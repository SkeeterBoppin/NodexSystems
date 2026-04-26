"use strict";

const HANDOFF_RUNNER_ACTIONS = Object.freeze([
  "inspect",
  "classify",
  "plan",
  "validate",
  "commit_gate",
  "evidence_gate",
  "defer_runtime_execution"
]);

const HANDOFF_RUNNER_STATUSES = Object.freeze([
  "routed",
  "blocked",
  "deferred"
]);

const HANDOFF_RUNNER_BLOCKED_REASONS = Object.freeze([
  "invalid_handoff_packet",
  "tool_execution_requested",
  "file_write_requested",
  "git_execution_requested",
  "commit_requested",
  "permission_grant_requested",
  "model_output_used_as_proof",
  "runtime_integration_requested",
  "missing_required_gate"
]);

const HANDOFF_RUNNER_REQUIRED_GATES = Object.freeze([
  "AgentHandoffPacket",
  "AgentHandoffBridge",
  "TaskGraph",
  "EvidenceGate",
  "ValidityGraph",
  "ToolCapabilityRegistry",
  "ReplayStore",
  "CommitGate"
]);

const REQUIRED_DECISION_FIELDS = Object.freeze([
  "decisionId",
  "handoffId",
  "action",
  "status",
  "requiredGates",
  "blockedCapabilities",
  "blockedReasons",
  "canExecuteTools",
  "canWriteFiles",
  "canRunGit",
  "canCommit",
  "canGrantPermissions",
  "canUseModelOutputAsProof"
]);

const ACTION_SET = new Set(HANDOFF_RUNNER_ACTIONS);
const STATUS_SET = new Set(HANDOFF_RUNNER_STATUSES);
const BLOCKED_REASON_SET = new Set(HANDOFF_RUNNER_BLOCKED_REASONS);
const REQUIRED_GATE_SET = new Set(HANDOFF_RUNNER_REQUIRED_GATES);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter(isNonEmptyString)));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDecision(decision = {}) {
  return {
    ...decision,
    requiredGates: uniqueStrings(decision.requiredGates),
    blockedCapabilities: uniqueStrings(decision.blockedCapabilities),
    blockedReasons: uniqueStrings(decision.blockedReasons)
  };
}

function validateHandoffRunnerDecision(decision = {}) {
  const errors = [];

  if (!isPlainObject(decision)) {
    return {
      valid: false,
      errors: ["decision must be an object"]
    };
  }

  for (const field of REQUIRED_DECISION_FIELDS) {
    if (!(field in decision)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of ["decisionId", "handoffId", "action", "status"]) {
    if (field in decision && !isNonEmptyString(decision[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("action" in decision && !ACTION_SET.has(decision.action)) {
    errors.push("unknown handoff runner action: " + decision.action);
  }

  if ("status" in decision && !STATUS_SET.has(decision.status)) {
    errors.push("unknown handoff runner status: " + decision.status);
  }

  for (const field of ["requiredGates", "blockedCapabilities", "blockedReasons"]) {
    if (!Array.isArray(decision[field])) {
      errors.push(field + " must be an array");
    } else if (!decision[field].every(isNonEmptyString)) {
      errors.push(field + " must contain only non-empty strings");
    }
  }

  if (Array.isArray(decision.requiredGates)) {
    for (const gate of HANDOFF_RUNNER_REQUIRED_GATES) {
      if (!decision.requiredGates.includes(gate)) {
        errors.push("missing required gate: " + gate);
      }
    }
  }

  if (Array.isArray(decision.blockedReasons)) {
    for (const reason of decision.blockedReasons) {
      if (!BLOCKED_REASON_SET.has(reason)) {
        errors.push("unknown blockedReason: " + reason);
      }
    }
  }

  for (const field of [
    "canExecuteTools",
    "canWriteFiles",
    "canRunGit",
    "canCommit",
    "canGrantPermissions",
    "canUseModelOutputAsProof"
  ]) {
    if (field in decision && typeof decision[field] !== "boolean") {
      errors.push(field + " must be a boolean");
    }

    if (decision[field] !== false) {
      errors.push(field + " must be false in AgentHandoffRunner v1");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createHandoffRunnerDecision(decision = {}) {
  const normalized = normalizeDecision(cloneJson(decision));
  const validation = validateHandoffRunnerDecision(normalized);

  if (!validation.valid) {
    throw new Error("Invalid handoff runner decision: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    requiredGates: Object.freeze([...normalized.requiredGates]),
    blockedCapabilities: Object.freeze([...normalized.blockedCapabilities]),
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function packetValue(packet, keys = []) {
  if (!isPlainObject(packet)) return null;

  for (const key of keys) {
    if (key in packet && packet[key] !== undefined && packet[key] !== null) {
      return packet[key];
    }
  }

  return null;
}

function packetIncludesCapability(packet, patterns = []) {
  const haystack = JSON.stringify(packet || {}).toLowerCase();
  return patterns.some(pattern => haystack.includes(pattern));
}

function classifyHandoffPacketForRunner(packet = {}, options = {}) {
  const validPacket = isPlainObject(packet);
  const handoffId =
    packetValue(packet, ["handoffId", "packetId", "taskId", "id"]) ||
    packetValue(options, ["handoffId", "decisionId"]) ||
    "unknown_handoff";

  const requestedAction = packetValue(packet, ["action", "requestedAction", "intent"]) || "classify";
  const normalizedAction = ACTION_SET.has(requestedAction) ? requestedAction : "classify";

  const blockedReasons = [];
  const blockedCapabilities = [];

  if (!validPacket) {
    blockedReasons.push("invalid_handoff_packet");
  }

  if (packetIncludesCapability(packet, ["executetool", "runtool", "tool execution", "tool_execution", "commandtool", "writefiletool", "pythontool"])) {
    blockedReasons.push("tool_execution_requested");
    blockedCapabilities.push("tool_execution");
  }

  if (packetIncludesCapability(packet, ["writefile", "file write", "file_write", "write files", "filesystem_write"])) {
    blockedReasons.push("file_write_requested");
    blockedCapabilities.push("file_write");
  }

  if (packetIncludesCapability(packet, ["rungit", "git execution", "git_execution", "git add", "git commit"])) {
    blockedReasons.push("git_execution_requested");
    blockedCapabilities.push("git_execution");
  }

  if (packetIncludesCapability(packet, ["commit_requested", "auto commit", "autocommit", "commit changes"])) {
    blockedReasons.push("commit_requested");
    blockedCapabilities.push("commit");
  }

  if (packetIncludesCapability(packet, ["permission grant", "permission_grant", "grant permission", "grantpermissions"])) {
    blockedReasons.push("permission_grant_requested");
    blockedCapabilities.push("permission_grant");
  }

  if (packetIncludesCapability(packet, ["model output as proof", "model_output_used_as_proof", "llm output as proof"])) {
    blockedReasons.push("model_output_used_as_proof");
    blockedCapabilities.push("model_output_authority");
  }

  if (packetIncludesCapability(packet, ["runtime integration", "runtime_integration", "side effect runner", "side-effect-capable runner"])) {
    blockedReasons.push("runtime_integration_requested");
    blockedCapabilities.push("runtime_integration");
  }

  const uniqueBlockedReasons = uniqueStrings(blockedReasons);
  const uniqueBlockedCapabilities = uniqueStrings(blockedCapabilities);
  const blocked = uniqueBlockedReasons.length > 0;

  return createHandoffRunnerDecision({
    decisionId: packetValue(options, ["decisionId"]) || "handoff_runner_decision",
    handoffId: String(handoffId),
    action: blocked ? "defer_runtime_execution" : normalizedAction,
    status: blocked ? "blocked" : "routed",
    requiredGates: HANDOFF_RUNNER_REQUIRED_GATES,
    blockedCapabilities: uniqueBlockedCapabilities,
    blockedReasons: uniqueBlockedReasons,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsProof: false
  });
}

function createAgentHandoffRunner(options = {}) {
  const requiredGates = uniqueStrings(options.requiredGates || HANDOFF_RUNNER_REQUIRED_GATES);

  for (const gate of HANDOFF_RUNNER_REQUIRED_GATES) {
    if (!requiredGates.includes(gate)) {
      throw new Error("AgentHandoffRunner missing required gate: " + gate);
    }
  }

  return Object.freeze({
    version: 1,
    metadataOnly: true,
    runtimeIntegrationAllowed: false,
    requiredGates: Object.freeze([...requiredGates]),
    classify(packet = {}, classifyOptions = {}) {
      return classifyHandoffPacketForRunner(packet, classifyOptions);
    },
    validateDecision(decision = {}) {
      return validateHandoffRunnerDecision(decision);
    }
  });
}

function assertHandoffRunnerDecisionSafe(decision = {}) {
  const created = createHandoffRunnerDecision(decision);

  if (
    created.canExecuteTools ||
    created.canWriteFiles ||
    created.canRunGit ||
    created.canCommit ||
    created.canGrantPermissions ||
    created.canUseModelOutputAsProof
  ) {
    throw new Error("Unsafe handoff runner decision: " + created.decisionId);
  }

  return true;
}

function summarizeHandoffRunnerDecision(decision = {}) {
  const validation = validateHandoffRunnerDecision(decision);

  if (!validation.valid) {
    return Object.freeze({
      valid: false,
      status: "blocked",
      errors: Object.freeze([...validation.errors]),
      safe: false,
      canExecuteTools: false,
      canWriteFiles: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canUseModelOutputAsProof: false
    });
  }

  const created = createHandoffRunnerDecision(decision);

  return Object.freeze({
    valid: true,
    decisionId: created.decisionId,
    handoffId: created.handoffId,
    action: created.action,
    status: created.status,
    requiredGateCount: created.requiredGates.length,
    blockedCapabilityCount: created.blockedCapabilities.length,
    blockedReasonCount: created.blockedReasons.length,
    safe: true,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsProof: false
  });
}

module.exports = {
  HANDOFF_RUNNER_ACTIONS,
  HANDOFF_RUNNER_STATUSES,
  HANDOFF_RUNNER_BLOCKED_REASONS,
  createHandoffRunnerDecision,
  validateHandoffRunnerDecision,
  classifyHandoffPacketForRunner,
  createAgentHandoffRunner,
  assertHandoffRunnerDecisionSafe,
  summarizeHandoffRunnerDecision
};
