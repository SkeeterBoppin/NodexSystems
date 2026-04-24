const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createRegistry } = require("../tools/registry");
const imageTool = require("../tools/imageTool");
const {
  isSafePath,
  checkSafety,
  runPythonCode,
  readSandboxFile
} = require("../execution/pythonSandbox");
const { audit } = require("../evolution/auditor");
const { routeTask } = require("../core/toolRouter");
const { fallbackDecision } = require("../core/taskDecider");
const {
  buildExecutionMetrics,
  buildStrategyCandidates,
  calculateAdaptiveExploration,
  calculatePublishConfidence,
  calculateStrategyPerformance,
  classifyAttempt,
  extractPatternComposition,
  extractStructuralPatternSummary,
  selectStrategy,
  summarizeAttempts,
  formatLearningForPrompt
} = require("../evolution/learning");
const { scoreExecutionMetrics } = require("../evolution/scorer");
const { selectBestCandidate } = require("../evolution/evolver");

function assertApproximatelyEqual(actual, expected, tolerance = 1e-12) {
  assert(Math.abs(actual - expected) < tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

async function testRegistry() {
  const registry = createRegistry();
  ["image", "video", "audio", "code", "ffmpeg", "math", "geometry", "unit"].forEach(name => {
    assert(registry.has(name), `missing tool: ${name}`);
  });
}

async function testMissingCommandTool() {
  const original = process.env.NODEX_IMAGE_COMMAND;
  delete process.env.NODEX_IMAGE_COMMAND;

  const result = await imageTool.run({ prompt: "test" });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("NODEX_IMAGE_COMMAND"));

  if (original === undefined) {
    delete process.env.NODEX_IMAGE_COMMAND;
  } else {
    process.env.NODEX_IMAGE_COMMAND = original;
  }
}

function testStructuralPathAllowlist() {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-sandbox-"));

  assert.strictEqual(isSafePath("output.txt", sandboxRoot), true);
  assert.strictEqual(isSafePath("nested/output.txt", sandboxRoot), true);
  assert.strictEqual(isSafePath(path.join(sandboxRoot, "absolute-inside.txt"), sandboxRoot), true);
  assert.strictEqual(isSafePath("../escape.txt", sandboxRoot), false);
  assert.strictEqual(isSafePath(path.resolve(sandboxRoot, "..", "escape.txt"), sandboxRoot), false);
}

function testSymlinkEscapeWhenSupported() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-link-"));
  const sandboxRoot = path.join(parent, "Sandbox");
  const outsideRoot = path.join(parent, "Outside");
  fs.mkdirSync(sandboxRoot);
  fs.mkdirSync(outsideRoot);

  const linkPath = path.join(sandboxRoot, "linked-outside");

  try {
    fs.symlinkSync(outsideRoot, linkPath, "dir");
  } catch (err) {
    if (["EPERM", "EACCES", "ENOTSUP"].includes(err.code)) {
      return;
    }
    throw err;
  }

  assert.strictEqual(isSafePath("linked-outside/escape.txt", sandboxRoot), false);
}

function testAstSafetyBlocks() {
  assert.strictEqual(checkSafety("import os").reason, "ForbiddenModule");
  assert.strictEqual(checkSafety("import subprocess").reason, "ForbiddenModule");
  assert.strictEqual(checkSafety("__import__('os')").reason, "DynamicImportBlocked");
  assert.strictEqual(checkSafety("eval('1 + 1')").reason, "RuntimeEscapeBlocked");
  assert.strictEqual(checkSafety("from pathlib import Path\nprint(Path('/').iterdir())").reason, "ForbiddenModule");
  assert.strictEqual(checkSafety("import json\nprint(json.dumps({\"status\":\"success\"}))").reason, "OK");
}

function testAuditorRejectsInvalidText() {
  const issues = audit("not python");
  assert(issues.includes("No executable Python code detected"));
}

async function testRouterUnknownTool() {
  const result = await routeTask({ tool: "missing", input: {} });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown tool"));
}

async function testMathRouteAdd() {
  const result = await routeTask({ tool: "math", input: { operation: "add", operands: [2, 3] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.result, 5);
  assert.strictEqual(payload.operation, "add");
}

async function testMathRouteConstantPi() {
  const result = await routeTask({ tool: "math", input: { operation: "constant", constant: "pi" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert(Math.abs(payload.result - Math.PI) < 1e-12);
  assert.strictEqual(payload.operation, "constant");
}

async function testMathRouteDivideByZero() {
  const result = await routeTask({ tool: "math", input: { operation: "divide", operands: [8, 0] } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("divide by zero"));
}

async function testMathRouteUnknownOperation() {
  const result = await routeTask({ tool: "math", input: { operation: "matrix", operands: [1, 2] } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown math operation"));
}

async function testUnitRouteLengthConversion() {
  const result = await routeTask({ tool: "unit", input: { operation: "convert", value: 2, from: "m", to: "cm" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.dimension, "length");
  assert.strictEqual(payload.result, 200);
}

async function testUnitRouteMassConversion() {
  const result = await routeTask({ tool: "unit", input: { operation: "convert", value: 1, from: "kg", to: "g" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.dimension, "mass");
  assert.strictEqual(payload.result, 1000);
}

async function testUnitRouteTemperatureConversion() {
  const result = await routeTask({
    tool: "unit",
    input: { operation: "convert", value: 0, from: "celsius", to: "fahrenheit" }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.dimension, "temperature");
  assert.strictEqual(payload.result, 32);
}

async function testUnitRouteAngleConversion() {
  const result = await routeTask({
    tool: "unit",
    input: { operation: "convert", value: Math.PI, from: "radians", to: "degrees" }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.dimension, "angle");
  assert(Math.abs(payload.result - 180) < 1e-12);
}

async function testUnitRouteIncompatibleConversion() {
  const result = await routeTask({ tool: "unit", input: { operation: "convert", value: 1, from: "m", to: "s" } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Incompatible unit dimensions"));
}

async function testUnitRouteUnknownUnit() {
  const result = await routeTask({ tool: "unit", input: { operation: "convert", value: 1, from: "parsec", to: "m" } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown from unit"));
}

async function testGeometryRouteCircleArea() {
  const result = await routeTask({ tool: "geometry", input: { operation: "circle_area", radius: 2 } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "circle_area");
  assertApproximatelyEqual(payload.result, 4 * Math.PI);
}

async function testGeometryRouteCircleCircumference() {
  const result = await routeTask({ tool: "geometry", input: { operation: "circle_circumference", radius: 2 } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "circle_circumference");
  assertApproximatelyEqual(payload.result, 4 * Math.PI);
}

async function testGeometryRouteRectangleArea() {
  const result = await routeTask({ tool: "geometry", input: { operation: "rectangle_area", width: 3, height: 4 } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "rectangle_area");
  assert.strictEqual(payload.result, 12);
}

async function testGeometryRouteTriangleArea() {
  const result = await routeTask({ tool: "geometry", input: { operation: "triangle_area", base: 10, height: 5 } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "triangle_area");
  assert.strictEqual(payload.result, 25);
}

async function testGeometryRouteRightTriangleHypotenuse() {
  const result = await routeTask({ tool: "geometry", input: { operation: "right_triangle_hypotenuse", a: 3, b: 4 } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "right_triangle_hypotenuse");
  assert.strictEqual(payload.result, 5);
}

async function testGeometryRouteDistance2d() {
  const result = await routeTask({
    tool: "geometry",
    input: { operation: "distance_2d", x1: 0, y1: 0, x2: 3, y2: 4 }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "distance_2d");
  assert.strictEqual(payload.result, 5);
}

async function testGeometryRouteNegativeRadius() {
  const result = await routeTask({ tool: "geometry", input: { operation: "circle_area", radius: -1 } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("radius"));
}

async function testGeometryRouteUnknownOperation() {
  const result = await routeTask({ tool: "geometry", input: { operation: "polygon_area", sides: 5 } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown geometry operation"));
}

function testFallbackRouting() {
  assert.strictEqual(fallbackDecision("generate an image of a workstation").tool, "image");
  assert.strictEqual(fallbackDecision("make a video animation").tool, "video");
  assert.strictEqual(fallbackDecision("create TTS narration").tool, "audio");
  assert.strictEqual(fallbackDecision("ffmpeg combine clips").tool, "ffmpeg");
  assert.strictEqual(fallbackDecision("run python logic").tool, "execute_python");
}

function testPythonSandboxSafeExecution() {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-run-"));
  const result = runPythonCode("import json\nprint(json.dumps({\"status\": \"success\", \"result\": 1}))", {
    sandboxRoot,
    timeout: 3000,
    log: () => {}
  });

  assert.strictEqual(result.status, "success");
  assert(result.durationMs >= 0);
  assert.strictEqual(result.errorClass, "none");
  assert(result.output.includes('"status": "success"'));
  assert(readSandboxFile("execution.txt", sandboxRoot).includes('"status": "success"'));
  assert(JSON.parse(readSandboxFile("execution_meta.json", sandboxRoot)).outputBytes > 0);
}

function testSandboxAllowsInternalOpen() {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-open-ok-"));
  const result = runPythonCode(
    "import json\nopen('inside.txt', 'w').write('ok')\nprint(json.dumps({\"status\": \"success\", \"result\": \"written\"}))",
    { sandboxRoot, timeout: 3000, log: () => {} }
  );

  assert.strictEqual(result.status, "success");
  assert.strictEqual(readSandboxFile("inside.txt", sandboxRoot), "ok");
}

function testSandboxBlocksTraversalOpen() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-open-block-"));
  const sandboxRoot = path.join(parent, "Sandbox");
  fs.mkdirSync(sandboxRoot);

  const result = runPythonCode("open('../outside.txt', 'w').write('escape')", {
    sandboxRoot,
    timeout: 3000,
    log: () => {}
  });

  assert.strictEqual(result.status, "error");
  assert(result.error.includes("PermissionError"));
  assert.strictEqual(fs.existsSync(path.join(parent, "outside.txt")), false);
}

function testImportBypassBlocked() {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-import-block-"));
  const result = runPythonCode("__import__('os').system('dir')", {
    sandboxRoot,
    timeout: 3000,
    log: () => {}
  });

  assert.strictEqual(result.status, "error");
  assert.strictEqual(result.error, "DynamicImportBlocked");
}

function testPathlibBypassBlocked() {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-pathlib-block-"));
  const result = runPythonCode("from pathlib import Path\nprint(Path('/').iterdir())", {
    sandboxRoot,
    timeout: 3000,
    log: () => {}
  });

  assert.strictEqual(result.status, "error");
  assert.strictEqual(result.error, "ForbiddenModule");
}

function testPythonSandboxTimeout() {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-timeout-"));
  const result = runPythonCode("while True:\n    pass", {
    sandboxRoot,
    timeout: 250,
    log: () => {}
  });

  assert.strictEqual(result.status, "error");
  assert(result.error.includes("ExecutionTimeout"));
  assert.strictEqual(result.timedOut, true);
}

function testLearningSignals() {
  const metrics = buildExecutionMetrics({
    executionResult: {
      status: "error",
      output: "",
      error: "ForbiddenModule",
      durationMs: 12,
      errorClass: "ForbiddenModule"
    }
  });

  assert.strictEqual(metrics.errorClass, "import_blocked");
  assert.strictEqual(metrics.outputValidJson, false);

  const failureReason = classifyAttempt({
    status: "error",
    metrics
  });

  assert.strictEqual(failureReason, "import_blocked");

  const state = summarizeAttempts([
    { attempt: 1, status: "error", phase: "execution", failureReason: "import_blocked", score: 10 },
    { attempt: 2, status: "success", phase: "finalize", score: 30, metrics: { durationMs: 40 }, codeShape: { functionCount: 5 } }
  ]);

  assert.strictEqual(state.lastFailureReason, "import_blocked");
  assert(state.guidance.some(line => line.includes("allowlisted imports")));
  assert(formatLearningForPrompt(state).includes("import_blocked"));
}

function testGranularExecutionScoring() {
  const metrics = buildExecutionMetrics({
    executionResult: {
      status: "success",
      output: "{\"status\":\"success\",\"result\":1}",
      error: "",
      durationMs: 50,
      errorClass: "none"
    }
  });

  assert(scoreExecutionMetrics(metrics) >= 8);
}

function testStrategyPerformanceAndSelection() {
  const attempts = [
    { strategy: "explore_variation", status: "error", score: 8, weight: 0.4, timestamp: "2026-04-20T18:00:00.000Z" },
    { strategy: "exploit_success_patterns", status: "success", score: 31, weight: 5, timestamp: "2026-04-20T18:01:00.000Z" },
    { strategy: "exploit_success_patterns", status: "success", score: 34, weight: 5, timestamp: "2026-04-20T18:02:00.000Z" },
    { strategy: "top_k_structure_reuse", status: "success", score: 28, weight: 4.2, timestamp: "2026-04-20T18:03:00.000Z" }
  ];

  const performance = calculateStrategyPerformance(attempts);
  assert.strictEqual(performance.exploit_success_patterns.success_rate, 1);
  assert(performance.exploit_success_patterns.avg_score > performance.explore_variation.avg_score);
  assert(performance.exploit_success_patterns.expected_value > performance.explore_variation.expected_value);

  const selected = selectStrategy({
    strategy_performance: performance,
    successful_patterns: [{ pattern: "Keep execution under 100ms" }],
    pattern_composition: { compositions: [] }
  });
  assert.strictEqual(selected.mode, "exploit_success_patterns");
}

function testStructuralPatternExtractionAndCandidates() {
  const attempts = [
    {
      strategy: "exploit_success_patterns",
      status: "success",
      score: 34,
      weight: 5,
      timestamp: "2026-04-20T18:00:00.000Z",
      metrics: { durationMs: 40, outputValidJson: true, outputStatus: "success", errorClass: "none" },
      evolution: "import json\ndef input_stage():\n    return [{\"value\": 1}]\ndef transformation_stage(data):\n    return [{\"value\": item[\"value\"] * 2} for item in data]\ndef analysis_stage(data):\n    return {\"total\": sum(item[\"value\"] for item in data), \"count\": len(data)}\ndef output_stage(result):\n    print(json.dumps({\"status\":\"success\",\"result\":result}))\ndef main():\n    output_stage(analysis_stage(transformation_stage(input_stage())))\nmain()"
    }
  ];

  const structures = extractStructuralPatternSummary(attempts);
  assert(structures.pipeline_patterns.some(item => item.pattern === "five_stage_pipeline"));
  assert(structures.transformation_strategies.some(item => item.pattern === "records_as_list_of_dicts"));
  assert(structures.algorithm_choices.some(item => item.pattern === "aggregate_sum_len_count"));

  const compositions = extractPatternComposition(attempts);
  assert.strictEqual(compositions.length, 1);
  assert(compositions[0].directive.includes("five_stage_pipeline"));

  const state = summarizeAttempts(attempts);
  const candidates = buildStrategyCandidates(state, 4);
  assert(candidates.length >= 3);
  assert(candidates.some(candidate => candidate.name === "top_k_structure_reuse"));
  assert(candidates.some(candidate => candidate.name === "composed_pattern_reuse"));
}

function testAdaptiveExplorationAndPublishConfidence() {
  const stagnant = calculateAdaptiveExploration({
    trend: { stagnant: true, improving: false },
    selected_strategy: { mode: "explore_variation" },
    strategy_performance: {
      explore_variation: { attempts: 3, decayed_success_rate: 0.2, expected_value: 8 }
    },
    successful_patterns: [{ pattern: "Produce one valid JSON object with status success" }]
  }, 4);
  assert.strictEqual(stagnant.target_parallel_attempts, 5);

  const focused = calculateAdaptiveExploration({
    trend: { stagnant: false, improving: true },
    selected_strategy: { mode: "exploit_success_patterns" },
    strategy_performance: {
      exploit_success_patterns: { attempts: 3, decayed_success_rate: 0.85, expected_value: 32 }
    },
    successful_patterns: [{ pattern: "Keep execution under 100ms" }]
  }, 4);
  assert.strictEqual(focused.target_parallel_attempts, 3);

  const confidence = calculatePublishConfidence({
    top_attempts: [{ score: 34 }],
    trend: { avg_score_last_5: 23.2 }
  }, 25);
  assert.strictEqual(confidence.threshold, 31);
}

function testBestCandidateSelection() {
  const best = selectBestCandidate([
    { candidate: 1, strategy: "explore_variation", status: "error", score: 40, weight: 1 },
    { candidate: 2, strategy: "candidate_hold", status: "hold", score: 29, weight: 4 },
    { candidate: 3, strategy: "top_k_structure_reuse", status: "success", score: 32, weight: 3 }
  ]);

  assert.strictEqual(best.candidate, 3);

  const held = selectBestCandidate([
    { candidate: 1, strategy: "explore_variation", status: "error", score: 41, weight: 1 },
    { candidate: 2, strategy: "top_k_structure_reuse", status: "hold", score: 30, weight: 4 }
  ]);

  assert.strictEqual(held.candidate, 2);
}

async function run() {
  await testRegistry();
  await testMissingCommandTool();
  testStructuralPathAllowlist();
  testSymlinkEscapeWhenSupported();
  testAstSafetyBlocks();
  testAuditorRejectsInvalidText();
  await testRouterUnknownTool();
  await testMathRouteAdd();
  await testMathRouteConstantPi();
  await testMathRouteDivideByZero();
  await testMathRouteUnknownOperation();
  await testUnitRouteLengthConversion();
  await testUnitRouteMassConversion();
  await testUnitRouteTemperatureConversion();
  await testUnitRouteAngleConversion();
  await testUnitRouteIncompatibleConversion();
  await testUnitRouteUnknownUnit();
  await testGeometryRouteCircleArea();
  await testGeometryRouteCircleCircumference();
  await testGeometryRouteRectangleArea();
  await testGeometryRouteTriangleArea();
  await testGeometryRouteRightTriangleHypotenuse();
  await testGeometryRouteDistance2d();
  await testGeometryRouteNegativeRadius();
  await testGeometryRouteUnknownOperation();
  testFallbackRouting();
  testPythonSandboxSafeExecution();
  testSandboxAllowsInternalOpen();
  testSandboxBlocksTraversalOpen();
  testImportBypassBlocked();
  testPathlibBypassBlocked();
  testPythonSandboxTimeout();
  testLearningSignals();
  testGranularExecutionScoring();
  testStrategyPerformanceAndSelection();
  testStructuralPatternExtractionAndCandidates();
  testAdaptiveExplorationAndPublishConfidence();
  testBestCandidateSelection();

  console.log("All Nodex tests passed");
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
