function cleanEvolutionOutput(evolution) {
  const lines = String(evolution || "")
    .replace(/```python/g, "")
    .replace(/```/g, "")
    .split(/\r?\n/);

  const isPythonStart = (line) => {
    const trimmed = line.trim();
    return (
      trimmed === "import json" ||
      trimmed.startsWith("def input_stage") ||
      trimmed.startsWith("def transformation_stage") ||
      trimmed.startsWith("def analysis_stage") ||
      trimmed.startsWith("def output_stage") ||
      trimmed.startsWith("def main") ||
      trimmed.startsWith('if __name__ == "__main__":')
    );
  };

  const startIndex = lines.findIndex(isPythonStart);
  if (startIndex === -1) {
    return String(evolution || "")
      .replace(/```python/g, "")
      .replace(/```/g, "")
      .trim();
  }

  let cleanedLines = lines.slice(startIndex);

  const entryIndex = cleanedLines.findIndex(
    (line) => line.trim() === 'if __name__ == "__main__":'
  );

  if (entryIndex !== -1) {
    let endIndex = entryIndex;

    for (let i = entryIndex + 1; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        endIndex = i;
        continue;
      }

      if (/^( {4}|\t)main\(\)\s*$/.test(line)) {
        endIndex = i;
        continue;
      }

      break;
    }

    cleanedLines = cleanedLines.slice(0, endIndex + 1);
  }

  return cleanedLines.join("\n").trim();
}

function validateEvolution(evolution) {
  const hasPipeline =
    evolution.includes("def input_stage") &&
    evolution.includes("def transformation_stage") &&
    evolution.includes("def analysis_stage") &&
    evolution.includes("def output_stage") &&
    evolution.includes("def main");

  if (!hasPipeline) {
    return { valid: false, reason: "Missing pipeline" };
  }

  const hasComplexData =
    evolution.includes("{") ||
    evolution.includes("[{") ||
    (evolution.includes("for ") && evolution.includes("if "));

  if (!hasComplexData) {
    return { valid: false, reason: "No meaningful data" };
  }

  const analysisBlock = evolution.split("def analysis_stage")[1] || "";

  if (
    analysisBlock &&
    /return\s+\w+\s*$/.test(analysisBlock) &&
    !analysisBlock.includes("len(") &&
    !analysisBlock.includes("sum(") &&
    !analysisBlock.includes("count(") &&
    !analysisBlock.includes("if ")
  ) {
    return { valid: false, reason: "Analysis empty" };
  }

  if (evolution.includes("prime")) {
    return { valid: false, reason: "Rejected pattern: prime" };
  }

  if (
    /for\s+\w+\s+in\s+\w+/.test(evolution) &&
    (evolution.includes("**2") || evolution.includes("* 2") || evolution.includes("+ 1")) &&
    !evolution.includes("if ")
  ) {
    return { valid: false, reason: "Rejected simple loop transform" };
  }

  if (
    evolution.includes("[1, 2, 3") &&
    !evolution.includes("random") &&
    !evolution.includes("range")
  ) {
    return { valid: false, reason: "Rejected static simple list" };
  }

  if (
    evolution.includes("range(") &&
    evolution.includes("**2") &&
    !evolution.includes("if ")
  ) {
    return { valid: false, reason: "Rejected square range without branching" };
  }

  if (!evolution.includes("print(json.dumps")) {
    return { valid: false, reason: "Missing JSON print" };
  }

  if (evolution.includes("input(")) {
    return { valid: false, reason: "Interactive input is not allowed" };
  }

  const analysisScore = getAnalysisScore(evolution);
  if (analysisScore < 2) {
    return { valid: false, reason: "Insufficient analysis logic" };
  }

  return { valid: true, reason: "OK" };
}

function getAnalysisScore(evolution) {
  let analysisScore = 0;
  if (evolution.includes("len(")) analysisScore++;
  if (evolution.includes("sum(")) analysisScore++;
  if (evolution.includes("count(")) analysisScore++;
  if (evolution.includes("if ")) analysisScore++;
  return analysisScore;
}

module.exports = {
  cleanEvolutionOutput,
  validateEvolution,
  getAnalysisScore
};
