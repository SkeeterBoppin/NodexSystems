const { createTaskGraph, getCurrentStep } = require("./taskGraph");
const {
  createAgentHandoffPacket,
  validateAgentHandoffPacket
} = require("./agentHandoffPacket");

const TOP_LEVEL_FIELDS = new Set(["taskGraph", "title", "instructions", "stepId"]);
const STEP_ID_PATTERN = /^[a-z0-9_]+$/;
const STEP_TYPE_TO_MODE = {
  inspect: "inspect_only",
  edit: "apply",
  validate: "validate_only"
};

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoUnknownFields(value, allowedFields, label) {
  Object.keys(value).forEach(key => {
    assertCondition(allowedFields.has(key), `${label} contains an unknown field: ${key}`);
  });
}

function normalizeTrimmedString(value, label) {
  assertCondition(typeof value === "string", `${label} must be a string`);

  const normalized = value.trim();
  assertCondition(normalized.length > 0, `${label} must be a non-empty string`);

  return normalized;
}

function normalizeInstructions(value) {
  assertCondition(Array.isArray(value), "instructions must be an array");
  assertCondition(value.length > 0, "instructions must be a non-empty array");

  return value.map((entry, index) => {
    return normalizeTrimmedString(entry, `instructions[${index}]`);
  });
}

function normalizeStepId(value) {
  const normalized = normalizeTrimmedString(value, "stepId");
  assertCondition(STEP_ID_PATTERN.test(normalized), "stepId must match /^[a-z0-9_]+$/");
  return normalized;
}

function createAgentHandoffBridgePacket(input) {
  assertCondition(isPlainObject(input), "agent handoff bridge input must be a plain object");
  assertNoUnknownFields(input, TOP_LEVEL_FIELDS, "bridge input");
  assertCondition(input.taskGraph !== undefined, "taskGraph is required");

  const graph = createTaskGraph(input.taskGraph);
  const currentStep = getCurrentStep(graph);

  assertCondition(currentStep !== null, "no current executable step is available");

  const title = normalizeTrimmedString(input.title, "title");
  const instructions = normalizeInstructions(input.instructions);

  if (input.stepId !== undefined) {
    const stepId = normalizeStepId(input.stepId);
    assertCondition(stepId === currentStep.id, `stepId must match current executable step ${currentStep.id}`);
  }

  const mode = STEP_TYPE_TO_MODE[currentStep.type];
  assertCondition(typeof mode === "string", `current step type is not supported: ${currentStep.type}`);

  const expectedDirtyStateFiles = mode === "apply" ? currentStep.files.slice() : [];

  return createAgentHandoffPacket({
    version: 1,
    packetId: `${graph.graphId}_${currentStep.id}_handoff_packet`,
    mode,
    type: currentStep.type,
    title,
    instructions,
    allowedFiles: graph.allowedFiles.slice(),
    forbiddenFiles: graph.forbiddenFiles.slice(),
    files: currentStep.files.slice(),
    validation: {
      required: currentStep.validation.required,
      gates: currentStep.validation.gates.slice()
    },
    expectedDirtyState: {
      files: expectedDirtyStateFiles
    },
    taskGraph: {
      graphId: graph.graphId,
      stepId: currentStep.id
    }
  });
}

function validateAgentHandoffBridgePacket(input) {
  const packet = createAgentHandoffBridgePacket(input);
  validateAgentHandoffPacket(packet);
  return true;
}

module.exports = {
  createAgentHandoffBridgePacket,
  validateAgentHandoffBridgePacket
};
