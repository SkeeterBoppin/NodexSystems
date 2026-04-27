"use strict";

const DRY_RUN_NONBYPASSABILITY_CENSUS_STATUSES = Object.freeze({
  PASS: "pass",
  INVALID: "invalid"
});

const DRY_RUN_NONBYPASSABILITY_CENSUS_BLOCKED_REASONS = Object.freeze({
  MISSING_DRY_RUN_EXECUTION_PATH: "missing_dry_run_execution_path",
  MISSING_DRY_RUN_ADAPTER_PATH: "missing_dry_run_adapter_path",
  MISSING_DRY_RUN_CONTRACT: "missing_dry_run_contract",
  ACTUAL_DRY_RUN_EXECUTION_NOT_ALLOWED: "actual_dry_run_execution_not_allowed",
  RUNTIME_INTEGRATION_NOT_ALLOWED: "runtime_integration_not_allowed",
  RUNTIME_EXECUTION_NOT_ALLOWED: "runtime_execution_not_allowed",
  TOOL_EXECUTION_NOT_ALLOWED: "tool_execution_not_allowed",
  RUNTIME_FILE_WRITES_NOT_ALLOWED: "runtime_file_writes_not_allowed",
  PROCESS_EXECUTION_NOT_ALLOWED: "process_execution_not_allowed",
  GIT_EXECUTION_BY_NODEX_NOT_ALLOWED: "git_execution_by_nodex_not_allowed",
  PERMISSION_GRANTS_NOT_ALLOWED: "permission_grants_not_allowed",
  AGENT_HANDOFF_RUNTIME_WIRING_NOT_ALLOWED: "agent_handoff_runtime_wiring_not_allowed",
  MODEL_OUTPUT_AUTHORITY_NOT_ALLOWED: "model_output_authority_not_allowed",
  REPLAY_AUTHORITY_NOT_ALLOWED: "replay_authority_not_allowed",
  EXTERNAL_REVIEW_AUTHORITY_NOT_ALLOWED: "external_review_authority_not_allowed",
  DEEP_RESEARCH_AUTHORITY_NOT_ALLOWED: "deep_research_authority_not_allowed"
});

const REQUIRED_DEPENDENCIES = Object.freeze([
  "runtimeDryRunExecutionPath",
  "runtimeIntegrationPlanExecutorDryRunPath",
  "runtimeDryRunContract"
]);

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

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneRecord(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDependencyMap(dependencies = {}) {
  const normalized = {};

  for (const dependencyName of REQUIRED_DEPENDENCIES) {
    normalized[dependencyName] = dependencies[dependencyName] === true;
  }

  return normalized;
}

function normalizeBoundary(boundary = {}) {
  return {
    ...DEFAULT_BOUNDARY,
    ...(isRecord(boundary) ? boundary : {})
  };
}

function createDryRunNonBypassabilityCensus(input = {}) {
  const dependencies = normalizeDependencyMap(input.dependencies);
  const boundary = normalizeBoundary(input.boundary);

  return Object.freeze({
    schema: "nodex.dryRunNonBypassabilityCensus.v1",
    seam: input.seam || "DryRunNonBypassabilityCensusImplementation v1",
    metadataOnly: input.metadataOnly !== false,
    dependencies,
    boundary,
    bypassChecks: Object.freeze({
      dryRunClassificationOnly: input.bypassChecks?.dryRunClassificationOnly === true,
      noRuntimeAuthorityGranted: input.bypassChecks?.noRuntimeAuthorityGranted !== false,
      noAdapterInvocationGranted: input.bypassChecks?.noAdapterInvocationGranted !== false,
      noAgentHandoffRuntimeWiringGranted: input.bypassChecks?.noAgentHandoffRuntimeWiringGranted !== false,
      noModelOutputAuthorityGranted: input.bypassChecks?.noModelOutputAuthorityGranted !== false,
      noReplayAuthorityGranted: input.bypassChecks?.noReplayAuthorityGranted !== false
    }),
    notes: Array.isArray(input.notes) ? [...input.notes] : []
  });
}

function validateDryRunNonBypassabilityCensus(census) {
  const errors = [];

  if (!isRecord(census)) {
    return Object.freeze({
      valid: false,
      errors: Object.freeze(["census must be an object"])
    });
  }

  if (census.schema !== "nodex.dryRunNonBypassabilityCensus.v1") {
    errors.push("schema must be nodex.dryRunNonBypassabilityCensus.v1");
  }

  if (census.seam !== "DryRunNonBypassabilityCensusImplementation v1") {
    errors.push("seam must be DryRunNonBypassabilityCensusImplementation v1");
  }

  if (census.metadataOnly !== true) {
    errors.push("metadataOnly must be true");
  }

  if (!isRecord(census.dependencies)) {
    errors.push("dependencies must be an object");
  } else {
    for (const dependencyName of REQUIRED_DEPENDENCIES) {
      if (census.dependencies[dependencyName] !== true) {
        errors.push(`dependency must be present: ${dependencyName}`);
      }
    }
  }

  if (!isRecord(census.boundary)) {
    errors.push("boundary must be an object");
  } else {
    for (const key of REQUIRED_FALSE_BOUNDARIES) {
      if (census.boundary[key] !== false) {
        errors.push(`boundary must remain false: ${key}`);
      }
    }
  }

  if (!isRecord(census.bypassChecks)) {
    errors.push("bypassChecks must be an object");
  } else {
    const requiredTrueChecks = [
      "dryRunClassificationOnly",
      "noRuntimeAuthorityGranted",
      "noAdapterInvocationGranted",
      "noAgentHandoffRuntimeWiringGranted",
      "noModelOutputAuthorityGranted",
      "noReplayAuthorityGranted"
    ];

    for (const check of requiredTrueChecks) {
      if (census.bypassChecks[check] !== true) {
        errors.push(`bypass check must be true: ${check}`);
      }
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function classifyDryRunNonBypassabilityCensus(census) {
  const validation = validateDryRunNonBypassabilityCensus(census);

  if (!validation.valid) {
    return Object.freeze({
      status: DRY_RUN_NONBYPASSABILITY_CENSUS_STATUSES.INVALID,
      reasons: Object.freeze([...validation.errors])
    });
  }

  return Object.freeze({
    status: DRY_RUN_NONBYPASSABILITY_CENSUS_STATUSES.PASS,
    reasons: Object.freeze([])
  });
}

function assertDryRunNonBypassabilityCensusNotBypassable(census) {
  const classification = classifyDryRunNonBypassabilityCensus(census);

  if (classification.status !== DRY_RUN_NONBYPASSABILITY_CENSUS_STATUSES.PASS) {
    throw new Error(`dry-run nonbypassability census failed: ${classification.reasons.join(", ")}`);
  }

  return true;
}

function summarizeDryRunNonBypassabilityCensus(census) {
  const validation = validateDryRunNonBypassabilityCensus(census);
  const classification = classifyDryRunNonBypassabilityCensus(census);

  return Object.freeze({
    schema: census?.schema,
    seam: census?.seam,
    metadataOnly: census?.metadataOnly === true,
    valid: validation.valid,
    status: classification.status,
    reasons: Object.freeze([...classification.reasons]),
    authorityGranted: false,
    boundary: cloneRecord(census?.boundary || {})
  });
}

module.exports = {
  DRY_RUN_NONBYPASSABILITY_CENSUS_STATUSES,
  DRY_RUN_NONBYPASSABILITY_CENSUS_BLOCKED_REASONS,
  createDryRunNonBypassabilityCensus,
  validateDryRunNonBypassabilityCensus,
  classifyDryRunNonBypassabilityCensus,
  assertDryRunNonBypassabilityCensusNotBypassable,
  summarizeDryRunNonBypassabilityCensus
};
