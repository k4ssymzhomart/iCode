export const getCompilerConfig = () => ({
  rapidApiKey: process.env.RAPIDAPI_KEY ?? "",
  rapidApiHost: process.env.RAPIDAPI_HOST ?? "gpt-5-4-mini.p.rapidapi.com",
  rapidApiUrl:
    process.env.RAPIDAPI_AI_URL ??
    "https://gpt-5-4-mini.p.rapidapi.com/chat/completions",
  rapidApiModel: process.env.RAPIDAPI_MODEL ?? "gpt-5.4-mini",
});

export const requireCompilerConfig = () => {
  const config = getCompilerConfig();

  if (!config.rapidApiKey) {
    throw new Error(
      "RAPIDAPI_KEY is missing. Add it to your environment before using Run or Correct.",
    );
  }

  return config;
};
