function cleanEvolutionOutput(evolution) {
  let cleaned = evolution
    .replace(/```python/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("import json");
  const pipelineStart = cleaned.indexOf("def input_stage");
  const endMarker = 'if __name__ == "__main__":';

  let startIndex = -1;
  if (start !== -1) startIndex = start;
  else if (pipelineStart !== -1) startIndex = pipelineStart;

  if (startIndex !== -1) {
    cleaned = cleaned.slice(startIndex);
  }

  const endIndex = cleaned.indexOf(endMarker);
  if (endIndex !== -1) {
    const mainCallIndex = cleaned.indexOf("main()", endIndex);
    if (mainCallIndex !== -1) {
      cleaned = cleaned.slice(0, mainCallIndex + "main()".length);
    }
  }

  return cleaned.trim();
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
