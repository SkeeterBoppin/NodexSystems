"use strict";

const RUNTIME_USER_APPROVAL_SCOPES = Object.freeze([
  "runtime_integration",
  "tool_execution",
  "file_write",
  "process_execution",
  "git_execution",
  "commit",
  "permission_grant"
]);

const RUNTIME_USER_APPROVAL_STATES = Object.freeze([
  "missing",
  "requested",
  "explicitly_denied",
  "explicitly_deferred",
  "explicitly_approved_for_plan_only"
]);

const RUNTIME_USER_APPROVAL_DECISIONS = Object.freeze([
  "deny",
  "defer",
  "plan_only"
]);

const RUNTIME_USER_APPROVAL_BLOCKED_REASONS = Object.freeze([
  "runtime_execution_blocked",
  "tool_execution_blocked",
  "file_write_blocked",
  "process_execution_blocked",
  "git_execution_blocked",
  "commit_blocked",
  "permission_grant_blocked",
  "implicit_approval_blocked",
  "model_output_approval_blocked",
  "approval_not_runtime_authority",
  "missing_required_gate",
  "replay_authority_blocked"
]);

const RUNTIME_USER_APPROVAL_REQUIRED_GATES = Object.freeze([
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "RuntimeDryRunContract",
  "ExecutionAdapterRegistry",
  "SideEffectSandbox",
  "ToolExecutionAuditLog",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
]);

const REQUIRED_CHECKPOINT_FIELDS = Object.freeze([
  "approvalId",
  "source",
  "scope",
  "targetCapability",
  "requestedAction",
  "requiredGates",
  "userApprovalState",
  "decision",
  "runtimeExecutionAllowed",
  "permissionGrant",
  "modelOutputApproval",
  "blockedReasons"
]);

const SCOPE_SET = new Set(RUNTIME_USER_APPROVAL_SCOPES);
const STATE_SET = new Set(RUNTIME_USER_APPROVAL_STATES);
const DECISION_SET = new Set(RUNTIME_USER_APPROVAL_DECISIONS);
const BLOCKED_REASON_SET = new Set(RUNTIME_USER_APPROVAL_BLOCKED_REASONS);

const SCOPE_BLOCK_REASON = Object.freeze({
  runtime_integration: "runtime_execution_blocked",
  tool_execution: "tool_execution_blocked",
  file_write: "file_write_blocked",
  process_execution: "process_execution_blocked",
  git_execution: "git_execution_blocked",
  commit: "commit_blocked",
  permission_grant: "permission_grant_blocked"
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

function normalizeCheckpoint(checkpoint = {}) {
  return {
    ...checkpoint,
    requiredGates: uniqueStrings(checkpoint.requiredGates),
    blockedReasons: uniqueStrings(checkpoint.blockedReasons)
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

  for (const gate of RUNTIME_USER_APPROVAL_REQUIRED_GATES) {
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

function validateRuntimeUserApprovalCheckpoint(checkpoint = {}) {
  const errors = [];

  if (!isPlainObject(checkpoint)) {
    return {
      valid: false,
      errors: ["runtime user approval checkpoint must be an object"]
    };
  }

  for (const field of REQUIRED_CHECKPOINT_FIELDS) {
    if (!(field in checkpoint)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of [
    "approvalId",
    "source",
    "scope",
    "targetCapability",
    "requestedAction",
    "userApprovalState",
    "decision"
  ]) {
    if (field in checkpoint && !isNonEmptyString(checkpoint[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("scope" in checkpoint && !SCOPE_SET.has(checkpoint.scope)) {
    errors.push("unknown scope: " + checkpoint.scope);
  }

  if ("userApprovalState" in checkpoint && !STATE_SET.has(checkpoint.userApprovalState)) {
    errors.push("unknown userApprovalState: " + checkpoint.userApprovalState);
  }

  if ("decision" in checkpoint && !DECISION_SET.has(checkpoint.decision)) {
    errors.push("unknown decision: " + checkpoint.decision);
  }

  validateRequiredGates(checkpoint.requiredGates, errors);
  validateBlockedReasons(checkpoint.blockedReasons, errors);

  for (const field of ["runtimeExecutionAllowed", "permissionGrant", "modelOutputApproval"]) {
    if (field in checkpoint && typeof checkpoint[field] !== "boolean") {
      errors.push(field + " must be a boolean");
    }
  }

  if (checkpoint.runtimeExecutionAllowed !== false) {
    errors.push("runtimeExecutionAllowed must be false in RuntimeUserApprovalCheckpoint v1");
  }

  if (checkpoint.permissionGrant !== false) {
    errors.push("permissionGrant must be false in RuntimeUserApprovalCheckpoint v1");
  }

  if (checkpoint.modelOutputApproval !== false) {
    errors.push("modelOutputApproval must be false in RuntimeUserApprovalCheckpoint v1");
  }

  if (checkpoint.implicitApproval === true || checkpoint.assumeApproval === true) {
    errors.push("implicit approval must not be accepted");
  }

  if (checkpoint.modelOutputUsedAsApproval === true || checkpoint.modelOutputUsedAsAuthority === true) {
    errors.push("model output must not be accepted as approval authority");
  }

  if (checkpoint.replayAllowed === true || checkpoint.autoReplay === true) {
    errors.push("approval checkpoint must not allow replay authority");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createRuntimeUserApprovalCheckpoint(checkpoint = {}) {
  const normalized = normalizeCheckpoint(cloneJson(checkpoint));
  const validation = validateRuntimeUserApprovalCheckpoint(normalized);

  if (!validation.valid) {
    throw new Error("Invalid runtime user approval checkpoint: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    requiredGates: Object.freeze([...normalized.requiredGates]),
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function classifyRuntimeUserApprovalCheckpoint(checkpoint = {}) {
  const base = isPlainObject(checkpoint) ? cloneJson(checkpoint) : {};
  const scope = SCOPE_SET.has(base.scope) ? base.scope : "runtime_integration";
  const blockedReasons = uniqueStrings(base.blockedReasons || []);

  if (SCOPE_BLOCK_REASON[scope]) {
    blockedReasons.push(SCOPE_BLOCK_REASON[scope]);
  }

  blockedReasons.push("approval_not_runtime_authority");

  if (
    base.userApprovalState === "missing" ||
    base.userApprovalState === "requested" ||
    base.userApprovalState === "explicitly_denied" ||
    base.userApprovalState === "explicitly_deferred"
  ) {
    blockedReasons.push("implicit_approval_blocked");
  }

  if (base.runtimeExecutionAllowed === true || base.executeNow === true || base.runNow === true) {
    blockedReasons.push("runtime_execution_blocked");
  }

  if (base.permissionGrant === true || base.grantPermission === true) {
    blockedReasons.push("permission_grant_blocked");
  }

  if (
    base.modelOutputApproval === true ||
    base.modelOutputUsedAsApproval === true ||
    base.modelOutputUsedAsAuthority === true
  ) {
    blockedReasons.push("model_output_approval_blocked");
  }

  if (base.replayAllowed === true || base.autoReplay === true) {
    blockedReasons.push("replay_authority_blocked");
  }

  const normalized = {
    approvalId: isNonEmptyString(base.approvalId) ? base.approvalId : "runtime_user_approval_checkpoint",
    source: isNonEmptyString(base.source) ? base.source : "unknown",
    scope,
    targetCapability: isNonEmptyString(base.targetCapability) ? base.targetCapability : "unknown",
    requestedAction: isNonEmptyString(base.requestedAction) ? base.requestedAction : "unknown",
    requiredGates: uniqueStrings(base.requiredGates || RUNTIME_USER_APPROVAL_REQUIRED_GATES),
    userApprovalState: STATE_SET.has(base.userApprovalState) ? base.userApprovalState : "missing",
    decision: DECISION_SET.has(base.decision) ? base.decision : "deny",
    runtimeExecutionAllowed: false,
    permissionGrant: false,
    modelOutputApproval: false,
    blockedReasons: uniqueStrings(blockedReasons)
  };

  const validation = validateRuntimeUserApprovalCheckpoint(normalized);

  if (!validation.valid) {
    return Object.freeze({
      valid: false,
      status: "blocked",
      errors: Object.freeze([...validation.errors]),
      checkpoint: Object.freeze(normalized),
      runtimeExecutionAllowed: false,
      permissionGrant: false,
      modelOutputApproval: false,
      userApprovalGranted: false,
      canExecuteRuntime: false,
      canExecuteTools: false,
      canWriteFiles: false,
      canRunProcess: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canUseModelOutputAsApproval: false,
      canReplay: false
    });
  }

  const created = createRuntimeUserApprovalCheckpoint(normalized);

  return Object.freeze({
    valid: true,
    status: created.blockedReasons.length > 0 ? "blocked" : "plan_only",
    checkpoint: created,
    runtimeExecutionAllowed: false,
    permissionGrant: false,
    modelOutputApproval: false,
    userApprovalGranted: false,
    canExecuteRuntime: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunProcess: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsApproval: false,
    canReplay: false
  });
}

function assertRuntimeUserApprovalNotGranted(checkpoint = {}) {
  const classified = classifyRuntimeUserApprovalCheckpoint(checkpoint);

  if (
    classified.runtimeExecutionAllowed ||
    classified.permissionGrant ||
    classified.modelOutputApproval ||
    classified.userApprovalGranted ||
    classified.canExecuteRuntime ||
    classified.canExecuteTools ||
    classified.canWriteFiles ||
    classified.canRunProcess ||
    classified.canRunGit ||
    classified.canCommit ||
    classified.canGrantPermissions ||
    classified.canUseModelOutputAsApproval ||
    classified.canReplay
  ) {
    throw new Error("Runtime user approval checkpoint crossed authority boundary.");
  }

  return true;
}

function summarizeRuntimeUserApprovalCheckpoint(checkpoint = {}) {
  const classified = classifyRuntimeUserApprovalCheckpoint(checkpoint);

  return Object.freeze({
    valid: classified.valid,
    status: classified.status,
    approvalId: classified.checkpoint ? classified.checkpoint.approvalId : null,
    scope: classified.checkpoint ? classified.checkpoint.scope : null,
    userApprovalState: classified.checkpoint ? classified.checkpoint.userApprovalState : null,
    decision: classified.checkpoint ? classified.checkpoint.decision : null,
    blockedReasonCount: classified.checkpoint ? classified.checkpoint.blockedReasons.length : 0,
    runtimeExecutionAllowed: false,
    permissionGrant: false,
    modelOutputApproval: false,
    userApprovalGranted: false,
    canExecuteRuntime: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunProcess: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsApproval: false,
    canReplay: false
  });
}

module.exports = {
  RUNTIME_USER_APPROVAL_SCOPES,
  RUNTIME_USER_APPROVAL_STATES,
  RUNTIME_USER_APPROVAL_DECISIONS,
  RUNTIME_USER_APPROVAL_BLOCKED_REASONS,
  createRuntimeUserApprovalCheckpoint,
  validateRuntimeUserApprovalCheckpoint,
  classifyRuntimeUserApprovalCheckpoint,
  assertRuntimeUserApprovalNotGranted,
  summarizeRuntimeUserApprovalCheckpoint
};
