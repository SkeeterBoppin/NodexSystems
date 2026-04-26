"use strict";

const RUNTIME_INTEGRATION_PLAN_STATUSES = Object.freeze({
  CREATED: "created",
  VALID_METADATA_ONLY: "valid_metadata_only",
  INVALID: "invalid",
});

const RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS = Object.freeze({
  MISSING_DRY_RUN_CONTRACT: "missing_runtime_dry_run_contract",
  MISSING_USER_APPROVAL_CHECKPOINT: "missing_runtime_user_approval_checkpoint",
  RUNTIME_INTEGRATION_BLOCKED: "runtime_integration_blocked",
  RUNTIME_EXECUTION_BLOCKED: "runtime_execution_blocked",
  TOOL_EXECUTION_BLOCKED: "tool_execution_blocked",
  RUNTIME_FILE_WRITES_BLOCKED: "runtime_file_writes_blocked",
  PROCESS_EXECUTION_BLOCKED: "process_execution_blocked",
  GIT_EXECUTION_BLOCKED: "git_execution_blocked",
  COMMITS_BLOCKED: "commits_blocked",
  PERMISSION_GRANTS_BLOCKED: "permission_grants_blocked",
  AGENT_HANDOFF_RUNTIME_WIRING_BLOCKED: "agent_handoff_runtime_wiring_blocked",
  MODEL_OUTPUT_AUTHORITY_BLOCKED: "model_output_authority_blocked",
  REPLAY_AUTHORITY_BLOCKED: "replay_authority_blocked",
});

const APPROVED_CANDIDATE_FILES = Object.freeze([
  "core/runtimeIntegrationPlanExecutor.js",
  "tests/run.js",
]);

const BLOCKED_RUNTIME_FILES = Object.freeze([
  "tools/" + "write" + "FileTool.js",
  "tools/commandTool.js",
  "tools/pythonTool.js",
  "core/agentHandoffRunner.js",
  "core/executionAdapterRegistry.js",
  "core/permissionGate.js",
  "core/runtimeIntegrationBoundary.js",
]);

const REQUIRED_AUTHORITY_FALSE_FIELDS = Object.freeze([
  "runtimeIntegrationAllowed",
  "runtimeExecutionAllowed",
  "toolExecutionAllowed",
  "runtimeFileWritesAllowed",
  "processExecutionAllowed",
  "gitExecutionAllowed",
  "commitsAllowed",
  "permissionGrantsAllowed",
  "agentHandoffRuntimeWiringAllowed",
  "modelOutputAuthorityAllowed",
  "replayAuthorityAllowed",
]);

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function createBlockedAuthority() {
  return Object.freeze({
    runtimeIntegrationAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    processExecutionAllowed: false,
    gitExecutionAllowed: false,
    commitsAllowed: false,
    permissionGrantsAllowed: false,
    agentHandoffRuntimeWiringAllowed: false,
    modelOutputAuthorityAllowed: false,
    replayAuthorityAllowed: false,
  });
}

function createRuntimeIntegrationPlan(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("createRuntimeIntegrationPlan input must be a plain object");
  }

  return Object.freeze({
    version: 1,
    kind: "runtime_integration_plan_executor_v1",
    planId: input.planId || "runtime_integration_plan_executor_v1",
    status: RUNTIME_INTEGRATION_PLAN_STATUSES.CREATED,
    metadataOnly: true,
    dryRunContractRequired: true,
    userApprovalCheckpointRequired: true,
    dryRunContract: input.dryRunContract || null,
    userApprovalCheckpoint: input.userApprovalCheckpoint || null,
    approvedCandidateFiles: freezeArray(input.approvedCandidateFiles || APPROVED_CANDIDATE_FILES),
    blockedFiles: freezeArray(input.blockedFiles || BLOCKED_RUNTIME_FILES),
    authority: createBlockedAuthority(),
  });
}

function hasExactItems(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  return expected.every((item) => actual.includes(item));
}

function validateRuntimeIntegrationPlan(plan) {
  const errors = [];

  if (!isPlainObject(plan)) {
    return Object.freeze({ valid: false, errors: Object.freeze(["plan must be a plain object"]) });
  }

  if (plan.version !== 1) errors.push("version must be 1");
  if (plan.kind !== "runtime_integration_plan_executor_v1") errors.push("kind must be runtime_integration_plan_executor_v1");
  if (plan.metadataOnly !== true) errors.push("metadataOnly must be true");
  if (plan.dryRunContractRequired !== true) errors.push("dryRunContractRequired must be true");
  if (plan.userApprovalCheckpointRequired !== true) errors.push("userApprovalCheckpointRequired must be true");
  if (!isPlainObject(plan.dryRunContract)) errors.push(RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.MISSING_DRY_RUN_CONTRACT);
  if (!isPlainObject(plan.userApprovalCheckpoint)) errors.push(RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.MISSING_USER_APPROVAL_CHECKPOINT);
  if (!hasExactItems(plan.approvedCandidateFiles, APPROVED_CANDIDATE_FILES)) errors.push("approvedCandidateFiles must match approved metadata-only candidate files");
  if (!hasExactItems(plan.blockedFiles, BLOCKED_RUNTIME_FILES)) errors.push("blockedFiles must match runtime-blocked files");

  if (!isPlainObject(plan.authority)) {
    errors.push("authority must be a plain object");
  } else {
    for (const field of REQUIRED_AUTHORITY_FALSE_FIELDS) {
      if (plan.authority[field] !== false) {
        errors.push(`${field} must be false`);
      }
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

function classifyRuntimeIntegrationPlan(plan) {
  const validation = validateRuntimeIntegrationPlan(plan);
  const blockedReasons = [
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.RUNTIME_INTEGRATION_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.RUNTIME_EXECUTION_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.TOOL_EXECUTION_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.RUNTIME_FILE_WRITES_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.PROCESS_EXECUTION_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.GIT_EXECUTION_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.COMMITS_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.PERMISSION_GRANTS_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.AGENT_HANDOFF_RUNTIME_WIRING_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.MODEL_OUTPUT_AUTHORITY_BLOCKED,
    RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS.REPLAY_AUTHORITY_BLOCKED,
  ];

  if (!validation.valid) {
    for (const error of validation.errors) {
      if (!blockedReasons.includes(error)) blockedReasons.push(error);
    }
  }

  return Object.freeze({
    status: validation.valid
      ? RUNTIME_INTEGRATION_PLAN_STATUSES.VALID_METADATA_ONLY
      : RUNTIME_INTEGRATION_PLAN_STATUSES.INVALID,
    valid: validation.valid,
    executable: false,
    metadataOnly: true,
    blockedReasons: Object.freeze(blockedReasons),
    errors: validation.errors,
  });
}

function assertRuntimeIntegrationPlanNotExecutable(plan) {
  const classification = classifyRuntimeIntegrationPlan(plan);

  if (!classification.valid) {
    throw new Error(`runtime integration plan is invalid: ${classification.errors.join(", ")}`);
  }

  if (classification.executable !== false) {
    throw new Error("runtime integration plan must remain non-executable");
  }

  return true;
}

function summarizeRuntimeIntegrationPlan(plan) {
  const classification = classifyRuntimeIntegrationPlan(plan);

  return Object.freeze({
    version: 1,
    planId: isPlainObject(plan) ? plan.planId : undefined,
    status: classification.status,
    valid: classification.valid,
    metadataOnly: true,
    executable: false,
    approvedCandidateFiles: isPlainObject(plan) && Array.isArray(plan.approvedCandidateFiles)
      ? freezeArray(plan.approvedCandidateFiles)
      : Object.freeze([]),
    blockedFiles: isPlainObject(plan) && Array.isArray(plan.blockedFiles)
      ? freezeArray(plan.blockedFiles)
      : Object.freeze([]),
    blockedReasons: classification.blockedReasons,
    errors: classification.errors,
  });
}

module.exports = Object.freeze({
  RUNTIME_INTEGRATION_PLAN_STATUSES,
  RUNTIME_INTEGRATION_PLAN_BLOCKED_REASONS,
  createRuntimeIntegrationPlan,
  validateRuntimeIntegrationPlan,
  classifyRuntimeIntegrationPlan,
  assertRuntimeIntegrationPlanNotExecutable,
  summarizeRuntimeIntegrationPlan,
});
