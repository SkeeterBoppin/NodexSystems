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

function assertApproximatelyArrayEqual(actual, expected, tolerance = 1e-12) {
  assert(Array.isArray(actual), "expected an array result");
  assert.strictEqual(actual.length, expected.length, "array lengths must match");

  actual.forEach((value, index) => {
    assertApproximatelyEqual(value, expected[index], tolerance);
  });
}

async function testRegistry() {
  const registry = createRegistry();
  ["image", "video", "audio", "code", "ffmpeg", "math", "geometry", "unit", "trig", "logic", "vector"].forEach(name => {
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

async function testTrigRouteSinDegrees() {
  const result = await routeTask({ tool: "trig", input: { operation: "sin", angle: 90, angleUnit: "deg" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "sin");
  assert.strictEqual(payload.angle, 90);
  assert.strictEqual(payload.angleUnit, "deg");
  assertApproximatelyEqual(payload.result, 1);
}

async function testTrigRouteCosRadians() {
  const result = await routeTask({ tool: "trig", input: { operation: "cos", angle: Math.PI, angleUnit: "rad" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "cos");
  assert.strictEqual(payload.angle, Math.PI);
  assert.strictEqual(payload.angleUnit, "rad");
  assertApproximatelyEqual(payload.result, -1);
}

async function testTrigRouteTanDegrees() {
  const result = await routeTask({ tool: "trig", input: { operation: "tan", angle: 45, angleUnit: "deg" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "tan");
  assert.strictEqual(payload.angle, 45);
  assert.strictEqual(payload.angleUnit, "deg");
  assertApproximatelyEqual(payload.result, 1);
}

async function testTrigRouteAsinDegrees() {
  const result = await routeTask({ tool: "trig", input: { operation: "asin", value: 1, resultUnit: "deg" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "asin");
  assert.strictEqual(payload.value, 1);
  assert.strictEqual(payload.resultUnit, "deg");
  assertApproximatelyEqual(payload.result, 90);
}

async function testTrigRouteAcosRadians() {
  const result = await routeTask({ tool: "trig", input: { operation: "acos", value: 1, resultUnit: "rad" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "acos");
  assert.strictEqual(payload.value, 1);
  assert.strictEqual(payload.resultUnit, "rad");
  assertApproximatelyEqual(payload.result, 0);
}

async function testTrigRouteAtanDegrees() {
  const result = await routeTask({ tool: "trig", input: { operation: "atan", value: 1, resultUnit: "deg" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "atan");
  assert.strictEqual(payload.value, 1);
  assert.strictEqual(payload.resultUnit, "deg");
  assertApproximatelyEqual(payload.result, 45);
}

async function testTrigRouteTanSingularAngle() {
  const result = await routeTask({ tool: "trig", input: { operation: "tan", angle: 90, angleUnit: "deg" } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("tan"));
}

async function testTrigRouteAsinOutOfRange() {
  const result = await routeTask({ tool: "trig", input: { operation: "asin", value: 2, resultUnit: "rad" } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("[-1, 1]"));
}

async function testTrigRouteUnknownOperation() {
  const result = await routeTask({ tool: "trig", input: { operation: "sec", angle: 1, angleUnit: "rad" } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown trig operation"));
}

async function testLogicRouteNot() {
  const result = await routeTask({ tool: "logic", input: { operation: "not", operands: [true] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "not");
  assert.deepStrictEqual(payload.operands, [true]);
  assert.strictEqual(payload.result, false);
}

async function testLogicRouteAnd() {
  const result = await routeTask({ tool: "logic", input: { operation: "and", operands: [true, true, true] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "and");
  assert.deepStrictEqual(payload.operands, [true, true, true]);
  assert.strictEqual(payload.result, true);
}

async function testLogicRouteOr() {
  const result = await routeTask({ tool: "logic", input: { operation: "or", operands: [false, false, true] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "or");
  assert.deepStrictEqual(payload.operands, [false, false, true]);
  assert.strictEqual(payload.result, true);
}

async function testLogicRouteXor() {
  const result = await routeTask({ tool: "logic", input: { operation: "xor", operands: [true, false] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "xor");
  assert.deepStrictEqual(payload.operands, [true, false]);
  assert.strictEqual(payload.result, true);
}

async function testLogicRouteImplies() {
  const result = await routeTask({ tool: "logic", input: { operation: "implies", operands: [true, false] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "implies");
  assert.deepStrictEqual(payload.operands, [true, false]);
  assert.strictEqual(payload.result, false);
}

async function testLogicRouteIff() {
  const result = await routeTask({ tool: "logic", input: { operation: "iff", operands: [true, true] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "iff");
  assert.deepStrictEqual(payload.operands, [true, true]);
  assert.strictEqual(payload.result, true);
}

async function testLogicRouteUnknownOperation() {
  const result = await routeTask({ tool: "logic", input: { operation: "nand", operands: [true, false] } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown logic operation"));
}

async function testLogicRouteMissingOperands() {
  const result = await routeTask({ tool: "logic", input: { operation: "and" } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("operands"));
}

async function testLogicRouteWrongArity() {
  const result = await routeTask({ tool: "logic", input: { operation: "xor", operands: [true, false, true] } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("exactly 2"));
}

async function testLogicRouteNonBooleanOperand() {
  const result = await routeTask({ tool: "logic", input: { operation: "or", operands: [false, 1] } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("boolean"));
}

async function testVectorRouteAdd() {
  const result = await routeTask({ tool: "vector", input: { operation: "vector_add", left: [1, 2], right: [3, 4] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "vector_add");
  assert.strictEqual(payload.dimension, 2);
  assert.deepStrictEqual(payload.result, [4, 6]);
}

async function testVectorRouteSubtract() {
  const result = await routeTask({
    tool: "vector",
    input: { operation: "vector_subtract", left: [5, 7], right: [2, 3] }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "vector_subtract");
  assert.strictEqual(payload.dimension, 2);
  assert.deepStrictEqual(payload.result, [3, 4]);
}

async function testVectorRouteScalarMultiply() {
  const result = await routeTask({
    tool: "vector",
    input: { operation: "scalar_multiply", scalar: 3, vector: [1, -2, 0] }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "scalar_multiply");
  assert.strictEqual(payload.dimension, 3);
  assert.deepStrictEqual(payload.result, [3, -6, 0]);
}

async function testVectorRouteDotProduct() {
  const result = await routeTask({
    tool: "vector",
    input: { operation: "dot_product", left: [1, 2, 3], right: [4, 5, 6] }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "dot_product");
  assert.strictEqual(payload.dimension, 3);
  assert.strictEqual(payload.result, 32);
}

async function testVectorRouteMagnitude() {
  const result = await routeTask({ tool: "vector", input: { operation: "magnitude", vector: [3, 4] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "magnitude");
  assert.strictEqual(payload.dimension, 2);
  assert.strictEqual(payload.result, 5);
}

async function testVectorRouteNormalize() {
  const result = await routeTask({ tool: "vector", input: { operation: "normalize", vector: [3, 4] } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "normalize");
  assert.strictEqual(payload.dimension, 2);
  assertApproximatelyArrayEqual(payload.result, [0.6, 0.8]);
}

async function testVectorRouteCrossProduct3d() {
  const result = await routeTask({
    tool: "vector",
    input: { operation: "cross_product_3d", left: [1, 0, 0], right: [0, 1, 0] }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "cross_product_3d");
  assert.strictEqual(payload.dimension, 3);
  assert.deepStrictEqual(payload.result, [0, 0, 1]);
}

async function testVectorRouteMismatchedLengths() {
  const result = await routeTask({
    tool: "vector",
    input: { operation: "vector_add", left: [1, 2], right: [3] }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("same length"));
}

async function testVectorRouteNormalizeZeroVector() {
  const result = await routeTask({ tool: "vector", input: { operation: "normalize", vector: [0, 0] } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("non-zero vector"));
}

async function testVectorRouteNonFiniteElement() {
  const result = await routeTask({
    tool: "vector",
    input: { operation: "dot_product", left: [1, Infinity], right: [2, 3] }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("finite number"));
}

async function testVectorRouteUnknownOperation() {
  const result = await routeTask({ tool: "vector", input: { operation: "matrix_inverse", vector: [1, 2] } });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown vector operation"));
}

async function testVectorRouteCapOverflow() {
  const result = await routeTask({
    tool: "vector",
    input: {
      operation: "vector_add",
      left: new Array(129).fill(1),
      right: new Array(129).fill(2)
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("128"));
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
  await testTrigRouteSinDegrees();
  await testTrigRouteCosRadians();
  await testTrigRouteTanDegrees();
  await testTrigRouteAsinDegrees();
  await testTrigRouteAcosRadians();
  await testTrigRouteAtanDegrees();
  await testTrigRouteTanSingularAngle();
  await testTrigRouteAsinOutOfRange();
  await testTrigRouteUnknownOperation();
  await testLogicRouteNot();
  await testLogicRouteAnd();
  await testLogicRouteOr();
  await testLogicRouteXor();
  await testLogicRouteImplies();
  await testLogicRouteIff();
  await testLogicRouteUnknownOperation();
  await testLogicRouteMissingOperands();
  await testLogicRouteWrongArity();
  await testLogicRouteNonBooleanOperand();
  await testVectorRouteAdd();
  await testVectorRouteSubtract();
  await testVectorRouteScalarMultiply();
  await testVectorRouteDotProduct();
  await testVectorRouteMagnitude();
  await testVectorRouteNormalize();
  await testVectorRouteCrossProduct3d();
  await testVectorRouteMismatchedLengths();
  await testVectorRouteNormalizeZeroVector();
  await testVectorRouteNonFiniteElement();
  await testVectorRouteUnknownOperation();
  await testVectorRouteCapOverflow();
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
