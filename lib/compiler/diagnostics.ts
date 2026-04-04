import type {
  CompilerExplanation,
  CompilerRunVerdict,
} from "./types";

const firstNonEmptyLine = (...values: Array<string | undefined>) => {
  for (const value of values) {
    const line = value
      ?.split(/\r?\n/)
      .map((entry) => entry.trim())
      .find(Boolean);

    if (line) {
      return line;
    }
  }

  return "";
};

const compactSnippet = (value?: string) => {
  if (!value) {
    return "";
  }

  const compact = value.replace(/\r\n/g, "\n").trim();
  if (!compact) {
    return "";
  }

  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
};

export const buildCompilerExplanation = ({
  verdict,
  statusLabel,
  stderr,
  compileOutput,
  stdout,
}: {
  verdict: CompilerRunVerdict;
  statusLabel: string;
  stderr: string;
  compileOutput: string;
  stdout: string;
}): CompilerExplanation => {
  const evidence = firstNonEmptyLine(compileOutput, stderr, statusLabel);
  const lowerEvidence = evidence.toLowerCase();

  if (verdict === "success") {
    return {
      title: "Run completed",
      summary: stdout.trim()
        ? "The code executed successfully and produced output."
        : "The code executed successfully with no printed output.",
      checkNext: [
        "If you expected output, confirm that you are printing the final result.",
        "Try a boundary input next to make sure the behavior stays stable.",
      ],
    };
  }

  if (verdict === "compile_error") {
    return {
      title: "Syntax issue",
      summary:
        "Python could not parse the code, so execution never started.",
      checkNext: [
        "Inspect the first reported line for indentation, missing colons, or unmatched brackets.",
        "Fix the earliest syntax error first before trusting later messages.",
      ],
      evidence: compactSnippet(evidence),
    };
  }

  if (verdict === "runtime_error") {
    let title = "Runtime error";
    let summary =
      "The code started running, then stopped because of an error.";

    if (
      lowerEvidence.includes("indexerror") ||
      lowerEvidence.includes("out of range")
    ) {
      title = "Index boundary issue";
      summary = "The code is reading beyond the valid range of a list or sequence.";
    } else if (
      lowerEvidence.includes("zerodivision") ||
      lowerEvidence.includes("division by zero")
    ) {
      title = "Division by zero";
      summary = "A division or modulo operation is using zero as the divisor.";
    } else if (
      lowerEvidence.includes("nameerror") ||
      lowerEvidence.includes("not defined")
    ) {
      title = "Missing name";
      summary = "The code is using a variable or function name that is not available.";
    } else if (
      lowerEvidence.includes("typeerror")
    ) {
      title = "Type mismatch";
      summary = "An operation is being used with a value of the wrong type.";
    }

    return {
      title,
      summary,
      checkNext: [
        "Inspect the traceback line that failed and verify the data shape at that point.",
        "Check assumptions about indexes, input size, and variable names.",
      ],
      evidence: compactSnippet(evidence),
    };
  }

  return {
    title: "Runner issue",
    summary: "The compiler service returned an unexpected error for this run.",
    checkNext: [
      "Retry once to rule out a transient service problem.",
      "If it repeats, inspect stderr and compiler output for the raw details.",
    ],
    evidence: compactSnippet(evidence),
  };
};
