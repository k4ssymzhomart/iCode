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

type RapidApiResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export const generateCompilerText = async (messages: ChatMessage[]) => {
  const config = requireCompilerConfig();

  const response = await axios.post<RapidApiResponse>(
    config.rapidApiUrl,
    {
      model: config.rapidApiModel,
      messages,
      temperature: 0.2,
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

  const content = response.data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("RapidAPI returned an empty response.");
  }

  return stripCodeFences(content);
};
