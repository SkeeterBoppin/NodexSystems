const { getAnalysisScore } = require("./validators");
const {
  buildExecutionMetrics,
  calculateAttemptWeight
} = require("./learning");

function scoreEvolution(evolution) {
  let score = 0;

  const hasPipeline =
    evolution.includes("def input_stage") &&
    evolution.includes("def transformation_stage") &&
    evolution.includes("def analysis_stage") &&
    evolution.includes("def output_stage") &&
    evolution.includes("def main");

  const functionCount = (evolution.match(/def /g) || []).length;
  const loopCount = (evolution.match(/for /g) || []).length;
  const conditionalCount = (evolution.match(/if /g) || []).length;

  if (hasPipeline) score += 5;
  if (functionCount >= 3) score += 3;
  if (loopCount >= 1) score += 2;
  if (conditionalCount >= 1) score += 2;
  if (evolution.includes("{") && evolution.includes(":")) score += 5;

  score += getAnalysisScore(evolution) >= 2 ? 8 : 0;

  return score;
}

function scoreExecutionMetrics(metrics) {
  let score = 0;

  if (metrics.outputValidJson) score += 2;
  if (metrics.outputStatus === "success") score += 3;
  if (metrics.errorClass === "none") score += 2;
  if (metrics.outputBytes > 0) score += 1;
  if (metrics.errorBytes === 0) score += 1;
  if (metrics.durationMs > 0 && metrics.durationMs <= 100) score += 2;
  else if (metrics.durationMs > 0 && metrics.durationMs <= 1000) score += 1;

  return score;
}

function scoreExecutionOutput(score, executionOutput, executionSummary = "", executionResult = {}) {
  const metrics = buildExecutionMetrics({
    executionResult,
    executionOutput,
    executionSummary
  });

  return score + scoreExecutionMetrics(metrics);
}

function scoreAttempt({ baseScore = 0, executionOutput = "", executionSummary = "", executionResult = {}, status = "error" } = {}) {
  const metrics = buildExecutionMetrics({
    executionResult,
    executionOutput,
    executionSummary
  });
  const score = scoreExecutionOutput(baseScore, executionOutput, executionSummary, executionResult);
  const weight = calculateAttemptWeight({
    status,
    score,
    metrics
  });

  return { score, weight, metrics };
}

module.exports = {
  scoreEvolution,
  scoreExecutionMetrics,
  scoreExecutionOutput,
  scoreAttempt,
  calculateAttemptWeight
};
