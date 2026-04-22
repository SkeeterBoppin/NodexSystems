const { readJsonArray, readJsonObject, writeJson } = require("../memory/memoryStore");

const ATTEMPT_MEMORY_FILE = "memory/ATTEMPTS.json";
const LEARNING_STATE_FILE = "memory/LEARNING_STATE.json";
const MAX_ATTEMPTS = 50;
const TOP_ATTEMPT_LIMIT = 5;
const SUCCESS_PATTERN_LIMIT = 8;
const STRATEGY_LIMIT = 5;
const PATTERN_COMPOSITION_LIMIT = 5;
const MIN_PARALLEL_ATTEMPTS = 3;
const MAX_PARALLEL_ATTEMPTS = 5;
const DEFAULT_PARALLEL_ATTEMPTS = 4;
const STRATEGY_DECAY_FACTOR = 0.9;
const BASE_PUBLISH_THRESHOLD = 25;

function round(value, decimals = 2) {
  const scale = 10 ** decimals;
  return Math.round(Number(value || 0) * scale) / scale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function parseJsonOutput(output) {
  const text = String(output || "").trim();
  if (!text) return { valid: false, value: null };

  try {
    return { valid: true, value: JSON.parse(text) };
  } catch {
    const line = text.split(/\r?\n/).find(item => item.trim().startsWith("{"));
    if (!line) return { valid: false, value: null };

    try {
      return { valid: true, value: JSON.parse(line) };
    } catch {
      return { valid: false, value: null };
    }
  }
}

function classifyError(errorText = "") {
  const text = String(errorText || "");

  if (!text.trim()) return "none";
  if (/ExecutionTimeout|timed out|ETIMEDOUT/i.test(text)) return "execution_timeout";
  if (/ForbiddenModule|ModuleNotAllowed|ImportError: Module is blocked|ImportError: Module is not allowlisted/i.test(text)) return "import_blocked";
  if (/DynamicImportBlocked|__import__/i.test(text)) return "dynamic_import_blocked";
  if (/PermissionError|Unsafe sandbox path|outside Sandbox|DirectoryTraversalBlocked|AbsolutePathBlocked/i.test(text)) return "filesystem_blocked";
  if (/PythonSyntaxError|SyntaxError/i.test(text)) return "python_syntax_error";
  if (/Missing JSON output|No executable Python/i.test(text)) return "audit_failed";
  if (/Traceback/i.test(text)) return "runtime_exception";

  return "runtime_error";
}

function normalizeErrorClass(errorClass = "") {
  const text = String(errorClass || "");

  if (!text || text === "none") return "none";
  if (/ForbiddenModule|ModuleNotAllowed|ImportError|import_blocked/i.test(text)) return "import_blocked";
  if (/DynamicImportBlocked|dynamic_import/i.test(text)) return "dynamic_import_blocked";
  if (/PermissionError|Unsafe sandbox path|outside Sandbox|DirectoryTraversalBlocked|AbsolutePathBlocked|filesystem/i.test(text)) return "filesystem_blocked";
  if (/ExecutionTimeout|SafetyValidationTimeout|timeout/i.test(text)) return "execution_timeout";
  if (/PythonSyntaxError|SyntaxError|syntax/i.test(text)) return "python_syntax_error";
  if (/Traceback|runtime_exception/i.test(text)) return "runtime_exception";

  return text;
}

function buildExecutionMetrics({ executionResult = {}, executionOutput = "", executionSummary = "" } = {}) {
  const output = executionResult.output !== undefined ? executionResult.output : executionOutput;
  const error = executionResult.error !== undefined ? executionResult.error : executionSummary;
  const parsed = parseJsonOutput(output);
  const outputStatus = parsed.valid && parsed.value ? parsed.value.status : null;
  const errorClass = normalizeErrorClass(executionResult.errorClass || classifyError(error));

  return {
    status: executionResult.status || (error ? "error" : "success"),
    durationMs: Number(executionResult.durationMs || 0),
    outputBytes: Buffer.byteLength(String(output || "")),
    errorBytes: Buffer.byteLength(String(error || "")),
    outputValidJson: parsed.valid,
    outputStatus,
    timedOut: Boolean(executionResult.timedOut || errorClass === "execution_timeout"),
    errorClass
  };
}

function normalizeReason(reason = "") {
  return String(reason)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "unknown";
}

function summarizeCodeShape(code = "") {
  const importLines = code.match(/^\s*(import|from)\s+[^\n]+/gm) || [];
  const nonJsonImports = importLines.filter(line => !/^\s*import\s+json\s*$/.test(line.trim()));

  return {
    functionCount: (code.match(/def /g) || []).length,
    loopCount: (code.match(/\bfor\b|\bwhile\b/g) || []).length,
    conditionalCount: (code.match(/\bif\b/g) || []).length,
    imports: importLines.length,
    nonJsonImports: nonJsonImports.length,
    hasJsonOutput: code.includes("print(json.dumps"),
    usesFileAccess: /\bopen\s*\(/.test(code),
    hasWhileLoop: /\bwhile\b/.test(code),
    usesListOfDicts: /\[\s*\{/.test(code) || /\{\s*["'][^"']+["']\s*:/.test(code),
    usesAggregation: /\bsum\s*\(|\blen\s*\(|\bcount\s*\(/.test(code),
    usesFiltering: /\bif\b/.test(code) && /\bfor\b/.test(code)
  };
}

function classifyAttempt(attempt) {
  if (attempt.status === "success") return "success";
  if (attempt.failureReason) return attempt.failureReason;

  if (attempt.validation && attempt.validation.valid === false) {
    return `validation_${normalizeReason(attempt.validation.reason)}`;
  }

  if (attempt.auditResults && String(attempt.auditResults).trim()) {
    return "audit_failed";
  }

  if (attempt.metrics) {
    const errorClass = normalizeErrorClass(attempt.metrics.errorClass);
    if (errorClass && errorClass !== "none") return errorClass;
    if (!attempt.metrics.outputValidJson) return "output_not_json";
    if (attempt.metrics.outputStatus && attempt.metrics.outputStatus !== "success") return "generated_failure";
  }

  if (attempt.publishThreshold !== undefined && attempt.score !== undefined && attempt.score < attempt.publishThreshold) {
    return "score_below_publish_threshold";
  }

  if (attempt.score !== undefined && attempt.successThreshold !== undefined && attempt.score < attempt.successThreshold) {
    return "score_below_threshold";
  }

  return "unknown_failure";
}

function severityPenalty(failureReason = "") {
  const reason = normalizeErrorClass(failureReason);

  if (reason === "import_blocked" || reason === "dynamic_import_blocked") return 0.1;
  if (reason === "filesystem_blocked") return 0.2;
  if (reason === "runtime_exception") return 0.3;
  if (reason === "execution_timeout") return 0.35;
  if (reason === "python_syntax_error") return 0.4;
  if (reason === "audit_failed") return 0.45;
  if (String(failureReason).startsWith("validation_")) return 0.5;
  if (reason === "generated_failure" || reason === "output_not_json") return 0.6;
  if (reason === "score_below_threshold") return 0.8;
  if (reason === "score_below_publish_threshold") return 0.9;

  return 0.5;
}

function efficiencyWeight(durationMs = 0) {
  const duration = Number(durationMs || 0);

  if (duration > 0 && duration <= 100) return 1;
  if (duration <= 250) return 0.75;
  if (duration <= 500) return 0.5;
  if (duration <= 1000) return 0.25;
  if (duration <= 3000) return 0;

  return -0.25;
}

function calculateAttemptWeight(attempt = {}) {
  const score = Number(attempt.score || 0);
  const metrics = attempt.metrics || {};
  const failureReason = attempt.failureReason || classifyAttempt(attempt);

  if (attempt.status === "success") {
    let weight = 1 + Math.min(score / 20, 2.5);
    weight += efficiencyWeight(metrics.durationMs);
    if (metrics.outputValidJson) weight += 0.5;
    if (metrics.outputStatus === "success") weight += 0.5;
    if (metrics.errorClass === "none" || !metrics.errorClass) weight += 0.5;
    return round(Math.max(1, Math.min(weight, 5)));
  }

  const scoreCredit = Math.min(score / 100, 0.25);
  return round(Math.max(0.05, Math.min(severityPenalty(failureReason) + scoreCredit, 1)));
}

function buildGuidance(failureCounts, lastFailureReason) {
  const guidance = [];

  if (failureCounts.import_blocked || failureCounts.dynamic_import_blocked) {
    guidance.push("Use only allowlisted imports: json, math, statistics, collections, itertools, functools, operator, re, datetime, decimal, fractions.");
  }

  if (failureCounts.filesystem_blocked) {
    guidance.push("Use only relative Sandbox-safe file paths; never use absolute paths or parent traversal.");
  }

  if (failureCounts.execution_timeout) {
    guidance.push("Use bounded loops with fixed limits; avoid while loops unless the exit condition is deterministic.");
  }

  if (failureCounts.audit_failed || String(lastFailureReason || "").startsWith("validation_")) {
    guidance.push("Preserve input_stage, transformation_stage, analysis_stage, output_stage, main, and exactly one print(json.dumps(...)).");
  }

  if (failureCounts.output_not_json || failureCounts.generated_failure) {
    guidance.push("Return one valid JSON object with status set to success when execution completes.");
  }

  if (failureCounts.score_below_publish_threshold) {
    guidance.push("Improve score quality enough to clear the publish threshold; reuse successful structure but deepen the transformation and analysis.");
  }

  return guidance;
}

function isSuccessfulAttempt(attempt) {
  return attempt.status === "success" && Number(attempt.score || 0) > 0;
}

function inferStructuralPatterns(attempt = {}) {
  const code = attempt.evolution || attempt.code || "";
  const shape = attempt.codeShape || summarizeCodeShape(code);
  const pipeline = [];
  const transformations = [];
  const algorithms = [];

  if (shape.functionCount >= 5) pipeline.push("five_stage_pipeline");
  if (shape.hasJsonOutput) pipeline.push("single_json_output_stage");
  if (shape.conditionalCount > 0) pipeline.push("analysis_with_branching");
  if (shape.loopCount > 0 && !shape.hasWhileLoop) pipeline.push("bounded_for_loop_pipeline");

  if (shape.usesListOfDicts) transformations.push("records_as_list_of_dicts");
  if (/\[\s*.*\s+for\s+/.test(code)) transformations.push("list_comprehension_transform");
  if (/\{\s*["'][^"']+["']\s*:/.test(code)) transformations.push("dictionary_enrichment");
  if (shape.usesFiltering) transformations.push("conditional_filter_or_label");

  if (shape.usesAggregation) algorithms.push("aggregate_sum_len_count");
  if (/sorted\s*\(/.test(code)) algorithms.push("sorting");
  if (/set\s*\(/.test(code)) algorithms.push("deduplication");
  if (/max\s*\(|min\s*\(/.test(code)) algorithms.push("min_max_analysis");
  if (shape.loopCount > 0 && !shape.hasWhileLoop) algorithms.push("bounded_iteration");

  return {
    pipeline_patterns: [...new Set(pipeline)],
    transformation_strategies: [...new Set(transformations)],
    algorithm_choices: [...new Set(algorithms)]
  };
}

function inferSuccessfulPatternDescriptions(attempt = {}) {
  const metrics = attempt.metrics || {};
  const shape = attempt.codeShape || summarizeCodeShape(attempt.evolution || attempt.code || "");
  const structures = inferStructuralPatterns(attempt);
  const score = Number(attempt.score || 0);
  const patterns = [];

  if (shape.imports === 0) patterns.push("Use pure computation without imports");
  if (shape.nonJsonImports === 0) patterns.push("Use no non-json imports");
  if (metrics.outputValidJson && metrics.outputStatus === "success") patterns.push("Produce one valid JSON object with status success");
  if (metrics.durationMs > 0 && metrics.durationMs <= 100) patterns.push("Keep execution under 100ms");
  else if (metrics.durationMs > 0 && metrics.durationMs <= 500) patterns.push("Keep execution under 500ms");
  if (score >= BASE_PUBLISH_THRESHOLD) patterns.push("Preserve high-scoring multi-stage pipeline structure");
  if (shape.functionCount >= 5) patterns.push("Use the five required pipeline functions");
  if (shape.loopCount > 0 && !metrics.timedOut) patterns.push("Use bounded deterministic loops");
  if (shape.conditionalCount > 0) patterns.push("Include conditional analysis logic");
  if (!shape.usesFileAccess) patterns.push("Avoid filesystem access unless the task explicitly requires it");

  for (const pattern of structures.pipeline_patterns) patterns.push(`Pipeline structure: ${pattern}`);
  for (const pattern of structures.transformation_strategies) patterns.push(`Transformation strategy: ${pattern}`);
  for (const pattern of structures.algorithm_choices) patterns.push(`Algorithm choice: ${pattern}`);

  return [...new Set(patterns)];
}

function extractSuccessfulPatterns(attempts = []) {
  const clusters = new Map();

  for (const attempt of attempts.filter(isSuccessfulAttempt)) {
    const timestamp = attempt.timestamp || new Date(0).toISOString();
    const score = Number(attempt.score || 0);
    const weight = Number(attempt.weight || calculateAttemptWeight(attempt));

    for (const pattern of inferSuccessfulPatternDescriptions(attempt)) {
      const current = clusters.get(pattern) || {
        pattern,
        totalScore: 0,
        weightedScore: 0,
        totalWeight: 0,
        frequency: 0,
        last_used: timestamp
      };

      current.totalScore += score;
      current.weightedScore += score * weight;
      current.totalWeight += weight;
      current.frequency += 1;
      if (timestamp > current.last_used) current.last_used = timestamp;
      clusters.set(pattern, current);
    }
  }

  return Array.from(clusters.values())
    .map(item => ({
      pattern: item.pattern,
      avg_score: round(item.totalScore / item.frequency),
      weighted_avg_score: round(item.weightedScore / Math.max(item.totalWeight, 0.01)),
      frequency: item.frequency,
      last_used: item.last_used
    }))
    .sort((a, b) =>
      b.weighted_avg_score - a.weighted_avg_score ||
      b.frequency - a.frequency ||
      b.last_used.localeCompare(a.last_used) ||
      a.pattern.localeCompare(b.pattern)
    )
    .slice(0, SUCCESS_PATTERN_LIMIT);
}

function countPatternGroups(attempts, groupName) {
  const clusters = new Map();

  for (const attempt of attempts.filter(isSuccessfulAttempt)) {
    const structures = inferStructuralPatterns(attempt);
    const timestamp = attempt.timestamp || new Date(0).toISOString();
    const score = Number(attempt.score || 0);
    const weight = Number(attempt.weight || calculateAttemptWeight(attempt));

    for (const pattern of structures[groupName] || []) {
      const current = clusters.get(pattern) || {
        pattern,
        totalScore: 0,
        weightedScore: 0,
        totalWeight: 0,
        frequency: 0,
        last_used: timestamp
      };
      current.totalScore += score;
      current.weightedScore += score * weight;
      current.totalWeight += weight;
      current.frequency += 1;
      if (timestamp > current.last_used) current.last_used = timestamp;
      clusters.set(pattern, current);
    }
  }

  return Array.from(clusters.values())
    .map(item => ({
      pattern: item.pattern,
      avg_score: round(item.totalScore / item.frequency),
      weighted_avg_score: round(item.weightedScore / Math.max(item.totalWeight, 0.01)),
      frequency: item.frequency,
      last_used: item.last_used
    }))
    .sort((a, b) => b.weighted_avg_score - a.weighted_avg_score || b.frequency - a.frequency || a.pattern.localeCompare(b.pattern))
    .slice(0, 6);
}

function extractStructuralPatternSummary(attempts = []) {
  return {
    pipeline_patterns: countPatternGroups(attempts, "pipeline_patterns"),
    transformation_strategies: countPatternGroups(attempts, "transformation_strategies"),
    algorithm_choices: countPatternGroups(attempts, "algorithm_choices")
  };
}

function extractPatternComposition(attempts = []) {
  const clusters = new Map();

  for (const attempt of attempts.filter(isSuccessfulAttempt)) {
    const structures = inferStructuralPatterns(attempt);
    const pipeline = structures.pipeline_patterns.slice(0, 2);
    const transformation = structures.transformation_strategies.slice(0, 2);
    const algorithm = structures.algorithm_choices.slice(0, 2);

    if (pipeline.length === 0 && transformation.length === 0 && algorithm.length === 0) continue;

    const timestamp = attempt.timestamp || new Date(0).toISOString();
    const score = Number(attempt.score || 0);
    const weight = Number(attempt.weight || calculateAttemptWeight(attempt));
    const signature = [
      pipeline.join("+") || "none",
      transformation.join("+") || "none",
      algorithm.join("+") || "none"
    ].join(" | ");

    const current = clusters.get(signature) || {
      signature,
      pipeline,
      transformation,
      algorithm,
      totalScore: 0,
      weightedScore: 0,
      totalWeight: 0,
      frequency: 0,
      last_used: timestamp
    };

    current.totalScore += score;
    current.weightedScore += score * weight;
    current.totalWeight += weight;
    current.frequency += 1;
    if (timestamp > current.last_used) current.last_used = timestamp;
    clusters.set(signature, current);
  }

  return Array.from(clusters.values())
    .map(item => ({
      signature: item.signature,
      pipeline: item.pipeline,
      transformation: item.transformation,
      algorithm: item.algorithm,
      avg_score: round(item.totalScore / item.frequency),
      weighted_avg_score: round(item.weightedScore / Math.max(item.totalWeight, 0.01)),
      frequency: item.frequency,
      last_used: item.last_used,
      directive: `Compose pipeline ${item.pipeline[0] || "none"} with transformation ${item.transformation[0] || "none"} and algorithm ${item.algorithm[0] || "none"}`
    }))
    .sort((a, b) =>
      b.weighted_avg_score - a.weighted_avg_score ||
      b.frequency - a.frequency ||
      b.last_used.localeCompare(a.last_used) ||
      a.signature.localeCompare(b.signature)
    )
    .slice(0, PATTERN_COMPOSITION_LIMIT);
}

function truncateCode(code = "", maxLength = 5000) {
  const text = String(code || "");
  return text.length <= maxLength ? text : text.slice(0, maxLength) + "\n# ... truncated by Nodex learning memory";
}

function extractTopAttempts(attempts = []) {
  return attempts
    .filter(isSuccessfulAttempt)
    .map(attempt => ({
      code: truncateCode(attempt.evolution || attempt.code || ""),
      score: Number(attempt.score || 0),
      weight: Number(attempt.weight || calculateAttemptWeight(attempt)),
      strategy: attempt.strategy || attempt.strategyMode || "unknown",
      timestamp: attempt.timestamp,
      metrics: attempt.metrics || {},
      codeShape: attempt.codeShape || summarizeCodeShape(attempt.evolution || attempt.code || ""),
      structures: inferStructuralPatterns(attempt)
    }))
    .sort((a, b) =>
      b.weight - a.weight ||
      b.score - a.score ||
      String(b.timestamp || "").localeCompare(String(a.timestamp || ""))
    )
    .slice(0, TOP_ATTEMPT_LIMIT);
}

function calculateTrend(records = []) {
  const scored = records.filter(item => typeof item.score === "number");
  const lastFive = scored.slice(-5);
  const previousFive = scored.slice(-10, -5);
  const avgLast = lastFive.length
    ? lastFive.reduce((sum, item) => sum + item.score, 0) / lastFive.length
    : 0;
  const avgPrevious = previousFive.length
    ? previousFive.reduce((sum, item) => sum + item.score, 0) / previousFive.length
    : 0;
  const bestLast = lastFive.length ? Math.max(...lastFive.map(item => Number(item.score || 0))) : 0;
  const bestPrevious = previousFive.length ? Math.max(...previousFive.map(item => Number(item.score || 0))) : 0;
  const successRateLast = lastFive.length
    ? lastFive.filter(item => item.status === "success").length / lastFive.length
    : 0;

  return {
    avg_score_last_5: round(avgLast),
    avg_score_previous_5: round(avgPrevious),
    best_score_last_5: round(bestLast),
    success_rate_last_5: round(successRateLast),
    improving: previousFive.length === 0 ? avgLast > 0 : avgLast > avgPrevious || bestLast > bestPrevious,
    stagnant: previousFive.length > 0 && avgLast <= avgPrevious && bestLast <= bestPrevious
  };
}

function recordDecayWeight(index, total, decayFactor = STRATEGY_DECAY_FACTOR) {
  const distanceFromLatest = Math.max(0, total - index - 1);
  return decayFactor ** distanceFromLatest;
}

function calculateStrategyPerformance(records = []) {
  const groups = new Map();
  const total = records.length;

  records.forEach((record, index) => {
    const strategy = record.strategy || record.strategyMode || "unlabeled";
    const weight = Number(record.weight || calculateAttemptWeight(record));
    const decay = recordDecayWeight(index, total);
    const current = groups.get(strategy) || {
      attempts: 0,
      successes: 0,
      totalScore: 0,
      totalWeight: 0,
      decayedAttempts: 0,
      decayedSuccesses: 0,
      decayedScore: 0,
      decayedWeight: 0,
      last_used: record.timestamp || ""
    };

    current.attempts += 1;
    if (record.status === "success") current.successes += 1;
    current.totalScore += Number(record.score || 0);
    current.totalWeight += weight;
    current.decayedAttempts += decay;
    current.decayedSuccesses += record.status === "success" ? decay : 0;
    current.decayedScore += Number(record.score || 0) * decay;
    current.decayedWeight += weight * decay;
    if ((record.timestamp || "") > current.last_used) current.last_used = record.timestamp || current.last_used;
    groups.set(strategy, current);
  });

  const performance = {};
  for (const [strategy, value] of groups.entries()) {
    const avgScore = value.attempts ? value.totalScore / value.attempts : 0;
    const avgWeight = value.attempts ? value.totalWeight / value.attempts : 0;
    const successRate = value.attempts ? value.successes / value.attempts : 0;
    const decayedAvgScore = value.decayedAttempts ? value.decayedScore / value.decayedAttempts : 0;
    const decayedAvgWeight = value.decayedAttempts ? value.decayedWeight / value.decayedAttempts : 0;
    const decayedSuccessRate = value.decayedAttempts ? value.decayedSuccesses / value.decayedAttempts : 0;

    performance[strategy] = {
      attempts: value.attempts,
      successes: value.successes,
      avg_score: round(avgScore),
      avg_weight: round(avgWeight),
      success_rate: round(successRate),
      decayed_attempts: round(value.decayedAttempts, 3),
      decayed_avg_score: round(decayedAvgScore),
      decayed_avg_weight: round(decayedAvgWeight),
      decayed_success_rate: round(decayedSuccessRate),
      expected_value: round(decayedAvgScore * decayedSuccessRate + decayedAvgWeight),
      lifetime_expected_value: round(avgScore * successRate + avgWeight),
      window_attempts: total,
      decay_factor: STRATEGY_DECAY_FACTOR,
      last_used: value.last_used
    };
  }

  return Object.fromEntries(
    Object.entries(performance).sort((a, b) =>
      b[1].expected_value - a[1].expected_value ||
      b[1].decayed_success_rate - a[1].decayed_success_rate ||
      b[1].avg_score - a[1].avg_score ||
      a[0].localeCompare(b[0])
    )
  );
}

function bestStrategyName(strategyPerformance = {}) {
  const entries = Object.entries(strategyPerformance).filter(([, stats]) => stats.attempts > 0);
  if (entries.length === 0) return null;
  return entries.sort((a, b) =>
    b[1].expected_value - a[1].expected_value ||
    b[1].decayed_success_rate - a[1].decayed_success_rate ||
    b[1].avg_score - a[1].avg_score ||
    a[0].localeCompare(b[0])
  )[0][0];
}

function buildSuccessGuidance(successfulPatterns = [], topAttempts = [], trend = {}, structuralPatterns = {}, patternComposition = { compositions: [] }) {
  const guidance = successfulPatterns.slice(0, 5).map(item => item.pattern);
  const topPipeline = structuralPatterns.pipeline_patterns && structuralPatterns.pipeline_patterns[0];
  const topTransform = structuralPatterns.transformation_strategies && structuralPatterns.transformation_strategies[0];
  const topAlgorithm = structuralPatterns.algorithm_choices && structuralPatterns.algorithm_choices[0];
  const topComposition = patternComposition.compositions && patternComposition.compositions[0];

  if (topPipeline) guidance.push(`Build from pipeline pattern ${topPipeline.pattern}`);
  if (topTransform) guidance.push(`Prefer transformation strategy ${topTransform.pattern}`);
  if (topAlgorithm) guidance.push(`Prefer algorithm choice ${topAlgorithm.pattern}`);
  if (topComposition) guidance.push(topComposition.directive);
  if (topAttempts.length > 0) guidance.push(`Build from top attempt structure with score ${topAttempts[0].score}`);
  if (trend.stagnant) guidance.push("Increase problem-domain variation while preserving the top successful execution patterns");

  return [...new Set(guidance)];
}

function selectStrategy(learningState = {}) {
  const strategyPerformance = learningState.strategy_performance || {};
  const measuredBest = bestStrategyName(strategyPerformance);
  const patterns = learningState.successful_patterns || [];
  const failureCounts = learningState.failureCounts || {};
  const trend = learningState.trend || {};
  const topComposition = learningState.pattern_composition && learningState.pattern_composition.compositions
    ? learningState.pattern_composition.compositions[0]
    : null;

  if (measuredBest) {
    return {
      mode: measuredBest,
      reason: "best_measured_strategy_performance",
      directives: [
        `Use measured best strategy: ${measuredBest}`,
        ...(topComposition ? [topComposition.directive] : []),
        ...(patterns.slice(0, 2).map(item => item.pattern))
      ]
    };
  }

  if (trend.stagnant) {
    return {
      mode: "explore_variation",
      reason: "avg_score_last_5_not_improving",
      directives: [
        "Change problem domain from recent attempts",
        "Keep the highest-weight successful pattern that still applies",
        ...(topComposition ? [topComposition.directive] : []),
        "Avoid repeating the last failure reason"
      ]
    };
  }

  if (patterns.length > 0) {
    return {
      mode: "exploit_success_patterns",
      reason: "successful_patterns_available",
      directives: [
        ...(topComposition ? [topComposition.directive] : []),
        ...patterns.slice(0, 3).map(item => item.pattern)
      ]
    };
  }

  if (Object.keys(failureCounts).length > 0) {
    return {
      mode: "recover_from_failures",
      reason: "failures_without_success_patterns",
      directives: learningState.guidance || []
    };
  }

  return {
    mode: "baseline_exploration",
    reason: "no_prior_strategy_signal",
    directives: [
      "Use the required pipeline structure",
      "Return valid JSON",
      "Keep execution bounded"
    ]
  };
}

function calculateAdaptiveExploration(learningState = {}, configuredCount = DEFAULT_PARALLEL_ATTEMPTS) {
  const base = clamp(configuredCount || DEFAULT_PARALLEL_ATTEMPTS, MIN_PARALLEL_ATTEMPTS, MAX_PARALLEL_ATTEMPTS);
  const trend = learningState.trend || {};
  const selected = learningState.selected_strategy || {};
  const strategyPerformance = learningState.strategy_performance || {};
  const selectedStats = strategyPerformance[selected.mode] || {};
  let target = base;
  let reason = "stable_signal_keep_search_width";

  if (trend.stagnant) {
    target = MAX_PARALLEL_ATTEMPTS;
    reason = "trend_stagnant_expand_search";
  } else if (
    trend.improving &&
    Number(selectedStats.attempts || 0) >= 2 &&
    Number(selectedStats.decayed_success_rate || selectedStats.success_rate || 0) >= 0.7 &&
    Number(selectedStats.expected_value || 0) >= BASE_PUBLISH_THRESHOLD
  ) {
    target = MIN_PARALLEL_ATTEMPTS;
    reason = "trend_improving_focus_search";
  } else if ((learningState.successful_patterns || []).length === 0) {
    target = Math.min(MAX_PARALLEL_ATTEMPTS, base + 1);
    reason = "low_success_signal_expand_search";
  }

  return {
    base_parallel_attempts: base,
    target_parallel_attempts: clamp(target, MIN_PARALLEL_ATTEMPTS, MAX_PARALLEL_ATTEMPTS),
    min_parallel_attempts: MIN_PARALLEL_ATTEMPTS,
    max_parallel_attempts: MAX_PARALLEL_ATTEMPTS,
    selected_strategy: selected.mode || "baseline_exploration",
    strategy_expected_value: round(selectedStats.expected_value || 0),
    reason
  };
}

function calculatePublishConfidence(learningState = {}, baseThreshold = BASE_PUBLISH_THRESHOLD) {
  const topAttempt = (learningState.top_attempts || [])[0] || null;
  const trend = learningState.trend || {};
  const topScore = Number(topAttempt ? topAttempt.score : 0);
  const rollingAverage = Number(trend.avg_score_last_5 || 0);
  const threshold = topScore > 0
    ? Math.max(baseThreshold, Math.min(topScore, Math.ceil(Math.max(topScore * 0.9, rollingAverage))))
    : Math.max(baseThreshold, Math.ceil(rollingAverage));

  return {
    base_threshold: Number(baseThreshold || BASE_PUBLISH_THRESHOLD),
    threshold,
    reference_top_score: topScore,
    rolling_avg_score: round(rollingAverage),
    keep_previous_best: topScore > 0,
    reason: topScore > baseThreshold
      ? "protect_previous_best_band"
      : rollingAverage > baseThreshold
        ? "protect_recent_average_band"
        : "base_threshold_only"
  };
}

function buildStrategyCandidates(learningState = {}, count = DEFAULT_PARALLEL_ATTEMPTS) {
  const selected = learningState.selected_strategy || selectStrategy(learningState);
  const patterns = learningState.successful_patterns || [];
  const structures = learningState.structural_patterns || {};
  const failureConstraints = learningState.guidance || [];
  const strategyPerformance = learningState.strategy_performance || {};
  const trend = learningState.trend || {};
  const compositions = learningState.pattern_composition && learningState.pattern_composition.compositions
    ? learningState.pattern_composition.compositions
    : [];
  const topComposition = compositions[0] || null;

  const templates = {
    baseline_exploration: {
      name: "baseline_exploration",
      purpose: "Establish a bounded baseline when the system has weak prior signal",
      directives: [
        "Use the required multi-stage pipeline",
        "Produce one valid JSON object",
        "Keep execution bounded and deterministic"
      ]
    },
    exploit_success_patterns: {
      name: "exploit_success_patterns",
      purpose: "Lean into the highest-performing successful patterns",
      directives: [
        ...(topComposition ? [topComposition.directive] : []),
        ...patterns.slice(0, 3).map(item => item.pattern)
      ]
    },
    top_k_structure_reuse: {
      name: "top_k_structure_reuse",
      purpose: "Build from the highest-weight successful attempt structure",
      directives: [
        "Reuse the top attempt pipeline shape",
        "Preserve stage order, JSON output style, and bounded execution",
        "Change problem data and domain details"
      ]
    },
    explore_variation: {
      name: "explore_variation",
      purpose: "Try a different problem domain while preserving known-good execution traits",
      directives: [
        "Change domain from recent attempts",
        ...(topComposition ? [topComposition.directive] : []),
        "Use a different transformation strategy",
        "Keep loops bounded and deterministic"
      ]
    },
    recover_from_failures: {
      name: "recover_from_failures",
      purpose: "Optimize away recent failure modes",
      directives: failureConstraints
    },
    composed_pattern_reuse: {
      name: "composed_pattern_reuse",
      purpose: "Compose the best observed pipeline, transformation, and algorithm bundle",
      directives: [
        ...(topComposition ? [topComposition.directive] : []),
        ...((structures.pipeline_patterns || []).slice(0, 1).map(item => `Use pipeline pattern ${item.pattern}`)),
        ...((structures.transformation_strategies || []).slice(0, 1).map(item => `Use transformation ${item.pattern}`)),
        ...((structures.algorithm_choices || []).slice(0, 1).map(item => `Use algorithm ${item.pattern}`))
      ]
    }
  };

  if (!templates[selected.mode]) {
    templates[selected.mode] = {
      name: selected.mode,
      purpose: "Use the currently selected strategy",
      directives: selected.directives || []
    };
  }

  const rankedMeasuredStrategies = Object.entries(strategyPerformance)
    .sort((a, b) =>
      b[1].expected_value - a[1].expected_value ||
      b[1].decayed_success_rate - a[1].decayed_success_rate ||
      a[0].localeCompare(b[0])
    )
    .map(([name]) => name);

  const orderedNames = [
    selected.mode,
    ...rankedMeasuredStrategies,
    "top_k_structure_reuse",
    trend.stagnant ? "explore_variation" : "composed_pattern_reuse",
    "recover_from_failures",
    "composed_pattern_reuse",
    "baseline_exploration"
  ];

  const unique = [];
  const seen = new Set();
  for (const name of orderedNames) {
    const candidate = templates[name];
    if (!candidate || seen.has(name)) continue;
    seen.add(name);
    unique.push({
      ...candidate,
      directives: [...new Set((candidate.directives || []).filter(Boolean))]
    });
  }

  return unique.slice(0, clamp(count || DEFAULT_PARALLEL_ATTEMPTS, MIN_PARALLEL_ATTEMPTS, STRATEGY_LIMIT));
}

function summarizeAttempts(records = []) {
  const recent = records.slice(-10);
  const failureCounts = {};
  const successes = recent.filter(item => item.status === "success");
  const failures = recent.filter(item => item.status !== "success");
  const lastFailure = failures[failures.length - 1] || null;
  const successfulPatterns = extractSuccessfulPatterns(records);
  const topAttempts = extractTopAttempts(records);
  const trend = calculateTrend(records);
  const strategyPerformance = calculateStrategyPerformance(records);
  const structuralPatterns = extractStructuralPatternSummary(records);
  const patternComposition = {
    compositions: extractPatternComposition(records)
  };

  for (const record of failures) {
    const reason = record.failureReason || "unknown_failure";
    failureCounts[reason] = (failureCounts[reason] || 0) + 1;
  }

  const guidance = buildGuidance(failureCounts, lastFailure ? lastFailure.failureReason : "none");
  const partialState = {
    failureCounts,
    guidance,
    successful_patterns: successfulPatterns,
    top_attempts: topAttempts,
    trend,
    strategy_performance: strategyPerformance,
    structural_patterns: structuralPatterns,
    pattern_composition: patternComposition
  };

  const selectedStrategy = selectStrategy(partialState);
  const adaptiveExploration = calculateAdaptiveExploration({ ...partialState, selected_strategy: selectedStrategy });
  const publishConfidence = calculatePublishConfidence({ ...partialState, selected_strategy: selectedStrategy });
  const strategyCandidates = buildStrategyCandidates(
    {
      ...partialState,
      selected_strategy: selectedStrategy,
      adaptive_exploration: adaptiveExploration,
      publish_confidence: publishConfidence
    },
    adaptiveExploration.target_parallel_attempts
  );

  return {
    totalAttemptsTracked: records.length,
    recentAttemptsTracked: recent.length,
    lastFailureReason: lastFailure ? lastFailure.failureReason : "none",
    failureCounts,
    recentFailures: failures.slice(-5).map(item => ({
      attempt: item.attempt,
      candidate: item.candidate,
      strategy: item.strategy,
      phase: item.phase,
      failureReason: item.failureReason,
      score: item.score,
      weight: item.weight
    })),
    recentSuccesses: successes.slice(-3).map(item => ({
      attempt: item.attempt,
      candidate: item.candidate,
      strategy: item.strategy,
      score: item.score,
      weight: item.weight,
      codeShape: item.codeShape,
      metrics: item.metrics
    })),
    guidance,
    successful_patterns: successfulPatterns,
    top_attempts: topAttempts,
    structural_patterns: structuralPatterns,
    pattern_composition: patternComposition,
    success_guidance: buildSuccessGuidance(successfulPatterns, topAttempts, trend, structuralPatterns, patternComposition),
    strategy_performance: strategyPerformance,
    trend,
    selected_strategy: selectedStrategy,
    adaptive_exploration: adaptiveExploration,
    publish_confidence: publishConfidence,
    strategy_candidates: strategyCandidates
  };
}

function loadAttempts() {
  return readJsonArray(ATTEMPT_MEMORY_FILE);
}

function loadLearningState() {
  const records = loadAttempts();
  const derived = summarizeAttempts(records);
  const stored = readJsonObject(LEARNING_STATE_FILE);

  if (Object.keys(stored).length === 0) return derived;
  return { ...stored, ...derived };
}

function recordAttempt(attempt, { maxAttempts = MAX_ATTEMPTS } = {}) {
  const records = loadAttempts();
  const base = {
    timestamp: new Date().toISOString(),
    ...attempt,
    codeShape: attempt.codeShape || summarizeCodeShape(attempt.evolution || attempt.code || "")
  };

  const enriched = {
    ...base,
    strategy: base.strategy || base.strategyMode || "unlabeled",
    failureReason: base.failureReason || classifyAttempt(base)
  };
  enriched.weight = Number(base.weight || calculateAttemptWeight(enriched));

  const nextRecords = records.concat(enriched).slice(-maxAttempts);
  const learningState = summarizeAttempts(nextRecords);

  writeJson(ATTEMPT_MEMORY_FILE, nextRecords);
  writeJson(LEARNING_STATE_FILE, learningState);

  return learningState;
}

function formatTopAttemptForPrompt(attempt) {
  return {
    score: attempt.score,
    weight: attempt.weight,
    strategy: attempt.strategy,
    codeShape: attempt.codeShape,
    structures: attempt.structures,
    code: truncateCode(attempt.code, 1600)
  };
}

function formatLearningForPrompt(learningState = {}) {
  return JSON.stringify({
    lastFailureReason: learningState.lastFailureReason || "none",
    failureCounts: learningState.failureCounts || {},
    failure_constraints: learningState.guidance || [],
    success_guidance: learningState.success_guidance || [],
    successful_patterns: (learningState.successful_patterns || []).slice(0, 5),
    structural_patterns: learningState.structural_patterns || {},
    pattern_composition: learningState.pattern_composition || { compositions: [] },
    strategy_performance: learningState.strategy_performance || {},
    adaptive_exploration: learningState.adaptive_exploration || calculateAdaptiveExploration(learningState),
    publish_confidence: learningState.publish_confidence || calculatePublishConfidence(learningState),
    top_attempts: (learningState.top_attempts || []).slice(0, 2).map(formatTopAttemptForPrompt),
    trend: learningState.trend || {
      avg_score_last_5: 0,
      improving: false
    },
    selected_strategy: learningState.selected_strategy || selectStrategy(learningState),
    strategy_candidates: learningState.strategy_candidates || buildStrategyCandidates(learningState, DEFAULT_PARALLEL_ATTEMPTS),
    recentFailures: learningState.recentFailures || [],
    recentSuccesses: learningState.recentSuccesses || []
  }, null, 2);
}

module.exports = {
  ATTEMPT_MEMORY_FILE,
  LEARNING_STATE_FILE,
  MAX_ATTEMPTS,
  TOP_ATTEMPT_LIMIT,
  SUCCESS_PATTERN_LIMIT,
  STRATEGY_LIMIT,
  PATTERN_COMPOSITION_LIMIT,
  MIN_PARALLEL_ATTEMPTS,
  MAX_PARALLEL_ATTEMPTS,
  DEFAULT_PARALLEL_ATTEMPTS,
  STRATEGY_DECAY_FACTOR,
  BASE_PUBLISH_THRESHOLD,
  round,
  clamp,
  parseJsonOutput,
  classifyError,
  normalizeErrorClass,
  buildExecutionMetrics,
  normalizeReason,
  summarizeCodeShape,
  classifyAttempt,
  severityPenalty,
  efficiencyWeight,
  calculateAttemptWeight,
  buildGuidance,
  isSuccessfulAttempt,
  inferStructuralPatterns,
  inferSuccessfulPatternDescriptions,
  extractSuccessfulPatterns,
  extractStructuralPatternSummary,
  extractPatternComposition,
  extractTopAttempts,
  calculateTrend,
  recordDecayWeight,
  calculateStrategyPerformance,
  bestStrategyName,
  buildSuccessGuidance,
  selectStrategy,
  calculateAdaptiveExploration,
  calculatePublishConfidence,
  buildStrategyCandidates,
  summarizeAttempts,
  loadAttempts,
  loadLearningState,
  recordAttempt,
  formatLearningForPrompt
};
