const assert = require("assert");
const {
  RUNTIME_DRY_RUN_EXECUTION_PATH_STATUSES,
  RUNTIME_DRY_RUN_EXECUTION_PATH_BLOCKED_REASONS,
  createRuntimeDryRunExecutionPath,
  validateRuntimeDryRunExecutionPath,
  classifyRuntimeDryRunExecutionPath,
  assertRuntimeDryRunExecutionPathNotExecutable,
  summarizeRuntimeDryRunExecutionPath
} = require("../core/runtimeDryRunExecutionPath");
const {
  RUNTIME_INTEGRATION_DRY_RUN_PATH_STATUSES,
  RUNTIME_INTEGRATION_DRY_RUN_PATH_BLOCKED_REASONS,
  createRuntimeIntegrationDryRunPath,
  validateRuntimeIntegrationDryRunPath,
  classifyRuntimeIntegrationDryRunPath,
  assertRuntimeIntegrationDryRunPathNotExecutable,
  summarizeRuntimeIntegrationDryRunPath
} = require("../core/runtimeIntegrationPlanExecutorDryRunPath");
const {
  RUNTIME_USER_APPROVAL_SCOPES,
  RUNTIME_USER_APPROVAL_STATES,
  RUNTIME_USER_APPROVAL_DECISIONS,
  RUNTIME_USER_APPROVAL_BLOCKED_REASONS,
  createRuntimeUserApprovalCheckpoint,
  validateRuntimeUserApprovalCheckpoint,
  classifyRuntimeUserApprovalCheckpoint,
  assertRuntimeUserApprovalNotGranted,
  summarizeRuntimeUserApprovalCheckpoint
} = require("../core/runtimeUserApprovalCheckpoint");
const {
  RUNTIME_DRY_RUN_REQUEST_TYPES,
  RUNTIME_DRY_RUN_STATUSES,
  RUNTIME_DRY_RUN_AUTHORITY_STATES,
  RUNTIME_DRY_RUN_BLOCKED_REASONS,
  createRuntimeDryRunRequest,
  validateRuntimeDryRunRequest,
  classifyRuntimeDryRunRequest,
  createRuntimeDryRunResult,
  validateRuntimeDryRunResult,
  assertRuntimeDryRunResultNotAuthority,
  summarizeRuntimeDryRunRecord
} = require("../core/runtimeDryRunContract");
const {
  TOOL_EXECUTION_AUDIT_RECORD_TYPES,
  TOOL_EXECUTION_AUDIT_STATUSES,
  TOOL_EXECUTION_AUDIT_AUTHORITY_STATES,
  TOOL_EXECUTION_AUDIT_BLOCKED_REASONS,
  createToolExecutionAuditRecord,
  validateToolExecutionAuditRecord,
  classifyToolExecutionAuditRecord,
  assertToolExecutionAuditRecordNotProof,
  assertToolExecutionAuditRecordNotReplayable,
  summarizeToolExecutionAuditRecord
} = require("../core/toolExecutionAuditLog");
const {
  SIDE_EFFECT_SANDBOX_LEVELS,
  SIDE_EFFECT_SANDBOX_STATUSES,
  SIDE_EFFECT_SANDBOX_BLOCKED_REASONS,
  SIDE_EFFECT_SANDBOX_REQUIRED_GATES,
  createSideEffectSandboxPolicy,
  validateSideEffectSandboxPolicy,
  classifySideEffectSandboxRequest,
  assertSideEffectSandboxBlocksExecution,
  summarizeSideEffectSandboxPolicy
} = require("../core/sideEffectSandbox");
const {
  EXECUTION_ADAPTER_TYPES,
  EXECUTION_ADAPTER_STATUSES,
  EXECUTION_ADAPTER_SIDE_EFFECT_LEVELS,
  EXECUTION_ADAPTER_BLOCKED_REASONS,
  createExecutionAdapterPolicy,
  validateExecutionAdapterPolicy,
  createExecutionAdapterRegistry,
  classifyExecutionAdapterRequest,
  assertExecutionAdapterNotExecutable,
  summarizeExecutionAdapterRegistry
} = require("../core/executionAdapterRegistry");
const {
  PERMISSION_GATE_SCOPES,
  PERMISSION_GATE_STATUSES,
  PERMISSION_GATE_DECISIONS,
  PERMISSION_GATE_BLOCKED_REASONS,
  createPermissionRequest,
  validatePermissionRequest,
  classifyPermissionRequest,
  assertPermissionNotGranted,
  summarizePermissionRequest
} = require("../core/permissionGate");
const {
  RUNTIME_BOUNDARY_ACTIONS,
  RUNTIME_BOUNDARY_STATUSES,
  RUNTIME_BOUNDARY_SIDE_EFFECT_LEVELS,
  RUNTIME_BOUNDARY_BLOCKED_REASONS,
  createRuntimeRequest,
  validateRuntimeRequest,
  classifyRuntimeRequest,
  assertRuntimeRequestBlocked,
  summarizeRuntimeRequest
} = require("../core/runtimeIntegrationBoundary");
const {
  HANDOFF_RUNNER_ACTIONS,
  HANDOFF_RUNNER_STATUSES,
  HANDOFF_RUNNER_BLOCKED_REASONS,
  createHandoffRunnerDecision,
  validateHandoffRunnerDecision,
  classifyHandoffPacketForRunner,
  createAgentHandoffRunner,
  assertHandoffRunnerDecisionSafe,
  summarizeHandoffRunnerDecision
} = require("../core/agentHandoffRunner");
const {
  COMMIT_GATE_REQUIRED_STEPS,
  COMMIT_GATE_STATUSES,
  COMMIT_GATE_BLOCKING_REASONS,
  createCommitGateRecord,
  validateCommitGateRecord,
  evaluateCommitGateRecord,
  assertCommitGatePassed,
  summarizeCommitGateRecord
} = require("../core/commitGate");
const {
  REPLAY_RECORD_TYPES,
  REPLAY_AUTHORITY_STATES,
  REPLAY_BLOCKED_AUTHORITY_STATES,
  REPLAY_FRESHNESS_STATES,
  REPLAY_VALIDATION_STATES,
  createReplayRecord,
  validateReplayRecord,
  classifyReplayRecordAuthority,
  assertReplayRecordNotProof,
  assertReplayRecordFreshForUse
} = require("../core/replayStore");
const {
  TOOL_CAPABILITY_POLICIES,
  CAPABILITY_CLASSES,
  SIDE_EFFECT_LEVELS,
  DEFAULT_POLICIES,
  createToolCapabilityPolicy,
  validateToolCapabilityPolicy,
  createToolCapabilityRegistry,
  getToolCapabilityPolicy,
  classifyToolCapability,
  canUseToolCapability,
  assertToolCapabilityAllowed,
  summarizeToolCapabilityRisk
} = require("../core/toolCapabilityRegistry");
const {
  INPUT_RISK_FLAGS,
  ALLOWED_NEXT_ACTIONS,
  BLOCKED_ACTIONS,
  createInputPatternResult,
  validateInputPatternResult,
  weighInputPattern,
  createInputPatternWeigher,
  classifyInputPatternResult,
  assertInputPatternResultNotProof
} = require("../core/inputPatternWeigher");
const {
  PATTERN_TYPES,
  createPatternObservation,
  validatePatternObservation,
  createContextPatternGraph,
  getPatternObservation,
  classifyPatternObservation,
  canPatternAffectRouting,
  assertPatternNotProof
} = require("../core/contextPatternGraph");
const {
  CONTEXT_USE_SURFACES,
  createContextSurface,
  validateContextSurface,
  createContextUseGraph,
  getContextSurface,
  canUseContextFor,
  assertContextUsageAllowed,
  classifyContextUsage
} = require("../core/contextUseGraph");
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
const {
  candidateRoot,
  candidatePaths,
  selectBestCandidate
} = require("../evolution/evolver");
const {
  createTaskGraph,
  validateTaskGraph,
  getCurrentStep,
  getNextExecutableStep,
  markStepStarted,
  markStepPassed,
  markStepFailed
} = require("../core/taskGraph");
const {
  createMemoryCapsule,
  validateMemoryCapsule
} = require("../core/memoryCapsule");
const {
  createContextLedgerRecord,
  validateContextLedgerRecord,
  appendContextLedgerRecord,
  validateContextLedger
} = require("../core/contextLedger");

const {
  createValidityClaim,
  validateValidityClaim,
  createValidityGraph,
  validateValidityGraph,
  appendValidityClaim,
  resolveValidityGraph
} = require("../core/validityGraph");
const {
  createRepairRecommendation,
  validateRepairRecommendation
} = require("../core/repairLoop");
const {
  createAgentHandoffPacket,
  validateAgentHandoffPacket
} = require("../core/agentHandoffPacket");
const {
  createAgentHandoffBridgePacket,
  validateAgentHandoffBridgePacket
} = require("../core/agentHandoffBridge");
const {
  createEvidenceGateRecord,
  validateEvidenceGateRecord
} = require("../core/evidenceGate");
const {
  parseTranscriptEvidenceCandidates
} = require("../core/transcriptParser");
const {
  adaptTranscriptEvidenceCandidates
} = require("../core/transcriptEvidenceAdapter");

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
  ["image", "video", "audio", "code", "ffmpeg", "math", "geometry", "unit", "trig", "logic", "vector", "matrix", "formula"].forEach(name => {
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

async function testMatrixRouteAdd() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "matrix_add",
      left: [[1, 2], [3, 4]],
      right: [[5, 6], [7, 8]]
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "matrix_add");
  assert.strictEqual(payload.rows, 2);
  assert.strictEqual(payload.cols, 2);
  assert.deepStrictEqual(payload.result, [[6, 8], [10, 12]]);
}

async function testMatrixRouteSubtract() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "matrix_subtract",
      left: [[5, 6], [7, 8]],
      right: [[1, 2], [3, 4]]
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "matrix_subtract");
  assert.strictEqual(payload.rows, 2);
  assert.strictEqual(payload.cols, 2);
  assert.deepStrictEqual(payload.result, [[4, 4], [4, 4]]);
}

async function testMatrixRouteScalarMultiply() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "scalar_multiply",
      scalar: 2,
      matrix: [[1, -2], [0, 3]]
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "scalar_multiply");
  assert.strictEqual(payload.rows, 2);
  assert.strictEqual(payload.cols, 2);
  assert.deepStrictEqual(payload.result, [[2, -4], [0, 6]]);
}

async function testMatrixRouteVectorMultiply() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "matrix_vector_multiply",
      matrix: [[1, 2], [3, 4]],
      vector: [5, 6]
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "matrix_vector_multiply");
  assert.strictEqual(payload.dimension, 2);
  assert.deepStrictEqual(payload.result, [17, 39]);
}

async function testMatrixRouteMultiply() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "matrix_multiply",
      left: [[1, 2, 3], [4, 5, 6]],
      right: [[7, 8], [9, 10], [11, 12]]
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "matrix_multiply");
  assert.strictEqual(payload.rows, 2);
  assert.strictEqual(payload.cols, 2);
  assert.deepStrictEqual(payload.result, [[58, 64], [139, 154]]);
}

async function testMatrixRouteTranspose() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "transpose",
      matrix: [[1, 2, 3], [4, 5, 6]]
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "transpose");
  assert.strictEqual(payload.rows, 3);
  assert.strictEqual(payload.cols, 2);
  assert.deepStrictEqual(payload.result, [[1, 4], [2, 5], [3, 6]]);
}

async function testMatrixRouteIdentity() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "identity",
      size: 3
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "identity");
  assert.strictEqual(payload.size, 3);
  assert.strictEqual(payload.rows, 3);
  assert.strictEqual(payload.cols, 3);
  assert.deepStrictEqual(payload.result, [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
}

async function testMatrixRouteDeterminant2x2() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "determinant_2x2",
      matrix: [[1, 2], [3, 4]]
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "determinant_2x2");
  assert.strictEqual(payload.size, 2);
  assert.strictEqual(payload.result, -2);
}

async function testMatrixRouteDeterminant3x3() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "determinant_3x3",
      matrix: [[6, 1, 1], [4, -2, 5], [2, 8, 7]]
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "determinant_3x3");
  assert.strictEqual(payload.size, 3);
  assert.strictEqual(payload.result, -306);
}

async function testMatrixRouteUnknownOperation() {
  const result = await routeTask({
    tool: "matrix",
    input: { operation: "inverse", matrix: [[1, 2], [3, 4]] }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown matrix operation"));
}

async function testMatrixRouteRaggedMatrix() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "transpose",
      matrix: [[1, 2], [3]]
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("rectangular"));
}

async function testMatrixRouteAddShapeMismatch() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "matrix_add",
      left: [[1, 2], [3, 4]],
      right: [[5, 6]]
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("same rows and columns"));
}

async function testMatrixRouteMultiplyIncompatibleDimensions() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "matrix_multiply",
      left: [[1, 2], [3, 4]],
      right: [[5, 6]]
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("left column count"));
}

async function testMatrixRouteNonFiniteElement() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "transpose",
      matrix: [[1, Infinity]]
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("finite number"));
}

async function testMatrixRouteDeterminantWrongSize() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "determinant_2x2",
      matrix: [[1, 2, 3], [4, 5, 6]]
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("exactly 2x2"));
}

async function testMatrixRouteCapOverflow() {
  const result = await routeTask({
    tool: "matrix",
    input: {
      operation: "transpose",
      matrix: Array.from({ length: 33 }, (_, index) => [index])
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("32"));
}

async function testFormulaRouteListFormulas() {
  const result = await routeTask({ tool: "formula", input: { operation: "list_formulas" } });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "list_formulas");
  assert.strictEqual(payload.count, 5);
  assert(payload.formulas.some(formula => formula.id === "kinetic_energy"));
}

async function testFormulaRouteGetFormula() {
  const result = await routeTask({
    tool: "formula",
    input: { operation: "get_formula", formulaId: "kinetic_energy" }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.operation, "get_formula");
  assert.strictEqual(payload.formulaId, "kinetic_energy");
  assert.strictEqual(payload.formula.id, "kinetic_energy");
}

async function testFormulaRouteEvaluateKineticEnergy() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "kinetic_energy",
      variables: { mass: 2, velocity: 3 }
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.result, 9);
}

async function testFormulaRouteEvaluateDensity() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "density",
      variables: { mass: 10, volume: 2 }
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.result, 5);
}

async function testFormulaRouteEvaluateSpeed() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "speed",
      variables: { distance: 100, time: 4 }
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.result, 25);
}

async function testFormulaRouteEvaluateOhmsLawVoltage() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "ohms_law_voltage",
      variables: { current: 2, resistance: 5 }
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.result, 10);
}

async function testFormulaRouteEvaluateMomentum() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "momentum",
      variables: { mass: 3, velocity: 4 }
    }
  });
  assert.strictEqual(result.status, "success");

  const payload = JSON.parse(result.output);
  assert.strictEqual(payload.status, "success");
  assert.strictEqual(payload.result, 12);
}

async function testFormulaRouteUnknownFormulaId() {
  const result = await routeTask({
    tool: "formula",
    input: { operation: "get_formula", formulaId: "missing_formula" }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown formulaId"));
}

async function testFormulaRouteMissingRequiredVariable() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "kinetic_energy",
      variables: { mass: 2 }
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Missing required variable"));
}

async function testFormulaRouteUnknownProvidedVariable() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "kinetic_energy",
      variables: { mass: 2, velocity: 3, force: 5 }
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown variable"));
}

async function testFormulaRouteNonFiniteVariable() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "kinetic_energy",
      variables: { mass: Infinity, velocity: 3 }
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("finite number"));
}

async function testFormulaRouteDivideByZero() {
  const result = await routeTask({
    tool: "formula",
    input: {
      operation: "evaluate_formula",
      formulaId: "density",
      variables: { mass: 10, volume: 0 }
    }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("divide by zero"));
}

async function testFormulaRouteUnknownOperation() {
  const result = await routeTask({
    tool: "formula",
    input: { operation: "derive_formula" }
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("Unknown formula operation"));
}

async function testFormulaRouteMalformedInput() {
  const result = await routeTask({
    tool: "formula",
    input: []
  });
  assert.strictEqual(result.status, "error");
  assert(result.error.includes("JSON object"));
}

function testDomainOntologyManifest() {
  const ontology = require("../Knowledge/domainOntology.json");
  const idPattern = /^[a-z0-9]+(?:[._][a-z0-9]+)*$/;
  const collections = [
    ["epistemicModes", ontology.epistemicModes],
    ["claimTypes", ontology.claimTypes],
    ["sourceTypes", ontology.sourceTypes],
    ["validationRules", ontology.validationRules],
    ["domains", ontology.domains]
  ];

  assert.strictEqual(ontology.version, 1);

  function indexCollection(name, items) {
    assert(Array.isArray(items), `${name} must be an array`);
    assert(items.length > 0, `${name} must not be empty`);

    const map = new Map();
    items.forEach(item => {
      assert(item && typeof item === "object" && !Array.isArray(item), `${name} entries must be objects`);
      assert.strictEqual(typeof item.id, "string", `${name} ids must be strings`);
      assert(item.id.length > 0, `${name} ids must be non-empty`);
      assert(idPattern.test(item.id), `${name} id must be stable lowercase underscore/dot: ${item.id}`);
      assert.strictEqual(map.has(item.id), false, `${name} id must be unique: ${item.id}`);
      map.set(item.id, item);
    });

    return map;
  }

  const epistemicModes = indexCollection(collections[0][0], collections[0][1]);
  const claimTypes = indexCollection(collections[1][0], collections[1][1]);
  const sourceTypes = indexCollection(collections[2][0], collections[2][1]);
  const validationRules = indexCollection(collections[3][0], collections[3][1]);
  const domains = indexCollection(collections[4][0], collections[4][1]);

  ontology.validationRules.forEach(rule => {
    assert(Array.isArray(rule.allowedEpistemicModeIds), `${rule.id} allowedEpistemicModeIds must be an array`);
    assert(Array.isArray(rule.allowedClaimTypeIds), `${rule.id} allowedClaimTypeIds must be an array`);
    assert(Array.isArray(rule.allowedSourceTypeIds), `${rule.id} allowedSourceTypeIds must be an array`);

    rule.allowedEpistemicModeIds.forEach(modeId => {
      assert(epistemicModes.has(modeId), `${rule.id} references unknown epistemic mode ${modeId}`);
    });
    rule.allowedClaimTypeIds.forEach(claimTypeId => {
      assert(claimTypes.has(claimTypeId), `${rule.id} references unknown claim type ${claimTypeId}`);
    });
    rule.allowedSourceTypeIds.forEach(sourceTypeId => {
      assert(sourceTypes.has(sourceTypeId), `${rule.id} references unknown source type ${sourceTypeId}`);
    });
  });

  ontology.domains.forEach(domain => {
    assert(Array.isArray(domain.validationRuleIds), `${domain.id} validationRuleIds must be an array`);
    domain.validationRuleIds.forEach(ruleId => {
      assert(validationRules.has(ruleId), `${domain.id} references unknown validation rule ${ruleId}`);
    });

    if (domain.parentId !== undefined && domain.parentId !== null) {
      assert(domains.has(domain.parentId), `${domain.id} references unknown parentId ${domain.parentId}`);
    }

    if (domain.defaultEpistemicModeIds !== undefined) {
      assert(Array.isArray(domain.defaultEpistemicModeIds), `${domain.id} defaultEpistemicModeIds must be an array`);
      domain.defaultEpistemicModeIds.forEach(modeId => {
        assert(epistemicModes.has(modeId), `${domain.id} references unknown default epistemic mode ${modeId}`);
      });
    }
  });

  const visiting = new Set();
  const visited = new Set();

  function visitDomain(domainId) {
    if (visited.has(domainId)) {
      return;
    }

    assert.strictEqual(visiting.has(domainId), false, `domain cycle detected at ${domainId}`);
    visiting.add(domainId);

    const domain = domains.get(domainId);
    if (domain.parentId) {
      visitDomain(domain.parentId);
    }

    visiting.delete(domainId);
    visited.add(domainId);
  }

  domains.forEach((_, domainId) => {
    visitDomain(domainId);
  });

  function assertDomainUsesRule(domainId, ruleId) {
    const domain = domains.get(domainId);
    assert(domain, `missing domain ${domainId}`);
    assert(domain.validationRuleIds.includes(ruleId), `${domainId} must use ${ruleId}`);
  }

  ["physics.general", "physics.mechanics", "physics.electromagnetism"].forEach(domainId => {
    assert(domains.has(domainId), `missing formula domain ${domainId}`);
  });

  assertDomainUsesRule("astrology", "symbolic_traditional");
  assertDomainUsesRule("theology", "theological_textual");
  assertDomainUsesRule("classics", "philological_textual");
  assertDomainUsesRule("linguistics", "philological_textual");
  assertDomainUsesRule("philosophy", "philosophical_argument");
  assertDomainUsesRule("cosmology.scientific", "cosmology_scientific");
  assertDomainUsesRule("cosmology.ancient", "cosmology_traditional");
  assertDomainUsesRule("cosmology.religious", "cosmology_traditional");
  assertDomainUsesRule("cosmology.metaphysical", "cosmology_traditional");
  assertDomainUsesRule("mathematics", "mathematical_formal");
  assertDomainUsesRule("physics", "scientific_empirical");
  assertDomainUsesRule("chemistry", "scientific_empirical");
  assertDomainUsesRule("neuroscience", "scientific_empirical");
}

function buildTaskGraphInput() {
  return {
    version: 1,
    graphId: "taskgraph_example",
    mode: "apply",
    allowedFiles: ["./core\\taskGraph.js", "./tests\\run.js"],
    forbiddenFiles: ["tools/", "Knowledge/", "evolution/", "./CONTEXT.md"],
    steps: [
      {
        id: "inspect_boundary",
        type: "inspect",
        title: "Inspect existing seam",
        files: [],
        status: "pending",
        validation: {
          required: false,
          gates: []
        },
        evidence: []
      },
      {
        id: "implement_module",
        type: "edit",
        title: "Add task graph runtime module",
        files: ["./core\\taskGraph.js"],
        status: "pending",
        validation: {
          required: true,
          gates: ["syntax"]
        },
        evidence: []
      },
      {
        id: "validate_harness",
        type: "validate",
        title: "Validate harness",
        files: ["./tests\\run.js"],
        status: "pending",
        validation: {
          required: true,
          gates: ["test"]
        },
        evidence: []
      }
    ]
  };
}

function buildTaskGraph(mutate) {
  const input = buildTaskGraphInput();

  if (typeof mutate === "function") {
    mutate(input);
  }

  return createTaskGraph(input);
}

function createEvidence(kind, result = "pass", overrides = {}) {
  return {
    kind,
    label: `${kind} evidence`,
    subject: "core/taskGraph.js",
    result,
    summary: `${kind} ${result}`,
    data: { exitCode: result === "pass" ? 0 : 1 },
    ...overrides
  };
}

function testTaskGraphRuntime() {
  {
    const input = buildTaskGraphInput();
    const graph = createTaskGraph(input);

    assert.strictEqual(validateTaskGraph(graph), true);
    assert.deepStrictEqual(graph.allowedFiles, ["core/taskGraph.js", "tests/run.js"]);
    assert.deepStrictEqual(graph.forbiddenFiles, ["tools/", "Knowledge/", "evolution/", "CONTEXT.md"]);
    assert.deepStrictEqual(graph.steps[1].files, ["core/taskGraph.js"]);
    assert.deepStrictEqual(input.allowedFiles, ["./core\\taskGraph.js", "./tests\\run.js"]);
  }

  {
    const input = buildTaskGraphInput();
    input.steps = [];
    assert.throws(() => createTaskGraph(input), /steps/i);
  }

  {
    const input = buildTaskGraphInput();
    input.steps[1].id = "inspect_boundary";
    assert.throws(() => createTaskGraph(input), /unique/i);
  }

  {
    const input = buildTaskGraphInput();
    input.forbiddenFiles = ["core/"];
    assert.throws(() => createTaskGraph(input), /overlaps|forbidden/i);
  }

  {
    const input = buildTaskGraphInput();
    input.steps[1].files = ["tools/mathTool.js"];
    assert.throws(() => createTaskGraph(input), /allowedFiles|forbidden/i);
  }

  {
    const graph = buildTaskGraph(input => {
      input.steps[0].status = "passed";
    });
    const nextStep = getNextExecutableStep(graph);

    assert(nextStep, "expected a next executable step");
    assert.strictEqual(nextStep.id, "implement_module");
  }

  {
    const graph = buildTaskGraph();
    assert.throws(() => markStepStarted(graph, "implement_module"), /next executable|step implement_module/i);
  }

  {
    const graph = buildTaskGraph(input => {
      input.steps[0].status = "passed";
      input.steps[1].status = "in_progress";
    });
    assert.throws(() => markStepPassed(graph, "implement_module", []), /syntax|evidence/i);
  }

  {
    const graph = buildTaskGraph(input => {
      input.steps[0].status = "passed";
      input.steps[1].status = "in_progress";
    });
    const passedGraph = markStepPassed(graph, "implement_module", [
      createEvidence("syntax", "pass", {
        label: "node -c core/taskGraph.js",
        subject: "core/taskGraph.js",
        summary: "syntax check passed"
      })
    ]);

    assert.strictEqual(passedGraph.steps[1].status, "passed");
    assert.strictEqual(passedGraph.steps[1].evidence.length, 1);
    assert.strictEqual(getNextExecutableStep(passedGraph).id, "validate_harness");
  }

  {
    const graph = buildTaskGraph(input => {
      input.steps[0].status = "passed";
      input.steps[1].status = "in_progress";
    });
    const currentStep = getCurrentStep(graph);

    assert(currentStep, "expected a current step");
    assert.strictEqual(currentStep.id, "implement_module");
  }

  {
    const input = buildTaskGraphInput();
    input.steps[0].status = "passed";
    input.steps[1].status = "in_progress";
    input.steps[2].status = "in_progress";
    assert.throws(() => validateTaskGraph(input), /in_progress/i);
  }

  {
    const graph = buildTaskGraph(input => {
      input.steps[0].status = "passed";
      input.steps[1].status = "in_progress";
    });
    const failedGraph = markStepFailed(graph, "implement_module", [
      createEvidence("syntax", "fail", {
        label: "node -c core/taskGraph.js",
        subject: "core/taskGraph.js",
        summary: "syntax check failed",
        data: { exitCode: 1 }
      })
    ]);

    assert.strictEqual(failedGraph.steps[1].status, "failed");
    assert.strictEqual(failedGraph.steps[1].evidence.length, 1);
    assert.strictEqual(failedGraph.steps[1].evidence[0].result, "fail");
    assert.strictEqual(getCurrentStep(failedGraph), null);
  }

  {
    const originalGraph = buildTaskGraph();
    const startedGraph = markStepStarted(originalGraph, "inspect_boundary");
    const passedGraph = markStepPassed(startedGraph, "inspect_boundary", []);

    assert.strictEqual(originalGraph.steps[0].status, "pending");
    assert.strictEqual(startedGraph.steps[0].status, "in_progress");
    assert.strictEqual(passedGraph.steps[0].status, "passed");
    assert.strictEqual(originalGraph.steps[0].evidence.length, 0);
    assert.strictEqual(startedGraph.steps[0].evidence.length, 0);
  }
}

function buildAgentHandoffPacketInput() {
  return {
    version: 1,
    packetId: " agent_handoff_packet_v1 ",
    mode: " apply ",
    type: " edit ",
    title: " Implement Agent Handoff Packet ",
    instructions: [" Add module ", " Add runtime tests "],
    allowedFiles: [" core\\ ", " tests\\run.js "],
    forbiddenFiles: [" evolution\\ "],
    files: [" core\\agentHandoffPacket.js ", " tests\\run.js "],
    validation: {
      required: true,
      gates: [" syntax ", " test "]
    },
    expectedDirtyState: {
      files: [" core\\agentHandoffPacket.js ", " tests\\run.js "]
    }
  };
}

function buildAgentHandoffBridgeInput(mutate) {
  const input = {
    taskGraph: {
      version: 1,
      graphId: "agent_handoff_bridge_graph",
      mode: "apply",
      allowedFiles: [" core\\ ", " tests\\run.js "],
      forbiddenFiles: [" evolution\\ "],
      steps: [
        {
          id: "inspect_bridge",
          type: "inspect",
          title: "Inspect bridge seam",
          files: [" tests\\run.js "],
          status: "pending",
          validation: {
            required: false,
            gates: []
          },
          evidence: []
        },
        {
          id: "implement_bridge",
          type: "edit",
          title: "Implement bridge",
          files: [" core\\agentHandoffBridge.js ", " tests\\run.js "],
          status: "pending",
          validation: {
            required: true,
            gates: ["syntax"]
          },
          evidence: []
        },
        {
          id: "validate_bridge",
          type: "validate",
          title: "Validate bridge",
          files: [" tests\\run.js "],
          status: "pending",
          validation: {
            required: true,
            gates: ["test"]
          },
          evidence: []
        }
      ]
    },
    title: " Implement bridge ",
    instructions: [" Create packet from current graph step ", " Preserve deterministic structure "]
  };

  if (typeof mutate === "function") {
    mutate(input);
  }

  return input;
}

function testAgentHandoffPacketRuntime() {
  {
    const input = buildAgentHandoffPacketInput();
    const packet = createAgentHandoffPacket(input);

    assert.deepStrictEqual(packet, {
      version: 1,
      packetId: "agent_handoff_packet_v1",
      mode: "apply",
      type: "edit",
      title: "Implement Agent Handoff Packet",
      instructions: ["Add module", "Add runtime tests"],
      allowedFiles: ["core/", "tests/run.js"],
      forbiddenFiles: ["evolution/"],
      files: ["core/agentHandoffPacket.js", "tests/run.js"],
      validation: {
        required: true,
        gates: ["syntax", "test"]
      },
      expectedDirtyState: {
        files: ["core/agentHandoffPacket.js", "tests/run.js"]
      }
    });
    assert.strictEqual(input.packetId, " agent_handoff_packet_v1 ");
    assert.deepStrictEqual(input.allowedFiles, [" core\\ ", " tests\\run.js "]);
  }

  {
    const input = buildAgentHandoffPacketInput();
    assert.strictEqual(validateAgentHandoffPacket(input), true);
  }

  {
    const input = buildAgentHandoffPacketInput();
    const snapshot = JSON.parse(JSON.stringify(input));
    const packet = createAgentHandoffPacket(input);

    assert.deepStrictEqual(input, snapshot);
    assert.notStrictEqual(packet, input);
    assert.notStrictEqual(packet.instructions, input.instructions);
    assert.notStrictEqual(packet.allowedFiles, input.allowedFiles);
    assert.notStrictEqual(packet.forbiddenFiles, input.forbiddenFiles);
    assert.notStrictEqual(packet.files, input.files);
    assert.notStrictEqual(packet.validation, input.validation);
    assert.notStrictEqual(packet.validation.gates, input.validation.gates);
    assert.notStrictEqual(packet.expectedDirtyState, input.expectedDirtyState);
    assert.notStrictEqual(packet.expectedDirtyState.files, input.expectedDirtyState.files);

    packet.validation.gates[0] = "runtime";
    packet.expectedDirtyState.files[0] = "tests/run.js";

    assert.strictEqual(input.validation.gates[0], " syntax ");
    assert.strictEqual(input.expectedDirtyState.files[0], " core\\agentHandoffPacket.js ");
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.extra = true;
    assert.throws(() => createAgentHandoffPacket(input), /unknown/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.validation.extra = true;
    assert.throws(() => createAgentHandoffPacket(input), /validation|unknown/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.type = "validate";
    assert.throws(() => createAgentHandoffPacket(input), /mode|type/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.packetId = "agent-handoff-packet";
    assert.throws(() => createAgentHandoffPacket(input), /packetId/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.instructions = [];
    assert.throws(() => createAgentHandoffPacket(input), /instructions/i);
  }

  {
    const absoluteInput = buildAgentHandoffPacketInput();
    absoluteInput.allowedFiles = ["/core/"];
    assert.throws(() => createAgentHandoffPacket(absoluteInput), /repo-relative|allowedFiles/i);

    const driveInput = buildAgentHandoffPacketInput();
    driveInput.allowedFiles = ["C:/core/"];
    assert.throws(() => createAgentHandoffPacket(driveInput), /repo-relative|allowedFiles/i);

    const uncInput = buildAgentHandoffPacketInput();
    uncInput.allowedFiles = ["//server/share/"];
    assert.throws(() => createAgentHandoffPacket(uncInput), /repo-relative|allowedFiles/i);

    const traversalInput = buildAgentHandoffPacketInput();
    traversalInput.files = ["../core/agentHandoffPacket.js", "tests/run.js"];
    assert.throws(() => createAgentHandoffPacket(traversalInput), /\.\.|files/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.files = ["core/agentHandoffPacket.js", "tests/run.js", "memory/capsule.json"];
    assert.throws(() => createAgentHandoffPacket(input), /allowedFiles/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.forbiddenFiles = ["tests/"];
    assert.throws(() => createAgentHandoffPacket(input), /forbidden/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.forbiddenFiles = ["core/"];
    assert.throws(() => createAgentHandoffPacket(input), /overlaps|forbidden/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.files = ["core\\agentHandoffPacket.js", "core/agentHandoffPacket.js"];
    input.expectedDirtyState.files = ["core\\agentHandoffPacket.js"];
    assert.throws(() => createAgentHandoffPacket(input), /duplicate|files/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.validation.gates = ["syntax", "git"];
    assert.throws(() => createAgentHandoffPacket(input), /git/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.mode = "inspect_only";
    input.type = "inspect";
    assert.throws(() => createAgentHandoffPacket(input), /expectedDirtyState/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.mode = "validate_only";
    input.type = "validate";
    assert.throws(() => createAgentHandoffPacket(input), /expectedDirtyState/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.expectedDirtyState.files = [];
    assert.throws(() => createAgentHandoffPacket(input), /expectedDirtyState/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.expectedDirtyState.files = ["core/agentHandoffPacket.js", "core/extra.js"];
    assert.throws(() => createAgentHandoffPacket(input), /subset|expectedDirtyState/i);
  }

  {
    const input = buildAgentHandoffPacketInput();
    input.taskGraph = {
      graphId: " taskgraph_example ",
      stepId: " implement_module "
    };
    const packet = createAgentHandoffPacket(input);

    assert.deepStrictEqual(packet.taskGraph, {
      graphId: "taskgraph_example",
      stepId: "implement_module"
    });
  }

  {
    const missingFieldInput = buildAgentHandoffPacketInput();
    missingFieldInput.taskGraph = {
      graphId: "taskgraph_example"
    };
    assert.throws(() => createAgentHandoffPacket(missingFieldInput), /taskGraph\.stepId|taskGraph/i);

    const invalidIdInput = buildAgentHandoffPacketInput();
    invalidIdInput.taskGraph = {
      graphId: "taskgraph-example",
      stepId: "implement_module"
    };
    assert.throws(() => createAgentHandoffPacket(invalidIdInput), /taskGraph\.graphId|taskGraph/i);
  }
}

function testAgentHandoffBridgeRuntime() {
  {
    const input = buildAgentHandoffBridgeInput();
    const packet = createAgentHandoffBridgePacket(input);

    assert.deepStrictEqual(packet, {
      version: 1,
      packetId: "agent_handoff_bridge_graph_inspect_bridge_handoff_packet",
      mode: "inspect_only",
      type: "inspect",
      title: "Implement bridge",
      instructions: ["Create packet from current graph step", "Preserve deterministic structure"],
      allowedFiles: ["core/", "tests/run.js"],
      forbiddenFiles: ["evolution/"],
      files: ["tests/run.js"],
      validation: {
        required: false,
        gates: []
      },
      expectedDirtyState: {
        files: []
      },
      taskGraph: {
        graphId: "agent_handoff_bridge_graph",
        stepId: "inspect_bridge"
      }
    });
  }

  {
    const input = buildAgentHandoffBridgeInput(bridgeInput => {
      bridgeInput.taskGraph.steps[0].status = "passed";
    });
    const packet = createAgentHandoffBridgePacket(input);

    assert.strictEqual(packet.mode, "apply");
    assert.strictEqual(packet.type, "edit");
    assert.deepStrictEqual(packet.files, ["core/agentHandoffBridge.js", "tests/run.js"]);
    assert.deepStrictEqual(packet.expectedDirtyState.files, ["core/agentHandoffBridge.js", "tests/run.js"]);
    assert.deepStrictEqual(packet.taskGraph, {
      graphId: "agent_handoff_bridge_graph",
      stepId: "implement_bridge"
    });
  }

  {
    const input = buildAgentHandoffBridgeInput(bridgeInput => {
      bridgeInput.taskGraph.steps[0].status = "passed";
      bridgeInput.taskGraph.steps[1].status = "passed";
      bridgeInput.taskGraph.steps[1].evidence = [
        createEvidence("syntax", "pass", {
          subject: "core/agentHandoffBridge.js",
          summary: "syntax check passed for core/agentHandoffBridge.js"
        })
      ];
    });
    const packet = createAgentHandoffBridgePacket(input);

    assert.strictEqual(packet.mode, "validate_only");
    assert.strictEqual(packet.type, "validate");
    assert.deepStrictEqual(packet.files, ["tests/run.js"]);
    assert.deepStrictEqual(packet.expectedDirtyState.files, []);
    assert.deepStrictEqual(packet.taskGraph, {
      graphId: "agent_handoff_bridge_graph",
      stepId: "validate_bridge"
    });
  }

  {
    const input = buildAgentHandoffBridgeInput(bridgeInput => {
      bridgeInput.taskGraph.steps[0].status = "passed";
    });
    assert.strictEqual(validateAgentHandoffBridgePacket(input), true);
  }

  {
    const input = buildAgentHandoffBridgeInput(bridgeInput => {
      bridgeInput.taskGraph.steps[0].status = "passed";
    });
    const packet = createAgentHandoffBridgePacket(input);

    assert.strictEqual(validateAgentHandoffPacket(packet), true);
  }

  {
    const input = buildAgentHandoffBridgeInput(bridgeInput => {
      bridgeInput.taskGraph.steps[0].status = "passed";
    });
    const snapshot = JSON.parse(JSON.stringify(input));
    const packet = createAgentHandoffBridgePacket(input);

    assert.deepStrictEqual(input, snapshot);

    packet.files[0] = "tests/run.js";
    assert.strictEqual(input.taskGraph.steps[1].files[0], " core\\agentHandoffBridge.js ");
  }

  {
    const input = buildAgentHandoffBridgeInput();
    input.extra = true;
    assert.throws(() => createAgentHandoffBridgePacket(input), /unknown/i);
  }

  {
    const missingTitleInput = buildAgentHandoffBridgeInput();
    delete missingTitleInput.title;
    assert.throws(() => createAgentHandoffBridgePacket(missingTitleInput), /title/i);

    const emptyTitleInput = buildAgentHandoffBridgeInput();
    emptyTitleInput.title = "   ";
    assert.throws(() => createAgentHandoffBridgePacket(emptyTitleInput), /title/i);
  }

  {
    const missingInstructionsInput = buildAgentHandoffBridgeInput();
    delete missingInstructionsInput.instructions;
    assert.throws(() => createAgentHandoffBridgePacket(missingInstructionsInput), /instructions/i);

    const emptyInstructionsInput = buildAgentHandoffBridgeInput();
    emptyInstructionsInput.instructions = [];
    assert.throws(() => createAgentHandoffBridgePacket(emptyInstructionsInput), /instructions/i);
  }

  {
    const input = buildAgentHandoffBridgeInput();
    input.stepId = "inspect-bridge";
    assert.throws(() => createAgentHandoffBridgePacket(input), /stepId/i);
  }

  {
    const input = buildAgentHandoffBridgeInput();
    input.stepId = "implement_bridge";
    assert.throws(() => createAgentHandoffBridgePacket(input), /stepId|current executable step/i);
  }

  {
    const input = buildAgentHandoffBridgeInput(bridgeInput => {
      bridgeInput.taskGraph.steps[0].status = "passed";
      bridgeInput.taskGraph.steps[1].status = "passed";
      bridgeInput.taskGraph.steps[1].evidence = [
        createEvidence("syntax", "pass", {
          subject: "core/agentHandoffBridge.js",
          summary: "syntax check passed for core/agentHandoffBridge.js"
        })
      ];
      bridgeInput.taskGraph.steps[2].status = "passed";
      bridgeInput.taskGraph.steps[2].evidence = [
        createEvidence("test", "pass", {
          subject: "tests/run.js",
          summary: "All Nodex tests passed"
        })
      ];
    });
    assert.throws(() => createAgentHandoffBridgePacket(input), /current executable step/i);
  }

  {
    const input = buildAgentHandoffBridgeInput(bridgeInput => {
      bridgeInput.taskGraph.steps[0].status = "passed";
      bridgeInput.taskGraph.steps[1].status = "failed";
      bridgeInput.taskGraph.steps[1].evidence = [
        createEvidence("syntax", "fail", {
          subject: "core/agentHandoffBridge.js",
          summary: "syntax check failed for core/agentHandoffBridge.js",
          data: { exitCode: 1 }
        })
      ];
    });
    assert.throws(() => createAgentHandoffBridgePacket(input), /current executable step/i);
  }

  {
    const input = buildAgentHandoffBridgeInput(bridgeInput => {
      bridgeInput.taskGraph.steps[0].status = "passed";
      bridgeInput.taskGraph.steps[1].files = [
        " core\\agentHandoffBridge.js ",
        " core/agentHandoffBridge.js "
      ];
    });
    assert.throws(() => createAgentHandoffBridgePacket(input), /duplicate|files/i);
  }
}

function buildMemoryCapsuleInput() {
  return {
    version: 1,
    capsuleId: "task_graph_v1",
    phase: "stabilization",
    seam: {
      id: "task_graph_v1",
      title: "Deterministic task graph",
      status: "validated"
    },
    commit: {
      head: "d01ea48",
      message: "Add deterministic task graph"
    },
    files: ["./core\\taskGraph.js", "./tests\\run.js"],
    evidence: [
      {
        kind: "test",
        subject: "./tests\\run.js",
        result: "pass",
        summary: "All Nodex tests passed"
      }
    ],
    summary: {
      problem: "Need deterministic task execution control",
      change: "Added TaskGraph validator/runtime",
      outcome: "Validated and committed",
      limits: [
        "no prompt-to-graph parser",
        "no persistence",
        "no autonomous execution"
      ]
    }
  };
}

function testMemoryCapsuleRuntime() {
  {
    const input = buildMemoryCapsuleInput();
    const capsule = createMemoryCapsule(input);

    assert.strictEqual(validateMemoryCapsule(capsule), true);
    assert.deepStrictEqual(capsule.files, ["core/taskGraph.js", "tests/run.js"]);
    assert.strictEqual(capsule.evidence[0].subject, "tests/run.js");
    assert.deepStrictEqual(input.files, ["./core\\taskGraph.js", "./tests\\run.js"]);
    assert.strictEqual(input.evidence[0].subject, "./tests\\run.js");
  }

  {
    const input = buildMemoryCapsuleInput();
    const snapshot = JSON.parse(JSON.stringify(input));
    const capsule = createMemoryCapsule(input);

    assert.deepStrictEqual(input, snapshot);
    assert.notStrictEqual(capsule, input);
    assert.notStrictEqual(capsule.files, input.files);
    assert.notStrictEqual(capsule.evidence, input.evidence);
    assert.notStrictEqual(capsule.evidence[0], input.evidence[0]);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.capsuleId = "task-graph-v1";
    assert.throws(() => createMemoryCapsule(input), /capsuleId/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.phase = "one_click";
    assert.throws(() => createMemoryCapsule(input), /phase/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.seam.status = "running";
    assert.throws(() => createMemoryCapsule(input), /seam\.status/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.commit.head = "invalid";
    assert.throws(() => createMemoryCapsule(input), /commit\.head/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.files = [];
    assert.throws(() => createMemoryCapsule(input), /files/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.files = ["/core/taskGraph.js"];
    assert.throws(() => createMemoryCapsule(input), /repo-relative|files/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.files = ["../core/taskGraph.js"];
    assert.throws(() => createMemoryCapsule(input), /\.\.|files/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.files = ["./core\\taskGraph.js", "core/taskGraph.js"];
    assert.throws(() => createMemoryCapsule(input), /duplicate|files/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.evidence = [];
    assert.throws(() => createMemoryCapsule(input), /evidence/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.evidence[0].kind = "deploy";
    assert.throws(() => createMemoryCapsule(input), /kind/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.evidence[0].result = "warn";
    assert.throws(() => createMemoryCapsule(input), /result/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.evidence[0].subject = "../tests/run.js";
    assert.throws(() => createMemoryCapsule(input), /subject|\.\./i);
  }

  {
    const input = buildMemoryCapsuleInput();
    delete input.summary.outcome;
    assert.throws(() => createMemoryCapsule(input), /summary\.outcome/i);
  }

  {
    const input = buildMemoryCapsuleInput();
    input.summary.limits = ["no persistence", 1];
    assert.throws(() => createMemoryCapsule(input), /summary\.limits/i);
  }
}

function buildContextLedgerMemoryCapsuleInput(mutate) {
  const input = {
    version: 1,
    capsuleId: "agent_handoff_bridge_v1",
    phase: "stabilization",
    seam: {
      id: "agent_handoff_bridge_v1",
      title: "Agent Handoff Bridge v1",
      status: "validated"
    },
    commit: {
      head: "562bfce",
      message: "Add deterministic agent handoff bridge"
    },
    files: [" ./core\\agentHandoffBridge.js ", " tests\\run.js "],
    evidence: [
      {
        kind: "test",
        subject: " .\\tests\\run.js ",
        result: "pass",
        summary: "All Nodex tests passed"
      }
    ],
    summary: {
      problem: "Need deterministic TaskGraph to AgentHandoffPacket bridge",
      change: "Added pure bridge adapter",
      outcome: "Validated and committed",
      limits: [
        "no execution",
        "no persistence"
      ]
    }
  };

  if (typeof mutate === "function") {
    mutate(input);
  }

  return input;
}

function buildContextLedgerRecordInput(sequence = 1, recordId = "agent_handoff_bridge_v1", mutate) {
  const input = {
    version: 1,
    ledgerId: " nodex_context ",
    sequence,
    recordId,
    timestamp: "2026-04-25T10:20:36-07:00",
    memoryCapsule: buildContextLedgerMemoryCapsuleInput()
  };

  if (typeof mutate === "function") {
    mutate(input);
  }

  return input;
}

function testContextLedgerRuntime() {
  {
    const input = buildContextLedgerRecordInput();
    const record = createContextLedgerRecord(input);

    assert.strictEqual(record.version, 1);
    assert.strictEqual(record.ledgerId, "nodex_context");
    assert.strictEqual(record.sequence, 1);
    assert.strictEqual(record.recordId, "agent_handoff_bridge_v1");
    assert.strictEqual(record.timestamp, "2026-04-25T17:20:36.000Z");
    assert.deepStrictEqual(record.files, ["core/agentHandoffBridge.js", "tests/run.js"]);
    assert.strictEqual(record.memoryCapsule.capsuleId, "agent_handoff_bridge_v1");
    assert.strictEqual(input.ledgerId, " nodex_context ");
    assert.deepStrictEqual(input.memoryCapsule.files, [" ./core\\agentHandoffBridge.js ", " tests\\run.js "]);
  }

  {
    const input = buildContextLedgerRecordInput();
    assert.strictEqual(validateContextLedgerRecord(input), true);
  }

  {
    const input = buildContextLedgerRecordInput();
    const record = createContextLedgerRecord(input);

    assert.deepStrictEqual(record.seam, record.memoryCapsule.seam);
    assert.strictEqual(record.phase, record.memoryCapsule.phase);
    assert.deepStrictEqual(record.commit, record.memoryCapsule.commit);
    assert.deepStrictEqual(record.files, record.memoryCapsule.files);
    assert.deepStrictEqual(record.evidence, record.memoryCapsule.evidence);
    assert.deepStrictEqual(record.summary, record.memoryCapsule.summary);
  }

  {
    const input = buildContextLedgerRecordInput();
    const snapshot = JSON.parse(JSON.stringify(input));
    const record = createContextLedgerRecord(input);

    assert.deepStrictEqual(input, snapshot);
    assert.notStrictEqual(record, input);
    assert.notStrictEqual(record.seam, input.memoryCapsule.seam);
    assert.notStrictEqual(record.commit, input.memoryCapsule.commit);
    assert.notStrictEqual(record.files, input.memoryCapsule.files);
    assert.notStrictEqual(record.evidence, input.memoryCapsule.evidence);
    assert.notStrictEqual(record.summary, input.memoryCapsule.summary);
    assert.notStrictEqual(record.memoryCapsule, input.memoryCapsule);

    record.files[0] = "tests/run.js";
    record.memoryCapsule.summary.limits[0] = "changed";

    assert.strictEqual(input.memoryCapsule.files[0], " ./core\\agentHandoffBridge.js ");
    assert.strictEqual(input.memoryCapsule.summary.limits[0], "no execution");
  }

  {
    const input = buildContextLedgerRecordInput();
    input.extra = true;
    assert.throws(() => createContextLedgerRecord(input), /unknown/i);
  }

  {
    const input = buildContextLedgerRecordInput();
    input.ledgerId = "nodex-context";
    assert.throws(() => createContextLedgerRecord(input), /ledgerId/i);
  }

  {
    const zeroInput = buildContextLedgerRecordInput();
    zeroInput.sequence = 0;
    assert.throws(() => createContextLedgerRecord(zeroInput), /sequence/i);

    const fractionalInput = buildContextLedgerRecordInput();
    fractionalInput.sequence = 1.5;
    assert.throws(() => createContextLedgerRecord(fractionalInput), /sequence/i);
  }

  {
    const input = buildContextLedgerRecordInput();
    input.recordId = "agent-handoff-bridge-v1";
    assert.throws(() => createContextLedgerRecord(input), /recordId/i);
  }

  {
    const input = buildContextLedgerRecordInput();
    input.timestamp = "not a date";
    assert.throws(() => createContextLedgerRecord(input), /timestamp/i);
  }

  {
    const input = buildContextLedgerRecordInput();
    input.memoryCapsule.capsuleId = "agent-handoff-bridge-v1";
    assert.throws(() => createContextLedgerRecord(input), /capsuleId|memoryCapsule/i);
  }

  {
    assert.strictEqual(validateContextLedger({
      version: 1,
      ledgerId: "nodex_context",
      records: []
    }), true);
  }

  {
    const first = createContextLedgerRecord(buildContextLedgerRecordInput());
    const second = createContextLedgerRecord(buildContextLedgerRecordInput(2, "memory_capsule_v1", input => {
      input.memoryCapsule.capsuleId = "memory_capsule_v1";
      input.memoryCapsule.seam.id = "memory_capsule_v1";
      input.memoryCapsule.seam.title = "Memory Capsule v1";
      input.memoryCapsule.commit.head = "c360a2d";
      input.memoryCapsule.commit.message = "Add deterministic memory capsule";
    }));

    assert.strictEqual(validateContextLedger({
      version: 1,
      ledgerId: "nodex_context",
      records: [first, second]
    }), true);
  }

  {
    const record = createContextLedgerRecord(buildContextLedgerRecordInput(1, "other_record", input => {
      input.ledgerId = "other_context";
    }));

    assert.throws(() => validateContextLedger({
      version: 1,
      ledgerId: "nodex_context",
      records: [record]
    }), /ledgerId/i);
  }

  {
    const first = createContextLedgerRecord(buildContextLedgerRecordInput());
    const duplicate = createContextLedgerRecord(buildContextLedgerRecordInput(2, "agent_handoff_bridge_v1"));

    assert.throws(() => validateContextLedger({
      version: 1,
      ledgerId: "nodex_context",
      records: [first, duplicate]
    }), /recordId|unique/i);
  }

  {
    const first = createContextLedgerRecord(buildContextLedgerRecordInput());
    const gap = createContextLedgerRecord(buildContextLedgerRecordInput(3, "memory_capsule_v1", input => {
      input.memoryCapsule.capsuleId = "memory_capsule_v1";
      input.memoryCapsule.seam.id = "memory_capsule_v1";
      input.memoryCapsule.seam.title = "Memory Capsule v1";
    }));

    assert.throws(() => validateContextLedger({
      version: 1,
      ledgerId: "nodex_context",
      records: [first, gap]
    }), /sequence/i);
  }

  {
    const ledger = appendContextLedgerRecord({
      version: 1,
      ledgerId: "nodex_context",
      records: []
    }, buildContextLedgerRecordInput());

    assert.strictEqual(ledger.version, 1);
    assert.strictEqual(ledger.ledgerId, "nodex_context");
    assert.strictEqual(ledger.records.length, 1);
    assert.strictEqual(ledger.records[0].recordId, "agent_handoff_bridge_v1");
  }

  {
    assert.throws(() => appendContextLedgerRecord({
      version: 1,
      ledgerId: "nodex_context",
      records: []
    }, buildContextLedgerRecordInput(2, "agent_handoff_bridge_v1")), /sequence/i);
  }

  {
    const first = createContextLedgerRecord(buildContextLedgerRecordInput());

    assert.throws(() => appendContextLedgerRecord({
      version: 1,
      ledgerId: "nodex_context",
      records: [first]
    }, buildContextLedgerRecordInput(2, "agent_handoff_bridge_v1")), /recordId|unique/i);
  }

  {
    const originalLedger = {
      version: 1,
      ledgerId: "nodex_context",
      records: []
    };
    const snapshot = JSON.parse(JSON.stringify(originalLedger));
    const ledger = appendContextLedgerRecord(originalLedger, buildContextLedgerRecordInput());

    assert.deepStrictEqual(originalLedger, snapshot);
    assert.notStrictEqual(ledger, originalLedger);
    assert.notStrictEqual(ledger.records, originalLedger.records);
    assert.strictEqual(originalLedger.records.length, 0);
    assert.strictEqual(ledger.records.length, 1);
  }

  {
    const recordInput = buildContextLedgerRecordInput();
    const snapshot = JSON.parse(JSON.stringify(recordInput));

    appendContextLedgerRecord({
      version: 1,
      ledgerId: "nodex_context",
      records: []
    }, recordInput);

    assert.deepStrictEqual(recordInput, snapshot);
  }
}
function buildRepairRecommendationInput(kind = "syntax", mutate) {
  const input = {
    version: 1,
    repairId: `${kind}_repair_probe`,
    failure: {
      kind,
      subject: "core/repairLoop.js",
      result: "fail",
      summary: "node -c failed",
      data: {
        command: "node -c core/repairLoop.js"
      }
    },
    title: "Repair syntax failure",
    instructions: [
      "Inspect the failing boundary",
      "Patch only the failing file"
    ]
  };

  if (typeof mutate === "function") {
    mutate(input);
  }

  return input;
}

function assertRepairMapping(kind, classification, action) {
  const packet = createRepairRecommendation(buildRepairRecommendationInput(kind));

  assert.strictEqual(packet.version, 1);
  assert.strictEqual(packet.status, "recommended");
  assert.strictEqual(packet.failure.kind, kind);
  assert.strictEqual(packet.classification, classification);
  assert.strictEqual(packet.action, action);
}

function testRepairLoopRuntime() {
  assertRepairMapping("syntax", "syntax_repair", "inspect_and_patch");
  assertRepairMapping("test", "test_repair", "inspect_and_patch");
  assertRepairMapping("validation", "validation_repair", "tighten_contract");
  assertRepairMapping("dirty_state", "dirty_state_repair", "restore_unexpected_files");
  assertRepairMapping("boundary", "boundary_repair", "reduce_scope");
  assertRepairMapping("unknown", "unknown_repair", "inspect_first");

  {
    assert.strictEqual(validateRepairRecommendation(buildRepairRecommendationInput()), true);
  }

  {
    const input = buildRepairRecommendationInput();
    input.extra = true;
    assert.throws(() => createRepairRecommendation(input), /unknown/i);
  }

  {
    const input = buildRepairRecommendationInput();
    input.repairId = "syntax-repair";
    assert.throws(() => createRepairRecommendation(input), /repairId/i);
  }

  {
    const input = buildRepairRecommendationInput();
    input.failure.kind = "runtime";
    assert.throws(() => createRepairRecommendation(input), /failure\.kind/i);
  }

  {
    const input = buildRepairRecommendationInput();
    input.failure.result = "success";
    assert.throws(() => createRepairRecommendation(input), /failure\.result/i);
  }

  {
    const missingTitleInput = buildRepairRecommendationInput();
    delete missingTitleInput.title;
    assert.throws(() => createRepairRecommendation(missingTitleInput), /title/i);

    const emptyTitleInput = buildRepairRecommendationInput();
    emptyTitleInput.title = " ";
    assert.throws(() => createRepairRecommendation(emptyTitleInput), /title/i);
  }

  {
    const missingInstructionsInput = buildRepairRecommendationInput();
    delete missingInstructionsInput.instructions;
    assert.throws(() => createRepairRecommendation(missingInstructionsInput), /instructions/i);

    const emptyInstructionsInput = buildRepairRecommendationInput();
    emptyInstructionsInput.instructions = [];
    assert.throws(() => createRepairRecommendation(emptyInstructionsInput), /instructions/i);

    const blankInstructionInput = buildRepairRecommendationInput();
    blankInstructionInput.instructions = ["Inspect", " "];
    assert.throws(() => createRepairRecommendation(blankInstructionInput), /instructions\[1\]/i);
  }

  {
    const input = buildRepairRecommendationInput("boundary", repairInput => {
      repairInput.failure.data = {
        paths: [" evolution\\evolver.js ", " execution\\pythonSandbox.js "]
      };
    });
    const snapshot = JSON.parse(JSON.stringify(input));
    const packet = createRepairRecommendation(input);

    assert.deepStrictEqual(input, snapshot);
    assert.notStrictEqual(packet, input);
    assert.notStrictEqual(packet.failure, input.failure);
    assert.notStrictEqual(packet.instructions, input.instructions);
    assert.notStrictEqual(packet.failure.data, input.failure.data);
  }

  {
    const input = buildRepairRecommendationInput();
    const packet = createRepairRecommendation(input);

    packet.failure.data.command = "changed";
    packet.instructions[0] = "changed";

    assert.strictEqual(input.failure.data.command, "node -c core/repairLoop.js");
    assert.strictEqual(input.instructions[0], "Inspect the failing boundary");
  }

  {
    const input = buildRepairRecommendationInput("validation", repairInput => {
      repairInput.contextLedgerRecord = buildContextLedgerRecordInput();
    });

    const packet = createRepairRecommendation(input);

    assert.strictEqual(packet.contextLedgerRecord.ledgerId, "nodex_context");
    assert.strictEqual(packet.contextLedgerRecord.sequence, 1);
    assert.strictEqual(packet.contextLedgerRecord.recordId, "agent_handoff_bridge_v1");
  }

  {
    const input = buildRepairRecommendationInput("validation", repairInput => {
      repairInput.contextLedgerRecord = buildContextLedgerRecordInput();
      repairInput.contextLedgerRecord.ledgerId = "invalid-ledger";
    });

    assert.throws(() => createRepairRecommendation(input), /ledgerId|context ledger/i);
  }

  {
    const bridgeInput = buildAgentHandoffBridgeInput();
    const input = buildRepairRecommendationInput("boundary", repairInput => {
      repairInput.taskGraph = bridgeInput.taskGraph;
      repairInput.title = bridgeInput.title;
      repairInput.instructions = bridgeInput.instructions;
    });

    const packet = createRepairRecommendation(input);

    assert.strictEqual(packet.agentHandoffPacket.mode, "inspect_only");
    assert.strictEqual(packet.agentHandoffPacket.type, "inspect");
    assert.strictEqual(packet.agentHandoffPacket.taskGraph.graphId, "agent_handoff_bridge_graph");
  }

  {
    const bridgeInput = buildAgentHandoffBridgeInput(input => {
      input.taskGraph.steps.forEach(step => {
        step.status = "passed";
      });
    });

    const input = buildRepairRecommendationInput("boundary", repairInput => {
      repairInput.taskGraph = bridgeInput.taskGraph;
      repairInput.title = bridgeInput.title;
      repairInput.instructions = bridgeInput.instructions;
    });

    assert.throws(() => createRepairRecommendation(input), /current executable step|taskGraph|handoff|passing evidence|gate syntax|steps\[\d+\]/i);
  }

  {
    const repairLoopSource = fs.readFileSync(path.join(__dirname, "..", "core", "repairLoop.js"), "utf-8");

    assert.strictEqual(/require\(["']fs["']\)/.test(repairLoopSource), false);
    assert.strictEqual(/child_process/.test(repairLoopSource), false);
    assert.strictEqual(/writeFileSync|appendFileSync|rmSync|unlinkSync/.test(repairLoopSource), false);
    assert.strictEqual(/spawn|exec\(|process\.exit/.test(repairLoopSource), false);
    assert.strictEqual(/git\s/.test(repairLoopSource), false);
  }
}
function buildEvidenceGateInput() {
  return {
    version: 1,
    seamId: "memory_capsule_v1",
    files: ["./core\\memoryCapsule.js", " .\\tests\\run.js "],
    evidence: [
      {
        kind: "syntax",
        subject: " .\\tests\\run.js ",
        result: "pass",
        summary: "node -c passed",
        label: "syntax check",
        data: {
          command: "node -c .\\tests\\run.js"
        }
      }
    ]
  };
}

function testEvidenceGateRuntime() {
  {
    const input = buildEvidenceGateInput();
    const record = createEvidenceGateRecord(input);

    assert.strictEqual(validateEvidenceGateRecord(record), true);
    assert.deepStrictEqual(record.files, ["core/memoryCapsule.js", "tests/run.js"]);
    assert.strictEqual(record.evidence[0].subject, "tests/run.js");
    assert.deepStrictEqual(input.files, ["./core\\memoryCapsule.js", " .\\tests\\run.js "]);
    assert.strictEqual(input.evidence[0].subject, " .\\tests\\run.js ");
  }

  {
    const input = buildEvidenceGateInput();
    const snapshot = JSON.parse(JSON.stringify(input));
    const record = createEvidenceGateRecord(input);

    assert.deepStrictEqual(input, snapshot);
    assert.notStrictEqual(record, input);
    assert.notStrictEqual(record.files, input.files);
    assert.notStrictEqual(record.evidence, input.evidence);
    assert.notStrictEqual(record.evidence[0], input.evidence[0]);
    assert.notStrictEqual(record.evidence[0].data, input.evidence[0].data);
  }

  {
    const input = buildEvidenceGateInput();
    input.seamId = "memory-capsule-v1";
    assert.throws(() => createEvidenceGateRecord(input), /seamId/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.files = [];
    assert.throws(() => createEvidenceGateRecord(input), /files/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.files = ["./core\\memoryCapsule.js", "core/memoryCapsule.js"];
    assert.throws(() => createEvidenceGateRecord(input), /duplicate|files/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.files = ["/core/memoryCapsule.js"];
    assert.throws(() => createEvidenceGateRecord(input), /repo-relative|files/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.files = ["\\\\server\\share\\memoryCapsule.js"];
    assert.throws(() => createEvidenceGateRecord(input), /repo-relative|files/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.files = ["../core/memoryCapsule.js"];
    assert.throws(() => createEvidenceGateRecord(input), /files|\.\./i);
  }

  {
    const input = buildEvidenceGateInput();
    input.files = ["core/"];
    assert.throws(() => createEvidenceGateRecord(input), /files|file path/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence = [];
    assert.throws(() => createEvidenceGateRecord(input), /evidence/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].kind = "deploy";
    assert.throws(() => createEvidenceGateRecord(input), /kind/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].kind = "git";
    assert.throws(() => createEvidenceGateRecord(input), /kind/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].result = "warn";
    assert.throws(() => createEvidenceGateRecord(input), /result/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].result = "info";
    assert.strictEqual(validateEvidenceGateRecord(input), true);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].subject = "core/evidenceGate.js";
    assert.throws(() => createEvidenceGateRecord(input), /subject|claimed file/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].subject = "../tests/run.js";
    assert.throws(() => createEvidenceGateRecord(input), /subject|\.\./i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].summary = "   ";
    assert.throws(() => createEvidenceGateRecord(input), /summary/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].label = 1;
    assert.throws(() => createEvidenceGateRecord(input), /label/i);
  }

  {
    const input = buildEvidenceGateInput();
    input.evidence[0].data = [];
    assert.throws(() => createEvidenceGateRecord(input), /data/i);
  }
}

function testTranscriptParserRuntime() {
  assert.throws(() => parseTranscriptEvidenceCandidates(null), /transcriptText must be a string/);

  assert.deepStrictEqual(parseTranscriptEvidenceCandidates(""), []);
  assert.deepStrictEqual(parseTranscriptEvidenceCandidates("noise only"), []);

  {
    const candidates = parseTranscriptEvidenceCandidates("--- SYNTAX: .\\core\\evidenceGate.js ---\nPASS");

    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].kind, "syntax");
    assert.strictEqual(candidates[0].result, "pass");
    assert.strictEqual(candidates[0].subject, "core/evidenceGate.js");
    assert.strictEqual(candidates[0].data.source, "transcript");
    assert.strictEqual(candidates[0].data.sectionLabel, "SYNTAX: .\\core\\evidenceGate.js");
    assert.strictEqual(candidates[0].data.lineNumber, 2);
    assert.strictEqual(candidates[0].data.matchedText, "PASS");
  }

  {
    const candidates = parseTranscriptEvidenceCandidates("--- FULL TEST HARNESS ---\nAll Nodex tests passed");

    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].kind, "test");
    assert.strictEqual(candidates[0].result, "pass");
    assert.strictEqual(candidates[0].subject, "tests/run.js");
    assert(candidates[0].summary.includes("All Nodex tests passed"));
  }

  {
    const candidates = parseTranscriptEvidenceCandidates('{"status":"success","value":1}');

    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].kind, "targeted_command");
    assert.strictEqual(candidates[0].result, "pass");
    assert.strictEqual(candidates[0].data.status, "success");
    assert.deepStrictEqual(candidates[0].data.parsed, { status: "success", value: 1 });
  }

  {
    const candidates = parseTranscriptEvidenceCandidates("--- POST-COMMIT STATUS ---\n\n--- NEXT ---");

    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].kind, "git");
    assert.strictEqual(candidates[0].result, "info");
    assert.strictEqual(candidates[0].data.status, "clean");
    assert.strictEqual(candidates[0].data.sectionLabel, "POST-COMMIT STATUS");
  }

  {
    const candidates = parseTranscriptEvidenceCandidates(" M .\\tests\\run.js\n?? core\\transcriptParser.js");

    assert.strictEqual(candidates.length, 2);
    assert.strictEqual(candidates[0].kind, "git");
    assert.strictEqual(candidates[0].result, "info");
    assert.strictEqual(candidates[0].data.status, "dirty");
    assert.deepStrictEqual(candidates[0].data.paths, ["tests/run.js"]);
    assert.deepStrictEqual(candidates[1].data.paths, ["core/transcriptParser.js"]);
  }

  {
    const candidates = parseTranscriptEvidenceCandidates("[main c360a2d] Add deterministic evidence gate");

    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].kind, "git");
    assert.strictEqual(candidates[0].result, "info");
    assert.strictEqual(candidates[0].data.gitCommit, "c360a2d");
    assert.strictEqual(candidates[0].data.commitMessage, "Add deterministic evidence gate");
  }

  {
    const candidates = parseTranscriptEvidenceCandidates("c360a2d (HEAD -> main) Add deterministic evidence gate");

    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].kind, "git");
    assert.strictEqual(candidates[0].result, "info");
    assert.strictEqual(candidates[0].data.gitHead, "c360a2d");
    assert.strictEqual(candidates[0].data.commitMessage, "Add deterministic evidence gate");
  }

  assert.deepStrictEqual(
    parseTranscriptEvidenceCandidates("Syntax succeeded for core/evidenceGate.js"),
    []
  );

  {
    const candidates = parseTranscriptEvidenceCandidates(
      "--- SYNTAX: ../core/evidenceGate.js ---\nPASS\nAll Nodex tests passed"
    );

    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].kind, "test");
    assert.strictEqual(candidates[0].subject, "tests/run.js");
  }

  {
    const transcript = "--- FULL TEST HARNESS ---\nAll Nodex tests passed";
    const snapshot = transcript.slice();

    parseTranscriptEvidenceCandidates(transcript);

    assert.strictEqual(transcript, snapshot);
  }
}

function testTranscriptEvidenceAdapterRuntime() {
  assert.throws(() => adaptTranscriptEvidenceCandidates(), /input must be an object/);
  assert.throws(() => adaptTranscriptEvidenceCandidates({}), /input\.candidates must be an array/);

  {
    const candidates = parseTranscriptEvidenceCandidates("--- SYNTAX: .\\core\\evidenceGate.js ---\nPASS");
    const adapted = adaptTranscriptEvidenceCandidates({ candidates });

    assert.strictEqual(adapted.evidence.length, 1);
    assert.strictEqual(adapted.excluded.length, 0);
    assert.deepStrictEqual(adapted.evidence[0], {
      kind: "syntax",
      subject: "core/evidenceGate.js",
      result: "pass",
      summary: "Syntax check passed for core/evidenceGate.js",
      label: "syntax pass",
      data: {
        source: "transcript",
        lineNumber: 2,
        matchedText: "PASS",
        sectionLabel: "SYNTAX: .\\core\\evidenceGate.js"
      }
    });
  }

  {
    const candidates = parseTranscriptEvidenceCandidates("--- FULL TEST HARNESS ---\nAll Nodex tests passed");
    const adapted = adaptTranscriptEvidenceCandidates({ candidates });

    assert.strictEqual(adapted.evidence.length, 1);
    assert.strictEqual(adapted.excluded.length, 0);
    assert.strictEqual(adapted.evidence[0].kind, "test");
    assert.strictEqual(adapted.evidence[0].subject, "tests/run.js");
    assert.strictEqual(adapted.evidence[0].summary, "All Nodex tests passed");
  }

  {
    const candidates = parseTranscriptEvidenceCandidates('{"status":"success","value":1}');
    const adapted = adaptTranscriptEvidenceCandidates({ candidates });

    assert.strictEqual(adapted.evidence.length, 0);
    assert.strictEqual(adapted.excluded.length, 1);
    assert.strictEqual(adapted.excluded[0].reason, "missing_subject");
    assert.strictEqual(adapted.excluded[0].candidate.kind, "targeted_command");
  }

  {
    const candidates = parseTranscriptEvidenceCandidates(
      "--- POST-COMMIT STATUS ---\n\n--- NEXT ---\n M .\\tests\\run.js\n[main c360a2d] Add deterministic evidence gate\nc360a2d (HEAD -> main) Add deterministic evidence gate"
    );
    const adapted = adaptTranscriptEvidenceCandidates({ candidates });

    assert.strictEqual(adapted.evidence.length, 0);
    assert.strictEqual(adapted.excluded.length, 4);
    assert(adapted.excluded.every(entry => entry.reason === "unsupported_kind"));
    assert(adapted.excluded.every(entry => entry.candidate.kind === "git"));
  }

  {
    const adapted = adaptTranscriptEvidenceCandidates({
      candidates: [
        {
          kind: "inspection",
          subject: "core/transcriptParser.js",
          result: "info",
          summary: "Manual inspection recorded",
          label: "inspection note",
          data: {
            source: "manual"
          }
        }
      ]
    });

    assert.strictEqual(adapted.evidence.length, 1);
    assert.strictEqual(adapted.excluded.length, 0);
    assert.strictEqual(adapted.evidence[0].kind, "inspection");
    assert.strictEqual(adapted.evidence[0].subject, "core/transcriptParser.js");
  }

  {
    const adapted = adaptTranscriptEvidenceCandidates({
      candidates: [
        {
          kind: "runtime",
          subject: "core/evidenceGate.js",
          result: "pass",
          summary: "Runtime check passed",
          data: {
            durationMs: 12
          }
        }
      ]
    });

    assert.strictEqual(adapted.evidence.length, 1);
    assert.strictEqual(adapted.excluded.length, 0);
    assert.strictEqual(adapted.evidence[0].kind, "runtime");
    assert.strictEqual(adapted.evidence[0].subject, "core/evidenceGate.js");
  }

  {
    const adapted = adaptTranscriptEvidenceCandidates({
      candidates: [
        {
          kind: "deploy",
          subject: "core/evidenceGate.js",
          result: "pass",
          summary: "Unsupported kind"
        }
      ]
    });

    assert.strictEqual(adapted.evidence.length, 0);
    assert.strictEqual(adapted.excluded.length, 1);
    assert.strictEqual(adapted.excluded[0].reason, "unsupported_kind");
  }

  {
    const adapted = adaptTranscriptEvidenceCandidates({
      candidates: [
        {
          kind: "syntax",
          result: "pass",
          summary: "Missing subject"
        }
      ]
    });

    assert.strictEqual(adapted.evidence.length, 0);
    assert.strictEqual(adapted.excluded.length, 1);
    assert.strictEqual(adapted.excluded[0].reason, "missing_subject");
  }

  {
    const adapted = adaptTranscriptEvidenceCandidates({
      candidates: [
        {
          kind: "runtime",
          subject: "core/evidenceGate.js",
          result: "pass",
          summary: "Invalid data",
          data: []
        }
      ]
    });

    assert.strictEqual(adapted.evidence.length, 0);
    assert.strictEqual(adapted.excluded.length, 1);
    assert.strictEqual(adapted.excluded[0].reason, "invalid_data");
  }

  {
    const input = {
      candidates: [
        {
          kind: "inspection",
          subject: "  core/transcriptParser.js  ",
          result: "info",
          summary: "Nested data preserved",
          label: "manual inspection",
          data: {
            nested: {
              ok: true
            },
            items: [1, { value: 2 }]
          }
        }
      ]
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    const adapted = adaptTranscriptEvidenceCandidates(input);

    assert.deepStrictEqual(input, snapshot);
    assert.notStrictEqual(adapted.evidence[0], input.candidates[0]);
    assert.notStrictEqual(adapted.evidence[0].data, input.candidates[0].data);
    assert.notStrictEqual(adapted.evidence[0].data.nested, input.candidates[0].data.nested);
    assert.notStrictEqual(adapted.evidence[0].data.items, input.candidates[0].data.items);

    adapted.evidence[0].data.nested.ok = false;
    adapted.evidence[0].data.items[1].value = 3;

    assert.strictEqual(input.candidates[0].data.nested.ok, true);
    assert.strictEqual(input.candidates[0].data.items[1].value, 2);
    assert.strictEqual(adapted.evidence[0].subject, "core/transcriptParser.js");
  }

  {
    const candidates = parseTranscriptEvidenceCandidates("--- SYNTAX: core/evidenceGate.js ---\nPASS");
    const adapted = adaptTranscriptEvidenceCandidates({ candidates });
    const record = createEvidenceGateRecord({
      version: 1,
      seamId: "transcript_evidence_adapter_v1",
      files: ["core/evidenceGate.js"],
      evidence: adapted.evidence
    });

    assert.strictEqual(validateEvidenceGateRecord(record), true);
    assert.strictEqual(record.evidence.length, 1);
    assert.strictEqual(record.evidence[0].subject, "core/evidenceGate.js");
  }

  {
    const candidates = parseTranscriptEvidenceCandidates("--- SYNTAX: core/evidenceGate.js ---\nPASS");
    const adapted = adaptTranscriptEvidenceCandidates({ candidates });

    assert.throws(() => createEvidenceGateRecord({
      version: 1,
      seamId: "transcript_evidence_adapter_v1",
      files: ["tests/run.js"],
      evidence: adapted.evidence
    }), /subject|claimed file/i);
  }
}

function buildValidityClaimInput(mutate) {
  const input = {
    version: 1,
    claimId: " context_ledger_v1_committed ",
    subject: {
      type: "seam",
      id: " context_ledger_v1 "
    },
    predicate: "committed",
    status: "active",
    authority: {
      kind: "commit"
    },
    evidence: [
      {
        kind: "git",
        subject: "172a938",
        result: "pass",
        summary: "ContextLedger v1 was introduced by commit 172a938"
      },
      {
        kind: "test",
        subject: "tests/run.js",
        result: "pass",
        summary: "Full Nodex test harness passed"
      }
    ],
    supersedes: ["wrong_context_ledger_filesystem_seam"],
    contradicts: [],
    blocks: ["rerun_context_ledger_filesystem_record"],
    summary: "ContextLedger v1 is committed as pure runtime logic"
  };

  if (typeof mutate === "function") {
    mutate(input);
  }

  return input;
}

function buildStaleValidityClaimInput() {
  return {
    version: 1,
    claimId: "wrong_context_ledger_filesystem_seam",
    subject: {
      type: "decision",
      id: "wrong_context_ledger_filesystem_seam"
    },
    predicate: "superseded",
    status: "stale",
    authority: {
      kind: "inspection"
    },
    evidence: [
      {
        kind: "inspection",
        subject: "context_ledger_module_shape_inspection",
        result: "pass",
        summary: "Filesystem-ledger interpretation was rejected after module-shape proof"
      }
    ],
    supersedes: [],
    contradicts: [],
    blocks: [],
    summary: "ContextLedger must not be implemented as filesystem persistence"
  };
}

function testValidityGraphRuntime() {
  {
    const input = buildValidityClaimInput();
    const snapshot = JSON.parse(JSON.stringify(input));
    const claim = createValidityClaim(input);

    assert.strictEqual(claim.claimId, "context_ledger_v1_committed");
    assert.strictEqual(claim.subject.id, "context_ledger_v1");
    assert.strictEqual(claim.authority.kind, "commit");
    assert.strictEqual(claim.authority.rank, 100);
    assert.strictEqual(validateValidityClaim(input), true);
    assert.deepStrictEqual(input, snapshot);
  }

  {
    const stale = buildStaleValidityClaimInput();
    const active = buildValidityClaimInput();
    const graph = createValidityGraph({
      version: 1,
      graphId: "nodex_validity",
      claims: [stale, active]
    });

    assert.strictEqual(validateValidityGraph(graph), true);
    assert.strictEqual(graph.claims.length, 2);

    const resolved = resolveValidityGraph(graph);
    assert.deepStrictEqual(resolved.activeClaimIds, ["context_ledger_v1_committed"]);
    assert.deepStrictEqual(resolved.staleClaimIds, ["wrong_context_ledger_filesystem_seam"]);
    assert.deepStrictEqual(resolved.supersededClaimIds, ["wrong_context_ledger_filesystem_seam"]);
    assert.deepStrictEqual(resolved.blockedActionIds, ["rerun_context_ledger_filesystem_record"]);
    assert.deepStrictEqual(resolved.authorityOrder, [
      "context_ledger_v1_committed",
      "wrong_context_ledger_filesystem_seam"
    ]);
  }

  {
    const input = buildValidityClaimInput();
    input.claimId = "ContextLedger";
    assert.throws(() => createValidityClaim(input), /claimId/i);
  }

  {
    const input = buildValidityClaimInput();
    input.authority.kind = "chat_summary";
    assert.throws(() => createValidityClaim(input), /authority\.kind/i);
  }

  {
    const input = buildValidityClaimInput();
    input.evidence[0].subject = "../secret.txt";
    assert.throws(() => createValidityClaim(input), /subject|\.\./i);
  }

  {
    const input = buildValidityClaimInput();
    input.supersedes = ["missing_claim"];
    assert.throws(() => createValidityGraph({
      version: 1,
      graphId: "nodex_validity",
      claims: [input]
    }), /supersedes target/i);
  }

  {
    const stale = buildStaleValidityClaimInput();
    const active = buildValidityClaimInput();
    const duplicate = buildValidityClaimInput();

    assert.throws(() => createValidityGraph({
      version: 1,
      graphId: "nodex_validity",
      claims: [stale, active, duplicate]
    }), /claimId|unique/i);
  }

  {
    const stale = buildStaleValidityClaimInput();
    const graph = createValidityGraph({
      version: 1,
      graphId: "nodex_validity",
      claims: [stale]
    });

    const appended = appendValidityClaim(graph, buildValidityClaimInput());

    assert.strictEqual(appended.claims.length, 2);
    assert.strictEqual(graph.claims.length, 1);
    assert.throws(() => appendValidityClaim(appended, buildValidityClaimInput()), /claimId|unique/i);
  }
}
function testContextExporterAuthorityRuntime() {
  const {
    buildSnapshot,
    runContextExport
  } = require("../core/contextExporter");

  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "nodex-context-authority-"));
  const learningDirName = "Lear" + "ning";
  const runsDir = path.join(rootDir, learningDirName, "runs");
  const stateDir = path.join(rootDir, learningDirName, "state");
  const historyDir = path.join(rootDir, learningDirName, "history");

  fs.mkdirSync(runsDir, { recursive: true });
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(historyDir, { recursive: true });

  fs.writeFileSync(path.join(runsDir, "run_latest.json"), JSON.stringify({
    task_id: "task_authority",
    run_id: "run_authority",
    goal: "authority patch",
    success: true,
    duration_ms: 12,
    evaluation_summary: {
      success: true,
      correctness: 1,
      performance_ms: 12,
      error_type: null
    }
  }, null, 2));

  fs.writeFileSync(path.join(stateDir, "latest.json"), JSON.stringify({
    task_id: "task_authority",
    run_id: "run_authority",
    goal: "authority patch",
    success: true
  }, null, 2));

  fs.writeFileSync(path.join(historyDir, "failure.json"), JSON.stringify({
    failure_type: "old_failure",
    result_summary: "historical only"
  }, null, 2));

  const snapshot = buildSnapshot({ rootDir });

  assert.strictEqual(snapshot.version, 1);
  assert.strictEqual(snapshot.authority.activeAuthority, false);
  assert.strictEqual(snapshot.authority.scope, "diagnostic_only");
  assert.strictEqual(snapshot.authority.instructionAuthority, false);
  assert.strictEqual(snapshot.system_state.current_goal, "authority patch");
  assert.strictEqual(snapshot.system_state.last_run_id, "run_authority");
  assert.strictEqual(snapshot.system_state.status, "idle");
  assert.strictEqual(snapshot.last_execution.success, true);
  assert.strictEqual(snapshot.last_execution.correctness, 1);
  assert.strictEqual(snapshot.last_execution.performance_ms, 12);
  assert.strictEqual(snapshot.last_execution.error, null);

  const exported = runContextExport({ rootDir });
  const snapshotName = ["CONTEXT", "SNAPSHOT"].join("_") + ".json";
  const oldContextName = ["CODEX", "CONTEXT"].join("_") + ".txt";
  const oldLiveName = ["live", "snapshot"].join("_") + ".json";

  assert.strictEqual(exported.authority.activeAuthority, false);
  assert.strictEqual(fs.existsSync(path.join(rootDir, snapshotName)), true);
  assert.strictEqual(fs.existsSync(path.join(rootDir, oldContextName)), false);
  assert.strictEqual(fs.existsSync(path.join(rootDir, learningDirName, oldLiveName)), false);

  const persisted = JSON.parse(fs.readFileSync(path.join(rootDir, snapshotName), "utf-8"));
  assert.strictEqual(persisted.authority.activeAuthority, false);
  assert.strictEqual(persisted.authority.scope, "diagnostic_only");
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



function testDebugGenerationSkillUsesExternalEvidenceOutput() {
  const source = fs.readFileSync(path.join(__dirname, "..", "skills", "debug_generation.skill.md"), "utf-8");
  const stalePath = [["Learn", "ing"].join(""), "debug_generation.txt"].join("/");

  assert.strictEqual(source.includes(stalePath), false);
  assert.strictEqual(source.includes("Nodex Evidence"), true);
  assert.strictEqual(source.includes("[PROMPT]"), true);
  assert.strictEqual(source.includes("[CONCLUSION]"), true);
}

function testLegacyPromptMemoryReadsDeauthorized() {
  const source = fs.readFileSync(path.join(__dirname, "..", "evolution", "evolver.js"), "utf-8");
  const staleRuntimeState = ["memory", ["CURRENT", "STATE"].join("_") + ".json"].join("/");
  const missingFailureState = ["memory", ["FAILURES"].join("") + ".json"].join("/");
  const legacyLongTerm = ["memory", ["long", "term"].join("_") + ".json"].join("/");

  assert.strictEqual(source.includes(staleRuntimeState), false);
  assert.strictEqual(source.includes(missingFailureState), false);
  assert.strictEqual(source.includes(legacyLongTerm), false);
  assert.strictEqual(source.includes("SYSTEM_RULES"), true);
}

function testEvolutionCandidateWorkspaceLocation() {
  const probe = "strict_loader_reference_patch_probe";
  const root = candidateRoot(probe);
  const paths = candidatePaths(probe, 1);
  const repoRoot = path.resolve(__dirname, "..").replace(/\\/g, "/");
  const normalizedRoot = root.replace(/\\/g, "/");
  const normalizedWorkspace = paths.sandboxRoot.replace(/\\/g, "/");
  const forbiddenSegment = ["Sand", "box"].join("");

  assert.strictEqual(normalizedRoot.startsWith(`${repoRoot}/${forbiddenSegment}/`), false);
  assert.strictEqual(normalizedRoot.includes("nodex-evolution-candidates"), true);
  assert.strictEqual(normalizedWorkspace.includes("/workspace"), true);
  assert.strictEqual(normalizedWorkspace.includes(`/${forbiddenSegment}`), false);

  fs.rmSync(path.join(os.tmpdir(), "nodex-evolution-candidates", `attempt-${probe}`), {
    recursive: true,
    force: true
  });
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
  await testMatrixRouteAdd();
  await testMatrixRouteSubtract();
  await testMatrixRouteScalarMultiply();
  await testMatrixRouteVectorMultiply();
  await testMatrixRouteMultiply();
  await testMatrixRouteTranspose();
  await testMatrixRouteIdentity();
  await testMatrixRouteDeterminant2x2();
  await testMatrixRouteDeterminant3x3();
  await testMatrixRouteUnknownOperation();
  await testMatrixRouteRaggedMatrix();
  await testMatrixRouteAddShapeMismatch();
  await testMatrixRouteMultiplyIncompatibleDimensions();
  await testMatrixRouteNonFiniteElement();
  await testMatrixRouteDeterminantWrongSize();
  await testMatrixRouteCapOverflow();
  await testFormulaRouteListFormulas();
  await testFormulaRouteGetFormula();
  await testFormulaRouteEvaluateKineticEnergy();
  await testFormulaRouteEvaluateDensity();
  await testFormulaRouteEvaluateSpeed();
  await testFormulaRouteEvaluateOhmsLawVoltage();
  await testFormulaRouteEvaluateMomentum();
  await testFormulaRouteUnknownFormulaId();
  await testFormulaRouteMissingRequiredVariable();
  await testFormulaRouteUnknownProvidedVariable();
  await testFormulaRouteNonFiniteVariable();
  await testFormulaRouteDivideByZero();
  await testFormulaRouteUnknownOperation();
  await testFormulaRouteMalformedInput();
  testDomainOntologyManifest();
  testTaskGraphRuntime();
  testAgentHandoffPacketRuntime();
  testAgentHandoffBridgeRuntime();
  testMemoryCapsuleRuntime();
  testContextLedgerRuntime();
  testRepairLoopRuntime();
  testEvidenceGateRuntime();
  testTranscriptParserRuntime();
  testTranscriptEvidenceAdapterRuntime();
  testValidityGraphRuntime();
  testContextUseGraphSurfaceValidation();
  testContextUseGraphUsageQueries();
  testContextUseGraphMemoryCannotProve();
  testContextUseGraphGeneratedArtifactsDeauthorized();
  testContextUseGraphModelOutputProposalOnly();
  testContextPatternGraphObservationValidation();
  testContextPatternGraphRoutingHypothesisOnly();
  testContextPatternGraphPatternTypes();
  testContextPatternGraphNoUserPatternImplementation();
  testContextPatternGraphContextUseDependency();
  testInputPatternWeigherResultValidation();
  testInputPatternWeigherCurrentInputOnly();
  testInputPatternWeigherScopeExpansion();
  testInputPatternWeigherWeakContextSource();
  testInputPatternWeigherNoUserPatternTracking();
  testToolCapabilityRegistryPolicyValidation();
  testToolCapabilityRegistryHighRiskDenyByDefault();
  testToolCapabilityRegistryReadScope();
  testToolCapabilityRegistryRuntimeIntegrationBlocked();
  testToolCapabilityRegistryNoToolExecution();
  testReplayStoreRecordValidation();
  testReplayStoreRecordsAreNotProof();
  testReplayStoreFreshnessGate();
  testReplayStoreSideEffectReplayBlocked();
  testReplayStorePersistenceSchema();
  testCommitGateRecordValidation();
  testCommitGateRequiredSteps();
  testCommitGateBlocksOnFailedStep();
  testCommitGatePassesOnlyWhenAllRequiredStepsPass();
  testCommitGateNoRuntimeGitExecution();
  testAgentHandoffRunnerDecisionValidation();
  testAgentHandoffRunnerRoutesMetadataOnly();
  testAgentHandoffRunnerBlocksToolAndGitExecution();
  testAgentHandoffRunnerRequiresGateSpine();
  testAgentHandoffRunnerNoRuntimeExports();
  testRuntimeBoundaryRequestValidation();
  testRuntimeBoundaryBlocksExecutableIntent();
  testRuntimeBoundaryDefersRuntimeIntegration();
  testRuntimeBoundaryRequiresGateSpine();
  testRuntimeBoundaryNoRuntimeExports();
  testPermissionGateRequestValidation();
  testPermissionGateDoesNotGrantPermissions();
  testPermissionGateBlocksRuntimeSensitiveScopes();
  testPermissionGateRequiresEvidenceAndHumanState();
  testPermissionGateNoRuntimeExports();
  testExecutionAdapterPolicyValidation();
  testExecutionAdapterRegistryMetadataOnly();
  testExecutionAdapterBlocksExecutableRequests();
  testExecutionAdapterRequiresGateSpine();
  testExecutionAdapterNoRuntimeExports();
  testSideEffectSandboxPolicyValidation();
  testSideEffectSandboxClassifiesWithoutExecuting();
  testSideEffectSandboxBlocksMutationAndProcessExecution();
  testSideEffectSandboxRequiresGateSpine();
  testSideEffectSandboxNoRuntimeExports();
  testToolExecutionAuditRecordValidation();
  testToolExecutionAuditRecordsAreNotProof();
  testToolExecutionAuditRecordsAreNotReplayable();
  testToolExecutionAuditRequiresGateSpine();
  testToolExecutionAuditNoRuntimeExports();
  testRuntimeDryRunRequestValidation();
  testRuntimeDryRunRequestBlocksExecution();
  testRuntimeDryRunResultIsNotAuthority();
  testRuntimeDryRunRequiresGateSpine();
  testRuntimeDryRunNoRuntimeExports();
  testRuntimeUserApprovalCheckpointValidation();
  testRuntimeUserApprovalDoesNotGrantRuntime();
  testRuntimeUserApprovalBlocksImplicitAndModelApproval();
  testRuntimeUserApprovalRequiresGateSpine();
  testRuntimeUserApprovalNoRuntimeExports();
  testContextExporterAuthorityRuntime();
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
  testDebugGenerationSkillUsesExternalEvidenceOutput();
  testLegacyPromptMemoryReadsDeauthorized();
  testEvolutionCandidateWorkspaceLocation();
  testBestCandidateSelection();

  console.log("All Nodex tests passed");
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
function testContextUseGraphSurfaceValidation() {
  assert.strictEqual(CONTEXT_USE_SURFACES.length, 25);

  const missing = validateContextSurface({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const agents = CONTEXT_USE_SURFACES.find(surface => surface.path === "AGENTS.md");
  const invalidOverlap = validateContextSurface({
    ...agents,
    allowedUsage: ["planning", "proof"],
    blockedUsage: ["proof"]
  });

  assert.strictEqual(invalidOverlap.valid, false);
  assert.ok(invalidOverlap.errors.some(error => error.includes("overlap")));

  const created = createContextSurface(agents);
  assert.strictEqual(created.path, "AGENTS.md");
}

function testContextUseGraphUsageQueries() {
  const graph = createContextUseGraph();
  const agents = getContextSurface(graph, "AGENTS.md");

  assert.ok(agents);
  assert.strictEqual(canUseContextFor(agents, "planning"), true);
  assert.strictEqual(canUseContextFor(agents, "proof"), false);

  assert.throws(
    () => assertContextUsageAllowed(agents, "proof"),
    /explicitly blocked/
  );

  const classification = classifyContextUsage(agents, "routing_constraint");
  assert.strictEqual(classification.allowed, true);
  assert.strictEqual(classification.blocked, false);
}

function testContextUseGraphMemoryCannotProve() {
  const graph = createContextUseGraph();
  const memory = getContextSurface(graph, "memory/SYSTEM_RULES.MD");

  assert.ok(memory);
  assert.strictEqual(canUseContextFor(memory, "continuity"), true);
  assert.strictEqual(canUseContextFor(memory, "proof"), false);
  assert.strictEqual(canUseContextFor(memory, "live_repo_override"), false);
}

function testContextUseGraphGeneratedArtifactsDeauthorized() {
  const graph = createContextUseGraph();
  const snapshot = getContextSurface(graph, "CONTEXT_SNAPSHOT.json");

  assert.ok(snapshot);
  assert.strictEqual(snapshot.validationState, "deauthorized");
  assert.strictEqual(canUseContextFor(snapshot, "diagnostic_inspection_only"), true);
  assert.strictEqual(canUseContextFor(snapshot, "active_instruction"), false);
  assert.strictEqual(canUseContextFor(snapshot, "proof"), false);
}

function testContextUseGraphModelOutputProposalOnly() {
  const graph = createContextUseGraph();
  const evolution = getContextSurface(graph, "evolution/evolver.js");

  assert.ok(evolution);
  assert.strictEqual(evolution.validationState, "proposal_only");
  assert.strictEqual(canUseContextFor(evolution, "candidate_generation"), true);
  assert.strictEqual(canUseContextFor(evolution, "direct_context_promotion"), false);
  assert.strictEqual(canUseContextFor(evolution, "proof"), false);
}
function makePatternObservation(overrides = {}) {
  return {
    patternId: "pattern_scope_001",
    patternType: "scope_expansion_during_active_seam",
    sourceKind: "git_state",
    observedSurface: "working_tree_dirty",
    matchedSignals: ["dirty_state", "new_feature_request"],
    confidence: 0.8,
    effect: "route_to_current_boundary_closure",
    blockedUses: ["proof", "autonomous_authority", "semantic_truth"],
    requiredValidation: "ContextUseGraph",
    status: "hypothesis",
    ...overrides
  };
}

function testContextPatternGraphObservationValidation() {
  const missing = validatePatternObservation({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalidConfidence = validatePatternObservation(makePatternObservation({ confidence: 2 }));
  assert.strictEqual(invalidConfidence.valid, false);
  assert.ok(invalidConfidence.errors.some(error => error.includes("between 0 and 1")));

  const missingBlocked = validatePatternObservation(makePatternObservation({ blockedUses: ["proof"] }));
  assert.strictEqual(missingBlocked.valid, false);
  assert.ok(missingBlocked.errors.some(error => error.includes("autonomous_authority")));

  const truthField = validatePatternObservation(makePatternObservation({ semanticTruth: true }));
  assert.strictEqual(truthField.valid, false);
  assert.ok(truthField.errors.some(error => error.includes("semantic truth")));
}

function testContextPatternGraphRoutingHypothesisOnly() {
  const observation = createPatternObservation(makePatternObservation());
  const classification = classifyPatternObservation(observation);

  assert.strictEqual(classification.canAffectRouting, true);
  assert.strictEqual(classification.canServeAsProof, false);
  assert.strictEqual(classification.canDecideSemanticTruth, false);
  assert.strictEqual(classification.canActAutonomously, false);
  assert.strictEqual(canPatternAffectRouting(observation), true);
  assert.strictEqual(assertPatternNotProof(observation), true);

  const rejected = createPatternObservation(makePatternObservation({ patternId: "pattern_rejected_001", status: "rejected" }));
  assert.strictEqual(canPatternAffectRouting(rejected), false);
}

function testContextPatternGraphPatternTypes() {
  assert.strictEqual(PATTERN_TYPES.length, 5);
  assert.ok(PATTERN_TYPES.includes("scope_expansion_during_active_seam"));
  assert.ok(PATTERN_TYPES.includes("authority_leak_recurrence"));
  assert.ok(PATTERN_TYPES.includes("formatting_drift_recurrence"));
  assert.ok(PATTERN_TYPES.includes("weak_context_source_dependency"));
  assert.ok(PATTERN_TYPES.includes("validated_safe_seam_shape"));
}

function testContextPatternGraphNoUserPatternImplementation() {
  const userPattern = validatePatternObservation(makePatternObservation({
    userPattern: true
  }));

  assert.strictEqual(userPattern.valid, false);
  assert.ok(userPattern.errors.some(error => error.includes("user-pattern")));

  const moduleExports = require("../core/contextPatternGraph");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "UserPatternGraph"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "HumanContextState"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "InputPatternWeigher"), false);
}

function testContextPatternGraphContextUseDependency() {
  const { createContextUseGraph, getContextSurface, canUseContextFor } = require("../core/contextUseGraph");
  const contextUseGraph = createContextUseGraph();
  const observation = makePatternObservation();

  const graph = createContextPatternGraph([observation], { contextUseGraph });
  const stored = getPatternObservation(graph, "pattern_scope_001");

  assert.ok(stored);
  assert.strictEqual(graph.contextUseGraph.surfaces.length, 25);

  const agents = getContextSurface(graph.contextUseGraph, "AGENTS.md");
  assert.strictEqual(canUseContextFor(agents, "routing_constraint"), true);
  assert.strictEqual(canUseContextFor(agents, "proof"), false);
}
function makeInputPatternResult(overrides = {}) {
  return {
    inputId: "input_test_001",
    activeSeam: "InputPatternWeigher v1",
    matchedPatterns: [
      {
        patternType: "scope_expansion_during_active_seam",
        confidence: 0.8,
        effect: "route_to_current_boundary_closure",
        requiredValidation: "ContextUseGraph"
      }
    ],
    riskFlags: ["scope_expansion_during_active_seam", "live_repo_evidence_required"],
    allowedNextActions: ["inspect", "validate", "commit_gate"],
    blockedActions: ["patch_without_evidence", "delete", "broad_refactor", "trust_memory_as_proof"],
    blockedUses: ["proof", "autonomous_authority", "semantic_truth", "user_profile_inference"],
    status: "hypothesis",
    ...overrides
  };
}

function testInputPatternWeigherResultValidation() {
  assert.ok(INPUT_RISK_FLAGS.includes("scope_expansion_during_active_seam"));
  assert.ok(ALLOWED_NEXT_ACTIONS.includes("commit_gate"));
  assert.ok(BLOCKED_ACTIONS.includes("patch_without_evidence"));

  const missing = validateInputPatternResult({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalidPattern = validateInputPatternResult(makeInputPatternResult({
    matchedPatterns: [
      {
        patternType: "not_real",
        confidence: 2,
        effect: "route_to_current_boundary_closure",
        requiredValidation: "ContextUseGraph"
      }
    ]
  }));

  assert.strictEqual(invalidPattern.valid, false);
  assert.ok(invalidPattern.errors.some(error => error.includes("unknown matched pattern type")));
  assert.ok(invalidPattern.errors.some(error => error.includes("between 0 and 1")));

  const missingBlocked = validateInputPatternResult(makeInputPatternResult({
    blockedUses: ["proof"]
  }));

  assert.strictEqual(missingBlocked.valid, false);
  assert.ok(missingBlocked.errors.some(error => error.includes("user_profile_inference")));

  const truthField = validateInputPatternResult(makeInputPatternResult({ semanticTruth: true }));
  assert.strictEqual(truthField.valid, false);
  assert.ok(truthField.errors.some(error => error.includes("semantic truth")));
}

function testInputPatternWeigherCurrentInputOnly() {
  const result = weighInputPattern({
    inputId: "input_current_001",
    inputText: "inspect classify plan apply commit gate",
    activeSeam: "Current seam",
    repoState: { workingTreeClean: true }
  });

  assert.strictEqual(result.inputId, "input_current_001");
  assert.strictEqual(result.status, "hypothesis");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "inputText"), false);
  assert.strictEqual(result.contextSurfaceCount, 25);

  const classification = classifyInputPatternResult(result);
  assert.strictEqual(classification.canAffectRouting, true);
  assert.strictEqual(classification.canServeAsProof, false);
  assert.strictEqual(classification.canTrackUserPatterns, false);
  assert.strictEqual(assertInputPatternResultNotProof(result), true);
}

function testInputPatternWeigherScopeExpansion() {
  const result = weighInputPattern({
    inputId: "input_scope_001",
    inputText: "implement the next graph while pending commit gate",
    activeSeam: "ContextPatternGraph v1 CommitGate",
    repoState: { dirty: true }
  });

  assert.ok(result.riskFlags.includes("scope_expansion_during_active_seam"));
  assert.ok(result.riskFlags.includes("live_repo_evidence_required"));
  assert.ok(result.allowedNextActions.includes("commit_gate"));
  assert.ok(result.blockedActions.includes("broad_refactor"));
  assert.ok(result.matchedPatterns.some(pattern => pattern.patternType === "scope_expansion_during_active_seam"));
}

function testInputPatternWeigherWeakContextSource() {
  const result = weighInputPattern({
    inputId: "input_context_001",
    inputText: "use the memory summary from chat history",
    activeSeam: "Planning"
  });

  assert.ok(result.riskFlags.includes("weak_context_source_dependency"));
  assert.ok(result.riskFlags.includes("live_repo_evidence_required"));
  assert.ok(result.matchedPatterns.some(pattern => pattern.patternType === "weak_context_source_dependency"));
}

function testInputPatternWeigherNoUserPatternTracking() {
  assert.throws(
    () => weighInputPattern({
      inputText: "test",
      activeSeam: "test",
      emotionalState: "frustrated"
    }),
    /rejects truth, user-pattern, emotion, profile, and human-state fields/
  );

  const userPattern = validateInputPatternResult(makeInputPatternResult({
    userPattern: true
  }));

  assert.strictEqual(userPattern.valid, false);
  assert.ok(userPattern.errors.some(error => error.includes("user-pattern")));

  const weigher = createInputPatternWeigher();
  const result = weigher.weigh({
    inputId: "input_weigher_001",
    inputText: "formatting drift in generated artifact",
    activeSeam: "SystemDriftAudit"
  });

  assert.ok(result.riskFlags.includes("formatting_drift_risk"));

  const moduleExports = require("../core/inputPatternWeigher");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "UserPatternGraph"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "HumanContextState"), false);
}
function testToolCapabilityRegistryPolicyValidation() {
  assert.strictEqual(TOOL_CAPABILITY_POLICIES.length, 11);
  assert.ok(CAPABILITY_CLASSES.includes("write_file"));
  assert.ok(SIDE_EFFECT_LEVELS.includes("process_execution"));
  assert.ok(DEFAULT_POLICIES.includes("deny_by_default"));

  const missing = validateToolCapabilityPolicy({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validateToolCapabilityPolicy({
    ...TOOL_CAPABILITY_POLICIES[0],
    capabilityClass: "not_real",
    sideEffectLevel: "not_real",
    defaultPolicy: "not_real"
  });

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown capabilityClass")));
  assert.ok(invalid.errors.some(error => error.includes("unknown sideEffectLevel")));
  assert.ok(invalid.errors.some(error => error.includes("unknown defaultPolicy")));

  const runtimeAllowed = validateToolCapabilityPolicy({
    ...TOOL_CAPABILITY_POLICIES[0],
    runtimeIntegrationAllowed: true
  });

  assert.strictEqual(runtimeAllowed.valid, false);
  assert.ok(runtimeAllowed.errors.some(error => error.includes("runtimeIntegrationAllowed must be false")));
}

function testToolCapabilityRegistryHighRiskDenyByDefault() {
  const registry = createToolCapabilityRegistry();

  for (const toolPath of [
    "tools/writeFileTool.js",
    "tools/commandTool.js",
    "tools/pythonTool.js"
  ]) {
    const policy = getToolCapabilityPolicy(registry, toolPath);
    assert.ok(policy);
    assert.strictEqual(policy.defaultPolicy, "deny_by_default");
    assert.strictEqual(policy.requiresHumanApproval, true);
    assert.strictEqual(policy.requiresEvidenceGate, true);
    assert.strictEqual(policy.runtimeIntegrationAllowed, false);

    const classification = classifyToolCapability(policy);
    assert.strictEqual(classification.highRisk, true);
    assert.strictEqual(classification.canExecuteRuntime, false);
    assert.strictEqual(classification.canServeAsAuthority, false);
    assert.strictEqual(canUseToolCapability(policy, "runtime_use"), false);
    assert.throws(
      () => assertToolCapabilityAllowed(policy, "runtime_use"),
      /denied by registry policy/
    );
  }
}

function testToolCapabilityRegistryReadScope() {
  const registry = createToolCapabilityRegistry();
  const readPolicy = getToolCapabilityPolicy(registry, "tools/readFileTool.js");

  assert.ok(readPolicy);
  assert.strictEqual(readPolicy.capabilityClass, "read_file");
  assert.strictEqual(readPolicy.sideEffectLevel, "filesystem_read");
  assert.strictEqual(readPolicy.defaultPolicy, "allow_only_with_scope");
  assert.ok(readPolicy.allowedRoots.includes("repo"));
  assert.strictEqual(readPolicy.runtimeIntegrationAllowed, false);
  assert.strictEqual(canUseToolCapability(readPolicy, "metadata_inspection"), true);
  assert.strictEqual(canUseToolCapability(readPolicy, "scoped_read"), false);
}

function testToolCapabilityRegistryRuntimeIntegrationBlocked() {
  const registry = createToolCapabilityRegistry();
  const summary = summarizeToolCapabilityRisk(registry);

  assert.strictEqual(summary.totalPolicies, 11);
  assert.strictEqual(summary.highRiskPolicies, 3);
  assert.strictEqual(summary.runtimeAllowedPolicies, 0);
  assert.strictEqual(summary.metadataOnly, true);
  assert.strictEqual(summary.runtimeIntegrationAllowed, false);

  for (const policy of registry.policies) {
    assert.strictEqual(policy.runtimeIntegrationAllowed, false);
    assert.strictEqual(canUseToolCapability(policy, "runtime_use"), false);
  }
}

function testToolCapabilityRegistryNoToolExecution() {
  const moduleExports = require("../core/toolCapabilityRegistry");

  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "executeTool"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "runTool"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "routeTool"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, "grantToolPermission"), false);

  const registry = createToolCapabilityRegistry();
  const commandPolicy = getToolCapabilityPolicy(registry, "tools/commandTool.js");

  assert.ok(commandPolicy);
  assert.strictEqual(canUseToolCapability(commandPolicy, "metadata_inspection"), true);
  assert.strictEqual(canUseToolCapability(commandPolicy, "runtime_use"), false);
}
function makeReplayRecord(overrides = {}) {
  return {
    recordId: "replay_record_test_001",
    recordType: "debug_replay_record",
    createdAt: "2026-04-25T00:00:00.000Z",
    source: "test_harness",
    operation: "inspect",
    inputs: { input: true },
    outputs: { output: true },
    sideEffectLevel: "metadata_only",
    validationState: "schema_validated",
    authorityState: "historical_debug_record",
    freshnessState: "historical",
    ...overrides
  };
}

function testReplayStoreRecordValidation() {
  assert.ok(REPLAY_RECORD_TYPES.includes("debug_replay_record"));
  assert.ok(REPLAY_AUTHORITY_STATES.includes("historical_debug_record"));
  assert.ok(REPLAY_BLOCKED_AUTHORITY_STATES.includes("proof"));
  assert.ok(REPLAY_FRESHNESS_STATES.includes("stale"));
  assert.ok(REPLAY_VALIDATION_STATES.includes("schema_validated"));

  const missing = validateReplayRecord({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validateReplayRecord(makeReplayRecord({
    recordType: "not_real",
    authorityState: "not_real",
    freshnessState: "not_real",
    validationState: "not_real",
    sideEffectLevel: "not_real"
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown recordType")));
  assert.ok(invalid.errors.some(error => error.includes("unknown authorityState")));
  assert.ok(invalid.errors.some(error => error.includes("unknown freshnessState")));
  assert.ok(invalid.errors.some(error => error.includes("unknown validationState")));
  assert.ok(invalid.errors.some(error => error.includes("unknown sideEffectLevel")));
}

function testReplayStoreRecordsAreNotProof() {
  const proof = validateReplayRecord(makeReplayRecord({ authorityState: "proof" }));
  assert.strictEqual(proof.valid, false);
  assert.ok(proof.errors.some(error => error.includes("blocked authorityState")));

  for (const authorityState of [
    "live_repo_state",
    "permission_grant",
    "runtime_execution_authority"
  ]) {
    const invalid = validateReplayRecord(makeReplayRecord({ authorityState }));
    assert.strictEqual(invalid.valid, false);
  }

  const record = createReplayRecord(makeReplayRecord());
  const classification = classifyReplayRecordAuthority(record);

  assert.strictEqual(classification.canServeAsProof, false);
  assert.strictEqual(classification.canRepresentLiveRepoState, false);
  assert.strictEqual(classification.canGrantPermission, false);
  assert.strictEqual(classification.canOverrideLiveRepoEvidence, false);
  assert.strictEqual(assertReplayRecordNotProof(record), true);
}

function testReplayStoreFreshnessGate() {
  assert.throws(
    () => assertReplayRecordFreshForUse(makeReplayRecord({
      freshnessState: "stale",
      validationState: "freshness_validated"
    })),
    /not fresh enough/
  );

  assert.throws(
    () => assertReplayRecordFreshForUse(makeReplayRecord({
      freshnessState: "unknown",
      validationState: "freshness_validated"
    })),
    /not fresh enough/
  );

  assert.throws(
    () => assertReplayRecordFreshForUse(makeReplayRecord({
      freshnessState: "recent",
      validationState: "schema_validated"
    })),
    /requires freshness validation/
  );

  assert.strictEqual(
    assertReplayRecordFreshForUse(makeReplayRecord({
      freshnessState: "recent",
      validationState: "freshness_validated"
    })),
    true
  );
}

function testReplayStoreSideEffectReplayBlocked() {
  const invalid = validateReplayRecord(makeReplayRecord({
    sideEffectLevel: "filesystem_write",
    autoReplay: true
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("automatically replayable")));

  const record = createReplayRecord(makeReplayRecord({
    recordId: "side_effect_record",
    sideEffectLevel: "filesystem_write"
  }));

  const classification = classifyReplayRecordAuthority(record);
  assert.strictEqual(classification.canReplaySideEffectsAutomatically, false);
  assert.strictEqual(assertReplayRecordNotProof(record), true);
}

function testReplayStorePersistenceSchema() {
  const original = createReplayRecord(makeReplayRecord({
    recordId: "round_trip_record",
    validationState: "evidence_gate_validated",
    authorityState: "validated_evidence_reference",
    freshnessState: "current_run"
  }));

  const serialized = JSON.stringify(original);
  const parsed = JSON.parse(serialized);
  const recreated = createReplayRecord(parsed);

  assert.strictEqual(recreated.recordId, "round_trip_record");
  assert.strictEqual(recreated.authorityState, "validated_evidence_reference");
  assert.strictEqual(assertReplayRecordFreshForUse(recreated), true);

  const invalid = validateReplayRecord({
    ...parsed,
    permissionGrant: true
  });

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("must not grant permissions")));
}
function makeCommitGateSteps(overrides = {}) {
  return COMMIT_GATE_REQUIRED_STEPS.map(step => ({
    step,
    status: overrides[step] || "passed",
    evidence: step + "_evidence"
  }));
}

function makeCommitGateRecord(overrides = {}) {
  return {
    gateId: "commit_gate_test_001",
    seam: "CommitGateAutomationImplementation v1",
    expectedFiles: ["core/commitGate.js", "tests/run.js"],
    actualFiles: ["core/commitGate.js", "tests/run.js"],
    steps: makeCommitGateSteps(),
    evidencePath: "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence\\commit_gate_test.txt",
    status: "passed",
    ...overrides
  };
}

function testCommitGateRecordValidation() {
  assert.ok(COMMIT_GATE_REQUIRED_STEPS.includes("unstaged_diff_check"));
  assert.ok(COMMIT_GATE_STATUSES.includes("blocked"));
  assert.ok(COMMIT_GATE_BLOCKING_REASONS.includes("model_output_used_as_proof"));

  const missing = validateCommitGateRecord({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const unknownStep = validateCommitGateRecord(makeCommitGateRecord({
    steps: [
      ...makeCommitGateSteps(),
      { step: "not_real", status: "passed", evidence: "x" }
    ]
  }));

  assert.strictEqual(unknownStep.valid, false);
  assert.ok(unknownStep.errors.some(error => error.includes("unknown commit gate step")));

  const runtimeMutation = validateCommitGateRecord(makeCommitGateRecord({
    autoCommit: true
  }));

  assert.strictEqual(runtimeMutation.valid, false);
  assert.ok(runtimeMutation.errors.some(error => error.includes("must not execute git")));
}

function testCommitGateRequiredSteps() {
  const record = createCommitGateRecord(makeCommitGateRecord());

  assert.strictEqual(record.steps.length, COMMIT_GATE_REQUIRED_STEPS.length);

  for (const step of COMMIT_GATE_REQUIRED_STEPS) {
    assert.ok(record.steps.some(item => item.step === step));
  }

  const missingStep = validateCommitGateRecord(makeCommitGateRecord({
    steps: makeCommitGateSteps().filter(step => step.step !== "staged_diff_check")
  }));

  assert.strictEqual(missingStep.valid, false);
  assert.ok(missingStep.errors.some(error => error.includes("missing required commit gate step")));
}

function testCommitGateBlocksOnFailedStep() {
  const record = makeCommitGateRecord({
    steps: makeCommitGateSteps({
      full_test_harness: "failed"
    })
  });

  const evaluation = evaluateCommitGateRecord(record);

  assert.strictEqual(evaluation.eligible, false);
  assert.strictEqual(evaluation.status, "blocked");
  assert.ok(evaluation.failedSteps.includes("full_test_harness"));
  assert.strictEqual(evaluation.canRunGit, false);
  assert.strictEqual(evaluation.canCommit, false);
  assert.throws(() => assertCommitGatePassed(record), /CommitGate blocked/);
}

function testCommitGatePassesOnlyWhenAllRequiredStepsPass() {
  const record = makeCommitGateRecord();
  const evaluation = evaluateCommitGateRecord(record);
  const summary = summarizeCommitGateRecord(record);

  assert.strictEqual(evaluation.eligible, true);
  assert.strictEqual(assertCommitGatePassed(record), true);
  assert.strictEqual(summary.eligible, true);
  assert.strictEqual(summary.expectedFileCount, 2);
  assert.strictEqual(summary.actualFileCount, 2);

  const broadStaging = validateCommitGateRecord(makeCommitGateRecord({
    actualFiles: ["core/commitGate.js", "tests/run.js", "extra.js"]
  }));

  assert.strictEqual(broadStaging.valid, false);
  assert.ok(broadStaging.errors.some(error => error.includes("actualFiles must exactly match expectedFiles")));
}

function testCommitGateNoRuntimeGitExecution() {
  const moduleExports = require("../core/commitGate");

  for (const forbidden of [
    "runGit",
    "gitAdd",
    "gitCommit",
    "stageFiles",
    "commit",
    "autoFix",
    "executeCommand"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const record = makeCommitGateRecord();
  const evaluation = evaluateCommitGateRecord(record);

  assert.strictEqual(evaluation.canRunGit, false);
  assert.strictEqual(evaluation.canStageFiles, false);
  assert.strictEqual(evaluation.canCommit, false);
  assert.strictEqual(evaluation.canAutoFix, false);
  assert.strictEqual(evaluation.canUseModelOutputAsProof, false);
}
const HANDOFF_RUNNER_REQUIRED_GATES_TEST = [
  "AgentHandoffPacket",
  "AgentHandoffBridge",
  "TaskGraph",
  "EvidenceGate",
  "ValidityGraph",
  "ToolCapabilityRegistry",
  "ReplayStore",
  "CommitGate"
];

function makeHandoffRunnerDecision(overrides = {}) {
  return {
    decisionId: "handoff_runner_decision_test",
    handoffId: "handoff_packet_test",
    action: "plan",
    status: "routed",
    requiredGates: HANDOFF_RUNNER_REQUIRED_GATES_TEST,
    blockedCapabilities: [],
    blockedReasons: [],
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsProof: false,
    ...overrides
  };
}

function testAgentHandoffRunnerDecisionValidation() {
  assert.ok(HANDOFF_RUNNER_ACTIONS.includes("defer_runtime_execution"));
  assert.ok(HANDOFF_RUNNER_STATUSES.includes("blocked"));
  assert.ok(HANDOFF_RUNNER_BLOCKED_REASONS.includes("tool_execution_requested"));

  const missing = validateHandoffRunnerDecision({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const unknown = validateHandoffRunnerDecision(makeHandoffRunnerDecision({
    action: "not_real",
    status: "not_real",
    blockedReasons: ["not_real"]
  }));

  assert.strictEqual(unknown.valid, false);
  assert.ok(unknown.errors.some(error => error.includes("unknown handoff runner action")));
  assert.ok(unknown.errors.some(error => error.includes("unknown handoff runner status")));
  assert.ok(unknown.errors.some(error => error.includes("unknown blockedReason")));

  const unsafe = validateHandoffRunnerDecision(makeHandoffRunnerDecision({
    canExecuteTools: true
  }));

  assert.strictEqual(unsafe.valid, false);
  assert.ok(unsafe.errors.some(error => error.includes("canExecuteTools must be false")));
}

function testAgentHandoffRunnerRoutesMetadataOnly() {
  const runner = createAgentHandoffRunner();
  const decision = runner.classify({
    handoffId: "handoff_packet_metadata_only",
    requestedAction: "plan",
    payload: { goal: "plan only" }
  }, {
    decisionId: "metadata_only_decision"
  });

  assert.strictEqual(decision.action, "plan");
  assert.strictEqual(decision.status, "routed");
  assert.strictEqual(decision.canExecuteTools, false);
  assert.strictEqual(decision.canWriteFiles, false);
  assert.strictEqual(decision.canRunGit, false);
  assert.strictEqual(decision.canCommit, false);
  assert.strictEqual(decision.canGrantPermissions, false);
  assert.strictEqual(decision.canUseModelOutputAsProof, false);
  assert.strictEqual(assertHandoffRunnerDecisionSafe(decision), true);

  const summary = summarizeHandoffRunnerDecision(decision);
  assert.strictEqual(summary.safe, true);
  assert.strictEqual(summary.requiredGateCount, HANDOFF_RUNNER_REQUIRED_GATES_TEST.length);
}

function testAgentHandoffRunnerBlocksToolAndGitExecution() {
  const decision = classifyHandoffPacketForRunner({
    handoffId: "unsafe_handoff_packet",
    request: "executeTool writeFileTool git commit permission grant model output as proof runtime integration"
  });

  assert.strictEqual(decision.status, "blocked");
  assert.strictEqual(decision.action, "defer_runtime_execution");
  assert.ok(decision.blockedReasons.includes("tool_execution_requested"));
  assert.ok(decision.blockedReasons.includes("file_write_requested"));
  assert.ok(decision.blockedReasons.includes("git_execution_requested"));
  assert.ok(decision.blockedReasons.includes("permission_grant_requested"));
  assert.ok(decision.blockedReasons.includes("model_output_used_as_proof"));
  assert.ok(decision.blockedReasons.includes("runtime_integration_requested"));
  assert.strictEqual(decision.canExecuteTools, false);
  assert.strictEqual(decision.canRunGit, false);
  assert.strictEqual(assertHandoffRunnerDecisionSafe(decision), true);
}

function testAgentHandoffRunnerRequiresGateSpine() {
  const missingGate = validateHandoffRunnerDecision(makeHandoffRunnerDecision({
    requiredGates: HANDOFF_RUNNER_REQUIRED_GATES_TEST.filter(gate => gate !== "CommitGate")
  }));

  assert.strictEqual(missingGate.valid, false);
  assert.ok(missingGate.errors.some(error => error.includes("missing required gate: CommitGate")));

  assert.throws(
    () => createAgentHandoffRunner({
      requiredGates: HANDOFF_RUNNER_REQUIRED_GATES_TEST.filter(gate => gate !== "EvidenceGate")
    }),
    /missing required gate/
  );

  const created = createHandoffRunnerDecision(makeHandoffRunnerDecision());
  assert.strictEqual(created.requiredGates.length, HANDOFF_RUNNER_REQUIRED_GATES_TEST.length);
}

function testAgentHandoffRunnerNoRuntimeExports() {
  const moduleExports = require("../core/agentHandoffRunner");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const decision = makeHandoffRunnerDecision();
  const summary = summarizeHandoffRunnerDecision(decision);

  assert.strictEqual(summary.canExecuteTools, false);
  assert.strictEqual(summary.canWriteFiles, false);
  assert.strictEqual(summary.canRunGit, false);
  assert.strictEqual(summary.canCommit, false);
  assert.strictEqual(summary.canGrantPermissions, false);
  assert.strictEqual(summary.canUseModelOutputAsProof, false);
}
const RUNTIME_BOUNDARY_REQUIRED_GATES_TEST = [
  "AgentHandoffRunner",
  "ToolCapabilityRegistry",
  "PermissionGate",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
];

function makeRuntimeBoundaryRequest(overrides = {}) {
  return {
    requestId: "runtime_boundary_request_test",
    source: "test_harness",
    requestedAction: "plan",
    targetCapability: "metadata",
    sideEffectLevel: "metadata_only",
    requiredGates: RUNTIME_BOUNDARY_REQUIRED_GATES_TEST,
    permissionState: "not_requested",
    evidenceState: "unverified",
    runtimeAllowed: false,
    blockedReasons: [],
    ...overrides
  };
}

function testRuntimeBoundaryRequestValidation() {
  assert.ok(RUNTIME_BOUNDARY_ACTIONS.includes("execute_tool"));
  assert.ok(RUNTIME_BOUNDARY_STATUSES.includes("blocked"));
  assert.ok(RUNTIME_BOUNDARY_SIDE_EFFECT_LEVELS.includes("git_execution"));
  assert.ok(RUNTIME_BOUNDARY_BLOCKED_REASONS.includes("runtime_not_approved"));

  const missing = validateRuntimeRequest({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validateRuntimeRequest(makeRuntimeBoundaryRequest({
    requestedAction: "not_real",
    sideEffectLevel: "not_real",
    status: "not_real",
    blockedReasons: ["not_real"]
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown requestedAction")));
  assert.ok(invalid.errors.some(error => error.includes("unknown sideEffectLevel")));
  assert.ok(invalid.errors.some(error => error.includes("unknown status")));
  assert.ok(invalid.errors.some(error => error.includes("unknown blockedReason")));
}

function testRuntimeBoundaryBlocksExecutableIntent() {
  for (const [requestedAction, expectedReason] of [
    ["execute_tool", "tool_execution_blocked"],
    ["write_file", "file_write_blocked"],
    ["run_git", "git_execution_blocked"],
    ["commit", "commit_blocked"],
    ["grant_permission", "permission_grant_blocked"],
    ["runtime_integration", "runtime_integration_blocked"]
  ]) {
    const classified = classifyRuntimeRequest(makeRuntimeBoundaryRequest({
      requestedAction,
      targetCapability: requestedAction,
      sideEffectLevel: "unknown"
    }));

    assert.strictEqual(classified.status, "blocked");
    assert.strictEqual(classified.runtimeAllowed, false);
    assert.ok(classified.request.blockedReasons.includes(expectedReason));
    assert.strictEqual(assertRuntimeRequestBlocked(classified.request), true);
  }

  const modelProof = validateRuntimeRequest(makeRuntimeBoundaryRequest({
    modelOutputUsedAsProof: true
  }));

  assert.strictEqual(modelProof.valid, false);
  assert.ok(modelProof.errors.some(error => error.includes("model output")));
}

function testRuntimeBoundaryDefersRuntimeIntegration() {
  const classified = classifyRuntimeRequest(makeRuntimeBoundaryRequest({
    requestedAction: "runtime_integration",
    targetCapability: "agent_runtime",
    sideEffectLevel: "process_execution",
    runtimeIntegration: true
  }));

  const summary = summarizeRuntimeRequest(classified.request);

  assert.strictEqual(classified.status, "blocked");
  assert.strictEqual(classified.runtimeAllowed, false);
  assert.strictEqual(classified.canExecuteTools, false);
  assert.strictEqual(classified.canWriteFiles, false);
  assert.strictEqual(classified.canRunGit, false);
  assert.strictEqual(classified.canCommit, false);
  assert.strictEqual(classified.canGrantPermissions, false);
  assert.strictEqual(summary.runtimeAllowed, false);
  assert.ok(classified.request.blockedReasons.includes("runtime_integration_blocked"));
  assert.ok(classified.request.blockedReasons.includes("runtime_not_approved"));
}

function testRuntimeBoundaryRequiresGateSpine() {
  const missingGate = validateRuntimeRequest(makeRuntimeBoundaryRequest({
    requiredGates: RUNTIME_BOUNDARY_REQUIRED_GATES_TEST.filter(gate => gate !== "PermissionGate")
  }));

  assert.strictEqual(missingGate.valid, false);
  assert.ok(missingGate.errors.some(error => error.includes("missing required gate: PermissionGate")));

  const created = createRuntimeRequest(makeRuntimeBoundaryRequest());
  assert.strictEqual(created.requiredGates.length, RUNTIME_BOUNDARY_REQUIRED_GATES_TEST.length);
}

function testRuntimeBoundaryNoRuntimeExports() {
  const moduleExports = require("../core/runtimeIntegrationBoundary");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const classified = classifyRuntimeRequest(makeRuntimeBoundaryRequest());
  assert.strictEqual(classified.canExecuteTools, false);
  assert.strictEqual(classified.canWriteFiles, false);
  assert.strictEqual(classified.canRunGit, false);
  assert.strictEqual(classified.canCommit, false);
  assert.strictEqual(classified.canGrantPermissions, false);
  assert.strictEqual(classified.canUseModelOutputAsProof, false);
}
function makePermissionGateRequest(overrides = {}) {
  return {
    permissionId: "permission_gate_request_test",
    source: "test_harness",
    requestedScope: "classification",
    targetCapability: "metadata",
    evidenceState: "present",
    humanApprovalState: "not_required_for_metadata",
    decision: "metadata_only",
    status: "metadata_only",
    permissionGranted: false,
    blockedReasons: [],
    ...overrides
  };
}

function testPermissionGateRequestValidation() {
  assert.ok(PERMISSION_GATE_SCOPES.includes("tool_execution"));
  assert.ok(PERMISSION_GATE_STATUSES.includes("blocked"));
  assert.ok(PERMISSION_GATE_DECISIONS.includes("deny"));
  assert.ok(PERMISSION_GATE_BLOCKED_REASONS.includes("model_output_approval_blocked"));

  const missing = validatePermissionRequest({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validatePermissionRequest(makePermissionGateRequest({
    requestedScope: "not_real",
    status: "not_real",
    decision: "not_real",
    blockedReasons: ["not_real"]
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown requestedScope")));
  assert.ok(invalid.errors.some(error => error.includes("unknown status")));
  assert.ok(invalid.errors.some(error => error.includes("unknown decision")));
  assert.ok(invalid.errors.some(error => error.includes("unknown blockedReason")));
}

function testPermissionGateDoesNotGrantPermissions() {
  const grant = validatePermissionRequest(makePermissionGateRequest({
    permissionGranted: true
  }));

  assert.strictEqual(grant.valid, false);
  assert.ok(grant.errors.some(error => error.includes("permissionGranted must be false")));

  const classified = classifyPermissionRequest(makePermissionGateRequest({
    requestedScope: "permission_grant",
    permissionGranted: true,
    grantPermission: true
  }));

  assert.strictEqual(classified.permissionGranted, false);
  assert.strictEqual(classified.canGrantPermissions, false);
  assert.strictEqual(classified.status, "blocked");
  assert.ok(classified.request.blockedReasons.includes("permission_grant_blocked"));
  assert.strictEqual(assertPermissionNotGranted(classified.request), true);
}

function testPermissionGateBlocksRuntimeSensitiveScopes() {
  for (const [requestedScope, expectedReason] of [
    ["tool_execution", "tool_execution_permission_blocked"],
    ["file_write", "file_write_permission_blocked"],
    ["git_execution", "git_execution_permission_blocked"],
    ["commit", "commit_permission_blocked"],
    ["runtime_integration", "runtime_integration_permission_blocked"]
  ]) {
    const classified = classifyPermissionRequest(makePermissionGateRequest({
      requestedScope,
      targetCapability: requestedScope
    }));

    assert.strictEqual(classified.status, "blocked");
    assert.strictEqual(classified.permissionGranted, false);
    assert.ok(classified.request.blockedReasons.includes(expectedReason));
    assert.strictEqual(assertPermissionNotGranted(classified.request), true);
  }
}

function testPermissionGateRequiresEvidenceAndHumanState() {
  const missingEvidence = classifyPermissionRequest(makePermissionGateRequest({
    evidenceState: "missing"
  }));

  assert.strictEqual(missingEvidence.status, "blocked");
  assert.ok(missingEvidence.request.blockedReasons.includes("evidence_missing"));

  const missingHumanApproval = classifyPermissionRequest(makePermissionGateRequest({
    humanApprovalState: "missing"
  }));

  assert.strictEqual(missingHumanApproval.status, "blocked");
  assert.ok(missingHumanApproval.request.blockedReasons.includes("human_approval_missing"));

  const modelApproval = validatePermissionRequest(makePermissionGateRequest({
    modelOutputUsedAsApproval: true
  }));

  assert.strictEqual(modelApproval.valid, false);
  assert.ok(modelApproval.errors.some(error => error.includes("model output")));
}

function testPermissionGateNoRuntimeExports() {
  const moduleExports = require("../core/permissionGate");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const classified = classifyPermissionRequest(makePermissionGateRequest());
  const summary = summarizePermissionRequest(classified.request);

  assert.strictEqual(summary.permissionGranted, false);
  assert.strictEqual(summary.canExecuteTools, false);
  assert.strictEqual(summary.canWriteFiles, false);
  assert.strictEqual(summary.canRunGit, false);
  assert.strictEqual(summary.canCommit, false);
  assert.strictEqual(summary.canGrantPermissions, false);
  assert.strictEqual(summary.canUseModelOutputAsApproval, false);

  const created = createPermissionRequest(makePermissionGateRequest());
  assert.strictEqual(created.permissionGranted, false);
}
const EXECUTION_ADAPTER_REQUIRED_GATES_TEST = [
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ToolCapabilityRegistry",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
];

function makeExecutionAdapterPolicy(overrides = {}) {
  return {
    adapterId: "execution_adapter_test",
    adapterType: "metadata",
    targetCapability: "metadata",
    sideEffectLevel: "metadata_only",
    requiredGates: EXECUTION_ADAPTER_REQUIRED_GATES_TEST,
    defaultPolicy: "metadata_only",
    runtimeExecutionAllowed: false,
    blockedReasons: [],
    ...overrides
  };
}

function testExecutionAdapterPolicyValidation() {
  assert.ok(EXECUTION_ADAPTER_TYPES.includes("tool"));
  assert.ok(EXECUTION_ADAPTER_STATUSES.includes("blocked"));
  assert.ok(EXECUTION_ADAPTER_SIDE_EFFECT_LEVELS.includes("git_execution"));
  assert.ok(EXECUTION_ADAPTER_BLOCKED_REASONS.includes("adapter_execution_blocked"));

  const missing = validateExecutionAdapterPolicy({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validateExecutionAdapterPolicy(makeExecutionAdapterPolicy({
    adapterType: "not_real",
    sideEffectLevel: "not_real",
    defaultPolicy: "not_real",
    blockedReasons: ["not_real"]
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown adapterType")));
  assert.ok(invalid.errors.some(error => error.includes("unknown sideEffectLevel")));
  assert.ok(invalid.errors.some(error => error.includes("unknown defaultPolicy")));
  assert.ok(invalid.errors.some(error => error.includes("unknown blockedReason")));

  const executable = validateExecutionAdapterPolicy(makeExecutionAdapterPolicy({
    runtimeExecutionAllowed: true
  }));

  assert.strictEqual(executable.valid, false);
  assert.ok(executable.errors.some(error => error.includes("runtimeExecutionAllowed must be false")));
}

function testExecutionAdapterRegistryMetadataOnly() {
  const policy = createExecutionAdapterPolicy(makeExecutionAdapterPolicy());
  const registry = createExecutionAdapterRegistry([policy]);
  const summary = summarizeExecutionAdapterRegistry(registry);

  assert.strictEqual(registry.metadataOnly, true);
  assert.strictEqual(registry.adapterExecutionAllowed, false);
  assert.strictEqual(registry.runtimeIntegrationAllowed, false);
  assert.strictEqual(registry.getPolicy("execution_adapter_test").adapterId, "execution_adapter_test");
  assert.strictEqual(summary.metadataOnly, true);
  assert.strictEqual(summary.adapterExecutionAllowed, false);
  assert.strictEqual(summary.runtimeIntegrationAllowed, false);
  assert.strictEqual(summary.policyCount, 1);
}

function testExecutionAdapterBlocksExecutableRequests() {
  for (const [adapterType, sideEffectLevel, expectedReason] of [
    ["tool", "process_execution", "tool_adapter_blocked"],
    ["file", "filesystem_write", "file_adapter_blocked"],
    ["command", "process_execution", "command_adapter_blocked"],
    ["git", "git_execution", "git_adapter_blocked"],
    ["model", "model_execution", "model_adapter_blocked"],
    ["runtime", "unknown", "runtime_integration_blocked"]
  ]) {
    const classified = classifyExecutionAdapterRequest({
      adapterId: adapterType + "_adapter",
      adapterType,
      targetCapability: adapterType,
      sideEffectLevel,
      requiredGates: EXECUTION_ADAPTER_REQUIRED_GATES_TEST,
      evidenceState: "unverified"
    });

    assert.strictEqual(classified.status, "blocked");
    assert.strictEqual(classified.adapterExecutionAllowed, false);
    assert.strictEqual(classified.runtimeExecutionAllowed, false);
    assert.ok(classified.policy.blockedReasons.includes(expectedReason));
    assert.strictEqual(assertExecutionAdapterNotExecutable(classified.policy), true);
  }
}

function testExecutionAdapterRequiresGateSpine() {
  const missingGate = validateExecutionAdapterPolicy(makeExecutionAdapterPolicy({
    requiredGates: EXECUTION_ADAPTER_REQUIRED_GATES_TEST.filter(gate => gate !== "PermissionGate")
  }));

  assert.strictEqual(missingGate.valid, false);
  assert.ok(missingGate.errors.some(error => error.includes("missing required gate: PermissionGate")));

  const created = createExecutionAdapterPolicy(makeExecutionAdapterPolicy());
  assert.strictEqual(created.requiredGates.length, EXECUTION_ADAPTER_REQUIRED_GATES_TEST.length);
}

function testExecutionAdapterNoRuntimeExports() {
  const moduleExports = require("../core/executionAdapterRegistry");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix",
    "executeAdapter",
    "runAdapter"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const registry = createExecutionAdapterRegistry([makeExecutionAdapterPolicy()]);
  const summary = summarizeExecutionAdapterRegistry(registry);

  assert.strictEqual(summary.canExecuteAdapters, false);
  assert.strictEqual(summary.canExecuteTools, false);
  assert.strictEqual(summary.canWriteFiles, false);
  assert.strictEqual(summary.canRunCommands, false);
  assert.strictEqual(summary.canRunGit, false);
  assert.strictEqual(summary.canCommit, false);
  assert.strictEqual(summary.canGrantPermissions, false);
  assert.strictEqual(summary.canUseModelOutputAsAuthority, false);
}
const SIDE_EFFECT_SANDBOX_REQUIRED_GATES_TEST = [
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ExecutionAdapterRegistry",
  "ToolCapabilityRegistry",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
];

function makeSideEffectSandboxPolicy(overrides = {}) {
  return {
    sandboxId: "side_effect_sandbox_test",
    source: "test_harness",
    sideEffectLevel: "metadata_only",
    targetCapability: "metadata",
    requiredGates: SIDE_EFFECT_SANDBOX_REQUIRED_GATES_TEST,
    sandboxRequired: false,
    executionAllowed: false,
    filesystemMutationAllowed: false,
    processExecutionAllowed: false,
    blockedReasons: [],
    ...overrides
  };
}

function testSideEffectSandboxPolicyValidation() {
  assert.ok(SIDE_EFFECT_SANDBOX_LEVELS.includes("filesystem_write"));
  assert.ok(SIDE_EFFECT_SANDBOX_STATUSES.includes("blocked"));
  assert.ok(SIDE_EFFECT_SANDBOX_BLOCKED_REASONS.includes("sandbox_execution_blocked"));
  assert.ok(SIDE_EFFECT_SANDBOX_REQUIRED_GATES.includes("ExecutionAdapterRegistry"));

  const missing = validateSideEffectSandboxPolicy({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validateSideEffectSandboxPolicy(makeSideEffectSandboxPolicy({
    sideEffectLevel: "not_real",
    status: "not_real",
    blockedReasons: ["not_real"]
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown sideEffectLevel")));
  assert.ok(invalid.errors.some(error => error.includes("unknown status")));
  assert.ok(invalid.errors.some(error => error.includes("unknown blockedReason")));

  const executable = validateSideEffectSandboxPolicy(makeSideEffectSandboxPolicy({
    executionAllowed: true
  }));

  assert.strictEqual(executable.valid, false);
  assert.ok(executable.errors.some(error => error.includes("executionAllowed must be false")));
}

function testSideEffectSandboxClassifiesWithoutExecuting() {
  const metadata = classifySideEffectSandboxRequest(makeSideEffectSandboxPolicy());
  const summary = summarizeSideEffectSandboxPolicy(metadata.policy);

  assert.strictEqual(metadata.status, "metadata_only");
  assert.strictEqual(metadata.executionAllowed, false);
  assert.strictEqual(metadata.filesystemMutationAllowed, false);
  assert.strictEqual(metadata.processExecutionAllowed, false);
  assert.strictEqual(metadata.canExecuteEffects, false);
  assert.strictEqual(summary.executionAllowed, false);
  assert.strictEqual(summary.canExecuteProcesses, false);

  const created = createSideEffectSandboxPolicy(makeSideEffectSandboxPolicy());
  assert.strictEqual(created.executionAllowed, false);
}

function testSideEffectSandboxBlocksMutationAndProcessExecution() {
  for (const [sideEffectLevel, expectedReason] of [
    ["filesystem_write", "filesystem_write_blocked"],
    ["process_execution", "process_execution_blocked"],
    ["code_execution", "code_execution_blocked"],
    ["git_execution", "git_execution_blocked"],
    ["model_execution", "model_execution_blocked"],
    ["permission_grant", "permission_grant_blocked"]
  ]) {
    const classified = classifySideEffectSandboxRequest(makeSideEffectSandboxPolicy({
      sideEffectLevel,
      targetCapability: sideEffectLevel
    }));

    assert.strictEqual(classified.status, "blocked");
    assert.strictEqual(classified.executionAllowed, false);
    assert.strictEqual(classified.filesystemMutationAllowed, false);
    assert.strictEqual(classified.processExecutionAllowed, false);
    assert.ok(classified.policy.blockedReasons.includes(expectedReason));
    assert.ok(classified.policy.blockedReasons.includes("sandbox_execution_blocked"));
    assert.strictEqual(assertSideEffectSandboxBlocksExecution(classified.policy), true);
  }

  const authority = validateSideEffectSandboxPolicy(makeSideEffectSandboxPolicy({
    modelOutputUsedAsAuthority: true
  }));

  assert.strictEqual(authority.valid, false);
  assert.ok(authority.errors.some(error => error.includes("model output")));
}

function testSideEffectSandboxRequiresGateSpine() {
  const missingGate = validateSideEffectSandboxPolicy(makeSideEffectSandboxPolicy({
    requiredGates: SIDE_EFFECT_SANDBOX_REQUIRED_GATES_TEST.filter(gate => gate !== "ExecutionAdapterRegistry")
  }));

  assert.strictEqual(missingGate.valid, false);
  assert.ok(missingGate.errors.some(error => error.includes("missing required gate: ExecutionAdapterRegistry")));

  const created = createSideEffectSandboxPolicy(makeSideEffectSandboxPolicy());
  assert.strictEqual(created.requiredGates.length, SIDE_EFFECT_SANDBOX_REQUIRED_GATES_TEST.length);
}

function testSideEffectSandboxNoRuntimeExports() {
  const moduleExports = require("../core/sideEffectSandbox");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix",
    "executeSandbox",
    "runSandbox"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const classified = classifySideEffectSandboxRequest(makeSideEffectSandboxPolicy({
    sideEffectLevel: "process_execution"
  }));

  assert.strictEqual(classified.canExecuteEffects, false);
  assert.strictEqual(classified.canMutateFilesystem, false);
  assert.strictEqual(classified.canExecuteProcesses, false);
  assert.strictEqual(classified.canRunGit, false);
  assert.strictEqual(classified.canCommit, false);
  assert.strictEqual(classified.canGrantPermissions, false);
  assert.strictEqual(classified.canUseModelOutputAsAuthority, false);
}
const TOOL_EXECUTION_AUDIT_REQUIRED_GATES_TEST = [
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ExecutionAdapterRegistry",
  "SideEffectSandbox",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
];

function makeToolExecutionAuditRecord(overrides = {}) {
  return {
    recordId: "tool_execution_audit_record_test",
    recordType: "tool_execution_plan",
    createdAt: "2026-04-25T00:00:00.000Z",
    source: "test_harness",
    toolId: "tools/commandTool.js",
    requestedAction: "plan",
    sideEffectLevel: "process_execution",
    requiredGates: TOOL_EXECUTION_AUDIT_REQUIRED_GATES_TEST,
    status: "planned",
    authorityState: "non_authoritative",
    replayAllowed: false,
    permissionGrant: false,
    runtimeExecutionAuthority: false,
    blockedReasons: [],
    ...overrides
  };
}

function testToolExecutionAuditRecordValidation() {
  assert.ok(TOOL_EXECUTION_AUDIT_RECORD_TYPES.includes("tool_execution_attempt"));
  assert.ok(TOOL_EXECUTION_AUDIT_STATUSES.includes("blocked"));
  assert.ok(TOOL_EXECUTION_AUDIT_AUTHORITY_STATES.includes("non_authoritative"));
  assert.ok(TOOL_EXECUTION_AUDIT_BLOCKED_REASONS.includes("audit_record_not_proof"));

  const missing = validateToolExecutionAuditRecord({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validateToolExecutionAuditRecord(makeToolExecutionAuditRecord({
    recordType: "not_real",
    status: "not_real",
    authorityState: "not_real",
    blockedReasons: ["not_real"]
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown recordType")));
  assert.ok(invalid.errors.some(error => error.includes("unknown status")));
  assert.ok(invalid.errors.some(error => error.includes("unknown authorityState")));
  assert.ok(invalid.errors.some(error => error.includes("unknown blockedReason")));
}

function testToolExecutionAuditRecordsAreNotProof() {
  const proof = validateToolExecutionAuditRecord(makeToolExecutionAuditRecord({
    provesCurrentRepoState: true
  }));

  assert.strictEqual(proof.valid, false);
  assert.ok(proof.errors.some(error => error.includes("must not be proof")));

  const classified = classifyToolExecutionAuditRecord(makeToolExecutionAuditRecord({
    permissionGrant: true,
    runtimeExecutionAuthority: true,
    modelOutputUsedAsAuthority: true
  }));

  assert.strictEqual(classified.isProof, false);
  assert.strictEqual(classified.permissionGrant, false);
  assert.strictEqual(classified.runtimeExecutionAuthority, false);
  assert.strictEqual(classified.canUseModelOutputAsAuthority, false);
  assert.ok(classified.record.blockedReasons.includes("permission_grant_blocked"));
  assert.ok(classified.record.blockedReasons.includes("runtime_execution_authority_blocked"));
  assert.ok(classified.record.blockedReasons.includes("model_output_authority_blocked"));
  assert.strictEqual(assertToolExecutionAuditRecordNotProof(classified.record), true);
}

function testToolExecutionAuditRecordsAreNotReplayable() {
  const replay = validateToolExecutionAuditRecord(makeToolExecutionAuditRecord({
    replayAllowed: true
  }));

  assert.strictEqual(replay.valid, false);
  assert.ok(replay.errors.some(error => error.includes("replayAllowed must be false")));

  const classified = classifyToolExecutionAuditRecord(makeToolExecutionAuditRecord({
    replayAllowed: true,
    autoReplay: true
  }));

  assert.strictEqual(classified.replayAllowed, false);
  assert.strictEqual(classified.canReplaySideEffects, false);
  assert.ok(classified.record.blockedReasons.includes("side_effect_replay_blocked"));
  assert.strictEqual(assertToolExecutionAuditRecordNotReplayable(classified.record), true);
}

function testToolExecutionAuditRequiresGateSpine() {
  const missingGate = validateToolExecutionAuditRecord(makeToolExecutionAuditRecord({
    requiredGates: TOOL_EXECUTION_AUDIT_REQUIRED_GATES_TEST.filter(gate => gate !== "SideEffectSandbox")
  }));

  assert.strictEqual(missingGate.valid, false);
  assert.ok(missingGate.errors.some(error => error.includes("missing required gate: SideEffectSandbox")));

  const created = createToolExecutionAuditRecord(makeToolExecutionAuditRecord());
  assert.strictEqual(created.requiredGates.length, TOOL_EXECUTION_AUDIT_REQUIRED_GATES_TEST.length);
}

function testToolExecutionAuditNoRuntimeExports() {
  const moduleExports = require("../core/toolExecutionAuditLog");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix",
    "replay",
    "autoReplay",
    "replaySideEffects"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const classified = classifyToolExecutionAuditRecord(makeToolExecutionAuditRecord());
  const summary = summarizeToolExecutionAuditRecord(classified.record);

  assert.strictEqual(summary.isProof, false);
  assert.strictEqual(summary.replayAllowed, false);
  assert.strictEqual(summary.permissionGrant, false);
  assert.strictEqual(summary.runtimeExecutionAuthority, false);
  assert.strictEqual(summary.canExecuteTools, false);
  assert.strictEqual(summary.canWriteFiles, false);
  assert.strictEqual(summary.canRunGit, false);
  assert.strictEqual(summary.canCommit, false);
  assert.strictEqual(summary.canGrantPermissions, false);
  assert.strictEqual(summary.canReplaySideEffects, false);
}
const RUNTIME_DRY_RUN_REQUIRED_GATES_TEST = [
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ExecutionAdapterRegistry",
  "SideEffectSandbox",
  "ToolExecutionAuditLog",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
];

function makeRuntimeDryRunRequest(overrides = {}) {
  return {
    dryRunId: "runtime_dry_run_request_test",
    source: "test_harness",
    requestType: "tool_dry_run",
    targetCapability: "tools/commandTool.js",
    sideEffectLevel: "process_execution",
    requiredGates: RUNTIME_DRY_RUN_REQUIRED_GATES_TEST,
    expectedMutation: "none",
    executionAllowed: false,
    runtimeAllowed: false,
    blockedReasons: [],
    ...overrides
  };
}

function makeRuntimeDryRunResult(overrides = {}) {
  return {
    dryRunId: "runtime_dry_run_request_test",
    resultId: "runtime_dry_run_result_test",
    source: "test_harness",
    status: "simulated",
    observedMutation: "none",
    expectedMutationMatched: true,
    authorityState: "simulation_only",
    runtimeExecutionAuthority: false,
    replayAllowed: false,
    permissionGrant: false,
    blockedReasons: ["dry_run_result_not_authority"],
    ...overrides
  };
}

function testRuntimeDryRunRequestValidation() {
  assert.ok(RUNTIME_DRY_RUN_REQUEST_TYPES.includes("tool_dry_run"));
  assert.ok(RUNTIME_DRY_RUN_STATUSES.includes("blocked"));
  assert.ok(RUNTIME_DRY_RUN_AUTHORITY_STATES.includes("simulation_only"));
  assert.ok(RUNTIME_DRY_RUN_BLOCKED_REASONS.includes("actual_dry_run_execution_blocked"));

  const missing = validateRuntimeDryRunRequest({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validateRuntimeDryRunRequest(makeRuntimeDryRunRequest({
    requestType: "not_real",
    status: "not_real",
    blockedReasons: ["not_real"]
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown requestType")));
  assert.ok(invalid.errors.some(error => error.includes("unknown status")));
  assert.ok(invalid.errors.some(error => error.includes("unknown blockedReason")));

  const executable = validateRuntimeDryRunRequest(makeRuntimeDryRunRequest({
    executionAllowed: true,
    runtimeAllowed: true
  }));

  assert.strictEqual(executable.valid, false);
  assert.ok(executable.errors.some(error => error.includes("executionAllowed must be false")));
  assert.ok(executable.errors.some(error => error.includes("runtimeAllowed must be false")));
}

function testRuntimeDryRunRequestBlocksExecution() {
  for (const [requestType, expectedReason] of [
    ["tool_dry_run", "tool_execution_blocked"],
    ["file_write_dry_run", "file_write_blocked"],
    ["command_dry_run", "process_execution_blocked"],
    ["git_dry_run", "git_execution_blocked"],
    ["runtime_integration_dry_run", "runtime_execution_blocked"]
  ]) {
    const classified = classifyRuntimeDryRunRequest(makeRuntimeDryRunRequest({
      requestType,
      targetCapability: requestType
    }));

    assert.strictEqual(classified.status, "blocked");
    assert.strictEqual(classified.executionAllowed, false);
    assert.strictEqual(classified.runtimeAllowed, false);
    assert.strictEqual(classified.canExecuteTools, false);
    assert.strictEqual(classified.canWriteFiles, false);
    assert.strictEqual(classified.canRunProcess, false);
    assert.strictEqual(classified.canRunGit, false);
    assert.strictEqual(classified.canCommit, false);
    assert.strictEqual(classified.canGrantPermissions, false);
    assert.strictEqual(classified.canReplay, false);
    assert.ok(classified.request.blockedReasons.includes("actual_dry_run_execution_blocked"));
    assert.ok(classified.request.blockedReasons.includes(expectedReason));
  }

  const created = createRuntimeDryRunRequest(makeRuntimeDryRunRequest({
    blockedReasons: ["actual_dry_run_execution_blocked"]
  }));
  assert.strictEqual(created.executionAllowed, false);
  assert.strictEqual(created.runtimeAllowed, false);
}

function testRuntimeDryRunResultIsNotAuthority() {
  const result = createRuntimeDryRunResult(makeRuntimeDryRunResult());
  assert.strictEqual(result.runtimeExecutionAuthority, false);
  assert.strictEqual(result.replayAllowed, false);
  assert.strictEqual(result.permissionGrant, false);
  assert.strictEqual(assertRuntimeDryRunResultNotAuthority(result), true);

  const badAuthority = validateRuntimeDryRunResult(makeRuntimeDryRunResult({
    runtimeExecutionAuthority: true,
    replayAllowed: true,
    permissionGrant: true,
    provesCurrentRepoState: true
  }));

  assert.strictEqual(badAuthority.valid, false);
  assert.ok(badAuthority.errors.some(error => error.includes("runtimeExecutionAuthority must be false")));
  assert.ok(badAuthority.errors.some(error => error.includes("replayAllowed must be false")));
  assert.ok(badAuthority.errors.some(error => error.includes("permissionGrant must be false")));
  assert.ok(badAuthority.errors.some(error => error.includes("must not prove current repo state")));

  const summary = summarizeRuntimeDryRunRecord(result);
  assert.strictEqual(summary.kind, "result");
  assert.strictEqual(summary.runtimeExecutionAuthority, false);
  assert.strictEqual(summary.replayAllowed, false);
  assert.strictEqual(summary.permissionGrant, false);
}

function testRuntimeDryRunRequiresGateSpine() {
  const missingGate = validateRuntimeDryRunRequest(makeRuntimeDryRunRequest({
    requiredGates: RUNTIME_DRY_RUN_REQUIRED_GATES_TEST.filter(gate => gate !== "ToolExecutionAuditLog")
  }));

  assert.strictEqual(missingGate.valid, false);
  assert.ok(missingGate.errors.some(error => error.includes("missing required gate: ToolExecutionAuditLog")));
}

function testRuntimeDryRunNoRuntimeExports() {
  const moduleExports = require("../core/runtimeDryRunContract");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix",
    "executeDryRun",
    "runDryRun",
    "replay",
    "autoReplay"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const summary = summarizeRuntimeDryRunRecord(makeRuntimeDryRunRequest());
  assert.strictEqual(summary.executionAllowed, false);
  assert.strictEqual(summary.runtimeAllowed, false);
  assert.strictEqual(summary.canExecuteTools, false);
  assert.strictEqual(summary.canWriteFiles, false);
  assert.strictEqual(summary.canRunProcess, false);
  assert.strictEqual(summary.canRunGit, false);
  assert.strictEqual(summary.canCommit, false);
  assert.strictEqual(summary.canGrantPermissions, false);
  assert.strictEqual(summary.canReplay, false);
}
const RUNTIME_USER_APPROVAL_REQUIRED_GATES_TEST = [
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "RuntimeDryRunContract",
  "ExecutionAdapterRegistry",
  "SideEffectSandbox",
  "ToolExecutionAuditLog",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
];

function makeRuntimeUserApprovalCheckpoint(overrides = {}) {
  return {
    approvalId: "runtime_user_approval_checkpoint_test",
    source: "test_harness",
    scope: "runtime_integration",
    targetCapability: "agent_runtime",
    requestedAction: "plan_runtime_integration",
    requiredGates: RUNTIME_USER_APPROVAL_REQUIRED_GATES_TEST,
    userApprovalState: "explicitly_approved_for_plan_only",
    decision: "plan_only",
    runtimeExecutionAllowed: false,
    permissionGrant: false,
    modelOutputApproval: false,
    blockedReasons: [],
    ...overrides
  };
}

function testRuntimeUserApprovalCheckpointValidation() {
  assert.ok(RUNTIME_USER_APPROVAL_SCOPES.includes("runtime_integration"));
  assert.ok(RUNTIME_USER_APPROVAL_STATES.includes("explicitly_approved_for_plan_only"));
  assert.ok(RUNTIME_USER_APPROVAL_DECISIONS.includes("plan_only"));
  assert.ok(RUNTIME_USER_APPROVAL_BLOCKED_REASONS.includes("approval_not_runtime_authority"));

  const missing = validateRuntimeUserApprovalCheckpoint({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.some(error => error.includes("missing required field")));

  const invalid = validateRuntimeUserApprovalCheckpoint(makeRuntimeUserApprovalCheckpoint({
    scope: "not_real",
    userApprovalState: "not_real",
    decision: "not_real",
    blockedReasons: ["not_real"]
  }));

  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes("unknown scope")));
  assert.ok(invalid.errors.some(error => error.includes("unknown userApprovalState")));
  assert.ok(invalid.errors.some(error => error.includes("unknown decision")));
  assert.ok(invalid.errors.some(error => error.includes("unknown blockedReason")));
}

function testRuntimeUserApprovalDoesNotGrantRuntime() {
  const classified = classifyRuntimeUserApprovalCheckpoint(makeRuntimeUserApprovalCheckpoint());

  assert.strictEqual(classified.status, "blocked");
  assert.strictEqual(classified.runtimeExecutionAllowed, false);
  assert.strictEqual(classified.permissionGrant, false);
  assert.strictEqual(classified.modelOutputApproval, false);
  assert.strictEqual(classified.userApprovalGranted, false);
  assert.strictEqual(classified.canExecuteRuntime, false);
  assert.strictEqual(classified.canExecuteTools, false);
  assert.strictEqual(classified.canWriteFiles, false);
  assert.strictEqual(classified.canRunProcess, false);
  assert.strictEqual(classified.canRunGit, false);
  assert.strictEqual(classified.canCommit, false);
  assert.strictEqual(classified.canGrantPermissions, false);
  assert.strictEqual(classified.canUseModelOutputAsApproval, false);
  assert.strictEqual(classified.canReplay, false);
  assert.ok(classified.checkpoint.blockedReasons.includes("approval_not_runtime_authority"));
  assert.strictEqual(assertRuntimeUserApprovalNotGranted(classified.checkpoint), true);

  const created = createRuntimeUserApprovalCheckpoint(makeRuntimeUserApprovalCheckpoint({
    blockedReasons: ["approval_not_runtime_authority"]
  }));

  assert.strictEqual(created.runtimeExecutionAllowed, false);
  assert.strictEqual(created.permissionGrant, false);
  assert.strictEqual(created.modelOutputApproval, false);
}

function testRuntimeUserApprovalBlocksImplicitAndModelApproval() {
  const implicit = validateRuntimeUserApprovalCheckpoint(makeRuntimeUserApprovalCheckpoint({
    implicitApproval: true
  }));

  assert.strictEqual(implicit.valid, false);
  assert.ok(implicit.errors.some(error => error.includes("implicit approval")));

  const model = validateRuntimeUserApprovalCheckpoint(makeRuntimeUserApprovalCheckpoint({
    modelOutputApproval: true,
    modelOutputUsedAsApproval: true
  }));

  assert.strictEqual(model.valid, false);
  assert.ok(model.errors.some(error => error.includes("modelOutputApproval must be false")));
  assert.ok(model.errors.some(error => error.includes("model output")));

  const classified = classifyRuntimeUserApprovalCheckpoint(makeRuntimeUserApprovalCheckpoint({
    userApprovalState: "missing",
    modelOutputUsedAsApproval: true,
    permissionGrant: true,
    runtimeExecutionAllowed: true,
    replayAllowed: true
  }));

  assert.ok(classified.checkpoint.blockedReasons.includes("implicit_approval_blocked"));
  assert.ok(classified.checkpoint.blockedReasons.includes("model_output_approval_blocked"));
  assert.ok(classified.checkpoint.blockedReasons.includes("permission_grant_blocked"));
  assert.ok(classified.checkpoint.blockedReasons.includes("runtime_execution_blocked"));
  assert.ok(classified.checkpoint.blockedReasons.includes("replay_authority_blocked"));
}

function testRuntimeUserApprovalRequiresGateSpine() {
  const missingGate = validateRuntimeUserApprovalCheckpoint(makeRuntimeUserApprovalCheckpoint({
    requiredGates: RUNTIME_USER_APPROVAL_REQUIRED_GATES_TEST.filter(gate => gate !== "RuntimeDryRunContract")
  }));

  assert.strictEqual(missingGate.valid, false);
  assert.ok(missingGate.errors.some(error => error.includes("missing required gate: RuntimeDryRunContract")));
}

function testRuntimeUserApprovalNoRuntimeExports() {
  const moduleExports = require("../core/runtimeUserApprovalCheckpoint");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix",
    "executeRuntime",
    "runRuntime",
    "replay",
    "autoReplay"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const summary = summarizeRuntimeUserApprovalCheckpoint(makeRuntimeUserApprovalCheckpoint());

  assert.strictEqual(summary.runtimeExecutionAllowed, false);
  assert.strictEqual(summary.permissionGrant, false);
  assert.strictEqual(summary.modelOutputApproval, false);
  assert.strictEqual(summary.userApprovalGranted, false);
  assert.strictEqual(summary.canExecuteRuntime, false);
  assert.strictEqual(summary.canExecuteTools, false);
  assert.strictEqual(summary.canWriteFiles, false);
  assert.strictEqual(summary.canRunProcess, false);
  assert.strictEqual(summary.canRunGit, false);
  assert.strictEqual(summary.canCommit, false);
  assert.strictEqual(summary.canGrantPermissions, false);
  assert.strictEqual(summary.canUseModelOutputAsApproval, false);
  assert.strictEqual(summary.canReplay, false);
}
;
// === RuntimeIntegrationPlanExecutorImplementation v1 tests START ===
(() => {
  "use strict";

  const runtimeIntegrationPlanExecutor = require("../core/runtimeIntegrationPlanExecutor");
  const {
    RUNTIME_INTEGRATION_PLAN_STATUSES,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS,
    createRuntimeIntegrationPlan,
    validateRuntimeIntegrationPlan,
    classifyRuntimeIntegrationPlan,
    assertRuntimeIntegrationPlanNotExecutable,
    summarizeRuntimeIntegrationPlan,
  } = runtimeIntegrationPlanExecutor;

  function assertRuntimeIntegrationPlanExecutor(condition, message) {
    if (!condition) {
      throw new Error(`RuntimeIntegrationPlanExecutor test failed: ${message}`);
    }
  }

  function createValidRuntimeIntegrationPlanForTest() {
    return createRuntimeIntegrationPlan({
      planId: "runtime_integration_plan_executor_test",
      dryRunContract: { version: 1, executionAllowed: false },
      userApprovalCheckpoint: { version: 1, runtimeApprovalBlocked: true },
    });
  }

  function mutableRuntimeIntegrationPlanClone(plan) {
    return JSON.parse(JSON.stringify(plan));
  }

  function testRuntimeIntegrationPlanValidation() {
    const plan = createValidRuntimeIntegrationPlanForTest();
    const validation = validateRuntimeIntegrationPlan(plan);
    const summary = summarizeRuntimeIntegrationPlan(plan);

    assertRuntimeIntegrationPlanExecutor(validation.valid === true, "valid plan should pass validation");
    assertRuntimeIntegrationPlanExecutor(plan.metadataOnly === true, "plan must remain metadata-only");
    assertRuntimeIntegrationPlanExecutor(summary.status === RUNTIME_INTEGRATION_PLAN_STATUSES.VALID_METADATA_ONLY, "summary should classify valid metadata-only plan");
    assertRuntimeIntegrationPlanExecutor(summary.executable === false, "summary must remain non-executable");
  }

  function testRuntimeIntegrationPlanRequiresDryRunAndApprovalContracts() {
    const missingDryRunContract = createRuntimeIntegrationPlan({
      userApprovalCheckpoint: { version: 1, runtimeApprovalBlocked: true },
    });
    const missingUserApprovalCheckpoint = createRuntimeIntegrationPlan({
      dryRunContract: { version: 1, executionAllowed: false },
    });

    const dryRunValidation = validateRuntimeIntegrationPlan(missingDryRunContract);
    const approvalValidation = validateRuntimeIntegrationPlan(missingUserApprovalCheckpoint);

    assertRuntimeIntegrationPlanExecutor(dryRunValidation.valid === false, "missing dry-run contract must fail validation");
    assertRuntimeIntegrationPlanExecutor(dryRunValidation.errors.includes(RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.MISSING_DRY_RUN_CONTRACT), "missing dry-run contract reason required");
    assertRuntimeIntegrationPlanExecutor(approvalValidation.valid === false, "missing approval checkpoint must fail validation");
    assertRuntimeIntegrationPlanExecutor(approvalValidation.errors.includes(RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.MISSING_USER_APPROVAL_CHECKPOINT), "missing approval checkpoint reason required");
  }

  function testRuntimeIntegrationPlanBlocksExecution() {
    const plan = createValidRuntimeIntegrationPlanForTest();
    const classification = classifyRuntimeIntegrationPlan(plan);

    assertRuntimeIntegrationPlanExecutor(classification.valid === true, "valid metadata-only plan should classify as valid");
    assertRuntimeIntegrationPlanExecutor(classification.executable === false, "classification must be non-executable");
    assertRuntimeIntegrationPlanExecutor(classification.blockedReasons.includes(RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.RUNTIME_EXECUTION_BLOCKED), "runtime execution blocked reason required");
    assertRuntimeIntegrationPlanExecutor(classification.blockedReasons.includes(RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.TOOL_EXECUTION_BLOCKED), "tool execution blocked reason required");
    assertRuntimeIntegrationPlanExecutor(assertRuntimeIntegrationPlanNotExecutable(plan) === true, "non-executable assertion should pass for valid plan");

    const invalidAuthorityPlan = mutableRuntimeIntegrationPlanClone(plan);
    invalidAuthorityPlan.authority.runtimeExecutionAllowed = true;
    assertRuntimeIntegrationPlanExecutor(validateRuntimeIntegrationPlan(invalidAuthorityPlan).valid === false, "runtime authority true must fail validation");
  }

  function testRuntimeIntegrationPlanBlocksAgentHandoffRuntimeWiring() {
    const plan = mutableRuntimeIntegrationPlanClone(createValidRuntimeIntegrationPlanForTest());
    plan.authority.agentHandoffRuntimeWiringAllowed = true;

    const validation = validateRuntimeIntegrationPlan(plan);
    assertRuntimeIntegrationPlanExecutor(validation.valid === false, "AgentHandoff runtime wiring authority must stay false");
    assertRuntimeIntegrationPlanExecutor(
      classifyRuntimeIntegrationPlan(plan).blockedReasons.includes(RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.AGENT_HANDOFF_RUNTIME_WIRING_BLOCKED),
      "AgentHandoff runtime wiring blocked reason required"
    );
  }

  function testRuntimeIntegrationPlanNoRuntimeExports() {
    const exportedNames = Object.keys(runtimeIntegrationPlanExecutor);
    const forbiddenExportFragments = [
      "execute" + "Runtime",
      "execute" + "Tool",
      "write" + "File",
      "run" + "Process",
      "run" + "Git",
      "commit" + "Changes",
      "grant" + "Permission",
      "wire" + "AgentHandoffRunner",
      "use" + "ModelOutputAsAuthority",
      "replay" + "Runtime",
    ];

    for (const exportedName of exportedNames) {
      for (const forbiddenFragment of forbiddenExportFragments) {
        assertRuntimeIntegrationPlanExecutor(
          !exportedName.toLowerCase().includes(forbiddenFragment.toLowerCase()),
          `forbidden runtime export fragment present: ${exportedName}`
        );
      }
    }
  }

  testRuntimeIntegrationPlanValidation();
  testRuntimeIntegrationPlanRequiresDryRunAndApprovalContracts();
  testRuntimeIntegrationPlanBlocksExecution();
  testRuntimeIntegrationPlanBlocksAgentHandoffRuntimeWiring();
  testRuntimeIntegrationPlanNoRuntimeExports();
  testRuntimeIntegrationDryRunPathValidation();
  testRuntimeIntegrationDryRunPathRequiresPlanExecutorAndDryRunContract();
  testRuntimeIntegrationDryRunPathBlocksExecution();
  testRuntimeIntegrationDryRunPathBlocksAgentHandoffRuntimeWiring();
  testRuntimeIntegrationDryRunPathNoRuntimeExports();
  testRuntimeDryRunExecutionPathValidation();
  testRuntimeDryRunExecutionPathRequiresDryRunPathAndContract();
  testRuntimeDryRunExecutionPathBlocksActualExecution();
  testRuntimeDryRunExecutionPathBlocksAgentHandoffRuntimeWiring();
  testRuntimeDryRunExecutionPathNoRuntimeExports();
})();
// === RuntimeIntegrationPlanExecutorImplementation v1 tests END ===

function testRuntimeIntegrationDryRunPathValidation() {
  assert.strictEqual(RUNTIME_INTEGRATION_DRY_RUN_PATH_STATUSES.VALID_METADATA_ONLY, "valid_metadata_only");
  assert.strictEqual(
    RUNTIME_INTEGRATION_DRY_RUN_PATH_BLOCKED_REASONS.ACTUAL_DRY_RUN_EXECUTION_BLOCKED,
    "actual_dry_run_execution_blocked"
  );

  const record = createRuntimeIntegrationDryRunPath({
    pathId: "dry_run_path_validation_test",
    source: "test"
  });

  const validation = validateRuntimeIntegrationDryRunPath(record);
  assert.strictEqual(validation.valid, true, validation.errors.join("; "));

  const missing = validateRuntimeIntegrationDryRunPath({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.includes("version must be 1"));
}

function testRuntimeIntegrationDryRunPathRequiresPlanExecutorAndDryRunContract() {
  const missingPlanExecutor = createRuntimeIntegrationDryRunPath({
    requiredContracts: [
      "RuntimeDryRunContract",
      "RuntimeUserApprovalCheckpoint",
      "RuntimeIntegrationBoundary",
      "PermissionGate",
      "ExecutionAdapterRegistry",
      "SideEffectSandbox",
      "ToolExecutionAuditLog",
      "EvidenceGate",
      "ReplayStore",
      "CommitGate"
    ]
  });

  const missingPlanExecutorValidation = validateRuntimeIntegrationDryRunPath(missingPlanExecutor);
  assert.strictEqual(missingPlanExecutorValidation.valid, false);
  assert.ok(missingPlanExecutorValidation.errors.includes("missing required contract: RuntimeIntegrationPlanExecutor"));

  const missingDryRun = createRuntimeIntegrationDryRunPath({
    requiredContracts: [
      "RuntimeIntegrationPlanExecutor",
      "RuntimeUserApprovalCheckpoint",
      "RuntimeIntegrationBoundary",
      "PermissionGate",
      "ExecutionAdapterRegistry",
      "SideEffectSandbox",
      "ToolExecutionAuditLog",
      "EvidenceGate",
      "ReplayStore",
      "CommitGate"
    ]
  });

  const missingDryRunValidation = validateRuntimeIntegrationDryRunPath(missingDryRun);
  assert.strictEqual(missingDryRunValidation.valid, false);
  assert.ok(missingDryRunValidation.errors.includes("missing required contract: RuntimeDryRunContract"));
}

function testRuntimeIntegrationDryRunPathBlocksExecution() {
  const record = createRuntimeIntegrationDryRunPath({
    pathId: "dry_run_path_blocks_execution_test",
    source: "test"
  });

  const classification = classifyRuntimeIntegrationDryRunPath(record);
  assert.strictEqual(classification.valid, true);
  assert.strictEqual(classification.metadataOnly, true);
  assert.strictEqual(classification.executable, false);
  assert.strictEqual(classification.actualDryRunExecutionAllowed, false);
  assert.strictEqual(classification.runtimeExecutionAllowed, false);
  assert.strictEqual(classification.toolExecutionAllowed, false);
  assert.strictEqual(classification.runtimeFileWritesAllowed, false);
  assert.strictEqual(classification.processExecutionAllowed, false);
  assert.strictEqual(classification.gitExecutionAllowedByNodex, false);
  assert.strictEqual(classification.permissionGrantsAllowed, false);
  assert.strictEqual(classification.modelOutputAuthorityAllowed, false);
  assert.strictEqual(classification.replayAuthorityAllowed, false);
  assert.strictEqual(assertRuntimeIntegrationDryRunPathNotExecutable(record), true);

  for (const value of Object.values(record.authority)) {
    assert.strictEqual(value, false);
  }
}

function testRuntimeIntegrationDryRunPathBlocksAgentHandoffRuntimeWiring() {
  const record = createRuntimeIntegrationDryRunPath({
    pathId: "dry_run_path_blocks_agent_handoff_test",
    source: "test"
  });

  assert.strictEqual(record.authority.agentHandoffRuntimeWiringAllowed, false);

  const invalid = {
    ...record,
    authority: {
      ...record.authority,
      agentHandoffRuntimeWiringAllowed: true
    }
  };

  const validation = validateRuntimeIntegrationDryRunPath(invalid);
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors.includes("authority.agentHandoffRuntimeWiringAllowed must be false"));
}

function testRuntimeIntegrationDryRunPathNoRuntimeExports() {
  const moduleExports = require("../core/runtimeIntegrationPlanExecutorDryRunPath");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix",
    "executeRuntime",
    "runRuntime",
    "wireAgentHandoffRunner",
    "executeDryRun",
    "runDryRun",
    "replay",
    "autoReplay"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const summary = summarizeRuntimeIntegrationDryRunPath(createRuntimeIntegrationDryRunPath());
  assert.strictEqual(summary.valid, true);
  assert.strictEqual(summary.metadataOnly, true);
  assert.strictEqual(summary.executable, false);
  assert.strictEqual(summary.actualDryRunExecutionAllowed, false);
  assert.strictEqual(summary.runtimeExecutionAllowed, false);
  assert.strictEqual(summary.toolExecutionAllowed, false);
  assert.strictEqual(summary.agentHandoffRuntimeWiringAllowed, false);
}

function testRuntimeDryRunExecutionPathValidation() {
  assert.strictEqual(RUNTIME_DRY_RUN_EXECUTION_PATH_STATUSES.VALID_METADATA_ONLY, "valid_metadata_only");
  assert.strictEqual(
    RUNTIME_DRY_RUN_EXECUTION_PATH_BLOCKED_REASONS.ACTUAL_DRY_RUN_EXECUTION_BLOCKED,
    "actual_dry_run_execution_blocked"
  );

  const record = createRuntimeDryRunExecutionPath({
    pathId: "runtime_dry_run_execution_path_validation_test",
    source: "test"
  });

  const validation = validateRuntimeDryRunExecutionPath(record);
  assert.strictEqual(validation.valid, true, validation.errors.join("; "));

  const missing = validateRuntimeDryRunExecutionPath({});
  assert.strictEqual(missing.valid, false);
  assert.ok(missing.errors.includes("version must be 1"));
}

function testRuntimeDryRunExecutionPathRequiresDryRunPathAndContract() {
  const missingDryRunPath = createRuntimeDryRunExecutionPath({
    requiredContracts: [
      "RuntimeDryRunContract",
      "RuntimeUserApprovalCheckpoint",
      "RuntimeIntegrationBoundary",
      "PermissionGate",
      "ExecutionAdapterRegistry",
      "SideEffectSandbox",
      "ToolExecutionAuditLog",
      "EvidenceGate",
      "ReplayStore",
      "CommitGate"
    ]
  });

  const missingDryRunPathValidation = validateRuntimeDryRunExecutionPath(missingDryRunPath);
  assert.strictEqual(missingDryRunPathValidation.valid, false);
  assert.ok(missingDryRunPathValidation.errors.includes("missing required contract: RuntimeIntegrationPlanExecutorDryRunPath"));

  const missingContract = createRuntimeDryRunExecutionPath({
    requiredContracts: [
      "RuntimeIntegrationPlanExecutorDryRunPath",
      "RuntimeUserApprovalCheckpoint",
      "RuntimeIntegrationBoundary",
      "PermissionGate",
      "ExecutionAdapterRegistry",
      "SideEffectSandbox",
      "ToolExecutionAuditLog",
      "EvidenceGate",
      "ReplayStore",
      "CommitGate"
    ]
  });

  const missingContractValidation = validateRuntimeDryRunExecutionPath(missingContract);
  assert.strictEqual(missingContractValidation.valid, false);
  assert.ok(missingContractValidation.errors.includes("missing required contract: RuntimeDryRunContract"));
}

function testRuntimeDryRunExecutionPathBlocksActualExecution() {
  const record = createRuntimeDryRunExecutionPath({
    pathId: "runtime_dry_run_execution_path_blocks_execution_test",
    source: "test"
  });

  const classification = classifyRuntimeDryRunExecutionPath(record);
  assert.strictEqual(classification.valid, true);
  assert.strictEqual(classification.metadataOnly, true);
  assert.strictEqual(classification.executable, false);
  assert.strictEqual(classification.actualDryRunExecutionAllowed, false);
  assert.strictEqual(classification.runtimeIntegrationAllowed, false);
  assert.strictEqual(classification.runtimeExecutionAllowed, false);
  assert.strictEqual(classification.toolExecutionAllowed, false);
  assert.strictEqual(classification.runtimeFileWritesAllowed, false);
  assert.strictEqual(classification.processExecutionAllowed, false);
  assert.strictEqual(classification.gitExecutionAllowedByNodex, false);
  assert.strictEqual(classification.permissionGrantsAllowed, false);
  assert.strictEqual(classification.modelOutputAuthorityAllowed, false);
  assert.strictEqual(classification.replayAuthorityAllowed, false);
  assert.strictEqual(assertRuntimeDryRunExecutionPathNotExecutable(record), true);

  for (const value of Object.values(record.authority)) {
    assert.strictEqual(value, false);
  }
}

function testRuntimeDryRunExecutionPathBlocksAgentHandoffRuntimeWiring() {
  const record = createRuntimeDryRunExecutionPath({
    pathId: "runtime_dry_run_execution_path_blocks_agent_handoff_test",
    source: "test"
  });

  assert.strictEqual(record.authority.agentHandoffRuntimeWiringAllowed, false);

  const invalid = {
    ...record,
    authority: {
      ...record.authority,
      agentHandoffRuntimeWiringAllowed: true
    }
  };

  const validation = validateRuntimeDryRunExecutionPath(invalid);
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors.includes("authority.agentHandoffRuntimeWiringAllowed must be false"));
}

function testRuntimeDryRunExecutionPathNoRuntimeExports() {
  const moduleExports = require("../core/runtimeDryRunExecutionPath");

  for (const forbidden of [
    "executeTool",
    "runTool",
    "writeFile",
    "runGit",
    "gitCommit",
    "commit",
    "grantPermission",
    "executeCommand",
    "autoFix",
    "executeRuntime",
    "runRuntime",
    "wireAgentHandoffRunner",
    "executeDryRun",
    "runDryRun",
    "replay",
    "autoReplay"
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(moduleExports, forbidden), false);
  }

  const summary = summarizeRuntimeDryRunExecutionPath(createRuntimeDryRunExecutionPath());
  assert.strictEqual(summary.valid, true);
  assert.strictEqual(summary.metadataOnly, true);
  assert.strictEqual(summary.executable, false);
  assert.strictEqual(summary.actualDryRunExecutionAllowed, false);
  assert.strictEqual(summary.runtimeExecutionAllowed, false);
  assert.strictEqual(summary.toolExecutionAllowed, false);
  assert.strictEqual(summary.agentHandoffRuntimeWiringAllowed, false);
}
