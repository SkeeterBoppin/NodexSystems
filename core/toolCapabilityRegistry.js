"use strict";

const TOOL_CAPABILITY_POLICIES = Object.freeze([
  {
    "toolId": "tools_writefiletool_js",
    "path": "tools/writeFileTool.js",
    "capabilityClass": "write_file",
    "sideEffectLevel": "filesystem_write",
    "defaultPolicy": "deny_by_default",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": true,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Write capability has path/policy markers but still needs central registry policy before broader routing."
  },
  {
    "toolId": "tools_readfiletool_js",
    "path": "tools/readFileTool.js",
    "capabilityClass": "read_file",
    "sideEffectLevel": "filesystem_read",
    "defaultPolicy": "allow_only_with_scope",
    "allowedRoots": [
      "repo"
    ],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": false,
    "requiresEvidenceGate": false,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Read capability is lower risk but still needs allowed-root and blocked-path metadata."
  },
  {
    "toolId": "tools_commandtool_js",
    "path": "tools/commandTool.js",
    "capabilityClass": "execute_command",
    "sideEffectLevel": "process_execution",
    "defaultPolicy": "deny_by_default",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": true,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Command execution is a high-risk side-effect capability. It must be denied by default and require explicit policy before any agent-mediated use."
  },
  {
    "toolId": "tools_pythontool_js",
    "path": "tools/pythonTool.js",
    "capabilityClass": "execute_python",
    "sideEffectLevel": "code_execution",
    "defaultPolicy": "deny_by_default",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": true,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Python execution is code execution and must be explicitly policy-gated."
  },
  {
    "toolId": "tools_audiotool_js",
    "path": "tools/audioTool.js",
    "capabilityClass": "media_tool",
    "sideEffectLevel": "bounded_media_operation",
    "defaultPolicy": "deny_by_default",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": true,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Media tools may read/write/execute indirectly and need registry policy before agent-mediated use."
  },
  {
    "toolId": "tools_imagetool_js",
    "path": "tools/imageTool.js",
    "capabilityClass": "media_tool",
    "sideEffectLevel": "bounded_media_operation",
    "defaultPolicy": "deny_by_default",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": true,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Media tools may read/write/execute indirectly and need registry policy before agent-mediated use."
  },
  {
    "toolId": "tools_videotool_js",
    "path": "tools/videoTool.js",
    "capabilityClass": "media_tool",
    "sideEffectLevel": "bounded_media_operation",
    "defaultPolicy": "deny_by_default",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": true,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Media tools may read/write/execute indirectly and need registry policy before agent-mediated use."
  },
  {
    "toolId": "tools_ffmpegtool_js",
    "path": "tools/ffmpegTool.js",
    "capabilityClass": "media_tool",
    "sideEffectLevel": "bounded_media_operation",
    "defaultPolicy": "deny_by_default",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": true,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Media tools may read/write/execute indirectly and need registry policy before agent-mediated use."
  },
  {
    "toolId": "tools_registry_js",
    "path": "tools/registry.js",
    "capabilityClass": "registry_metadata",
    "sideEffectLevel": "metadata_only",
    "defaultPolicy": "preserve_pending_v2_registry",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": false,
    "requiresEvidenceGate": false,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Existing registry surface should be inspected as metadata substrate before modification."
  },
  {
    "toolId": "tools_toolinterface_js",
    "path": "tools/toolInterface.js",
    "capabilityClass": "tool_routing_or_interface",
    "sideEffectLevel": "routing_metadata",
    "defaultPolicy": "preserve_pending_v2_registry",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": false,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Routing/interface surfaces should not be integrated until registry policy is implemented and tested."
  },
  {
    "toolId": "core_toolrouter_js",
    "path": "core/toolRouter.js",
    "capabilityClass": "tool_routing_or_interface",
    "sideEffectLevel": "routing_metadata",
    "defaultPolicy": "preserve_pending_v2_registry",
    "allowedRoots": [],
    "blockedPaths": [
      ".git",
      "node_modules",
      "C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex Evidence"
    ],
    "requiresHumanApproval": false,
    "requiresEvidenceGate": true,
    "auditLoggingRequired": true,
    "runtimeIntegrationAllowed": false,
    "status": "policy_metadata_only",
    "reason": "Routing/interface surfaces should not be integrated until registry policy is implemented and tested."
  }
]);

const CAPABILITY_CLASSES = Object.freeze([
  "read_file",
  "write_file",
  "execute_command",
  "execute_python",
  "media_tool",
  "registry_metadata",
  "tool_routing_or_interface"
]);
const SIDE_EFFECT_LEVELS = Object.freeze([
  "metadata_only",
  "routing_metadata",
  "filesystem_read",
  "filesystem_write",
  "process_execution",
  "code_execution",
  "bounded_media_operation"
]);
const DEFAULT_POLICIES = Object.freeze([
  "deny_by_default",
  "allow_only_with_scope",
  "preserve_pending_v2_registry"
]);

const REQUIRED_POLICY_FIELDS = Object.freeze([
  "toolId",
  "path",
  "capabilityClass",
  "sideEffectLevel",
  "defaultPolicy",
  "allowedRoots",
  "blockedPaths",
  "requiresHumanApproval",
  "requiresEvidenceGate",
  "auditLoggingRequired",
  "runtimeIntegrationAllowed",
  "status"
]);

const CAPABILITY_CLASS_SET = new Set(CAPABILITY_CLASSES);
const SIDE_EFFECT_LEVEL_SET = new Set(SIDE_EFFECT_LEVELS);
const DEFAULT_POLICY_SET = new Set(DEFAULT_POLICIES);

const HIGH_RISK_SIDE_EFFECTS = Object.freeze([
  "filesystem_write",
  "process_execution",
  "code_execution"
]);

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

function isRepoRelativePath(value) {
  return isNonEmptyString(value) &&
    !/^[A-Za-z]:\\/.test(value) &&
    !value.startsWith("/") &&
    !value.includes("..");
}

function isHighRisk(policy) {
  return HIGH_RISK_SIDE_EFFECTS.includes(policy.sideEffectLevel);
}

function validateToolCapabilityPolicy(policy = {}) {
  const errors = [];

  if (!isPlainObject(policy)) {
    return {
      valid: false,
      errors: ["policy must be an object"]
    };
  }

  for (const field of REQUIRED_POLICY_FIELDS) {
    if (!(field in policy)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of [
    "toolId",
    "path",
    "capabilityClass",
    "sideEffectLevel",
    "defaultPolicy",
    "status"
  ]) {
    if (field in policy && !isNonEmptyString(policy[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("path" in policy && !isRepoRelativePath(policy.path)) {
    errors.push("path must be repo-relative and must not contain traversal");
  }

  if ("capabilityClass" in policy && !CAPABILITY_CLASS_SET.has(policy.capabilityClass)) {
    errors.push("unknown capabilityClass: " + policy.capabilityClass);
  }

  if ("sideEffectLevel" in policy && !SIDE_EFFECT_LEVEL_SET.has(policy.sideEffectLevel)) {
    errors.push("unknown sideEffectLevel: " + policy.sideEffectLevel);
  }

  if ("defaultPolicy" in policy && !DEFAULT_POLICY_SET.has(policy.defaultPolicy)) {
    errors.push("unknown defaultPolicy: " + policy.defaultPolicy);
  }

  if (!Array.isArray(policy.allowedRoots)) {
    errors.push("allowedRoots must be an array");
  } else if (!policy.allowedRoots.every(isNonEmptyString)) {
    errors.push("allowedRoots must contain only non-empty strings");
  }

  if (!Array.isArray(policy.blockedPaths)) {
    errors.push("blockedPaths must be an array");
  } else if (!policy.blockedPaths.every(isNonEmptyString)) {
    errors.push("blockedPaths must contain only non-empty strings");
  }

  for (const field of [
    "requiresHumanApproval",
    "requiresEvidenceGate",
    "auditLoggingRequired",
    "runtimeIntegrationAllowed"
  ]) {
    if (field in policy && typeof policy[field] !== "boolean") {
      errors.push(field + " must be a boolean");
    }
  }

  if (policy.runtimeIntegrationAllowed !== false) {
    errors.push("runtimeIntegrationAllowed must be false in ToolCapabilityRegistry v2 metadata seam");
  }

  if (isHighRisk(policy)) {
    if (policy.defaultPolicy !== "deny_by_default") {
      errors.push("high-risk side effects must be deny_by_default");
    }

    if (policy.requiresHumanApproval !== true) {
      errors.push("high-risk side effects must require human approval");
    }

    if (policy.requiresEvidenceGate !== true) {
      errors.push("high-risk side effects must require EvidenceGate");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createToolCapabilityPolicy(policy = {}) {
  const cloned = {
    ...policy,
    allowedRoots: uniqueStrings(policy.allowedRoots),
    blockedPaths: uniqueStrings(policy.blockedPaths)
  };

  const validation = validateToolCapabilityPolicy(cloned);

  if (!validation.valid) {
    throw new Error("Invalid tool capability policy: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...cloned,
    allowedRoots: Object.freeze([...cloned.allowedRoots]),
    blockedPaths: Object.freeze([...cloned.blockedPaths])
  });
}

function createToolCapabilityRegistry(policies = TOOL_CAPABILITY_POLICIES) {
  if (!Array.isArray(policies)) {
    throw new Error("policies must be an array");
  }

  const byToolId = new Map();
  const byPath = new Map();

  for (const policy of policies) {
    const created = createToolCapabilityPolicy(policy);

    if (byToolId.has(created.toolId)) {
      throw new Error("Duplicate tool capability policy id: " + created.toolId);
    }

    if (byPath.has(created.path)) {
      throw new Error("Duplicate tool capability policy path: " + created.path);
    }

    byToolId.set(created.toolId, created);
    byPath.set(created.path, created);
  }

  return Object.freeze({
    version: 2,
    metadataOnly: true,
    runtimeIntegrationAllowed: false,
    policies: Object.freeze([...byToolId.values()]),
    byToolId,
    byPath
  });
}

function getToolCapabilityPolicy(registry, idOrPath) {
  if (!registry || !registry.byToolId || !registry.byPath) {
    throw new Error("registry must be created by createToolCapabilityRegistry");
  }

  if (!isNonEmptyString(idOrPath)) {
    throw new Error("idOrPath must be a non-empty string");
  }

  return registry.byToolId.get(idOrPath) || registry.byPath.get(idOrPath) || null;
}

function classifyToolCapability(policy = {}) {
  const created = createToolCapabilityPolicy(policy);
  const highRisk = isHighRisk(created);

  return {
    toolId: created.toolId,
    path: created.path,
    capabilityClass: created.capabilityClass,
    sideEffectLevel: created.sideEffectLevel,
    defaultPolicy: created.defaultPolicy,
    highRisk,
    requiresHumanApproval: created.requiresHumanApproval,
    requiresEvidenceGate: created.requiresEvidenceGate,
    runtimeIntegrationAllowed: created.runtimeIntegrationAllowed,
    canExecuteRuntime: false,
    canGrantPermission: false,
    canServeAsAuthority: false,
    reason: "ToolCapabilityRegistry v2 is metadata/validation only; runtime integration is blocked."
  };
}

function canUseToolCapability(policy = {}, requestedUse = "runtime_use") {
  const created = createToolCapabilityPolicy(policy);

  if (requestedUse === "metadata_inspection") {
    return true;
  }

  if (created.runtimeIntegrationAllowed !== true) {
    return false;
  }

  if (created.defaultPolicy === "deny_by_default") {
    return false;
  }

  if (created.defaultPolicy === "allow_only_with_scope") {
    return requestedUse === "scoped_read";
  }

  return false;
}

function assertToolCapabilityAllowed(policy = {}, requestedUse = "runtime_use") {
  const created = createToolCapabilityPolicy(policy);

  if (!canUseToolCapability(created, requestedUse)) {
    throw new Error("Tool capability use denied by registry policy: " + created.path + " requestedUse=" + requestedUse);
  }

  return true;
}

function summarizeToolCapabilityRisk(registry = createToolCapabilityRegistry()) {
  if (!registry || !Array.isArray(registry.policies)) {
    throw new Error("registry must be created by createToolCapabilityRegistry");
  }

  const highRiskPolicies = registry.policies.filter(isHighRisk);
  const denyByDefaultPolicies = registry.policies.filter(policy => policy.defaultPolicy === "deny_by_default");
  const runtimeAllowedPolicies = registry.policies.filter(policy => policy.runtimeIntegrationAllowed === true);
  const evidenceGatePolicies = registry.policies.filter(policy => policy.requiresEvidenceGate === true);
  const humanApprovalPolicies = registry.policies.filter(policy => policy.requiresHumanApproval === true);

  return Object.freeze({
    totalPolicies: registry.policies.length,
    highRiskPolicies: highRiskPolicies.length,
    denyByDefaultPolicies: denyByDefaultPolicies.length,
    runtimeAllowedPolicies: runtimeAllowedPolicies.length,
    evidenceGatePolicies: evidenceGatePolicies.length,
    humanApprovalPolicies: humanApprovalPolicies.length,
    metadataOnly: registry.metadataOnly === true,
    runtimeIntegrationAllowed: registry.runtimeIntegrationAllowed === true
  });
}

module.exports = {
  TOOL_CAPABILITY_POLICIES,
  CAPABILITY_CLASSES,
  SIDE_EFFECT_LEVELS,
  DEFAULT_POLICIES,
  createToolCapabilityPolicy,
  validateToolCapabilityPolicy,
  createToolCapabilityRegistry,
  getToolCapabilityPolicy,
  classifyToolCapability,
  canUseToolCapability,
  assertToolCapabilityAllowed,
  summarizeToolCapabilityRisk
};
