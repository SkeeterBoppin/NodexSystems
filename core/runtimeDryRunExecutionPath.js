"use strict";

const RUNTIME_DRY_RUN_EXECUTION_PATH_STATUSES = Object.freeze({
  VALID_METADATA_ONLY: "valid_metadata_only",
  BLOCKED: "blocked",
  INVALID: "invalid"
});

const RUNTIME_DRY_RUN_EXECUTION_PATH_BLOCKED_REASONS = Object.freeze({
  ACTUAL_DRY_RUN_EXECUTION_BLOCKED: "actual_dry_run_execution_blocked",
  RUNTIME_INTEGRATION_BLOCKED: "runtime_integration_blocked",
  RUNTIME_EXECUTION_BLOCKED: "runtime_execution_blocked",
  TOOL_EXECUTION_BLOCKED: "tool_execution_blocked",
  RUNTIME_FILE_WRITES_BLOCKED: "runtime_file_writes_blocked",
  PROCESS_EXECUTION_BLOCKED: "process_execution_blocked",
  GIT_EXECUTION_BLOCKED: "git_execution_blocked",
  PERMISSION_GRANTS_BLOCKED: "permission_grants_blocked",
  AGENT_HANDOFF_RUNTIME_WIRING_BLOCKED: "agent_handoff_runtime_wiring_blocked",
  MODEL_OUTPUT_AUTHORITY_BLOCKED: "model_output_authority_blocked",
  REPLAY_AUTHORITY_BLOCKED: "replay_authority_blocked",
  MISSING_DRY_RUN_PATH: "missing_dry_run_path",
  MISSING_RUNTIME_DRY_RUN_CONTRACT: "missing_runtime_dry_run_contract",
  MISSING_RUNTIME_USER_APPROVAL_CHECKPOINT: "missing_runtime_user_approval_checkpoint",
  UNAPPROVED_CANDIDATE_FILE: "unapproved_candidate_file"
});

const REQUIRED_CONTRACTS = Object.freeze([
  "RuntimeIntegrationPlanExecutorDryRunPath",
  "RuntimeDryRunContract",
  "RuntimeUserApprovalCheckpoint",
  "RuntimeIntegrationBoundary",
  "PermissionGate",
  "ExecutionAdapterRegistry",
  "SideEffectSandbox",
  "ToolExecutionAuditLog",
  "EvidenceGate",
  "ReplayStore",
  "CommitGate"
]);

const APPROVED_CANDIDATE_FILES = Object.freeze([
  "core/runtimeDryRunExecutionPath.js",
  "tests/run.js"
]);

const AUTHORITY_DEFAULTS = Object.freeze({
  actualDryRunExecutionAllowed: false,
  runtimeIntegrationAllowed: false,
  runtimeExecutionAllowed: false,
  toolExecutionAllowed: false,
  runtimeFileWritesAllowed: false,
  processExecutionAllowed: false,
  gitExecutionAllowedByNodex: false,
  permissionGrantsAllowed: false,
  agentHandoffRuntimeWiringAllowed: false,
  modelOutputAuthorityAllowed: false,
  replayAuthorityAllowed: false
});

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter(value => typeof value === "string" && value.length > 0)));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeObject(value) {
  return Object.freeze({ ...value });
}

function exactStringSet(values, expected) {
  if (!Array.isArray(values)) return false;
  const actual = [...values].sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length) return false;
  return actual.every((value, index) => value === wanted[index]);
}

function normalizeAuthority(authority = {}) {
  return {
    actualDryRunExecutionAllowed: false,
    runtimeIntegrationAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    processExecutionAllowed: false,
    gitExecutionAllowedByNodex: false,
    permissionGrantsAllowed: false,
    agentHandoffRuntimeWiringAllowed: false,
    modelOutputAuthorityAllowed: false,
    replayAuthorityAllowed: false,
    ...Object.fromEntries(
      Object.keys(authority || {})
        .filter(key => Object.prototype.hasOwnProperty.call(AUTHORITY_DEFAULTS, key))
        .map(key => [key, false])
    )
  };
}

function createRuntimeDryRunExecutionPath(input = {}) {
  const source = isPlainObject(input) ? clone(input) : {};
  const authority = normalizeAuthority(source.authority);

  return Object.freeze({
    version: 1,
    kind: "runtime_dry_run_execution_path_v1",
    pathId: typeof source.pathId === "string" && source.pathId.length > 0
      ? source.pathId
      : "runtime_dry_run_execution_path",
    source: typeof source.source === "string" && source.source.length > 0
      ? source.source
      : "unknown",
    status: RUNTIME_DRY_RUN_EXECUTION_PATH_STATUSES.VALID_METADATA_ONLY,
    metadataOnly: true,
    dryRunPathRequired: true,
    dryRunContractRequired: true,
    userApprovalCheckpointRequired: true,
    requiredContracts: freezeArray(uniqueStrings(source.requiredContracts || REQUIRED_CONTRACTS)),
    approvedCandidateFiles: freezeArray(uniqueStrings(source.approvedCandidateFiles || APPROVED_CANDIDATE_FILES)),
    blockedReasons: freezeArray(uniqueStrings(source.blockedReasons || Object.values(RUNTIME_DRY_RUN_EXECUTION_PATH_BLOCKED_REASONS))),
    authority: freezeObject(authority)
  });
}

function validateRuntimeDryRunExecutionPath(record) {
  const errors = [];

  if (!isPlainObject(record)) {
    return { valid: false, errors: ["record must be a plain object"] };
  }

  if (record.version !== 1) errors.push("version must be 1");
  if (record.kind !== "runtime_dry_run_execution_path_v1") {
    errors.push("kind must be runtime_dry_run_execution_path_v1");
  }
  if (typeof record.pathId !== "string" || record.pathId.length === 0) {
    errors.push("pathId must be a non-empty string");
  }
  if (typeof record.source !== "string" || record.source.length === 0) {
    errors.push("source must be a non-empty string");
  }
  if (record.metadataOnly !== true) errors.push("metadataOnly must be true");
  if (record.dryRunPathRequired !== true) errors.push("dryRunPathRequired must be true");
  if (record.dryRunContractRequired !== true) errors.push("dryRunContractRequired must be true");
  if (record.userApprovalCheckpointRequired !== true) errors.push("userApprovalCheckpointRequired must be true");

  if (!Array.isArray(record.requiredContracts)) {
    errors.push("requiredContracts must be an array");
  } else {
    for (const contract of REQUIRED_CONTRACTS) {
      if (!record.requiredContracts.includes(contract)) {
        errors.push(`missing required contract: ${contract}`);
      }
    }
  }

  if (!exactStringSet(record.approvedCandidateFiles, APPROVED_CANDIDATE_FILES)) {
    errors.push("approvedCandidateFiles must match approved metadata-only candidate files");
  }

  if (!Array.isArray(record.blockedReasons)) {
    errors.push("blockedReasons must be an array");
  } else {
    for (const reason of Object.values(RUNTIME_DRY_RUN_EXECUTION_PATH_BLOCKED_REASONS)) {
      if (!record.blockedReasons.includes(reason)) {
        errors.push(`missing blocked reason: ${reason}`);
      }
    }
  }

  if (!isPlainObject(record.authority)) {
    errors.push("authority must be a plain object");
  } else {
    for (const key of Object.keys(AUTHORITY_DEFAULTS)) {
      if (record.authority[key] !== false) {
        errors.push(`authority.${key} must be false`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function classifyRuntimeDryRunExecutionPath(record) {
  const validation = validateRuntimeDryRunExecutionPath(record);
  const blockedReasons = Array.isArray(record && record.blockedReasons)
    ? uniqueStrings(record.blockedReasons)
    : [];

  return Object.freeze({
    valid: validation.valid,
    status: validation.valid
      ? RUNTIME_DRY_RUN_EXECUTION_PATH_STATUSES.VALID_METADATA_ONLY
      : RUNTIME_DRY_RUN_EXECUTION_PATH_STATUSES.INVALID,
    metadataOnly: true,
    executable: false,
    actualDryRunExecutionAllowed: false,
    runtimeIntegrationAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    processExecutionAllowed: false,
    gitExecutionAllowedByNodex: false,
    permissionGrantsAllowed: false,
    agentHandoffRuntimeWiringAllowed: false,
    modelOutputAuthorityAllowed: false,
    replayAuthorityAllowed: false,
    blockedReasons: freezeArray(blockedReasons),
    errors: freezeArray(validation.errors)
  });
}

function assertRuntimeDryRunExecutionPathNotExecutable(record) {
  const validation = validateRuntimeDryRunExecutionPath(record);

  if (!validation.valid) {
    throw new Error(`Invalid runtime dry-run execution path: ${validation.errors.join("; ")}`);
  }

  for (const key of Object.keys(AUTHORITY_DEFAULTS)) {
    if (record.authority[key] !== false) {
      throw new Error(`Runtime dry-run execution path authority boundary crossed: ${key}`);
    }
  }

  return true;
}

function summarizeRuntimeDryRunExecutionPath(record) {
  const classification = classifyRuntimeDryRunExecutionPath(record);

  return Object.freeze({
    valid: classification.valid,
    status: classification.status,
    metadataOnly: true,
    executable: false,
    actualDryRunExecutionAllowed: false,
    runtimeIntegrationAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    processExecutionAllowed: false,
    gitExecutionAllowedByNodex: false,
    permissionGrantsAllowed: false,
    agentHandoffRuntimeWiringAllowed: false,
    modelOutputAuthorityAllowed: false,
    replayAuthorityAllowed: false,
    blockedReasonCount: classification.blockedReasons.length,
    errorCount: classification.errors.length
  });
}

module.exports = {
  RUNTIME_DRY_RUN_EXECUTION_PATH_STATUSES,
  RUNTIME_DRY_RUN_EXECUTION_PATH_BLOCKED_REASONS,
  createRuntimeDryRunExecutionPath,
  validateRuntimeDryRunExecutionPath,
  classifyRuntimeDryRunExecutionPath,
  assertRuntimeDryRunExecutionPathNotExecutable,
  summarizeRuntimeDryRunExecutionPath
};
