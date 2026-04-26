const {
  createContextLedgerRecord,
  validateContextLedgerRecord
} = require("./contextLedger");

const {
  createAgentHandoffBridgePacket,
  validateAgentHandoffBridgePacket
} = require("./agentHandoffBridge");

const INPUT_FIELDS = new Set([
  "version",
  "repairId",
  "failure",
  "contextLedgerRecord",
  "taskGraph",
  "title",
  "instructions"
]);

const FAILURE_FIELDS = new Set([
  "kind",
  "subject",
  "summary",
  "result",
  "data"
]);

const ID_PATTERN = /^[a-z0-9_]+$/;

const FAILURE_MAP = {
  syntax: {
    classification: "syntax_repair",
    action: "inspect_and_patch"
  },
  test: {
    classification: "test_repair",
    action: "inspect_and_patch"
  },
  validation: {
    classification: "validation_repair",
    action: "tighten_contract"
  },
  dirty_state: {
    classification: "dirty_state_repair",
    action: "restore_unexpected_files"
  },
  boundary: {
    classification: "boundary_repair",
    action: "reduce_scope"
  },
  unknown: {
    classification: "unknown_repair",
    action: "inspect_first"
  }
};

const VALID_RESULTS = new Set(["fail", "blocked"]);

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

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)])
    );
  }

  return value;
}

function normalizeId(value, label) {
  assertCondition(typeof value === "string", `${label} must be a string`);

  const normalized = value.trim();
  assertCondition(normalized.length > 0, `${label} must be a non-empty string`);
  assertCondition(ID_PATTERN.test(normalized), `${label} must match /^[a-z0-9_]+$/`);

  return normalized;
}

function normalizeString(value, label) {
  assertCondition(typeof value === "string", `${label} must be a string`);

  const normalized = value.trim();
  assertCondition(normalized.length > 0, `${label} must be a non-empty string`);

  return normalized;
}

function normalizeInstructions(value) {
  assertCondition(Array.isArray(value), "instructions must be an array");
  assertCondition(value.length > 0, "instructions must be non-empty");

  return value.map((instruction, index) => {
    assertCondition(typeof instruction === "string", `instructions[${index}] must be a string`);

    const normalized = instruction.trim();
    assertCondition(normalized.length > 0, `instructions[${index}] must be non-empty`);

    return normalized;
  });
}

function normalizeFailure(value) {
  assertCondition(isPlainObject(value), "failure must be a plain object");
  assertNoUnknownFields(value, FAILURE_FIELDS, "failure");

  const kind = normalizeString(value.kind, "failure.kind");
  assertCondition(
    Object.prototype.hasOwnProperty.call(FAILURE_MAP, kind),
    "failure.kind must be one of syntax, test, validation, dirty_state, boundary, unknown"
  );

  const result = normalizeString(value.result, "failure.result");
  assertCondition(VALID_RESULTS.has(result), "failure.result must be fail or blocked");

  const failure = {
    kind,
    subject: normalizeString(value.subject, "failure.subject"),
    result,
    summary: normalizeString(value.summary, "failure.summary")
  };

  if (value.data !== undefined) {
    assertCondition(isPlainObject(value.data), "failure.data must be a plain object");
    failure.data = cloneValue(value.data);
  }

  return failure;
}

function normalizeContextLedgerRecord(value) {
  if (value === undefined) {
    return undefined;
  }

  const record = createContextLedgerRecord(value);
  validateContextLedgerRecord(value);

  return record;
}

function normalizeAgentHandoffPacket(taskGraph, title, instructions) {
  if (taskGraph === undefined) {
    return undefined;
  }

  const bridgeInput = {
    taskGraph,
    title,
    instructions
  };

  const packet = createAgentHandoffBridgePacket(bridgeInput);
  validateAgentHandoffBridgePacket(bridgeInput);

  return packet;
}

function createRepairRecommendation(input) {
  assertCondition(isPlainObject(input), "repair recommendation input must be a plain object");
  assertNoUnknownFields(input, INPUT_FIELDS, "repair recommendation input");

  assertCondition(input.version === 1, "repair recommendation version must be 1");

  const repairId = normalizeId(input.repairId, "repairId");
  const title = normalizeString(input.title, "title");
  const instructions = normalizeInstructions(input.instructions);
  const failure = normalizeFailure(input.failure);
  const mapping = FAILURE_MAP[failure.kind];

  const output = {
    version: 1,
    repairId,
    status: "recommended",
    failure: cloneValue(failure),
    classification: mapping.classification,
    action: mapping.action,
    title,
    instructions: cloneValue(instructions)
  };

  const contextLedgerRecord = normalizeContextLedgerRecord(input.contextLedgerRecord);
  if (contextLedgerRecord) {
    output.contextLedgerRecord = cloneValue(contextLedgerRecord);
  }

  const agentHandoffPacket = normalizeAgentHandoffPacket(input.taskGraph, title, instructions);
  if (agentHandoffPacket) {
    output.agentHandoffPacket = cloneValue(agentHandoffPacket);
  }

  return output;
}

function validateRepairRecommendation(input) {
  createRepairRecommendation(input);
  return true;
}

module.exports = {
  createRepairRecommendation,
  validateRepairRecommendation
};
