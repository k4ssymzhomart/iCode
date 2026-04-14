import axios from "axios";
import { requireCompilerConfig } from "./config";

const stripCodeFences = (value: string) =>
  value
    .replace(/^```[a-zA-Z0-9_-]*\s*/u, "")
    .replace(/```$/u, "")
    .trim();

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RapidApiContentPart =
  | string
  | {
      text?: string;
      content?: string | RapidApiContentPart[];
    };

type RapidApiChoice = {
  message?: {
    content?: string | RapidApiContentPart[];
  };
  delta?: {
    content?: string | RapidApiContentPart[];
  };
  text?: string;
};

type RapidApiResponse = {
  choices?: RapidApiChoice[];
  output_text?: string;
  generated_text?: string;
  result?: string;
  response?: string;
  data?: unknown;
};

const flattenRapidApiContent = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((part) => flattenRapidApiContent(part))
      .filter(Boolean)
      .join("\n");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.text === "string") {
      return record.text;
    }

    if (typeof record.content === "string" || Array.isArray(record.content)) {
      return flattenRapidApiContent(record.content);
    }
  }

  return "";
};

const extractRapidApiText = (payload: unknown): string | null => {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed || null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const topLevelCandidates = [
    data.output_text,
    data.generated_text,
    data.result,
    data.response,
  ];

  for (const candidate of topLevelCandidates) {
    const text = flattenRapidApiContent(candidate).trim();
    if (text) {
      return text;
    }
  }

  if (Array.isArray(data.choices)) {
    for (const choice of data.choices) {
      const text = flattenRapidApiContent(
        choice?.message?.content ?? choice?.delta?.content ?? choice?.text,
      ).trim();

      if (text) {
        return text;
      }
    }
  }

  if (data.data) {
    return extractRapidApiText(data.data);
  }

  return null;
};

export const generateCompilerText = async (
  messages: ChatMessage[],
  options?: { temperature?: number; max_tokens?: number; top_p?: number }
) => {
  const config = requireCompilerConfig();

  try {
    const response = await axios.post<RapidApiResponse>(
      config.rapidApiUrl,
      {
        model: config.rapidApiModel,
        messages,
        temperature: options?.temperature ?? 0.2,
        ...(options?.max_tokens ? { max_tokens: options.max_tokens } : {}),
        ...(options?.top_p !== undefined ? { top_p: options.top_p } : {}),
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": config.rapidApiHost,
          "x-rapidapi-key": config.rapidApiKey,
        },
        timeout: 60000,
      },
    );

    const content = extractRapidApiText(response.data);

    if (!content) {
      console.error("AI API Empty Response:", response.data);
      throw new Error("RapidAPI returned no usable text.");
    }

    return stripCodeFences(content);
  } catch (error: any) {
    if (error.response?.data) {
       console.error("AI API Error:", error.response.data);
       throw new Error(`AI API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
       console.error("AI API Error:", error.message);
       throw error;
    }
  }
};
