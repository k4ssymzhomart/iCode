const withOptionalStdin = (stdin?: string) =>
  stdin?.trim()
    ? `Use this stdin when reasoning about the program:\n\`\`\`\n${stdin}\n\`\`\``
    : "If the code expects stdin, assume 5 for numbers and hello for strings.";

export const buildRunMessages = (sourceCode: string, stdin?: string) => [
  {
    role: "user" as const,
    content: `You are evaluating beginner Python code.

Run the code in a normal Python interpreter mindset.
Return only the program output when execution succeeds.
If execution cannot succeed, return one short beginner-friendly fix instruction instead of rewriting the whole program.
Do not add markdown fences, labels, or extra explanation.
${withOptionalStdin(stdin)}

Python code:
\`\`\`python
${sourceCode}
\`\`\``,
  },
];

export const buildCorrectMessages = (sourceCode: string, stdin?: string) => [
  {
    role: "user" as const,
    content: `Fix this Python code so it runs while preserving the original intent.

Return only the full corrected Python code.
Add only short single-line # comments next to changed lines when it helps explain the fix.
Do not add markdown fences or explanation before or after the code.
${withOptionalStdin(stdin)}

Python code:
\`\`\`python
${sourceCode}
\`\`\``,
  },
];
