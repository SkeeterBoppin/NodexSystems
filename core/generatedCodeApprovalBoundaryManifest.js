'use strict';

const GENERATED_CODE_APPROVAL_BOUNDARY_FAILURE_MODES = Object.freeze([
  'generated packet claims its own output is approved',
  'generated code carries approval metadata treated as authority',
  'model output describes approval and downstream code treats it as granted',
  'prompt text bypasses local evidence gate',
  'generated artifact names drift and bypass canonical packet path',
  'approval state is inferred from live-context snapshot instead of local evidence',
  'commit gate treats generated content presence as approval',
]);

const GENERATED_CODE_APPROVAL_BOUNDARY_REQUIRED_CONTROLS = Object.freeze([
  'generatedCodeApprovalGranted must remain false until explicit local evidence gate',
  'generatedCodeApprovalAllowedNow must remain false in plan and preflight seams',
  'modelOutputApprovalGranted must remain false',
  'promptOutputAuthorityGranted must remain false',
  'selfApprovalAuthorityGranted must remain false',
  'generated artifacts must not promote themselves to approved state',
  'live-context snapshots must not grant approval authority',
  'commit gates must verify approval boundary flags remain false',
]);

const GENERATED_CODE_APPROVAL_BOUNDARY_BLOCKED_AUTHORITIES = Object.freeze([
  'generated_code_approval',
  'model_output_approval',
  'prompt_output_authority',
  'self_approval_authority',
  'authority_self_expansion',
]);

const GENERATED_ARTIFACT_NON_AUTHORITY_CONSTRAINTS = Object.freeze({
  generatedCodeIsApprovalAuthority: false,
  generatedPacketIsApprovalAuthority: false,
  generatedMetadataIsApprovalAuthority: false,
  generatedArtifactCanSelfApprove: false,
  generatedArtifactCanPromoteApprovalState: false,
});

const MODEL_OUTPUT_NON_APPROVAL_CONSTRAINTS = Object.freeze({
  modelOutputCanApproveGeneratedCode: false,
  promptOutputCanApproveGeneratedCode: false,
  modelOutputCanGrantAuthority: false,
  promptOutputCanGrantAuthority: false,
});

const LOCAL_EVIDENCE_GATE_REQUIREMENT = Object.freeze({
  localEvidenceGateRequired: true,
  localEvidenceAuthority: true,
  explicitFutureApprovalGateRequired: true,
  inferApprovalFromGeneratedContentAllowed: false,
  inferApprovalFromLiveContextAllowed: false,
});

const LIVE_CONTEXT_NON_AUTHORITY_CONSTRAINT = Object.freeze({
  liveContextSnapshotAuthority: false,
  liveContextCanGrantGeneratedCodeApproval: false,
  liveContextCanApproveGeneratedArtifacts: false,
});

function cloneArray(values) {
  return values.slice();
}

function getGeneratedCodeApprovalBoundaryManifest() {
  return Object.freeze({
    schema: 'nodex.generated_code_approval_boundary.manifest.v1',
    metadataOnly: true,
    failureModes: cloneArray(GENERATED_CODE_APPROVAL_BOUNDARY_FAILURE_MODES),
    requiredControls: cloneArray(GENERATED_CODE_APPROVAL_BOUNDARY_REQUIRED_CONTROLS),
    blockedAuthorities: cloneArray(GENERATED_CODE_APPROVAL_BOUNDARY_BLOCKED_AUTHORITIES),
    generatedArtifactNonAuthorityConstraints: GENERATED_ARTIFACT_NON_AUTHORITY_CONSTRAINTS,
    modelOutputNonApprovalConstraints: MODEL_OUTPUT_NON_APPROVAL_CONSTRAINTS,
    localEvidenceGateRequirement: LOCAL_EVIDENCE_GATE_REQUIREMENT,
    liveContextNonAuthorityConstraint: LIVE_CONTEXT_NON_AUTHORITY_CONSTRAINT,
    generatedCodeApprovalGranted: false,
    generatedCodeApprovalAllowedNow: false,
    modelOutputApprovalGranted: false,
    promptOutputAuthorityGranted: false,
    selfApprovalAuthorityGranted: false,
    authoritySelfExpansionGranted: false,
    generatedArtifactSelfApprovalAllowed: false,
    generatedArtifactApprovalPromotionAllowed: false,
    liveContextApprovalAuthorityGranted: false,
    explicitLocalEvidenceGateRequired: true,
  });
}

function validateGeneratedCodeApprovalBoundaryManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new TypeError('generated-code approval boundary manifest must be an object');
  }

  if (manifest.schema !== 'nodex.generated_code_approval_boundary.manifest.v1') {
    throw new Error('unexpected generated-code approval boundary schema');
  }

  if (manifest.metadataOnly !== true) {
    throw new Error('generated-code approval boundary manifest must be metadata-only');
  }

  const hardFalseFlags = [
    'generatedCodeApprovalGranted',
    'generatedCodeApprovalAllowedNow',
    'modelOutputApprovalGranted',
    'promptOutputAuthorityGranted',
    'selfApprovalAuthorityGranted',
    'authoritySelfExpansionGranted',
    'generatedArtifactSelfApprovalAllowed',
    'generatedArtifactApprovalPromotionAllowed',
    'liveContextApprovalAuthorityGranted',
  ];

  for (const flag of hardFalseFlags) {
    if (manifest[flag] !== false) {
      throw new Error(`${flag} must remain false`);
    }
  }

  if (manifest.explicitLocalEvidenceGateRequired !== true) {
    throw new Error('explicitLocalEvidenceGateRequired must remain true');
  }

  for (const failureMode of GENERATED_CODE_APPROVAL_BOUNDARY_FAILURE_MODES) {
    if (!manifest.failureModes.includes(failureMode)) {
      throw new Error(`missing generated-code approval failure mode: ${failureMode}`);
    }
  }

  for (const control of GENERATED_CODE_APPROVAL_BOUNDARY_REQUIRED_CONTROLS) {
    if (!manifest.requiredControls.includes(control)) {
      throw new Error(`missing generated-code approval required control: ${control}`);
    }
  }

  return true;
}

function createGeneratedCodeApprovalDecision(input = {}) {
  const manifest = getGeneratedCodeApprovalBoundaryManifest();
  validateGeneratedCodeApprovalBoundaryManifest(manifest);

  return Object.freeze({
    schema: 'nodex.generated_code_approval_boundary.decision.v1',
    requestedAction: String(input.requestedAction || 'unspecified'),
    allowed: false,
    reason: 'generated_code_approval_requires_future_explicit_local_evidence_gate',
    metadataOnly: true,
    generatedCodeApprovalGranted: false,
    generatedCodeApprovalAllowedNow: false,
    modelOutputApprovalGranted: false,
    promptOutputAuthorityGranted: false,
    selfApprovalAuthorityGranted: false,
    authoritySelfExpansionGranted: false,
    generatedArtifactSelfApprovalAllowed: false,
    generatedArtifactApprovalPromotionAllowed: false,
    liveContextApprovalAuthorityGranted: false,
    explicitLocalEvidenceGateRequired: true,
  });
}

function assertNoGeneratedCodeApprovalAuthority(decision) {
  if (!decision || typeof decision !== 'object') {
    throw new TypeError('generated-code approval decision must be an object');
  }

  const hardFalseFlags = [
    'allowed',
    'generatedCodeApprovalGranted',
    'generatedCodeApprovalAllowedNow',
    'modelOutputApprovalGranted',
    'promptOutputAuthorityGranted',
    'selfApprovalAuthorityGranted',
    'authoritySelfExpansionGranted',
    'generatedArtifactSelfApprovalAllowed',
    'generatedArtifactApprovalPromotionAllowed',
    'liveContextApprovalAuthorityGranted',
  ];

  for (const flag of hardFalseFlags) {
    if (decision[flag] !== false) {
      throw new Error(`${flag} must remain false`);
    }
  }

  if (decision.explicitLocalEvidenceGateRequired !== true) {
    throw new Error('explicitLocalEvidenceGateRequired must remain true');
  }

  return true;
}

module.exports = {
  GENERATED_CODE_APPROVAL_BOUNDARY_FAILURE_MODES,
  GENERATED_CODE_APPROVAL_BOUNDARY_REQUIRED_CONTROLS,
  GENERATED_CODE_APPROVAL_BOUNDARY_BLOCKED_AUTHORITIES,
  GENERATED_ARTIFACT_NON_AUTHORITY_CONSTRAINTS,
  MODEL_OUTPUT_NON_APPROVAL_CONSTRAINTS,
  LOCAL_EVIDENCE_GATE_REQUIREMENT,
  LIVE_CONTEXT_NON_AUTHORITY_CONSTRAINT,
  getGeneratedCodeApprovalBoundaryManifest,
  validateGeneratedCodeApprovalBoundaryManifest,
  createGeneratedCodeApprovalDecision,
  assertNoGeneratedCodeApprovalAuthority,
};