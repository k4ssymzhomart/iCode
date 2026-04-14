import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const EXECUTION_TIMEOUT_MS = 8000;

const PYTHON_CANDIDATES = (() => {
  const configured = process.env.PYTHON_BIN?.trim();
  const candidates = configured
    ? [{ command: configured, args: [] as string[] }]
    : [];

  if (process.platform === "win32") {
    return [
      ...candidates,
      { command: "py", args: ["-3"] },
      { command: "python", args: [] as string[] },
      { command: "python3", args: [] as string[] },
    ];
  }

  return [
    ...candidates,
    { command: "python3", args: [] as string[] },
    { command: "python", args: [] as string[] },
  ];
})();

type PythonExecutionResult =
  | {
      success: true;
      stdout: string;
    }
  | {
      success: false;
      formattedError: string;
    };

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
  const scriptName = path.basename(scriptPath);

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

const executePythonFile = async (
  command: string,
  args: string[],
  scriptPath: string,
  stdin: string,
) =>
  new Promise<{
    exitCode: number | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
  }>((resolve, reject) => {
    const child = spawn(command, [...args, "-I", scriptPath], {
      windowsHide: true,
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const finalize = (payload: {
      exitCode: number | null;
      stdout: string;
      stderr: string;
      timedOut: boolean;
    }) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(payload);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, EXECUTION_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      finalize({
        exitCode,
        stdout: normalizeOutput(stdout),
        stderr: normalizeOutput(stderr),
        timedOut,
      });
    });

    child.stdin.write(stdin);
    child.stdin.end();
  });

export const runPythonSource = async (
  sourceCode: string,
  stdin = "",
): Promise<PythonExecutionResult> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "icode-python-"));
  const scriptPath = path.join(tempDir, "main.py");

  try {
    await writeFile(scriptPath, sourceCode, "utf8");
    for (const candidate of PYTHON_CANDIDATES) {
      try {
        const execution = await executePythonFile(
          candidate.command,
          candidate.args,
          scriptPath,
          stdin,
        );

        if (/Python was not found|No Python/i.test(execution.stderr)) {
          continue;
        }

        if (execution.timedOut) {
          return {
            success: false,
            formattedError: "Line ?: execution timed out",
          };
        }

        if (execution.exitCode === 0) {
          return {
            success: true,
            stdout: execution.stdout,
          };
        }

        return {
          success: false,
          formattedError: formatPythonError(execution.stderr, scriptPath),
        };
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: unknown }).code ?? "")
            : "";
        if (code === "ENOENT") {
          continue;
        }
        throw error;
      }
    }

    return {
      success: false,
      formattedError: "Line ?: Python runtime is unavailable",
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
};
