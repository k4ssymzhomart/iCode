const withOptionalStdin = (stdin?: string) =>
  stdin?.trim()
    ? `Use this stdin exactly:\n\`\`\`\n${stdin}\n\`\`\``
    : "If input is required, assume the program receives no stdin.";

const extractLastConsoleLine = (consoleOutput?: string) =>
  consoleOutput
    ?.split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

export const buildRunMessages = (sourceCode: string, stdin?: string) => [
  {
    role: "user" as const,
    content: `Act as a Python runtime formatter.

Rules:
1. If the code runs successfully, output exactly the program stdout.
2. If the code has any error, output exactly one line in this format:
Line X: short explanation
3. The explanation must be specific and under 10 words.
4. Do not output traceback, markdown, or extra commentary.

${withOptionalStdin(stdin)}

Code:
${sourceCode.trimEnd()}`,
  },
];

export const buildCorrectMessages = (sourceCode: string, stdin?: string) => [
  {
    role: "user" as const,
    content: `Correct the following Python code so it runs successfully.

CRITICAL RULES:
1. Keep the user's existing logic and structure unless a direct fix requires otherwise.
2. Return ONLY the corrected code. Do NOT wrap it in code fences or add any text before or after.
3. Make the smallest reliable set of changes.
4. Add exactly ONE single-line comment (e.g., # added a column) perfectly aligned directly above or on the exact line of the change. This comment MUST be under 10 words and explain what you adjusted.

${stdin?.trim() ? `Input to consider:\n${stdin}` : ""}

Code to correct:
${sourceCode.trimEnd()}`,
  },
];

export const buildTargetedCorrectMessages = (
  sourceCode: string,
  consoleOutput: string,
  stdin?: string,
) => {
  const lastConsoleLine = extractLastConsoleLine(consoleOutput) ?? consoleOutput.trim();

  return [
    {
      role: "user" as const,
      content: `Fix the following Python code, but focus ONLY on the latest console error.

CRITICAL RULES:
1. Target the specific failure shown below and avoid unrelated refactors.
2. Preserve the user's overall structure and logic as much as possible.
3. Return ONLY the corrected code. Do NOT wrap it in code fences or add any text before or after.
4. Make the smallest reliable change that resolves the latest error first.
5. Add exactly ONE single-line comment (e.g., # added a column) perfectly aligned directly above or on the exact line of the change. This comment MUST be under 10 words and explain what you adjusted.

Latest console error line:
${lastConsoleLine}

Full console output:
${consoleOutput.trim()}

${stdin?.trim() ? `Input to consider:\n${stdin}` : ""}

Code to correct:
${sourceCode.trimEnd()}`,
    },
  ];
};

export const buildExplainMessages = (payload: {
  sourceCode: string;
  stdin?: string;
  outputLog?: string;
  taskContext?: string;
}) => [
  {
    role: "user" as const,
    content: `You are an encouraging programming tutor helping a student with a classroom task.

Write a clear, personalized explanation in plain text with exactly these section headings:
Understanding
What Your Code Is Doing
How The Output Connects
Next Best Steps

Rules:
1. Be warm, specific, and easy to follow.
2. Refer to the student's actual code approach, not generic advice.
3. If an output log is provided, explain what it means. If not, say that no execution log was available yet.
4. Do not repeat the full task statement or paste the full code back.
5. Do not use markdown tables or code fences.

Teacher task context:
${payload.taskContext?.trim() || "No classroom task context was provided."}

${withOptionalStdin(payload.stdin)}

Student code:
${payload.sourceCode.trimEnd()}

Execution log:
${payload.outputLog?.trim() || "No execution log was available."}`,
  },
];
