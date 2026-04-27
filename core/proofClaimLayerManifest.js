'use strict';

const PROOF_CLAIM_LAYER_CLAIM_TYPES = Object.freeze({
  ARCHITECTURE_BOUNDARY_CLAIM: 'architecture_boundary_claim',
  EVIDENCE_FILE_CLAIM: 'evidence_file_claim',
  REPO_STATE_CLAIM: 'repo_state_claim',
  TEST_RESULT_CLAIM: 'test_result_claim',
  AUTHORITY_CLAIM: 'authority_claim',
  CONTRADICTION_CLAIM: 'contradiction_claim',
  IMPLEMENTATION_CLAIM: 'implementation_claim',
  READINESS_CLAIM: 'readiness_claim',
});

const PROOF_CLAIM_LAYER_STATUSES = Object.freeze({
  UNPROVEN: 'unproven',
  LOCALLY_SUPPORTED: 'locally_supported',
  CONTRADICTED: 'contradicted',
  BLOCKED: 'blocked',
  NOT_APPLICABLE: 'not_applicable',
});

const PROOF_CLAIM_LAYER_FORBIDDEN_SURFACES = Object.freeze([
  'model-output authority',
  'external review authority',
  'Deep Research authority',
  'activation authority',
  'runtime integration authority',
  'actual dry-run execution authority',
  'runtime execution authority',
  'tool execution authority',
  'runtime file writes',
  'process execution',
  'git execution by Nodex',
  'permission grants',
  'AgentHandoffRunner runtime wiring',
  'packet helper execution authority',
  'runtime adapter side-effect authority',
  'unsupported claim promotion',
  'unverified evidence promotion',
  'contradicted claim promotion',
]);

const REQUIRED_CLAIM_FIELDS = Object.freeze([
  'claimId',
  'claimType',
  'claimText',
  'status',
  'localEvidenceRefs',
  'validationRule',
  'authorityGranted',
]);

const REQUIRED_EVIDENCE_REF_FIELDS = Object.freeze([
  'evidenceType',
  'pathOrCommit',
  'expectedMarker',
  'verified',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function defaultClaims() {
  return [
    {
      claimId: 'proof-claim-layer-local-evidence-required',
      claimType: PROOF_CLAIM_LAYER_CLAIM_TYPES.EVIDENCE_FILE_CLAIM,
      claimText: 'Proof claims require local evidence references before they can be treated as supported.',
      status: PROOF_CLAIM_LAYER_STATUSES.LOCALLY_SUPPORTED,
      localEvidenceRefs: [
        {
          evidenceType: 'repo_state',
          pathOrCommit: 'local working tree',
          expectedMarker: 'clean working tree and local evidence file reference',
          verified: true,
        },
      ],
      validationRule: 'local evidence reference must be present and verified',
      authorityGranted: false,
      modelOutputAuthorityAllowed: false,
      externalReviewAuthorityAllowed: false,
      deepResearchAuthorityAllowed: false,
      proofClaimPromotionAuthorityAllowed: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
    },
    {
      claimId: 'proof-claim-layer-unsupported-claims-blocked',
      claimType: PROOF_CLAIM_LAYER_CLAIM_TYPES.AUTHORITY_CLAIM,
      claimText: 'Unsupported, unverified, or contradicted claims cannot be promoted into authority.',
      status: PROOF_CLAIM_LAYER_STATUSES.BLOCKED,
      localEvidenceRefs: [
        {
          evidenceType: 'architecture_boundary',
          pathOrCommit: 'proof claim layer boundary',
          expectedMarker: 'unsupported and contradicted claim promotion blocked',
          verified: true,
        },
      ],
      validationRule: 'claim status must be locally_supported before any future authority decision',
      authorityGranted: false,
      modelOutputAuthorityAllowed: false,
      externalReviewAuthorityAllowed: false,
      deepResearchAuthorityAllowed: false,
      proofClaimPromotionAuthorityAllowed: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
    },
  ];
}

function createProofClaimLayerManifest(overrides = {}) {
  return {
    schema: 'nodex.proof_claim_layer.manifest.v1',
    metadataOnly: true,
    authorityGranted: false,
    localEvidenceRequired: true,
    deterministicValidationRequired: true,
    unsupportedClaimPromotionBlocked: true,
    unverifiedEvidencePromotionBlocked: true,
    contradictedClaimPromotionBlocked: true,
    modelOutputAuthorityAllowed: false,
    externalReviewAuthorityAllowed: false,
    deepResearchAuthorityAllowed: false,
    proofClaimPromotionAuthorityAllowed: false,
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
    packetHelperExecutionAllowed: false,
    runtimeAdapterSideEffectAuthorityAllowed: false,
    claimTypes: Object.values(PROOF_CLAIM_LAYER_CLAIM_TYPES),
    proofStatuses: Object.values(PROOF_CLAIM_LAYER_STATUSES),
    requiredClaimFields: [...REQUIRED_CLAIM_FIELDS],
    requiredEvidenceRefFields: [...REQUIRED_EVIDENCE_REF_FIELDS],
    forbiddenSurfaces: [...PROOF_CLAIM_LAYER_FORBIDDEN_SURFACES],
    claims: defaultClaims(),
    ...overrides,
  };
}

function validateEvidenceRef(ref, claimIndex, refIndex) {
  const errors = [];

  if (!isPlainObject(ref)) {
    return [`claims[${claimIndex}].localEvidenceRefs[${refIndex}] must be an object`];
  }

  for (const field of REQUIRED_EVIDENCE_REF_FIELDS) {
    if (!(field in ref)) {
      errors.push(`claims[${claimIndex}].localEvidenceRefs[${refIndex}].${field} is required`);
    }
  }

  for (const field of ['evidenceType', 'pathOrCommit', 'expectedMarker']) {
    if (typeof ref[field] !== 'string' || ref[field].length === 0) {
      errors.push(`claims[${claimIndex}].localEvidenceRefs[${refIndex}].${field} must be a non-empty string`);
    }
  }

  if (ref.verified !== true) {
    errors.push(`claims[${claimIndex}].localEvidenceRefs[${refIndex}].verified must be true`);
  }

  return errors;
}

function validateClaim(claim, index) {
  const errors = [];

  if (!isPlainObject(claim)) {
    return [`claims[${index}] must be an object`];
  }

  for (const field of REQUIRED_CLAIM_FIELDS) {
    if (!(field in claim)) {
      errors.push(`claims[${index}].${field} is required`);
    }
  }

  if (typeof claim.claimId !== 'string' || claim.claimId.length === 0) {
    errors.push(`claims[${index}].claimId must be a non-empty string`);
  }

  if (!Object.values(PROOF_CLAIM_LAYER_CLAIM_TYPES).includes(claim.claimType)) {
    errors.push(`claims[${index}].claimType must be recognized`);
  }

  if (typeof claim.claimText !== 'string' || claim.claimText.length === 0) {
    errors.push(`claims[${index}].claimText must be a non-empty string`);
  }

  if (!Object.values(PROOF_CLAIM_LAYER_STATUSES).includes(claim.status)) {
    errors.push(`claims[${index}].status must be recognized`);
  }

  if (!Array.isArray(claim.localEvidenceRefs) || claim.localEvidenceRefs.length === 0) {
    errors.push(`claims[${index}].localEvidenceRefs must be a non-empty array`);
  } else {
    claim.localEvidenceRefs.forEach((ref, refIndex) => {
      errors.push(...validateEvidenceRef(ref, index, refIndex));
    });
  }

  if (typeof claim.validationRule !== 'string' || claim.validationRule.length === 0) {
    errors.push(`claims[${index}].validationRule must be a non-empty string`);
  }

  const falseFields = [
    'authorityGranted',
    'modelOutputAuthorityAllowed',
    'externalReviewAuthorityAllowed',
    'deepResearchAuthorityAllowed',
    'proofClaimPromotionAuthorityAllowed',
    'runtimeExecutionAllowed',
    'toolExecutionAllowed',
  ];

  for (const field of falseFields) {
    if (claim[field] !== false) {
      errors.push(`claims[${index}].${field} must be false`);
    }
  }

  if (claim.status === PROOF_CLAIM_LAYER_STATUSES.UNPROVEN && claim.authorityGranted !== false) {
    errors.push(`claims[${index}] unproven claim cannot grant authority`);
  }

  if (claim.status === PROOF_CLAIM_LAYER_STATUSES.CONTRADICTED && claim.authorityGranted !== false) {
    errors.push(`claims[${index}] contradicted claim cannot grant authority`);
  }

  return errors;
}

function validateProofClaimLayerManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return { valid: false, errors: ['manifest must be an object'] };
  }

  const trueFields = [
    'metadataOnly',
    'localEvidenceRequired',
    'deterministicValidationRequired',
    'unsupportedClaimPromotionBlocked',
    'unverifiedEvidencePromotionBlocked',
    'contradictedClaimPromotionBlocked',
  ];

  for (const field of trueFields) {
    if (manifest[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  const falseFields = [
    'authorityGranted',
    'modelOutputAuthorityAllowed',
    'externalReviewAuthorityAllowed',
    'deepResearchAuthorityAllowed',
    'proofClaimPromotionAuthorityAllowed',
    'activationAllowed',
    'runtimeIntegrationAllowed',
    'actualDryRunExecutionAllowed',
    'runtimeExecutionAllowed',
    'toolExecutionAllowed',
    'runtimeFileWritesAllowed',
    'processExecutionAllowed',
    'gitExecutionAllowedByNodex',
    'permissionGrantsAllowed',
    'agentHandoffRuntimeWiringAllowed',
    'packetHelperExecutionAllowed',
    'runtimeAdapterSideEffectAuthorityAllowed',
  ];

  for (const field of falseFields) {
    if (manifest[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (!Array.isArray(manifest.claimTypes)) {
    errors.push('claimTypes must be an array');
  } else {
    for (const claimType of Object.values(PROOF_CLAIM_LAYER_CLAIM_TYPES)) {
      if (!manifest.claimTypes.includes(claimType)) {
        errors.push(`claimTypes missing: ${claimType}`);
      }
    }
  }

  if (!Array.isArray(manifest.proofStatuses)) {
    errors.push('proofStatuses must be an array');
  } else {
    for (const status of Object.values(PROOF_CLAIM_LAYER_STATUSES)) {
      if (!manifest.proofStatuses.includes(status)) {
        errors.push(`proofStatuses missing: ${status}`);
      }
    }
  }

  if (!Array.isArray(manifest.requiredClaimFields)) {
    errors.push('requiredClaimFields must be an array');
  } else {
    for (const field of REQUIRED_CLAIM_FIELDS) {
      if (!manifest.requiredClaimFields.includes(field)) {
        errors.push(`requiredClaimFields missing: ${field}`);
      }
    }
  }

  if (!Array.isArray(manifest.requiredEvidenceRefFields)) {
    errors.push('requiredEvidenceRefFields must be an array');
  } else {
    for (const field of REQUIRED_EVIDENCE_REF_FIELDS) {
      if (!manifest.requiredEvidenceRefFields.includes(field)) {
        errors.push(`requiredEvidenceRefFields missing: ${field}`);
      }
    }
  }

  if (!Array.isArray(manifest.forbiddenSurfaces)) {
    errors.push('forbiddenSurfaces must be an array');
  } else {
    for (const surface of PROOF_CLAIM_LAYER_FORBIDDEN_SURFACES) {
      if (!manifest.forbiddenSurfaces.includes(surface)) {
        errors.push(`forbiddenSurfaces missing: ${surface}`);
      }
    }
  }

  if (!Array.isArray(manifest.claims) || manifest.claims.length === 0) {
    errors.push('claims must be a non-empty array');
  } else {
    manifest.claims.forEach((claim, index) => {
      errors.push(...validateClaim(claim, index));
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertProofClaimLayerDoesNotGrantAuthority(manifest) {
  const validation = validateProofClaimLayerManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Proof claim layer manifest invalid: ${validation.errors.join('; ')}`);
  }
  return true;
}

function classifyProofClaimLayerReadiness(manifest) {
  const validation = validateProofClaimLayerManifest(manifest);

  if (!validation.valid) {
    return {
      ready: false,
      status: PROOF_CLAIM_LAYER_STATUSES.BLOCKED,
      reasons: validation.errors,
      implementationAllowedNow: false,
      sourceMutationAllowedNow: false,
      modelOutputAuthorityAllowed: false,
      proofClaimPromotionAuthorityAllowed: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
      authorityGranted: false,
    };
  }

  return {
    ready: true,
    status: PROOF_CLAIM_LAYER_STATUSES.LOCALLY_SUPPORTED,
    reasons: [],
    implementationAllowedNow: false,
    sourceMutationAllowedNow: false,
    modelOutputAuthorityAllowed: false,
    proofClaimPromotionAuthorityAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    authorityGranted: false,
  };
}

function summarizeProofClaimLayerManifest(manifest) {
  const classification = classifyProofClaimLayerReadiness(manifest);

  return {
    schema: manifest && manifest.schema,
    metadataOnly: manifest && manifest.metadataOnly === true,
    authorityGranted: false,
    localEvidenceRequired: manifest && manifest.localEvidenceRequired === true,
    deterministicValidationRequired: manifest && manifest.deterministicValidationRequired === true,
    unsupportedClaimPromotionBlocked: manifest && manifest.unsupportedClaimPromotionBlocked === true,
    unverifiedEvidencePromotionBlocked: manifest && manifest.unverifiedEvidencePromotionBlocked === true,
    contradictedClaimPromotionBlocked: manifest && manifest.contradictedClaimPromotionBlocked === true,
    claimTypeCount: Object.values(PROOF_CLAIM_LAYER_CLAIM_TYPES).length,
    proofStatusCount: Object.values(PROOF_CLAIM_LAYER_STATUSES).length,
    claimCount: Array.isArray(manifest && manifest.claims) ? manifest.claims.length : 0,
    ready: classification.ready,
    status: classification.status,
    implementationAllowedNow: false,
    sourceMutationAllowedNow: false,
    modelOutputAuthorityAllowed: false,
    proofClaimPromotionAuthorityAllowed: false,
    externalReviewAuthorityAllowed: false,
    deepResearchAuthorityAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    processExecutionAllowed: false,
    gitExecutionAllowedByNodex: false,
    permissionGrantsAllowed: false,
    packetHelperExecutionAllowed: false,
    runtimeAdapterSideEffectAuthorityAllowed: false,
  };
}

module.exports = Object.freeze({
  PROOF_CLAIM_LAYER_CLAIM_TYPES,
  PROOF_CLAIM_LAYER_STATUSES,
  PROOF_CLAIM_LAYER_FORBIDDEN_SURFACES,
  createProofClaimLayerManifest,
  validateProofClaimLayerManifest,
  summarizeProofClaimLayerManifest,
  assertProofClaimLayerDoesNotGrantAuthority,
  classifyProofClaimLayerReadiness,
});