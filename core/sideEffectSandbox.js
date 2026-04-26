"use strict";

const SIDE_EFFECT_SANDBOX_LEVELS = Object.freeze([
  "none",
  "metadata_only",
  "filesystem_read",
  "filesystem_write",
  "process_execution",
  "code_execution",
  "git_execution",
  "model_execution",
  "permission_grant",
  "unknown"
]);

const SIDE_EFFECT_SANDBOX_STATUSES = Object.freeze([
  "metadata_only",
  "blocked",
  "deferred"
]);

const SIDE_EFFECT_SANDBOX_BLOCKED_REASONS = Object.freeze([
  "filesystem_write_blocked",
  "process_execution_blocked",
  "code_execution_blocked",
  "git_execution_blocked",
  "model_execution_blocked",
  "permission_grant_blocked",
  "sandbox_execution_blocked",
  "runtime_integration_blocked",
  "missing_required_gate",
  "model_output_authority_blocked"
]);

const SIDE_EFFECT_SANDBOX_REQUIRED_GATES = Object.freeze([
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ExecutionAdapterRegistry",
  "ToolCapabilityRegistry",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
]);

const REQUIRED_SANDBOX_POLICY_FIELDS = Object.freeze([
  "sandboxId",
  "source",
  "sideEffectLevel",
  "targetCapability",
  "requiredGates",
  "sandboxRequired",
  "executionAllowed",
  "filesystemMutationAllowed",
  "processExecutionAllowed",
  "blockedReasons"
]);

const LEVEL_SET = new Set(SIDE_EFFECT_SANDBOX_LEVELS);
const STATUS_SET = new Set(SIDE_EFFECT_SANDBOX_STATUSES);
const BLOCKED_REASON_SET = new Set(SIDE_EFFECT_SANDBOX_BLOCKED_REASONS);

const LEVEL_BLOCK_REASON = Object.freeze({
  filesystem_write: "filesystem_write_blocked",
  process_execution: "process_execution_blocked",
  code_execution: "code_execution_blocked",
  git_execution: "git_execution_blocked",
  model_execution: "model_execution_blocked",
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

function normalizePolicy(policy = {}) {
  return {
    ...policy,
    requiredGates: uniqueStrings(policy.requiredGates),
    blockedReasons: uniqueStrings(policy.blockedReasons)
  };
}

function validateSideEffectSandboxPolicy(policy = {}) {
  const errors = [];

  if (!isPlainObject(policy)) {
    return {
      valid: false,
      errors: ["side-effect sandbox policy must be an object"]
    };
  }

  for (const field of REQUIRED_SANDBOX_POLICY_FIELDS) {
    if (!(field in policy)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of ["sandboxId", "source", "sideEffectLevel", "targetCapability"]) {
    if (field in policy && !isNonEmptyString(policy[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("sideEffectLevel" in policy && !LEVEL_SET.has(policy.sideEffectLevel)) {
    errors.push("unknown sideEffectLevel: " + policy.sideEffectLevel);
  }

  if ("status" in policy && !STATUS_SET.has(policy.status)) {
    errors.push("unknown status: " + policy.status);
  }

  if (!Array.isArray(policy.requiredGates)) {
    errors.push("requiredGates must be an array");
  } else {
    for (const gate of policy.requiredGates) {
      if (!isNonEmptyString(gate)) {
        errors.push("requiredGates must contain only non-empty strings");
      }
    }

    for (const gate of SIDE_EFFECT_SANDBOX_REQUIRED_GATES) {
      if (!policy.requiredGates.includes(gate)) {
        errors.push("missing required gate: " + gate);
      }
    }
  }

  if (!Array.isArray(policy.blockedReasons)) {
    errors.push("blockedReasons must be an array");
  } else {
    for (const reason of policy.blockedReasons) {
      if (!BLOCKED_REASON_SET.has(reason)) {
        errors.push("unknown blockedReason: " + reason);
      }
    }
  }

  for (const field of ["sandboxRequired", "executionAllowed", "filesystemMutationAllowed", "processExecutionAllowed"]) {
    if (field in policy && typeof policy[field] !== "boolean") {
      errors.push(field + " must be a boolean");
    }
  }

  if (policy.executionAllowed !== false) {
    errors.push("executionAllowed must be false in SideEffectSandboxContract v1");
  }

  if (policy.filesystemMutationAllowed !== false) {
    errors.push("filesystemMutationAllowed must be false in SideEffectSandboxContract v1");
  }

  if (policy.processExecutionAllowed !== false) {
    errors.push("processExecutionAllowed must be false in SideEffectSandboxContract v1");
  }

  if (policy.executeNow === true || policy.runNow === true || policy.autoExecute === true) {
    errors.push("side-effect sandbox policy must not execute effects");
  }

  if (policy.modelOutputUsedAsAuthority === true) {
    errors.push("model output must not be accepted as side-effect authority");
  }

  if (policy.permissionGranted === true || policy.grantPermission === true) {
    errors.push("side-effect sandbox policy must not grant permissions");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createSideEffectSandboxPolicy(policy = {}) {
  const normalized = normalizePolicy(cloneJson(policy));
  const validation = validateSideEffectSandboxPolicy(normalized);

  if (!validation.valid) {
    throw new Error("Invalid side-effect sandbox policy: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    requiredGates: Object.freeze([...normalized.requiredGates]),
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function classifySideEffectSandboxRequest(request = {}) {
  const base = isPlainObject(request) ? cloneJson(request) : {};
  const sideEffectLevel = LEVEL_SET.has(base.sideEffectLevel) ? base.sideEffectLevel : "unknown";
  const blockedReasons = uniqueStrings(base.blockedReasons || []);
  const blockReason = LEVEL_BLOCK_REASON[sideEffectLevel];

  if (blockReason) {
    blockedReasons.push(blockReason);
  }

  if (base.runtimeIntegration === true || base.executionAllowed === true) {
    blockedReasons.push("runtime_integration_blocked");
  }

  if (base.modelOutputUsedAsAuthority === true) {
    blockedReasons.push("model_output_authority_blocked");
  }

  if (base.permissionGranted === true || base.grantPermission === true) {
    blockedReasons.push("permission_grant_blocked");
  }

  if (sideEffectLevel !== "none" && sideEffectLevel !== "metadata_only" && sideEffectLevel !== "filesystem_read") {
    blockedReasons.push("sandbox_execution_blocked");
  }

  const normalized = {
    sandboxId: isNonEmptyString(base.sandboxId) ? base.sandboxId : "side_effect_sandbox",
    source: isNonEmptyString(base.source) ? base.source : "unknown",
    sideEffectLevel,
    targetCapability: isNonEmptyString(base.targetCapability) ? base.targetCapability : "unknown",
    requiredGates: uniqueStrings(base.requiredGates || SIDE_EFFECT_SANDBOX_REQUIRED_GATES),
    sandboxRequired: sideEffectLevel !== "none" && sideEffectLevel !== "metadata_only",
    executionAllowed: false,
    filesystemMutationAllowed: false,
    processExecutionAllowed: false,
    blockedReasons: uniqueStrings(blockedReasons)
  };

  const validation = validateSideEffectSandboxPolicy(normalized);

  if (!validation.valid) {
    return Object.freeze({
      valid: false,
      status: "blocked",
      errors: Object.freeze([...validation.errors]),
      policy: Object.freeze(normalized),
      executionAllowed: false,
      filesystemMutationAllowed: false,
      processExecutionAllowed: false,
      canExecuteEffects: false,
      canMutateFilesystem: false,
      canExecuteProcesses: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canUseModelOutputAsAuthority: false
    });
  }

  const created = createSideEffectSandboxPolicy(normalized);

  return Object.freeze({
    valid: true,
    status: created.blockedReasons.length > 0 ? "blocked" : "metadata_only",
    policy: created,
    executionAllowed: false,
    filesystemMutationAllowed: false,
    processExecutionAllowed: false,
    canExecuteEffects: false,
    canMutateFilesystem: false,
    canExecuteProcesses: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsAuthority: false
  });
}

function assertSideEffectSandboxBlocksExecution(request = {}) {
  const classified = classifySideEffectSandboxRequest(request);

  if (
    classified.executionAllowed ||
    classified.filesystemMutationAllowed ||
    classified.processExecutionAllowed ||
    classified.canExecuteEffects ||
    classified.canMutateFilesystem ||
    classified.canExecuteProcesses ||
    classified.canRunGit ||
    classified.canCommit ||
    classified.canGrantPermissions ||
    classified.canUseModelOutputAsAuthority
  ) {
    throw new Error("SideEffectSandbox crossed execution boundary.");
  }

  return true;
}

function summarizeSideEffectSandboxPolicy(policy = {}) {
  const classified = classifySideEffectSandboxRequest(policy);

  return Object.freeze({
    valid: classified.valid,
    status: classified.status,
    sandboxId: classified.policy ? classified.policy.sandboxId : null,
    sideEffectLevel: classified.policy ? classified.policy.sideEffectLevel : null,
    sandboxRequired: classified.policy ? classified.policy.sandboxRequired : false,
    blockedReasonCount: classified.policy ? classified.policy.blockedReasons.length : 0,
    executionAllowed: false,
    filesystemMutationAllowed: false,
    processExecutionAllowed: false,
    canExecuteEffects: false,
    canMutateFilesystem: false,
    canExecuteProcesses: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsAuthority: false
  });
}

module.exports = {
  SIDE_EFFECT_SANDBOX_LEVELS,
  SIDE_EFFECT_SANDBOX_STATUSES,
  SIDE_EFFECT_SANDBOX_BLOCKED_REASONS,
  SIDE_EFFECT_SANDBOX_REQUIRED_GATES,
  createSideEffectSandboxPolicy,
  validateSideEffectSandboxPolicy,
  classifySideEffectSandboxRequest,
  assertSideEffectSandboxBlocksExecution,
  summarizeSideEffectSandboxPolicy
};
