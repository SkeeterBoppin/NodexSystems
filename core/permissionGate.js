"use strict";

const PERMISSION_GATE_SCOPES = Object.freeze([
  "metadata_read",
  "classification",
  "planning",
  "tool_execution",
  "file_write",
  "git_execution",
  "commit",
  "permission_grant",
  "runtime_integration"
]);

const PERMISSION_GATE_STATUSES = Object.freeze([
  "metadata_only",
  "blocked",
  "deferred"
]);

const PERMISSION_GATE_DECISIONS = Object.freeze([
  "deny",
  "defer",
  "metadata_only"
]);

const PERMISSION_GATE_BLOCKED_REASONS = Object.freeze([
  "tool_execution_permission_blocked",
  "file_write_permission_blocked",
  "git_execution_permission_blocked",
  "commit_permission_blocked",
  "permission_grant_blocked",
  "runtime_integration_permission_blocked",
  "human_approval_missing",
  "evidence_missing",
  "model_output_approval_blocked"
]);

const REQUIRED_PERMISSION_REQUEST_FIELDS = Object.freeze([
  "permissionId",
  "source",
  "requestedScope",
  "targetCapability",
  "evidenceState",
  "humanApprovalState",
  "decision",
  "permissionGranted",
  "blockedReasons"
]);

const SCOPE_SET = new Set(PERMISSION_GATE_SCOPES);
const STATUS_SET = new Set(PERMISSION_GATE_STATUSES);
const DECISION_SET = new Set(PERMISSION_GATE_DECISIONS);
const BLOCKED_REASON_SET = new Set(PERMISSION_GATE_BLOCKED_REASONS);

const SCOPE_BLOCK_REASON = Object.freeze({
  tool_execution: "tool_execution_permission_blocked",
  file_write: "file_write_permission_blocked",
  git_execution: "git_execution_permission_blocked",
  commit: "commit_permission_blocked",
  permission_grant: "permission_grant_blocked",
  runtime_integration: "runtime_integration_permission_blocked"
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

function normalizePermissionRequest(request = {}) {
  return {
    ...request,
    blockedReasons: uniqueStrings(request.blockedReasons)
  };
}

function validatePermissionRequest(request = {}) {
  const errors = [];

  if (!isPlainObject(request)) {
    return {
      valid: false,
      errors: ["permission request must be an object"]
    };
  }

  for (const field of REQUIRED_PERMISSION_REQUEST_FIELDS) {
    if (!(field in request)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of [
    "permissionId",
    "source",
    "requestedScope",
    "targetCapability",
    "evidenceState",
    "humanApprovalState",
    "decision"
  ]) {
    if (field in request && !isNonEmptyString(request[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("requestedScope" in request && !SCOPE_SET.has(request.requestedScope)) {
    errors.push("unknown requestedScope: " + request.requestedScope);
  }

  if ("status" in request && !STATUS_SET.has(request.status)) {
    errors.push("unknown status: " + request.status);
  }

  if ("decision" in request && !DECISION_SET.has(request.decision)) {
    errors.push("unknown decision: " + request.decision);
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

  if (typeof request.permissionGranted !== "boolean") {
    errors.push("permissionGranted must be a boolean");
  }

  if (request.permissionGranted !== false) {
    errors.push("permissionGranted must be false in PermissionGate v1");
  }

  if (request.modelOutputUsedAsApproval === true || request.modelOutputApproved === true) {
    errors.push("model output must not be accepted as permission approval");
  }

  if (request.executeNow === true || request.runNow === true || request.autoExecute === true) {
    errors.push("permission request must not execute actions");
  }

  if (request.grantNow === true || request.grantPermission === true) {
    errors.push("permission request must not grant permissions");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createPermissionRequest(request = {}) {
  const normalized = normalizePermissionRequest(cloneJson(request));
  const validation = validatePermissionRequest(normalized);

  if (!validation.valid) {
    throw new Error("Invalid permission request: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function classifyPermissionRequest(request = {}) {
  const base = isPlainObject(request) ? cloneJson(request) : {};
  const blockedReasons = uniqueStrings(base.blockedReasons || []);

  const requestedScope = SCOPE_SET.has(base.requestedScope)
    ? base.requestedScope
    : "classification";

  const blockReason = SCOPE_BLOCK_REASON[requestedScope];

  if (blockReason) {
    blockedReasons.push(blockReason);
  }

  if (!isNonEmptyString(base.evidenceState) || base.evidenceState === "missing") {
    blockedReasons.push("evidence_missing");
  }

  if (!isNonEmptyString(base.humanApprovalState) || base.humanApprovalState === "missing") {
    blockedReasons.push("human_approval_missing");
  }

  if (base.modelOutputUsedAsApproval === true || base.modelOutputApproved === true) {
    blockedReasons.push("model_output_approval_blocked");
  }

  if (base.permissionGranted === true || base.grantNow === true || base.grantPermission === true) {
    blockedReasons.push("permission_grant_blocked");
  }

  const uniqueBlockedReasons = uniqueStrings(blockedReasons);
  const hasBlockedReason = uniqueBlockedReasons.length > 0;

  const normalized = {
    permissionId: isNonEmptyString(base.permissionId) ? base.permissionId : "permission_request",
    source: isNonEmptyString(base.source) ? base.source : "unknown",
    requestedScope,
    targetCapability: isNonEmptyString(base.targetCapability) ? base.targetCapability : "unknown",
    evidenceState: isNonEmptyString(base.evidenceState) ? base.evidenceState : "unverified",
    humanApprovalState: isNonEmptyString(base.humanApprovalState) ? base.humanApprovalState : "not_requested",
    decision: hasBlockedReason ? "deny" : "metadata_only",
    status: hasBlockedReason ? "blocked" : "metadata_only",
    permissionGranted: false,
    blockedReasons: uniqueBlockedReasons
  };

  const validation = validatePermissionRequest(normalized);

  if (!validation.valid) {
    return Object.freeze({
      valid: false,
      status: "blocked",
      decision: "deny",
      errors: Object.freeze([...validation.errors]),
      request: Object.freeze(normalized),
      permissionGranted: false,
      canExecuteTools: false,
      canWriteFiles: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canUseModelOutputAsApproval: false
    });
  }

  const created = createPermissionRequest(normalized);

  return Object.freeze({
    valid: true,
    status: created.status,
    decision: created.decision,
    request: created,
    permissionGranted: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsApproval: false
  });
}

function assertPermissionNotGranted(request = {}) {
  const classified = classifyPermissionRequest(request);

  if (
    classified.permissionGranted ||
    classified.canExecuteTools ||
    classified.canWriteFiles ||
    classified.canRunGit ||
    classified.canCommit ||
    classified.canGrantPermissions ||
    classified.canUseModelOutputAsApproval
  ) {
    throw new Error("Permission request crossed grant boundary.");
  }

  return true;
}

function summarizePermissionRequest(request = {}) {
  const classified = classifyPermissionRequest(request);

  return Object.freeze({
    valid: classified.valid,
    status: classified.status,
    decision: classified.decision,
    permissionId: classified.request ? classified.request.permissionId : null,
    requestedScope: classified.request ? classified.request.requestedScope : null,
    blockedReasonCount: classified.request ? classified.request.blockedReasons.length : 0,
    permissionGranted: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsApproval: false
  });
}

module.exports = {
  PERMISSION_GATE_SCOPES,
  PERMISSION_GATE_STATUSES,
  PERMISSION_GATE_DECISIONS,
  PERMISSION_GATE_BLOCKED_REASONS,
  createPermissionRequest,
  validatePermissionRequest,
  classifyPermissionRequest,
  assertPermissionNotGranted,
  summarizePermissionRequest
};
