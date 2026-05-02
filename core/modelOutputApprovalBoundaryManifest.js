'use strict';

const MODEL_OUTPUT_APPROVAL_BOUNDARY_STATUSES = Object.freeze({
  BLOCKED: 'blocked',
  NON_AUTHORITY: 'non_authority',
  LOCAL_EVIDENCE_REQUIRED: 'local_evidence_required',
});

const MODEL_OUTPUT_APPROVAL_BLOCKED_AUTHORITIES = Object.freeze([
  'generated_code_approval',
  'model_output_approval',
  'tool_execution_approval',
  'source_mutation_approval',
  'file_operation_approval',
  'process_execution_approval',
  'git_execution_approval',
  'permission_grant_approval',
  'next_seam_approval',
  'prompt_output_authority',
  'self_approval_authority',
  'authority_self_expansion',
]);

const MODEL_OUTPUT_APPROVAL_NON_AUTHORITY_CONSTRAINTS = Object.freeze([
  'model_output_is_not_approval_authority',
  'model_text_cannot_approve_generated_code',
  'model_text_cannot_approve_tool_execution',
  'model_text_cannot_approve_source_mutation',
  'model_text_cannot_approve_file_operations',
  'model_text_cannot_approve_process_execution',
  'model_text_cannot_approve_git_execution',
  'model_text_cannot_grant_future_authority',
  'model_text_cannot_mark_seams_passed_without_local_evidence',
  'model_text_cannot_change_next_allowed_seam_by_narrative',
]);

const MODEL_OUTPUT_APPROVAL_REQUIRED_EVIDENCE = Object.freeze([
  'explicit_local_evidence_gate',
  'terminal_output_or_evidence_json',
  'status_pass',
  'expected_decision',
  'expected_next_allowed_seam',
  'authority_flags_remain_false',
  'working_tree_and_staged_state_verified',
]);

const MODEL_OUTPUT_APPROVAL_FAILURE_MODES = Object.freeze([
  'model_output_claims_action_is_approved',
  'model_output_marks_generated_code_as_approved',
  'model_output_grants_itself_or_component_authority',
  'model_output_describes_seam_as_passed_without_local_evidence',
  'model_output_converts_recommendation_text_into_approval_state',
  'model_output_bypasses_user_controlled_local_evidence_gate',
  'model_output_changes_next_allowed_seam_through_narrative_text',
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }

  return Object.freeze(value);
}

function ensureFalse(record, key) {
  if (record[key] !== false) {
    throw new Error(`${key} must be false`);
  }
}

function ensureTrue(record, key) {
  if (record[key] !== true) {
    throw new Error(`${key} must be true`);
  }
}

function ensureArrayIncludes(record, key, requiredValue) {
  if (!Array.isArray(record[key]) || !record[key].includes(requiredValue)) {
    throw new Error(`${key} must include ${requiredValue}`);
  }
}

function createModelOutputApprovalBoundaryManifest(overrides = {}) {
  const manifest = {
    schema: 'nodex.model_output_approval_boundary_manifest.v1',
    version: 1,
    metadataOnly: true,
    approvalAuthorityGranted: false,
    approvalAuthorityAllowedNow: false,
    modelOutputApprovalGranted: false,
    modelOutputApprovalAllowedNow: false,
    generatedCodeApprovalGranted: false,
    generatedCodeApprovalAllowedNow: false,
    promptOutputAuthorityGranted: false,
    selfApprovalAuthorityGranted: false,
    authoritySelfExpansionGranted: false,
    modelOutputIsApprovalAuthority: false,
    modelOutputMayApproveGeneratedCode: false,
    modelOutputMayApproveToolExecution: false,
    modelOutputMayApproveSourceMutation: false,
    modelOutputMayApproveFileOperations: false,
    modelOutputMayApproveProcessExecution: false,
    modelOutputMayApproveGitExecution: false,
    modelOutputMayGrantFutureAuthority: false,
    modelOutputMayMarkSeamPassed: false,
    modelOutputMayChangeNextAllowedSeam: false,
    localEvidenceGateRequired: true,
    explicitUserAuthorityRequired: true,
    terminalOrEvidenceJsonRequired: true,
    blockedAuthorities: clone(MODEL_OUTPUT_APPROVAL_BLOCKED_AUTHORITIES),
    nonAuthorityConstraints: clone(MODEL_OUTPUT_APPROVAL_NON_AUTHORITY_CONSTRAINTS),
    requiredEvidence: clone(MODEL_OUTPUT_APPROVAL_REQUIRED_EVIDENCE),
    failureModes: clone(MODEL_OUTPUT_APPROVAL_FAILURE_MODES),
    status: MODEL_OUTPUT_APPROVAL_BOUNDARY_STATUSES.BLOCKED,
    reason: 'model_output_is_not_approval_authority',
  };

  return deepFreeze({ ...manifest, ...overrides });
}

function validateModelOutputApprovalBoundaryManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new TypeError('manifest must be an object');
  }

  if (manifest.schema !== 'nodex.model_output_approval_boundary_manifest.v1') {
    throw new Error('manifest schema mismatch');
  }

  ensureTrue(manifest, 'metadataOnly');
  ensureTrue(manifest, 'localEvidenceGateRequired');
  ensureTrue(manifest, 'explicitUserAuthorityRequired');
  ensureTrue(manifest, 'terminalOrEvidenceJsonRequired');

  ensureFalse(manifest, 'approvalAuthorityGranted');
  ensureFalse(manifest, 'approvalAuthorityAllowedNow');
  ensureFalse(manifest, 'modelOutputApprovalGranted');
  ensureFalse(manifest, 'modelOutputApprovalAllowedNow');
  ensureFalse(manifest, 'generatedCodeApprovalGranted');
  ensureFalse(manifest, 'generatedCodeApprovalAllowedNow');
  ensureFalse(manifest, 'promptOutputAuthorityGranted');
  ensureFalse(manifest, 'selfApprovalAuthorityGranted');
  ensureFalse(manifest, 'authoritySelfExpansionGranted');

  ensureFalse(manifest, 'modelOutputIsApprovalAuthority');
  ensureFalse(manifest, 'modelOutputMayApproveGeneratedCode');
  ensureFalse(manifest, 'modelOutputMayApproveToolExecution');
  ensureFalse(manifest, 'modelOutputMayApproveSourceMutation');
  ensureFalse(manifest, 'modelOutputMayApproveFileOperations');
  ensureFalse(manifest, 'modelOutputMayApproveProcessExecution');
  ensureFalse(manifest, 'modelOutputMayApproveGitExecution');
  ensureFalse(manifest, 'modelOutputMayGrantFutureAuthority');
  ensureFalse(manifest, 'modelOutputMayMarkSeamPassed');
  ensureFalse(manifest, 'modelOutputMayChangeNextAllowedSeam');

  ensureArrayIncludes(manifest, 'blockedAuthorities', 'model_output_approval');
  ensureArrayIncludes(manifest, 'blockedAuthorities', 'generated_code_approval');
  ensureArrayIncludes(manifest, 'blockedAuthorities', 'self_approval_authority');
  ensureArrayIncludes(manifest, 'nonAuthorityConstraints', 'model_output_is_not_approval_authority');
  ensureArrayIncludes(manifest, 'requiredEvidence', 'explicit_local_evidence_gate');
  ensureArrayIncludes(manifest, 'failureModes', 'model_output_bypasses_user_controlled_local_evidence_gate');

  return true;
}

function createModelOutputApprovalDecision(input = {}) {
  const decision = {
    schema: 'nodex.model_output_approval_decision.v1',
    status: MODEL_OUTPUT_APPROVAL_BOUNDARY_STATUSES.BLOCKED,
    allowed: false,
    approved: false,
    requestedAction: input.requestedAction || 'unspecified',
    modelOutputApprovalGranted: false,
    modelOutputApprovalAllowedNow: false,
    generatedCodeApprovalGranted: false,
    generatedCodeApprovalAllowedNow: false,
    promptOutputAuthorityGranted: false,
    selfApprovalAuthorityGranted: false,
    authoritySelfExpansionGranted: false,
    localEvidenceGateRequired: true,
    reason: 'model_output_cannot_approve_actions',
    blockedAuthorities: clone(MODEL_OUTPUT_APPROVAL_BLOCKED_AUTHORITIES),
  };

  return deepFreeze(decision);
}

function assertNoModelOutputApprovalAuthority(record) {
  if (!record || typeof record !== 'object') {
    throw new TypeError('record must be an object');
  }

  if (record.allowed === true || record.approved === true) {
    throw new Error('model output approval must not be allowed');
  }

  ensureFalse(record, 'modelOutputApprovalGranted');
  ensureFalse(record, 'modelOutputApprovalAllowedNow');
  ensureFalse(record, 'generatedCodeApprovalGranted');
  ensureFalse(record, 'generatedCodeApprovalAllowedNow');
  ensureFalse(record, 'promptOutputAuthorityGranted');
  ensureFalse(record, 'selfApprovalAuthorityGranted');
  ensureFalse(record, 'authoritySelfExpansionGranted');

  return true;
}

function classifyModelOutputApprovalClaim(input = {}) {
  const text = String(input.text || '');
  const containsApprovalLanguage = /\b(approve|approved|grant|granted|allowed|authority|passed)\b/i.test(text);

  return deepFreeze({
    schema: 'nodex.model_output_approval_claim_classification.v1',
    containsApprovalLanguage,
    classification: MODEL_OUTPUT_APPROVAL_BOUNDARY_STATUSES.NON_AUTHORITY,
    approvalAllowed: false,
    approvalGranted: false,
    localEvidenceGateRequired: true,
    reason: containsApprovalLanguage
      ? 'model_output_approval_language_is_non_authority'
      : 'model_output_has_no_approval_authority',
    modelOutputApprovalGranted: false,
    modelOutputApprovalAllowedNow: false,
    generatedCodeApprovalGranted: false,
    generatedCodeApprovalAllowedNow: false,
    promptOutputAuthorityGranted: false,
    selfApprovalAuthorityGranted: false,
    authoritySelfExpansionGranted: false,
  });
}

function summarizeModelOutputApprovalBoundary(manifest = createModelOutputApprovalBoundaryManifest()) {
  validateModelOutputApprovalBoundaryManifest(manifest);

  return deepFreeze({
    schema: 'nodex.model_output_approval_boundary_summary.v1',
    metadataOnly: manifest.metadataOnly,
    approvalAuthorityGranted: manifest.approvalAuthorityGranted,
    approvalAuthorityAllowedNow: manifest.approvalAuthorityAllowedNow,
    modelOutputApprovalGranted: manifest.modelOutputApprovalGranted,
    modelOutputApprovalAllowedNow: manifest.modelOutputApprovalAllowedNow,
    generatedCodeApprovalGranted: manifest.generatedCodeApprovalGranted,
    generatedCodeApprovalAllowedNow: manifest.generatedCodeApprovalAllowedNow,
    localEvidenceGateRequired: manifest.localEvidenceGateRequired,
    blockedAuthorityCount: manifest.blockedAuthorities.length,
    nonAuthorityConstraintCount: manifest.nonAuthorityConstraints.length,
    failureModeCount: manifest.failureModes.length,
  });
}

const MODEL_OUTPUT_APPROVAL_BOUNDARY_MANIFEST = createModelOutputApprovalBoundaryManifest();

module.exports = {
  MODEL_OUTPUT_APPROVAL_BOUNDARY_STATUSES,
  MODEL_OUTPUT_APPROVAL_BLOCKED_AUTHORITIES,
  MODEL_OUTPUT_APPROVAL_NON_AUTHORITY_CONSTRAINTS,
  MODEL_OUTPUT_APPROVAL_REQUIRED_EVIDENCE,
  MODEL_OUTPUT_APPROVAL_FAILURE_MODES,
  MODEL_OUTPUT_APPROVAL_BOUNDARY_MANIFEST,
  createModelOutputApprovalBoundaryManifest,
  validateModelOutputApprovalBoundaryManifest,
  createModelOutputApprovalDecision,
  assertNoModelOutputApprovalAuthority,
  classifyModelOutputApprovalClaim,
  summarizeModelOutputApprovalBoundary,
};
