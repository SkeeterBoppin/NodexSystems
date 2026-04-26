"use strict";

const TOOL_EXECUTION_AUDIT_RECORD_TYPES = Object.freeze([
  "tool_execution_attempt",
  "tool_execution_plan",
  "tool_execution_denial",
  "tool_execution_result",
  "tool_execution_error"
]);

const TOOL_EXECUTION_AUDIT_STATUSES = Object.freeze([
  "planned",
  "blocked",
  "denied",
  "observed",
  "error"
]);

const TOOL_EXECUTION_AUDIT_AUTHORITY_STATES = Object.freeze([
  "historical_record_only",
  "diagnostic_only",
  "non_authoritative",
  "deauthorized"
]);

const TOOL_EXECUTION_AUDIT_BLOCKED_REASONS = Object.freeze([
  "audit_record_not_proof",
  "replay_blocked",
  "permission_grant_blocked",
  "runtime_execution_authority_blocked",
  "missing_required_gate",
  "model_output_authority_blocked",
  "side_effect_replay_blocked"
]);

const TOOL_EXECUTION_AUDIT_REQUIRED_GATES = Object.freeze([
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ExecutionAdapterRegistry",
  "SideEffectSandbox",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
]);

const REQUIRED_AUDIT_RECORD_FIELDS = Object.freeze([
  "recordId",
  "recordType",
  "createdAt",
  "source",
  "toolId",
  "requestedAction",
  "sideEffectLevel",
  "requiredGates",
  "status",
  "authorityState",
  "replayAllowed",
  "permissionGrant",
  "runtimeExecutionAuthority",
  "blockedReasons"
]);

const RECORD_TYPE_SET = new Set(TOOL_EXECUTION_AUDIT_RECORD_TYPES);
const STATUS_SET = new Set(TOOL_EXECUTION_AUDIT_STATUSES);
const AUTHORITY_STATE_SET = new Set(TOOL_EXECUTION_AUDIT_AUTHORITY_STATES);
const BLOCKED_REASON_SET = new Set(TOOL_EXECUTION_AUDIT_BLOCKED_REASONS);

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

function normalizeAuditRecord(record = {}) {
  return {
    ...record,
    requiredGates: uniqueStrings(record.requiredGates),
    blockedReasons: uniqueStrings(record.blockedReasons)
  };
}

function validateToolExecutionAuditRecord(record = {}) {
  const errors = [];

  if (!isPlainObject(record)) {
    return {
      valid: false,
      errors: ["tool execution audit record must be an object"]
    };
  }

  for (const field of REQUIRED_AUDIT_RECORD_FIELDS) {
    if (!(field in record)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of [
    "recordId",
    "recordType",
    "createdAt",
    "source",
    "toolId",
    "requestedAction",
    "sideEffectLevel",
    "status",
    "authorityState"
  ]) {
    if (field in record && !isNonEmptyString(record[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("recordType" in record && !RECORD_TYPE_SET.has(record.recordType)) {
    errors.push("unknown recordType: " + record.recordType);
  }

  if ("status" in record && !STATUS_SET.has(record.status)) {
    errors.push("unknown status: " + record.status);
  }

  if ("authorityState" in record && !AUTHORITY_STATE_SET.has(record.authorityState)) {
    errors.push("unknown authorityState: " + record.authorityState);
  }

  if (!Array.isArray(record.requiredGates)) {
    errors.push("requiredGates must be an array");
  } else {
    for (const gate of record.requiredGates) {
      if (!isNonEmptyString(gate)) {
        errors.push("requiredGates must contain only non-empty strings");
      }
    }

    for (const gate of TOOL_EXECUTION_AUDIT_REQUIRED_GATES) {
      if (!record.requiredGates.includes(gate)) {
        errors.push("missing required gate: " + gate);
      }
    }
  }

  if (!Array.isArray(record.blockedReasons)) {
    errors.push("blockedReasons must be an array");
  } else {
    for (const reason of record.blockedReasons) {
      if (!BLOCKED_REASON_SET.has(reason)) {
        errors.push("unknown blockedReason: " + reason);
      }
    }
  }

  for (const field of ["replayAllowed", "permissionGrant", "runtimeExecutionAuthority"]) {
    if (field in record && typeof record[field] !== "boolean") {
      errors.push(field + " must be a boolean");
    }
  }

  if (record.replayAllowed !== false) {
    errors.push("replayAllowed must be false in ToolExecutionAuditLogSchema v1");
  }

  if (record.permissionGrant !== false) {
    errors.push("permissionGrant must be false in ToolExecutionAuditLogSchema v1");
  }

  if (record.runtimeExecutionAuthority !== false) {
    errors.push("runtimeExecutionAuthority must be false in ToolExecutionAuditLogSchema v1");
  }

  if (record.provesCurrentRepoState === true || record.proof === true) {
    errors.push("audit record must not be proof of current repo state");
  }

  if (record.modelOutputUsedAsAuthority === true) {
    errors.push("model output must not be accepted as audit authority");
  }

  if (record.autoReplay === true || record.replayNow === true) {
    errors.push("audit record must not auto-replay side effects");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createToolExecutionAuditRecord(record = {}) {
  const normalized = normalizeAuditRecord(cloneJson(record));
  const validation = validateToolExecutionAuditRecord(normalized);

  if (!validation.valid) {
    throw new Error("Invalid tool execution audit record: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    requiredGates: Object.freeze([...normalized.requiredGates]),
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function classifyToolExecutionAuditRecord(record = {}) {
  const base = isPlainObject(record) ? cloneJson(record) : {};
  const blockedReasons = uniqueStrings(base.blockedReasons || []);

  blockedReasons.push("audit_record_not_proof");
  blockedReasons.push("replay_blocked");

  if (base.permissionGrant === true || base.grantPermission === true) {
    blockedReasons.push("permission_grant_blocked");
  }

  if (base.runtimeExecutionAuthority === true || base.executeNow === true || base.runNow === true) {
    blockedReasons.push("runtime_execution_authority_blocked");
  }

  if (base.modelOutputUsedAsAuthority === true) {
    blockedReasons.push("model_output_authority_blocked");
  }

  if (base.autoReplay === true || base.replayNow === true || base.replayAllowed === true) {
    blockedReasons.push("side_effect_replay_blocked");
  }

  const normalized = {
    recordId: isNonEmptyString(base.recordId) ? base.recordId : "tool_execution_audit_record",
    recordType: RECORD_TYPE_SET.has(base.recordType) ? base.recordType : "tool_execution_plan",
    createdAt: isNonEmptyString(base.createdAt) ? base.createdAt : "1970-01-01T00:00:00.000Z",
    source: isNonEmptyString(base.source) ? base.source : "unknown",
    toolId: isNonEmptyString(base.toolId) ? base.toolId : "unknown_tool",
    requestedAction: isNonEmptyString(base.requestedAction) ? base.requestedAction : "unknown_action",
    sideEffectLevel: isNonEmptyString(base.sideEffectLevel) ? base.sideEffectLevel : "unknown",
    requiredGates: uniqueStrings(base.requiredGates || TOOL_EXECUTION_AUDIT_REQUIRED_GATES),
    status: STATUS_SET.has(base.status) ? base.status : "planned",
    authorityState: AUTHORITY_STATE_SET.has(base.authorityState) ? base.authorityState : "non_authoritative",
    replayAllowed: false,
    permissionGrant: false,
    runtimeExecutionAuthority: false,
    blockedReasons: uniqueStrings(blockedReasons)
  };

  const validation = validateToolExecutionAuditRecord(normalized);

  if (!validation.valid) {
    return Object.freeze({
      valid: false,
      status: "blocked",
      errors: Object.freeze([...validation.errors]),
      record: Object.freeze(normalized),
      isProof: false,
      replayAllowed: false,
      permissionGrant: false,
      runtimeExecutionAuthority: false,
      canExecuteTools: false,
      canWriteFiles: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canReplaySideEffects: false,
      canUseModelOutputAsAuthority: false
    });
  }

  const created = createToolExecutionAuditRecord(normalized);

  return Object.freeze({
    valid: true,
    status: created.blockedReasons.length > 0 ? "blocked" : created.status,
    record: created,
    isProof: false,
    replayAllowed: false,
    permissionGrant: false,
    runtimeExecutionAuthority: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canReplaySideEffects: false,
    canUseModelOutputAsAuthority: false
  });
}

function assertToolExecutionAuditRecordNotProof(record = {}) {
  const classified = classifyToolExecutionAuditRecord(record);

  if (
    classified.isProof ||
    classified.permissionGrant ||
    classified.runtimeExecutionAuthority ||
    classified.canUseModelOutputAsAuthority
  ) {
    throw new Error("Tool execution audit record crossed authority boundary.");
  }

  return true;
}

function assertToolExecutionAuditRecordNotReplayable(record = {}) {
  const classified = classifyToolExecutionAuditRecord(record);

  if (
    classified.replayAllowed ||
    classified.canReplaySideEffects ||
    classified.canExecuteTools ||
    classified.canWriteFiles ||
    classified.canRunGit ||
    classified.canCommit
  ) {
    throw new Error("Tool execution audit record crossed replay boundary.");
  }

  return true;
}

function summarizeToolExecutionAuditRecord(record = {}) {
  const classified = classifyToolExecutionAuditRecord(record);

  return Object.freeze({
    valid: classified.valid,
    status: classified.status,
    recordId: classified.record ? classified.record.recordId : null,
    recordType: classified.record ? classified.record.recordType : null,
    authorityState: classified.record ? classified.record.authorityState : null,
    blockedReasonCount: classified.record ? classified.record.blockedReasons.length : 0,
    isProof: false,
    replayAllowed: false,
    permissionGrant: false,
    runtimeExecutionAuthority: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canReplaySideEffects: false,
    canUseModelOutputAsAuthority: false
  });
}

module.exports = {
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
};
