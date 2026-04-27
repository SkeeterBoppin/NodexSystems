'use strict';

const ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_FINDINGS = Object.freeze([
  'first executable scope not defined',
  'packet helper execution still blocked',
  'runtime adapter side-effect contract not yet active',
  'external review not connected to local proof adoption',
  'proof claim layer not yet implemented',
]);

const ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_CONTROLS = Object.freeze([
  'first_executable_scope_control',
  'packet_helper_execution_boundary_control',
  'runtime_adapter_side_effect_contract_control',
  'advisory_finding_local_proof_adoption_control',
  'proof_claim_layer_control',
]);

const ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_AUTHORITY_STATES = Object.freeze({
  BLOCKED: 'blocked',
  ADVISORY_ONLY: 'advisory_only',
  PROPOSAL_ONLY: 'proposal_only',
  AUTHORITY_PRESERVED: 'authority_preserved',
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function defaultRows() {
  return [
    {
      finding: 'first executable scope not defined',
      localControl: 'first_executable_scope_control',
      proofAdoptionStatus: 'requires_local_plan',
      localEvidenceRequired: [
        'candidate scope identifier',
        'explicit non-side-effect claim',
        'blocked authority matrix',
        'stop conditions',
        'full harness pass',
      ],
      authorityImpact: {
        activation: 'blocked',
        runtimeIntegration: 'blocked',
        runtimeExecution: 'blocked',
        toolExecution: 'blocked',
        implementation: 'blocked',
      },
      implementationPreconditions: [
        'FirstExecutableScopeCandidatePlan v1',
        'FirstExecutableScopeCandidatePreflight v1',
        'explicit no-side-effect validation',
      ],
      rejectPath: [
        'reject if scope includes file writes',
        'reject if scope includes process spawn',
        'reject if scope includes git execution',
        'reject if scope grants permissions',
        'reject if stop conditions are incomplete',
      ],
      nextCandidatePlanningTarget: 'FirstExecutableScopeCandidatePlan v1',
      sourceMutationAllowedNow: false,
      implementationAllowedNow: false,
      authorityGranted: false,
    },
    {
      finding: 'packet helper execution still blocked',
      localControl: 'packet_helper_execution_boundary_control',
      proofAdoptionStatus: 'requires_local_plan',
      localEvidenceRequired: [
        'helper execution boundary definition',
        'no-auto-run proof',
        'operator approval checkpoint',
        'stdout/stderr capture requirement',
        'working tree invariant',
      ],
      authorityImpact: {
        activation: 'blocked',
        runtimeIntegration: 'blocked',
        runtimeExecution: 'blocked',
        toolExecution: 'blocked',
        packetHelperExecution: 'blocked',
      },
      implementationPreconditions: [
        'PacketHelperExecutionAuthorityBoundaryPlan v1',
        'PacketHelperExecutionAuthorityBoundaryPreflight v1',
        'helper audit record design',
      ],
      rejectPath: [
        'reject if helper can auto-run',
        'reject if operator approval is absent',
        'reject if helper mutates source',
        'reject if stdout/stderr is not captured',
        'reject if working tree invariant is missing',
      ],
      nextCandidatePlanningTarget: 'PacketHelperExecutionAuthorityBoundaryPlan v1',
      sourceMutationAllowedNow: false,
      implementationAllowedNow: false,
      authorityGranted: false,
    },
    {
      finding: 'runtime adapter side-effect contract not yet active',
      localControl: 'runtime_adapter_side_effect_contract_control',
      proofAdoptionStatus: 'requires_local_plan',
      localEvidenceRequired: [
        'adapter side-effect classification',
        'sandbox boundary',
        'audit log requirement',
        'rollback requirement',
        'negative side-effect probe',
      ],
      authorityImpact: {
        activation: 'blocked',
        runtimeIntegration: 'blocked',
        runtimeExecution: 'blocked',
        runtimeFileWrites: 'blocked',
        processExecution: 'blocked',
      },
      implementationPreconditions: [
        'RuntimeAdapterSideEffectContractPlan v1',
        'RuntimeAdapterSideEffectContractPreflight v1',
        'side-effect denial-path proof',
      ],
      rejectPath: [
        'reject if adapter can write files',
        'reject if adapter can spawn processes',
        'reject if rollback is absent',
        'reject if audit record is absent',
        'reject if sandbox boundary is undefined',
      ],
      nextCandidatePlanningTarget: 'RuntimeAdapterSideEffectContractPlan v1',
      sourceMutationAllowedNow: false,
      implementationAllowedNow: false,
      authorityGranted: false,
    },
    {
      finding: 'external review not connected to local proof adoption',
      localControl: 'advisory_finding_local_proof_adoption_control',
      proofAdoptionStatus: 'selected_now_for_planning',
      localEvidenceRequired: [
        'finding-to-local-control mapping',
        'evidence requirement per finding',
        'authority impact per finding',
        'implementation preconditions',
        'reject path for unsupported findings',
      ],
      authorityImpact: {
        externalReview: 'advisory_only',
        deepResearch: 'advisory_only',
        modelOutput: 'proposal_only',
        implementation: 'blocked',
        activation: 'blocked',
        runtimeExecution: 'blocked',
      },
      implementationPreconditions: [
        'AdvisoryFindingLocalProofAdoptionPreflight v1',
        'AdvisoryFindingLocalProofAdoptionReadinessDecision v1',
        'specific candidate implementation plan if later approved',
      ],
      rejectPath: [
        'reject if advisory finding lacks local evidence requirement',
        'reject if authority impact is unspecified',
        'reject if finding directly mutates source',
        'reject if finding treats external review as authority',
        'reject if finding treats model output as proof',
      ],
      nextCandidatePlanningTarget: 'AdvisoryFindingLocalProofAdoptionReadinessDecision v1',
      sourceMutationAllowedNow: false,
      implementationAllowedNow: false,
      authorityGranted: false,
    },
    {
      finding: 'proof claim layer not yet implemented',
      localControl: 'proof_claim_layer_control',
      proofAdoptionStatus: 'requires_local_plan',
      localEvidenceRequired: [
        'claim schema',
        'evidence pointer requirements',
        'validation status model',
        'staleness handling',
        'model-output proposal-only boundary',
      ],
      authorityImpact: {
        modelOutput: 'proposal_only',
        evidenceGate: 'authority_preserved',
        implementation: 'blocked',
        activation: 'blocked',
        runtimeExecution: 'blocked',
      },
      implementationPreconditions: [
        'ProofClaimManifestCandidatePlan v1',
        'ProofClaimManifestCandidatePreflight v1',
        'claim validation denial-path proof',
      ],
      rejectPath: [
        'reject if claim lacks evidence pointer',
        'reject if claim validity is inferred from model text',
        'reject if stale evidence can pass',
        'reject if unsupported claims can advance state',
        'reject if proof status can be overwritten without validation',
      ],
      nextCandidatePlanningTarget: 'ProofClaimManifestCandidatePlan v1',
      sourceMutationAllowedNow: false,
      implementationAllowedNow: false,
      authorityGranted: false,
    },
  ];
}

function createAdvisoryFindingLocalProofAdoptionManifest(overrides = {}) {
  const rows = Array.isArray(overrides.rows) ? overrides.rows : defaultRows();

  return {
    schema: 'nodex.advisory_finding_local_proof_adoption.manifest.v1',
    metadataOnly: true,
    authorityGranted: false,
    localEvidenceRequiredForAdoption: true,
    advisoryFindingsRemainNonAuthoritative: true,
    modelOutputRemainsProposalOnly: true,
    externalReviewRemainsAdvisoryOnly: true,
    deepResearchRemainsAdvisoryOnly: true,
    implementationAllowedNow: false,
    sourceMutationAllowedNow: false,
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
    deepResearchAuthorityAllowed: false,
    packetHelperExecutionAllowed: false,
    requiredFindings: [...ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_FINDINGS],
    requiredControls: [...ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_CONTROLS],
    rows,
    ...overrides,
  };
}

function validateAdvisoryFindingLocalProofAdoptionManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return { valid: false, errors: ['manifest must be an object'] };
  }

  const trueFields = [
    'metadataOnly',
    'localEvidenceRequiredForAdoption',
    'advisoryFindingsRemainNonAuthoritative',
    'modelOutputRemainsProposalOnly',
    'externalReviewRemainsAdvisoryOnly',
    'deepResearchRemainsAdvisoryOnly',
  ];

  for (const field of trueFields) {
    if (manifest[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  const falseFields = [
    'authorityGranted',
    'implementationAllowedNow',
    'sourceMutationAllowedNow',
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
    'modelOutputAuthorityAllowed',
    'replayAuthorityAllowed',
    'externalReviewAuthorityAllowed',
    'deepResearchAuthorityAllowed',
    'packetHelperExecutionAllowed',
  ];

  for (const field of falseFields) {
    if (manifest[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (!Array.isArray(manifest.rows)) {
    errors.push('rows must be an array');
  } else {
    const findings = new Set();
    const controls = new Set();

    for (const [index, row] of manifest.rows.entries()) {
      if (!isPlainObject(row)) {
        errors.push(`row ${index} must be an object`);
        continue;
      }

      if (typeof row.finding !== 'string' || row.finding.length === 0) {
        errors.push(`row ${index} missing finding`);
      } else {
        findings.add(row.finding);
      }

      if (typeof row.localControl !== 'string' || row.localControl.length === 0) {
        errors.push(`row ${index} missing localControl`);
      } else {
        controls.add(row.localControl);
      }

      if (!Array.isArray(row.localEvidenceRequired) || row.localEvidenceRequired.length === 0) {
        errors.push(`row ${index} missing localEvidenceRequired`);
      }

      if (!isPlainObject(row.authorityImpact) || Object.keys(row.authorityImpact).length === 0) {
        errors.push(`row ${index} missing authorityImpact`);
      }

      if (!Array.isArray(row.implementationPreconditions) || row.implementationPreconditions.length === 0) {
        errors.push(`row ${index} missing implementationPreconditions`);
      }

      if (!Array.isArray(row.rejectPath) || row.rejectPath.length === 0) {
        errors.push(`row ${index} missing rejectPath`);
      }

      if (typeof row.nextCandidatePlanningTarget !== 'string' || row.nextCandidatePlanningTarget.length === 0) {
        errors.push(`row ${index} missing nextCandidatePlanningTarget`);
      }

      if (row.sourceMutationAllowedNow !== false) {
        errors.push(`row ${index} sourceMutationAllowedNow must be false`);
      }

      if (row.implementationAllowedNow !== false) {
        errors.push(`row ${index} implementationAllowedNow must be false`);
      }

      if (row.authorityGranted !== false) {
        errors.push(`row ${index} authorityGranted must be false`);
      }
    }

    for (const finding of ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_FINDINGS) {
      if (!findings.has(finding)) {
        errors.push(`missing required finding: ${finding}`);
      }
    }

    for (const control of ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_CONTROLS) {
      if (!controls.has(control)) {
        errors.push(`missing required control: ${control}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertAdvisoryFindingLocalProofAdoptionDoesNotGrantAuthority(manifest) {
  const validation = validateAdvisoryFindingLocalProofAdoptionManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Advisory finding local proof adoption manifest invalid: ${validation.errors.join('; ')}`);
  }
  return true;
}

function classifyAdvisoryFindingLocalProofAdoptionReadiness(manifest) {
  const validation = validateAdvisoryFindingLocalProofAdoptionManifest(manifest);

  if (!validation.valid) {
    return {
      ready: false,
      status: 'blocked',
      reasons: validation.errors,
      implementationAllowedNow: false,
      authorityGranted: false,
    };
  }

  return {
    ready: true,
    status: 'ready_for_metadata_only_candidate_preflight',
    reasons: [],
    implementationAllowedNow: false,
    authorityGranted: false,
  };
}

function summarizeAdvisoryFindingLocalProofAdoptionManifest(manifest) {
  const classification = classifyAdvisoryFindingLocalProofAdoptionReadiness(manifest);

  return {
    schema: manifest && manifest.schema,
    metadataOnly: manifest && manifest.metadataOnly === true,
    authorityGranted: false,
    localEvidenceRequiredForAdoption: manifest && manifest.localEvidenceRequiredForAdoption === true,
    advisoryFindingsRemainNonAuthoritative: manifest && manifest.advisoryFindingsRemainNonAuthoritative === true,
    modelOutputRemainsProposalOnly: manifest && manifest.modelOutputRemainsProposalOnly === true,
    externalReviewRemainsAdvisoryOnly: manifest && manifest.externalReviewRemainsAdvisoryOnly === true,
    deepResearchRemainsAdvisoryOnly: manifest && manifest.deepResearchRemainsAdvisoryOnly === true,
    rowCount: Array.isArray(manifest && manifest.rows) ? manifest.rows.length : 0,
    requiredFindingCount: ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_FINDINGS.length,
    requiredControlCount: ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_CONTROLS.length,
    ready: classification.ready,
    status: classification.status,
    implementationAllowedNow: false,
    sourceMutationAllowedNow: false,
    activationAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
  };
}

module.exports = Object.freeze({
  ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_FINDINGS,
  ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_REQUIRED_CONTROLS,
  ADVISORY_FINDING_LOCAL_PROOF_ADOPTION_AUTHORITY_STATES,
  createAdvisoryFindingLocalProofAdoptionManifest,
  validateAdvisoryFindingLocalProofAdoptionManifest,
  summarizeAdvisoryFindingLocalProofAdoptionManifest,
  assertAdvisoryFindingLocalProofAdoptionDoesNotGrantAuthority,
  classifyAdvisoryFindingLocalProofAdoptionReadiness,
});