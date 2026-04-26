"use strict";

const RUNTIME_DRY_RUN_REQUEST_TYPES = Object.freeze([
  "tool_dry_run",
  "file_write_dry_run",
  "command_dry_run",
  "git_dry_run",
  "runtime_integration_dry_run"
]);

const RUNTIME_DRY_RUN_STATUSES = Object.freeze([
  "planned",
  "blocked",
  "simulated",
  "invalid"
]);

const RUNTIME_DRY_RUN_AUTHORITY_STATES = Object.freeze([
  "non_authoritative",
  "diagnostic_only",
  "simulation_only",
  "deauthorized"
]);

const RUNTIME_DRY_RUN_BLOCKED_REASONS = Object.freeze([
  "actual_dry_run_execution_blocked",
  "runtime_execution_blocked",
  "tool_execution_blocked",
  "file_write_blocked",
  "process_execution_blocked",
  "git_execution_blocked",
  "commit_blocked",
  "permission_grant_blocked",
  "replay_blocked",
  "model_output_authority_blocked",
  "missing_required_gate",
  "dry_run_result_not_authority"
]);

const RUNTIME_DRY_RUN_REQUIRED_GATES = Object.freeze([
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ExecutionAdapterRegistry",
  "SideEffectSandbox",
  "ToolExecutionAuditLog",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
]);

const REQUIRED_REQUEST_FIELDS = Object.freeze([
  "dryRunId",
  "source",
  "requestType",
  "targetCapability",
  "sideEffectLevel",
  "requiredGates",
  "expectedMutation",
  "executionAllowed",
  "runtimeAllowed",
  "blockedReasons"
]);

const REQUIRED_RESULT_FIELDS = Object.freeze([
  "dryRunId",
  "resultId",
  "source",
  "status",
  "observedMutation",
  "expectedMutationMatched",
  "authorityState",
  "runtimeExecutionAuthority",
  "replayAllowed",
  "permissionGrant",
  "blockedReasons"
]);

const REQUEST_TYPE_SET = new Set(RUNTIME_DRY_RUN_REQUEST_TYPES);
const STATUS_SET = new Set(RUNTIME_DRY_RUN_STATUSES);
const AUTHORITY_STATE_SET = new Set(RUNTIME_DRY_RUN_AUTHORITY_STATES);
const BLOCKED_REASON_SET = new Set(RUNTIME_DRY_RUN_BLOCKED_REASONS);

const REQUEST_TYPE_BLOCK_REASON = Object.freeze({
  tool_dry_run: "tool_execution_blocked",
  file_write_dry_run: "file_write_blocked",
  command_dry_run: "process_execution_blocked",
  git_dry_run: "git_execution_blocked",
  runtime_integration_dry_run: "runtime_execution_blocked"
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

function normalizeRequest(request = {}) {
  return {
    ...request,
    requiredGates: uniqueStrings(request.requiredGates),
    blockedReasons: uniqueStrings(request.blockedReasons)
  };
}

function normalizeResult(result = {}) {
  return {
    ...result,
    blockedReasons: uniqueStrings(result.blockedReasons)
  };
}

function validateRequiredGates(requiredGates, errors) {
  if (!Array.isArray(requiredGates)) {
    errors.push("requiredGates must be an array");
    return;
  }

  for (const gate of requiredGates) {
    if (!isNonEmptyString(gate)) {
      errors.push("requiredGates must contain only non-empty strings");
    }
  }

  for (const gate of RUNTIME_DRY_RUN_REQUIRED_GATES) {
    if (!requiredGates.includes(gate)) {
      errors.push("missing required gate: " + gate);
    }
  }
}

function validateBlockedReasons(blockedReasons, errors) {
  if (!Array.isArray(blockedReasons)) {
    errors.push("blockedReasons must be an array");
    return;
  }

  for (const reason of blockedReasons) {
    if (!BLOCKED_REASON_SET.has(reason)) {
      errors.push("unknown blockedReason: " + reason);
    }
  }
}

function validateRuntimeDryRunRequest(request = {}) {
  const errors = [];

  if (!isPlainObject(request)) {
    return {
      valid: false,
      errors: ["runtime dry-run request must be an object"]
    };
  }

  for (const field of REQUIRED_REQUEST_FIELDS) {
    if (!(field in request)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of ["dryRunId", "source", "requestType", "targetCapability", "sideEffectLevel"]) {
    if (field in request && !isNonEmptyString(request[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("requestType" in request && !REQUEST_TYPE_SET.has(request.requestType)) {
    errors.push("unknown requestType: " + request.requestType);
  }

  if ("status" in request && !STATUS_SET.has(request.status)) {
    errors.push("unknown status: " + request.status);
  }

  validateRequiredGates(request.requiredGates, errors);
  validateBlockedReasons(request.blockedReasons, errors);

  if (!("expectedMutation" in request)) {
    errors.push("expectedMutation is required");
  }

  for (const field of ["executionAllowed", "runtimeAllowed"]) {
    if (field in request && typeof request[field] !== "boolean") {
      errors.push(field + " must be a boolean");
    }
  }

  if (request.executionAllowed !== false) {
    errors.push("executionAllowed must be false in RuntimeDryRunContract v1");
  }

  if (request.runtimeAllowed !== false) {
    errors.push("runtimeAllowed must be false in RuntimeDryRunContract v1");
  }

  if (request.executeNow === true || request.runNow === true || request.actualExecution === true) {
    errors.push("runtime dry-run request must not execute actions");
  }

  if (request.permissionGrant === true || request.grantPermission === true) {
    errors.push("runtime dry-run request must not grant permissions");
  }

  if (request.replayAllowed === true || request.autoReplay === true) {
    errors.push("runtime dry-run request must not allow replay");
  }

  if (request.modelOutputUsedAsAuthority === true) {
    errors.push("model output must not be accepted as dry-run authority");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createRuntimeDryRunRequest(request = {}) {
  const normalized = normalizeRequest(cloneJson(request));
  const validation = validateRuntimeDryRunRequest(normalized);

  if (!validation.valid) {
    throw new Error("Invalid runtime dry-run request: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    requiredGates: Object.freeze([...normalized.requiredGates]),
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function classifyRuntimeDryRunRequest(request = {}) {
  const base = isPlainObject(request) ? cloneJson(request) : {};
  const requestType = REQUEST_TYPE_SET.has(base.requestType) ? base.requestType : "runtime_integration_dry_run";
  const blockedReasons = uniqueStrings(base.blockedReasons || []);

  blockedReasons.push("actual_dry_run_execution_blocked");

  if (REQUEST_TYPE_BLOCK_REASON[requestType]) {
    blockedReasons.push(REQUEST_TYPE_BLOCK_REASON[requestType]);
  }

  if (base.runtimeAllowed === true || base.runtimeExecutionAuthority === true) {
    blockedReasons.push("runtime_execution_blocked");
  }

  if (base.permissionGrant === true || base.grantPermission === true) {
    blockedReasons.push("permission_grant_blocked");
  }

  if (base.replayAllowed === true || base.autoReplay === true) {
    blockedReasons.push("replay_blocked");
  }

  if (base.modelOutputUsedAsAuthority === true) {
    blockedReasons.push("model_output_authority_blocked");
  }

  const normalized = {
    dryRunId: isNonEmptyString(base.dryRunId) ? base.dryRunId : "runtime_dry_run_request",
    source: isNonEmptyString(base.source) ? base.source : "unknown",
    requestType,
    targetCapability: isNonEmptyString(base.targetCapability) ? base.targetCapability : "unknown",
    sideEffectLevel: isNonEmptyString(base.sideEffectLevel) ? base.sideEffectLevel : "unknown",
    requiredGates: uniqueStrings(base.requiredGates || RUNTIME_DRY_RUN_REQUIRED_GATES),
    expectedMutation: "expectedMutation" in base ? base.expectedMutation : "none",
    executionAllowed: false,
    runtimeAllowed: false,
    blockedReasons: uniqueStrings(blockedReasons)
  };

  const validation = validateRuntimeDryRunRequest(normalized);

  if (!validation.valid) {
    return Object.freeze({
      valid: false,
      status: "invalid",
      errors: Object.freeze([...validation.errors]),
      request: Object.freeze(normalized),
      executionAllowed: false,
      runtimeAllowed: false,
      canExecuteTools: false,
      canWriteFiles: false,
      canRunProcess: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canReplay: false,
      canUseModelOutputAsAuthority: false
    });
  }

  const created = createRuntimeDryRunRequest(normalized);

  return Object.freeze({
    valid: true,
    status: created.blockedReasons.length > 0 ? "blocked" : "planned",
    request: created,
    executionAllowed: false,
    runtimeAllowed: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunProcess: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canReplay: false,
    canUseModelOutputAsAuthority: false
  });
}

function validateRuntimeDryRunResult(result = {}) {
  const errors = [];

  if (!isPlainObject(result)) {
    return {
      valid: false,
      errors: ["runtime dry-run result must be an object"]
    };
  }

  for (const field of REQUIRED_RESULT_FIELDS) {
    if (!(field in result)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of ["dryRunId", "resultId", "source", "status", "authorityState"]) {
    if (field in result && !isNonEmptyString(result[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("status" in result && !STATUS_SET.has(result.status)) {
    errors.push("unknown status: " + result.status);
  }

  if ("authorityState" in result && !AUTHORITY_STATE_SET.has(result.authorityState)) {
    errors.push("unknown authorityState: " + result.authorityState);
  }

  validateBlockedReasons(result.blockedReasons, errors);

  if (!("observedMutation" in result)) {
    errors.push("observedMutation is required");
  }

  for (const field of ["expectedMutationMatched", "runtimeExecutionAuthority", "replayAllowed", "permissionGrant"]) {
    if (field in result && typeof result[field] !== "boolean") {
      errors.push(field + " must be a boolean");
    }
  }

  if (result.runtimeExecutionAuthority !== false) {
    errors.push("runtimeExecutionAuthority must be false in RuntimeDryRunContract v1");
  }

  if (result.replayAllowed !== false) {
    errors.push("replayAllowed must be false in RuntimeDryRunContract v1");
  }

  if (result.permissionGrant !== false) {
    errors.push("permissionGrant must be false in RuntimeDryRunContract v1");
  }

  if (result.provesCurrentRepoState === true || result.proof === true) {
    errors.push("dry-run result must not prove current repo state");
  }

  if (result.modelOutputUsedAsAuthority === true) {
    errors.push("model output must not be accepted as dry-run result authority");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createRuntimeDryRunResult(result = {}) {
  const normalized = normalizeResult(cloneJson(result));
  const validation = validateRuntimeDryRunResult(normalized);

  if (!validation.valid) {
    throw new Error("Invalid runtime dry-run result: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function assertRuntimeDryRunResultNotAuthority(result = {}) {
  const normalized = normalizeResult(cloneJson(result));
  const validation = validateRuntimeDryRunResult(normalized);

  if (!validation.valid) {
    throw new Error("Invalid runtime dry-run result: " + validation.errors.join("; "));
  }

  if (
    normalized.runtimeExecutionAuthority ||
    normalized.replayAllowed ||
    normalized.permissionGrant ||
    normalized.provesCurrentRepoState === true ||
    normalized.proof === true ||
    normalized.modelOutputUsedAsAuthority === true
  ) {
    throw new Error("Runtime dry-run result crossed authority boundary.");
  }

  return true;
}

function summarizeRuntimeDryRunRecord(record = {}) {
  const requestLike = isPlainObject(record) && "requestType" in record;
  const resultLike = isPlainObject(record) && "resultId" in record;

  if (requestLike) {
    const classified = classifyRuntimeDryRunRequest(record);

    return Object.freeze({
      kind: "request",
      valid: classified.valid,
      status: classified.status,
      dryRunId: classified.request ? classified.request.dryRunId : null,
      executionAllowed: false,
      runtimeAllowed: false,
      canExecuteTools: false,
      canWriteFiles: false,
      canRunProcess: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canReplay: false,
      canUseModelOutputAsAuthority: false
    });
  }

  if (resultLike) {
    const validation = validateRuntimeDryRunResult(record);

    return Object.freeze({
      kind: "result",
      valid: validation.valid,
      status: isNonEmptyString(record.status) ? record.status : "invalid",
      dryRunId: isNonEmptyString(record.dryRunId) ? record.dryRunId : null,
      runtimeExecutionAuthority: false,
      replayAllowed: false,
      permissionGrant: false,
      provesCurrentRepoState: false,
      canUseModelOutputAsAuthority: false
    });
  }

  return Object.freeze({
    kind: "unknown",
    valid: false,
    status: "invalid",
    executionAllowed: false,
    runtimeAllowed: false,
    runtimeExecutionAuthority: false,
    replayAllowed: false,
    permissionGrant: false
  });
}

module.exports = {
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
};
