"use strict";

const EXECUTION_ADAPTER_TYPES = Object.freeze([
  "metadata",
  "tool",
  "file",
  "command",
  "git",
  "model",
  "runtime"
]);

const EXECUTION_ADAPTER_STATUSES = Object.freeze([
  "metadata_only",
  "blocked",
  "deferred"
]);

const EXECUTION_ADAPTER_SIDE_EFFECT_LEVELS = Object.freeze([
  "none",
  "metadata_only",
  "filesystem_read",
  "filesystem_write",
  "process_execution",
  "code_execution",
  "git_execution",
  "model_execution",
  "unknown"
]);

const EXECUTION_ADAPTER_BLOCKED_REASONS = Object.freeze([
  "adapter_execution_blocked",
  "tool_adapter_blocked",
  "file_adapter_blocked",
  "command_adapter_blocked",
  "git_adapter_blocked",
  "model_adapter_blocked",
  "runtime_integration_blocked",
  "missing_required_gate",
  "permission_gate_required",
  "evidence_gate_required"
]);

const EXECUTION_ADAPTER_REQUIRED_GATES = Object.freeze([
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ToolCapabilityRegistry",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
]);

const REQUIRED_ADAPTER_POLICY_FIELDS = Object.freeze([
  "adapterId",
  "adapterType",
  "targetCapability",
  "sideEffectLevel",
  "requiredGates",
  "defaultPolicy",
  "runtimeExecutionAllowed",
  "blockedReasons"
]);

const TYPE_SET = new Set(EXECUTION_ADAPTER_TYPES);
const STATUS_SET = new Set(EXECUTION_ADAPTER_STATUSES);
const SIDE_EFFECT_SET = new Set(EXECUTION_ADAPTER_SIDE_EFFECT_LEVELS);
const BLOCKED_REASON_SET = new Set(EXECUTION_ADAPTER_BLOCKED_REASONS);

const ADAPTER_TYPE_BLOCK_REASON = Object.freeze({
  tool: "tool_adapter_blocked",
  file: "file_adapter_blocked",
  command: "command_adapter_blocked",
  git: "git_adapter_blocked",
  model: "model_adapter_blocked",
  runtime: "runtime_integration_blocked"
});

const SIDE_EFFECT_BLOCK_REASON = Object.freeze({
  filesystem_write: "file_adapter_blocked",
  process_execution: "command_adapter_blocked",
  code_execution: "command_adapter_blocked",
  git_execution: "git_adapter_blocked",
  model_execution: "model_adapter_blocked",
  unknown: "adapter_execution_blocked"
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

function normalizeAdapterPolicy(policy = {}) {
  return {
    ...policy,
    requiredGates: uniqueStrings(policy.requiredGates),
    blockedReasons: uniqueStrings(policy.blockedReasons)
  };
}

function validateExecutionAdapterPolicy(policy = {}) {
  const errors = [];

  if (!isPlainObject(policy)) {
    return {
      valid: false,
      errors: ["adapter policy must be an object"]
    };
  }

  for (const field of REQUIRED_ADAPTER_POLICY_FIELDS) {
    if (!(field in policy)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of [
    "adapterId",
    "adapterType",
    "targetCapability",
    "sideEffectLevel",
    "defaultPolicy"
  ]) {
    if (field in policy && !isNonEmptyString(policy[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("adapterType" in policy && !TYPE_SET.has(policy.adapterType)) {
    errors.push("unknown adapterType: " + policy.adapterType);
  }

  if ("sideEffectLevel" in policy && !SIDE_EFFECT_SET.has(policy.sideEffectLevel)) {
    errors.push("unknown sideEffectLevel: " + policy.sideEffectLevel);
  }

  if ("defaultPolicy" in policy && !STATUS_SET.has(policy.defaultPolicy)) {
    errors.push("unknown defaultPolicy: " + policy.defaultPolicy);
  }

  if (!Array.isArray(policy.requiredGates)) {
    errors.push("requiredGates must be an array");
  } else {
    for (const gate of policy.requiredGates) {
      if (!isNonEmptyString(gate)) {
        errors.push("requiredGates must contain only non-empty strings");
      }
    }

    for (const gate of EXECUTION_ADAPTER_REQUIRED_GATES) {
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

  if (typeof policy.runtimeExecutionAllowed !== "boolean") {
    errors.push("runtimeExecutionAllowed must be a boolean");
  }

  if (policy.runtimeExecutionAllowed !== false) {
    errors.push("runtimeExecutionAllowed must be false in ExecutionAdapterRegistry v1");
  }

  if (policy.executeNow === true || policy.runNow === true || policy.autoExecute === true) {
    errors.push("execution adapter policy must not execute adapters");
  }

  if (policy.grantPermission === true || policy.permissionGranted === true) {
    errors.push("execution adapter policy must not grant permissions");
  }

  if (policy.modelOutputUsedAsAuthority === true) {
    errors.push("model output must not be accepted as adapter authority");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createExecutionAdapterPolicy(policy = {}) {
  const normalized = normalizeAdapterPolicy(cloneJson(policy));
  const validation = validateExecutionAdapterPolicy(normalized);

  if (!validation.valid) {
    throw new Error("Invalid execution adapter policy: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...normalized,
    requiredGates: Object.freeze([...normalized.requiredGates]),
    blockedReasons: Object.freeze([...normalized.blockedReasons])
  });
}

function createExecutionAdapterRegistry(policies = []) {
  const normalizedPolicies = Array.isArray(policies) ? policies : [];

  const createdPolicies = normalizedPolicies.map(createExecutionAdapterPolicy);

  return Object.freeze({
    version: 1,
    metadataOnly: true,
    adapterExecutionAllowed: false,
    runtimeIntegrationAllowed: false,
    policies: Object.freeze([...createdPolicies]),
    getPolicy(adapterId) {
      return createdPolicies.find(policy => policy.adapterId === adapterId) || null;
    },
    classify(request = {}) {
      return classifyExecutionAdapterRequest(request, createdPolicies);
    }
  });
}

function classifyExecutionAdapterRequest(request = {}, policies = []) {
  const base = isPlainObject(request) ? cloneJson(request) : {};
  const blockedReasons = uniqueStrings(base.blockedReasons || []);

  const adapterType = TYPE_SET.has(base.adapterType) ? base.adapterType : "runtime";
  const sideEffectLevel = SIDE_EFFECT_SET.has(base.sideEffectLevel) ? base.sideEffectLevel : "unknown";
  const adapterId = isNonEmptyString(base.adapterId) ? base.adapterId : "unknown_adapter";

  const policy = Array.isArray(policies)
    ? policies.find(item => item.adapterId === adapterId)
    : null;

  if (ADAPTER_TYPE_BLOCK_REASON[adapterType]) {
    blockedReasons.push(ADAPTER_TYPE_BLOCK_REASON[adapterType]);
  }

  if (SIDE_EFFECT_BLOCK_REASON[sideEffectLevel]) {
    blockedReasons.push(SIDE_EFFECT_BLOCK_REASON[sideEffectLevel]);
  }

  if (!policy) {
    blockedReasons.push("adapter_execution_blocked");
  }

  if (base.runtimeIntegration === true || base.runtimeExecutionAllowed === true) {
    blockedReasons.push("runtime_integration_blocked");
  }

  if (base.permissionGranted === true || base.grantPermission === true) {
    blockedReasons.push("permission_gate_required");
  }

  if (base.evidenceState === "missing" || base.evidenceState === "unverified") {
    blockedReasons.push("evidence_gate_required");
  }

  const normalized = {
    adapterId,
    adapterType,
    targetCapability: isNonEmptyString(base.targetCapability) ? base.targetCapability : "unknown",
    sideEffectLevel,
    requiredGates: uniqueStrings(base.requiredGates || EXECUTION_ADAPTER_REQUIRED_GATES),
    defaultPolicy: "blocked",
    runtimeExecutionAllowed: false,
    blockedReasons: uniqueStrings(blockedReasons)
  };

  const validation = validateExecutionAdapterPolicy(normalized);

  if (!validation.valid) {
    return Object.freeze({
      valid: false,
      status: "blocked",
      errors: Object.freeze([...validation.errors]),
      policy: Object.freeze(normalized),
      adapterExecutionAllowed: false,
      runtimeExecutionAllowed: false,
      canExecuteAdapters: false,
      canExecuteTools: false,
      canWriteFiles: false,
      canRunCommands: false,
      canRunGit: false,
      canCommit: false,
      canGrantPermissions: false,
      canUseModelOutputAsAuthority: false
    });
  }

  const created = createExecutionAdapterPolicy(normalized);

  return Object.freeze({
    valid: true,
    status: created.blockedReasons.length > 0 ? "blocked" : "metadata_only",
    policy: created,
    adapterExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    canExecuteAdapters: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunCommands: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsAuthority: false
  });
}

function assertExecutionAdapterNotExecutable(request = {}, policies = []) {
  const classified = classifyExecutionAdapterRequest(request, policies);

  if (
    classified.adapterExecutionAllowed ||
    classified.runtimeExecutionAllowed ||
    classified.canExecuteAdapters ||
    classified.canExecuteTools ||
    classified.canWriteFiles ||
    classified.canRunCommands ||
    classified.canRunGit ||
    classified.canCommit ||
    classified.canGrantPermissions ||
    classified.canUseModelOutputAsAuthority
  ) {
    throw new Error("Execution adapter crossed execution boundary.");
  }

  return true;
}

function summarizeExecutionAdapterRegistry(registry = createExecutionAdapterRegistry()) {
  const policies = Array.isArray(registry.policies) ? registry.policies : [];

  return Object.freeze({
    version: registry.version || 1,
    metadataOnly: true,
    adapterExecutionAllowed: false,
    runtimeIntegrationAllowed: false,
    policyCount: policies.length,
    executablePolicyCount: policies.filter(policy => policy.runtimeExecutionAllowed === true).length,
    blockedPolicyCount: policies.filter(policy => policy.defaultPolicy === "blocked").length,
    canExecuteAdapters: false,
    canExecuteTools: false,
    canWriteFiles: false,
    canRunCommands: false,
    canRunGit: false,
    canCommit: false,
    canGrantPermissions: false,
    canUseModelOutputAsAuthority: false
  });
}

module.exports = {
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
};
