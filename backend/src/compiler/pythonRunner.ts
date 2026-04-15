import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type PythonExecutionResult =
  | {
      success: true;
      stdout: string;
    }
  | {
      success: false;
      formattedError: string;
    };

type LocalPythonExecutionResult =
  | {
      success: true;
      stdout: string;
    }
  | {
      success: false;
      formattedError?: string;
      runtimeAvailable: boolean;
    };

interface PistonExecutionResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
  };
  message?: string;
}

type PythonCommand = {
  command: string;
  args: string[];
};

const PISTON_ENDPOINT = "https://emkc.org/api/v2/piston/execute";
const SCRIPT_NAME = "main.py";
const PYTHON_TIMEOUT_MS = 8000;
const PYTHON_COMPILE_TIMEOUT_MS = 10000;
const PYTHON_RUNTIME_UNAVAILABLE = "Line ?: Python runtime is unavailable";

let cachedPythonCommand: PythonCommand | null | undefined;

const normalizeOutput = (value: string) => value.replace(/\r\n/g, "\n");

const clampWords = (value: string, maxWords = 9) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join(" ")
    .trim();

const sanitizeQuotedValue = (value: string) => value.replace(/^['"]|['"]$/g, "");

const buildConciseExplanation = (errorType: string, rawMessage: string) => {
  const message = rawMessage.trim();

  if (errorType === "SyntaxError") {
    if (/expected ':'/.test(message)) return "missing colon";
    if (/was never closed|unexpected EOF/i.test(message)) return "missing closing bracket";
    if (/invalid syntax/i.test(message)) return "invalid syntax here";
    return "syntax issue on this line";
  }

  if (errorType === "IndentationError") {
    if (/expected an indented block/i.test(message)) return "missing indented block";
    if (/unexpected indent/i.test(message)) return "unexpected indentation";
    if (/unindent does not match/i.test(message)) return "indentation does not match";
    return "indentation issue here";
  }

  if (errorType === "NameError") {
    const match = message.match(/name ['"]?([^'"]+)['"]? is not defined/i);
    if (match) {
      return clampWords(`${sanitizeQuotedValue(match[1])} is not defined`);
    }
    return "name is not defined";
  }

  if (errorType === "TypeError") {
    if (/unsupported operand type/i.test(message)) return "unsupported types for this operation";
    if (/not callable/i.test(message)) return "object is not callable";
    if (/missing .* positional argument/i.test(message)) return "missing required argument";
    return "type mismatch in this operation";
  }

  if (errorType === "ValueError") {
    if (/invalid literal for int/i.test(message)) return "invalid integer input";
    if (/too many values to unpack/i.test(message)) return "too many values to unpack";
    if (/not enough values to unpack/i.test(message)) return "not enough values to unpack";
    return "invalid value used here";
  }

  if (errorType === "ZeroDivisionError") return "division by zero";
  if (errorType === "IndexError") return "index out of range";

  if (errorType === "KeyError") {
    const match = message.match(/['"]([^'"]+)['"]/);
    return match ? clampWords(`missing key ${match[1]}`) : "missing dictionary key";
  }

  if (errorType === "AttributeError") {
    const match = message.match(/attribute ['"]([^'"]+)['"]/i);
    return match
      ? clampWords(`${sanitizeQuotedValue(match[1])} attribute is missing`)
      : "attribute does not exist";
  }

  if (errorType === "ModuleNotFoundError") {
    const match = message.match(/No module named ['"]([^'"]+)['"]/i);
    return match ? clampWords(`module ${match[1]} not found`) : "module not found";
  }

  if (errorType === "ImportError") return "import failed here";
  if (errorType === "EOFError") return "input is missing";
  if (errorType === "RecursionError") return "too much recursion";
  if (errorType === "UnboundLocalError") return "variable used before assignment";
  if (errorType === "AssertionError") return "assertion failed";
  if (errorType === "TimeoutError") return "execution timed out";

  const cleaned = message
    .replace(/\([^)]*\)/g, "")
    .replace(/[_:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return clampWords(cleaned || errorType || "runtime issue");
};

const extractRelevantLineNumbers = (stderr: string, scriptPath: string) => {
  const lines = normalizeOutput(stderr).split("\n");
  const matches = new Set<number>();
  const scriptName = scriptPath.split(/[\\/]/).pop() ?? scriptPath;

  for (const line of lines) {
    if (!line.includes(scriptPath) && !line.includes(scriptName)) {
      continue;
    }

    const match = line.match(/line (\d+)/i);
    if (match) {
      matches.add(Number(match[1]));
    }
  }

  return [...matches].sort((left, right) => left - right);
};

const parsePythonError = (stderr: string) => {
  const lines = normalizeOutput(stderr)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const finalLine = [...lines].reverse().find((line) => line.includes(":")) ?? lines.at(-1) ?? "";
  const match = finalLine.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);

  if (!match) {
    return {
      errorType: "RuntimeError",
      message: finalLine || "runtime issue",
    };
  }

  return {
    errorType: match[1],
    message: match[2] || match[1],
  };
};

const formatPythonError = (stderr: string, scriptPath: string) => {
  const { errorType, message } = parsePythonError(stderr);
  const lineNumbers = extractRelevantLineNumbers(stderr, scriptPath);
  const explanation = buildConciseExplanation(errorType, message);

  if (lineNumbers.length === 0) {
    return `Line ?: ${explanation}`;
  }

  if (lineNumbers.length === 1) {
    return `Line ${lineNumbers[0]}: ${explanation}`;
  }

  return `Lines ${lineNumbers.join(", ")}: ${explanation}`;
};

const getPythonCommandCandidates = (): PythonCommand[] => {
  if (process.platform === "win32") {
    return [
      { command: "py", args: ["-3"] },
      { command: "python3", args: [] },
      { command: "python", args: [] },
    ];
  }

  return [
    { command: "python3", args: [] },
    { command: "python", args: [] },
  ];
};

const runCommand = (
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    stdin?: string;
    timeoutMs?: number;
  },
) =>
  new Promise<{
    code: number | null;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
  }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      windowsHide: true,
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer =
      options?.timeoutMs && options.timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            child.kill();
          }, options.timeoutMs)
        : null;

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      if (timer) {
        clearTimeout(timer);
      }
      reject(error);
    });

    child.on("close", (code, signal) => {
      if (timer) {
        clearTimeout(timer);
      }

      resolve({
        code,
        signal,
        stdout: normalizeOutput(stdout),
        stderr: normalizeOutput(stderr),
        timedOut,
      });
    });

    if (typeof options?.stdin === "string") {
      child.stdin.write(options.stdin);
    }

    child.stdin.end();
  });

const resolveLocalPythonCommand = async (): Promise<PythonCommand | null> => {
  if (cachedPythonCommand !== undefined) {
    return cachedPythonCommand;
  }

  for (const candidate of getPythonCommandCandidates()) {
    try {
      const result = await runCommand(candidate.command, [...candidate.args, "--version"], {
        timeoutMs: 2000,
      });

      if (result.code === 0) {
        cachedPythonCommand = candidate;
        return candidate;
      }
    } catch {
      continue;
    }
  }

  cachedPythonCommand = null;
  return null;
};

const runLocalPythonSource = async (
  sourceCode: string,
  stdin = "",
): Promise<LocalPythonExecutionResult> => {
  const pythonCommand = await resolveLocalPythonCommand();
  if (!pythonCommand) {
    return {
      success: false,
      runtimeAvailable: false,
    };
  }

  const tempDir = await mkdtemp(join(tmpdir(), "icode-python-"));
  const scriptPath = join(tempDir, SCRIPT_NAME);

  try {
    await writeFile(scriptPath, sourceCode, "utf8");
    const result = await runCommand(
      pythonCommand.command,
      [...pythonCommand.args, scriptPath],
      {
        cwd: tempDir,
        stdin,
        timeoutMs: PYTHON_TIMEOUT_MS,
      },
    );

    if (result.timedOut) {
      return {
        success: false,
        runtimeAvailable: true,
        formattedError: "Line ?: execution timed out",
      };
    }

    if (result.code === 0 && !result.stderr) {
      return {
        success: true,
        stdout: result.stdout,
      };
    }

    return {
      success: false,
      runtimeAvailable: true,
      formattedError: formatPythonError(result.stderr || result.stdout, scriptPath),
    };
  } catch (error) {
    console.error("[pythonRunner] Local Python execution error:", error);
    cachedPythonCommand = null;
    return {
      success: false,
      runtimeAvailable: false,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
};

const runLocalFallback = async (
  sourceCode: string,
  stdin = "",
): Promise<PythonExecutionResult> => {
  const fallback = await runLocalPythonSource(sourceCode, stdin);

  if (fallback.success) {
    return fallback;
  }

  if ("runtimeAvailable" in fallback && fallback.runtimeAvailable && fallback.formattedError) {
    return {
      success: false,
      formattedError: fallback.formattedError,
    };
  }

  return {
    success: false,
    formattedError: PYTHON_RUNTIME_UNAVAILABLE,
  };
};

export const runPythonSource = async (
  sourceCode: string,
  stdin = "",
): Promise<PythonExecutionResult> => {
  try {
    const response = await fetch(PISTON_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: "python",
        version: "3.10.0",
        files: [
          {
            name: SCRIPT_NAME,
            content: sourceCode,
          },
        ],
        stdin,
        compile_timeout: PYTHON_COMPILE_TIMEOUT_MS,
        run_timeout: PYTHON_TIMEOUT_MS,
      }),
    });

    if (!response.ok) {
      console.warn("[pythonRunner] Piston returned a non-OK response:", response.status);
      return runLocalFallback(sourceCode, stdin);
    }

    const data = (await response.json()) as PistonExecutionResponse;

    if (data.message) {
      console.warn("[pythonRunner] Piston returned an API-level error:", data.message);
      return runLocalFallback(sourceCode, stdin);
    }

    const executeStream = data.run;
    if (executeStream.code === 0 && !executeStream.stderr) {
      return {
        success: true,
        stdout: executeStream.stdout || executeStream.output || "",
      };
    }

    if (executeStream.signal === "SIGKILL") {
      return {
        success: false,
        formattedError: "Line ?: execution timed out",
      };
    }

    return {
      success: false,
      formattedError: formatPythonError(
        executeStream.stderr || executeStream.output,
        SCRIPT_NAME,
      ),
    };
  } catch (error) {
    console.error("[pythonRunner] Piston execution error:", error);
    return runLocalFallback(sourceCode, stdin);
  }
};
