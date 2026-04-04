import axios from "axios";
import type { CompilerRunVerdict } from "./types";

type Judge0Status = {
  id: number;
  description: string;
};

type Judge0Response = {
  token?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
  status?: Judge0Status;
};

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  time: string | null;
  memory: number | null;
  verdict: CompilerRunVerdict;
  statusDescription: string;
}

const pythonLanguageId = 71;
const finalStatusIds = new Set([3, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

const toBase64 = (value: string) =>
  Buffer.from(value, "utf8").toString("base64");

const fromBase64 = (value?: string | null) =>
  value ? Buffer.from(value, "base64").toString("utf8") : "";

const sleep = (durationMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });

const getJudge0Headers = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.JUDGE0_AUTH_TOKEN) {
    headers["X-Auth-Token"] = process.env.JUDGE0_AUTH_TOKEN;
  }

  if (process.env.RAPIDAPI_KEY) {
    headers["X-RapidAPI-Key"] = process.env.RAPIDAPI_KEY;
  }

  if (process.env.RAPIDAPI_HOST) {
    headers["X-RapidAPI-Host"] = process.env.RAPIDAPI_HOST;
  }

  return headers;
};

const judge0Client = axios.create({
  baseURL: (process.env.JUDGE0_API_URL || "https://ce.judge0.com").replace(/\/+$/, ""),
  headers: getJudge0Headers(),
  timeout: 45000,
});

const normalizeVerdict = (statusId: number): CompilerRunVerdict => {
  if (statusId === 3) {
    return "success";
  }

  if (statusId === 6) {
    return "compile_error";
  }

  if (statusId >= 7 && statusId <= 12) {
    return "runtime_error";
  }

  return "internal_error";
};

const normalizeResponse = (response: Judge0Response): PythonExecutionResult => {
  const statusId = response.status?.id ?? 0;
  return {
    stdout: fromBase64(response.stdout),
    stderr: fromBase64(response.stderr),
    compileOutput: fromBase64(response.compile_output),
    message: fromBase64(response.message),
    time: response.time ?? null,
    memory: response.memory ?? null,
    verdict: normalizeVerdict(statusId),
    statusDescription: response.status?.description ?? "Unknown status",
  };
};

const buildPayload = (sourceCode: string, stdin: string) => ({
  language_id: pythonLanguageId,
  source_code: toBase64(sourceCode),
  stdin: toBase64(stdin),
  cpu_time_limit: 4,
  cpu_extra_time: 0.2,
  wall_time_limit: 8,
  memory_limit: 128000,
  stack_limit: 128000,
  max_file_size: 2048,
});

const pollSubmission = async (token: string) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await judge0Client.get<Judge0Response>(
      `/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,message,time,memory,status,token`,
    );

    const normalized = normalizeResponse(response.data);
    const statusId = response.data.status?.id ?? 0;

    if (finalStatusIds.has(statusId)) {
      return normalized;
    }

    await sleep(700);
  }

  throw new Error("Timed out waiting for the execution result.");
};

export const runPythonSubmission = async (
  sourceCode: string,
  stdin: string,
) => {
  const response = await judge0Client.post<Judge0Response>(
    "/submissions/?base64_encoded=true&wait=true",
    buildPayload(sourceCode, stdin),
  );

  if (response.data.status) {
    return normalizeResponse(response.data);
  }

  if (response.data.token) {
    return pollSubmission(response.data.token);
  }

  throw new Error("Judge0 returned an unexpected response for this run.");
};
