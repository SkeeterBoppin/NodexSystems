"use strict";

const TOOL_CAPABILITY_REGISTRY_COVERAGE_STATUSES = Object.freeze({
  PASS: "pass",
  INVALID: "invalid"
});

const TOOL_CAPABILITY_REGISTRY_COVERAGE_BLOCKED_REASONS = Object.freeze({
  MISSING_TOOL_CAPABILITY_REGISTRY_METADATA: "missing_tool_capability_registry_metadata",
  TOOL_EXECUTION_NOT_ALLOWED: "tool_execution_not_allowed",
  RUNTIME_EXECUTION_NOT_ALLOWED: "runtime_execution_not_allowed",
  RUNTIME_FILE_WRITES_NOT_ALLOWED: "runtime_file_writes_not_allowed",
  PROCESS_EXECUTION_NOT_ALLOWED: "process_execution_not_allowed",
  GIT_EXECUTION_BY_NODEX_NOT_ALLOWED: "git_execution_by_nodex_not_allowed",
  PERMISSION_GRANTS_NOT_ALLOWED: "permission_grants_not_allowed",
  AGENT_HANDOFF_RUNTIME_WIRING_NOT_ALLOWED: "agent_handoff_runtime_wiring_not_allowed",
  MODEL_OUTPUT_AUTHORITY_NOT_ALLOWED: "model_output_authority_not_allowed",
  REPLAY_AUTHORITY_NOT_ALLOWED: "replay_authority_not_allowed"
});

const DEFAULT_BOUNDARY = Object.freeze({
  activationAllowed: false,
  runtimeIntegrationAllowed: false,
  actualDryRunExecutionAllowed: false,
  runtimeExecutionAllowed: false,
  toolExecutionAllowed: false,
  runtimeFileWritesAllowed: false,
  processExecutionAllowed: false,
  gitExecutionAllowedByNodex: false,
  permissionGrantsAllowed: false,
  agentHandoffRuntimeWiringAllowed: false,
  modelOutputAuthorityAllowed: false,
  replayAuthorityAllowed: false,
  externalReviewAuthorityAllowed: false,
  deepResearchAuthorityAllowed: false
});

const REQUIRED_FALSE_BOUNDARIES = Object.freeze([
  "activationAllowed",
  "runtimeIntegrationAllowed",
  "actualDryRunExecutionAllowed",
  "runtimeExecutionAllowed",
  "toolExecutionAllowed",
  "runtimeFileWritesAllowed",
  "processExecutionAllowed",
  "gitExecutionAllowedByNodex",
  "permissionGrantsAllowed",
  "agentHandoffRuntimeWiringAllowed",
  "modelOutputAuthorityAllowed",
  "replayAuthorityAllowed",
  "externalReviewAuthorityAllowed",
  "deepResearchAuthorityAllowed"
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneRecord(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBoundary(boundary = {}) {
  return {
    ...DEFAULT_BOUNDARY,
    ...(isRecord(boundary) ? boundary : {})
  };
}

function normalizeRegistryMetadata(registryMetadata = {}) {
  if (!isRecord(registryMetadata)) {
    return {
      present: false,
      exportedKeys: [],
      callableExports: [],
      forbiddenExportsAbsent: false
    };
  }

  return {
    present: registryMetadata.present === true,
    exportedKeys: Array.isArray(registryMetadata.exportedKeys) ? [...registryMetadata.exportedKeys] : [],
    callableExports: Array.isArray(registryMetadata.callableExports) ? [...registryMetadata.callableExports] : [],
    forbiddenExportsAbsent: registryMetadata.forbiddenExportsAbsent === true
  };
}

function createToolCapabilityRegistryCoverage(input = {}) {
  const registryMetadata = normalizeRegistryMetadata(input.registryMetadata);
  const boundary = normalizeBoundary(input.boundary);

  return Object.freeze({
    schema: "nodex.toolCapabilityRegistryCoverage.v1",
    seam: input.seam || "ToolCapabilityRegistryCoverageImplementation v1",
    metadataOnly: input.metadataOnly !== false,
    targetControl: input.targetControl || "tool_capability_registry",
    registryMetadata: Object.freeze(registryMetadata),
    boundary: Object.freeze(boundary),
    coverageChecks: Object.freeze({
      registryMetadataPresent: registryMetadata.present === true,
      forbiddenRuntimeExportsAbsent: registryMetadata.forbiddenExportsAbsent === true,
      toolExecutionBlocked: boundary.toolExecutionAllowed === false,
      runtimeExecutionBlocked: boundary.runtimeExecutionAllowed === false,
      runtimeFileWritesBlocked: boundary.runtimeFileWritesAllowed === false,
      processExecutionBlocked: boundary.processExecutionAllowed === false,
      gitExecutionByNodexBlocked: boundary.gitExecutionAllowedByNodex === false,
      permissionGrantsBlocked: boundary.permissionGrantsAllowed === false,
      agentHandoffRuntimeWiringBlocked: boundary.agentHandoffRuntimeWiringAllowed === false,
      modelOutputAuthorityBlocked: boundary.modelOutputAuthorityAllowed === false,
      replayAuthorityBlocked: boundary.replayAuthorityAllowed === false
    }),
    notes: Array.isArray(input.notes) ? [...input.notes] : []
  });
}

function validateToolCapabilityRegistryCoverage(coverage) {
  const errors = [];

  if (!isRecord(coverage)) {
    return Object.freeze({
      valid: false,
      errors: Object.freeze(["coverage must be an object"])
    });
  }

  if (coverage.schema !== "nodex.toolCapabilityRegistryCoverage.v1") {
    errors.push("schema must be nodex.toolCapabilityRegistryCoverage.v1");
  }

  if (coverage.seam !== "ToolCapabilityRegistryCoverageImplementation v1") {
    errors.push("seam must be ToolCapabilityRegistryCoverageImplementation v1");
  }

  if (coverage.metadataOnly !== true) {
    errors.push("metadataOnly must be true");
  }

  if (coverage.targetControl !== "tool_capability_registry") {
    errors.push("targetControl must be tool_capability_registry");
  }

  if (!isRecord(coverage.registryMetadata)) {
    errors.push("registryMetadata must be an object");
  } else {
    if (coverage.registryMetadata.present !== true) {
      errors.push("registryMetadata.present must be true");
    }

    if (!Array.isArray(coverage.registryMetadata.exportedKeys)) {
      errors.push("registryMetadata.exportedKeys must be an array");
    }

    if (!Array.isArray(coverage.registryMetadata.callableExports)) {
      errors.push("registryMetadata.callableExports must be an array");
    }

    if (coverage.registryMetadata.forbiddenExportsAbsent !== true) {
      errors.push("registryMetadata.forbiddenExportsAbsent must be true");
    }
  }

  if (!isRecord(coverage.boundary)) {
    errors.push("boundary must be an object");
  } else {
    for (const key of REQUIRED_FALSE_BOUNDARIES) {
      if (coverage.boundary[key] !== false) {
        errors.push(`boundary must remain false: ${key}`);
      }
    }
  }

  if (!isRecord(coverage.coverageChecks)) {
    errors.push("coverageChecks must be an object");
  } else {
    for (const [key, value] of Object.entries(coverage.coverageChecks)) {
      if (value !== true) {
        errors.push(`coverage check must be true: ${key}`);
      }
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function classifyToolCapabilityRegistryCoverage(coverage) {
  const validation = validateToolCapabilityRegistryCoverage(coverage);

  if (!validation.valid) {
    return Object.freeze({
      status: TOOL_CAPABILITY_REGISTRY_COVERAGE_STATUSES.INVALID,
      reasons: Object.freeze([...validation.errors])
    });
  }

  return Object.freeze({
    status: TOOL_CAPABILITY_REGISTRY_COVERAGE_STATUSES.PASS,
    reasons: Object.freeze([])
  });
}

function assertToolCapabilityRegistryCoverageNotExecutable(coverage) {
  const classification = classifyToolCapabilityRegistryCoverage(coverage);

  if (classification.status !== TOOL_CAPABILITY_REGISTRY_COVERAGE_STATUSES.PASS) {
    throw new Error(`tool capability registry coverage failed: ${classification.reasons.join(", ")}`);
  }

  return true;
}

function summarizeToolCapabilityRegistryCoverage(coverage) {
  const validation = validateToolCapabilityRegistryCoverage(coverage);
  const classification = classifyToolCapabilityRegistryCoverage(coverage);

  return Object.freeze({
    schema: coverage?.schema,
    seam: coverage?.seam,
    targetControl: coverage?.targetControl,
    metadataOnly: coverage?.metadataOnly === true,
    valid: validation.valid,
    status: classification.status,
    reasons: Object.freeze([...classification.reasons]),
    authorityGranted: false,
    registryMetadata: cloneRecord(coverage?.registryMetadata || {}),
    boundary: cloneRecord(coverage?.boundary || {})
  });
}

module.exports = {
  TOOL_CAPABILITY_REGISTRY_COVERAGE_STATUSES,
  TOOL_CAPABILITY_REGISTRY_COVERAGE_BLOCKED_REASONS,
  createToolCapabilityRegistryCoverage,
  validateToolCapabilityRegistryCoverage,
  classifyToolCapabilityRegistryCoverage,
  assertToolCapabilityRegistryCoverageNotExecutable,
  summarizeToolCapabilityRegistryCoverage
};
