"use strict";

const RUNTIME_BOUNDARY_ACTIONS = Object.freeze([
  "inspect",
  "classify",
  "plan",
  "validate",
  "execute_tool",
  "write_file",
  "run_git",
  "commit",
  "grant_permission",
  "runtime_integration"
]);

const RUNTIME_BOUNDARY_STATUSES = Object.freeze([
  "allowed_metadata_only",
  "blocked",
  "deferred"
]);

const RUNTIME_BOUNDARY_SIDE_EFFECT_LEVELS = Object.freeze([
  "none",
  "metadata_only",
  "filesystem_read",
  "filesystem_write",
  "process_execution",
  "code_execution",
  "git_execution",
  "permission_grant",
  "unknown"
]);

const RUNTIME_BOUNDARY_BLOCKED_REASONS = Object.freeze([
  "tool_execution_blocked",
  "file_write_blocked",
  "git_execution_blocked",
  "commit_blocked",
  "permission_grant_blocked",
  "model_output_proof_blocked",
  "runtime_integration_blocked",
  "missing_required_gate",
  "runtime_not_approved"
]);

const RUNTIME_BOUNDARY_REQUIRED_GATES = Object.freeze([
  "AgentHandoffRunner",
  "ToolCapabilityRegistry",
  "PermissionGate",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
]);

const REQUIRED_RUNTIME_REQUEST_FIELDS = Object.freeze([
  "requestId",
  "source",
  "requestedAction",
  "targetCapability",
  "sideEffectLevel",
  "requiredGates",
  "permissionState",
  "evidenceState",
  "runtimeAllowed",
  "blockedReasons"
]);

const ACTION_SET = new Set(RUNTIME_BOUNDARY_ACTIONS);
const STATUS_SET = new Set(RUNTIME_BOUNDARY_STATUSES);
const SIDE_EFFECT_SET = new Set(RUNTIME_BOUNDARY_SIDE_EFFECT_LEVELS);
const BLOCKED_REASON_SET = new Set(RUNTIME_BOUNDARY_BLOCKED_REASONS);

const ACTION_BLOCK_REASON = Object.freeze({
  execute_tool: "tool_execution_blocked",
  write_file: "file_write_blocked",
  run_git: "git_execution_blocked",
  commit: "commit_blocked",
  grant_permission: "permission_grant_blocked",
  runtime_integration: "runtime_integration_blocked"
});

const SIDE_EFFECT_BLOCK_REASON = Object.freeze({
  filesystem_write: "file_write_blocked",
  process_execution: "tool_execution_blocked",
  code_execution: "tool_execution_blocked",
  git_execution: "git_execution_blocked",
  permission_grant: "permission_grant_blocked",
  unknown: "runtime_integration_blocked"
});

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

function normalizeRuntimeRequest(request = {}) {
  return {
    ...request,
    requiredGates: uniqueStrings(request.requiredGates),
    blockedReasons: uniqueStrings(request.blockedReasons)
  };
}

function validateRuntimeRequest(request = {}) {
  const errors = [];

  if (!isPlainObject(request)) {
    return {
      valid: false,
      errors: ["runtime request must be an object"]
    };
  }

  for (const field of REQUIRED_RUNTIME_REQUEST_FIELDS) {
    if (!(field in request)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of [
    "requestId",
    "source",
    "requestedAction",
    "targetCapability",
    "sideEffectLevel",
    "permissionState",
    "evidenceState"
  ]) {
    if (field in request && !isNonEmptyString(request[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("requestedAction" in request && !ACTION_SET.has(request.requestedAction)) {
    errors.push("unknown requestedAction: " + request.requestedAction);
  }

  if ("status" in request && !STATUS_SET.has(request.status)) {
    errors.push("unknown status: " + request.status);
  }

  if ("sideEffectLevel" in request && !SIDE_EFFECT_SET.has(request.sideEffectLevel)) {
    errors.push("unknown sideEffectLevel: " + request.sideEffectLevel);
  }

  if (!Array.isArray(request.requiredGates)) {
    errors.push("requiredGates must be an array");
  } else {
    for (const gate of request.requiredGates) {
      if (!isNonEmptyString(gate)) {
        errors.push("requiredGates must contain only non-empty strings");
      }
    }

    for (const gate of RUNTIME_BOUNDARY_REQUIRED_GATES) {
      if (!request.requiredGates.includes(gate)) {
        errors.push("missing required gate: " + gate);
      }
    }
  }

  if (!Array.isArray(request.blockedReasons)) {
    errors.push("blockedReasons must be an array");
  } else {
    for (const reason of request.blockedReasons) {
      if (!BLOCKED_REASON_SET.has(reason)) {
        errors.push("unknown blockedReason: " + reason);
      }
    }
  }

  if (typeof request.runtimeAllowed !== "boolean") {
    errors.push("runtimeAllowed must be a boolean");
  }

  if (request.runtimeAllowed !== false) {
    errors.push("runtimeAllowed must be false in RuntimeIntegrationBoundary v1");
  }

  if (request.modelOutputUsedAsProof === true) {
    errors.push("model output must not be accepted as proof");
  }

  if (request.permissionGrant === true) {
    errors.push("runtime request must not grant permissions");
  }

  if (request.executeNow === true || request.runNow === true || request.autoExecute === true) {
    errors.push("runtime request must not execute actions");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createRuntimeRequest(request = {}) {
  const normalized = normalizeRuntimeRequest(cloneJson(request));
  const validation = validateRuntimeRequest(normalized);

  if (!validation.valid) {
    throw new Error("Invalid runtime request: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    requiredGates: Object.freeze([...normalized.requiredGates]),
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function classifyRuntimeRequest(request = {}) {
  const base = isPlainObject(request) ? cloneJson(request) : {};
  const blockedReasons = uniqueStrings(base.blockedReasons || []);

  const action = ACTION_SET.has(base.requestedAction) ? base.requestedAction : "classify";
  const sideEffectLevel = SIDE_EFFECT_SET.has(base.sideEffectLevel) ? base.sideEffectLevel : "unknown";

  if (ACTION_BLOCK_REASON[action]) {
    blockedReasons.push(ACTION_BLOCK_REASON[action]);
  }

  if (SIDE_EFFECT_BLOCK_REASON[sideEffectLevel]) {
    blockedReasons.push(SIDE_EFFECT_BLOCK_REASON[sideEffectLevel]);
  }

  if (base.modelOutputUsedAsProof === true) {
    blockedReasons.push("model_output_proof_blocked");
  }

  if (base.permissionGrant === true) {
    blockedReasons.push("permission_grant_blocked");
  }

  if (base.runtimeAllowed === true || base.runtimeIntegration === true) {
    blockedReasons.push("runtime_integration_blocked");
  }

  blockedReasons.push("runtime_not_approved");

  const normalized = {
    requestId: isNonEmptyString(base.requestId) ? base.requestId : "runtime_request",
    source: isNonEmptyString(base.source) ? base.source : "unknown",
    requestedAction: action,
    targetCapability: isNonEmptyString(base.targetCapability) ? base.targetCapability : "unknown",
    sideEffectLevel,
    requiredGates: uniqueStrings(base.requiredGates || RUNTIME_BOUNDARY_REQUIRED_GATES),
    permissionState: isNonEmptyString(base.permissionState) ? base.permissionState : "not_requested",
    evidenceState: isNonEmptyString(base.evidenceState) ? base.evidenceState : "unverified",
    runtimeAllowed: false,
    blockedReasons: uniqueStrings(blockedReasons)
  };

  const valid = validateRuntimeRequest(normalized);

  if (!valid.valid) {
    return Object.freeze({
      valid: false,
      status: "blocked",
      errors: Object.freeze([...valid.errors]),
      request: Object.freeze(normalized),
      runtimeAllowed: false,
      canExecuteTools: false,
      canWriteFiles: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canUseModelOutputAsProof: false
    });
  }

  const created = createRuntimeRequest(normalized);
  const executableBlocked = created.blockedReasons.length > 0;

  return Object.freeze({
    valid: true,
    status: executableBlocked ? "blocked" : "allowed_metadata_only",
    request: created,
    runtimeAllowed: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsProof: false
  });
}

function assertRuntimeRequestBlocked(request = {}) {
  const classified = classifyRuntimeRequest(request);

  if (
    classified.runtimeAllowed ||
    classified.canExecuteTools ||
    classified.canWriteFiles ||
    classified.canRunGit ||
    classified.canCommit ||
    classified.canGrantPermissions ||
    classified.canUseModelOutputAsProof
  ) {
    throw new Error("Runtime request crossed execution boundary.");
  }

  return true;
}

function summarizeRuntimeRequest(request = {}) {
  const classified = classifyRuntimeRequest(request);

  return Object.freeze({
    valid: classified.valid,
    status: classified.status,
    requestId: classified.request ? classified.request.requestId : null,
    requestedAction: classified.request ? classified.request.requestedAction : null,
    sideEffectLevel: classified.request ? classified.request.sideEffectLevel : null,
    blockedReasonCount: classified.request ? classified.request.blockedReasons.length : 0,
    runtimeAllowed: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsProof: false
  });
}

module.exports = {
  RUNTIME_BOUNDARY_ACTIONS,
  RUNTIME_BOUNDARY_STATUSES,
  RUNTIME_BOUNDARY_SIDE_EFFECT_LEVELS,
  RUNTIME_BOUNDARY_BLOCKED_REASONS,
  createRuntimeRequest,
  validateRuntimeRequest,
  classifyRuntimeRequest,
  assertRuntimeRequestBlocked,
  summarizeRuntimeRequest
};
