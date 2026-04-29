'use strict';

const ZAK_FINAL_AUTHORITY_CONTRACT_STATUSES = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
});

const ZAK_FINAL_AUTHORITY_CONTRACT_REQUIRED_APPROVALS = Object.freeze([
  'authority_expansion',
  'destructive_execution',
  'cross_boundary_file_movement',
]);

const ZAK_FINAL_AUTHORITY_CONTRACT_NON_GRANTS = Object.freeze([
  'file_move_authority',
  'commit_authority',
  'staging_authority',
  'autonomous_approval',
  'authority_self_expansion',
  'privilege_escalation',
]);

const REQUIRED_INVARIANTS = Object.freeze([
  'explicit_operator_approval_required_for_authority_expansion',
  'explicit_operator_approval_required_for_destructive_execution',
  'explicit_operator_approval_required_for_cross_boundary_file_movement',
  'operator_approval_cannot_be_inferred_from_model_output',
  'operator_approval_cannot_be_simulated_by_generated_code',
  'operator_approval_cannot_be_reused_outside_explicit_scope',
  'operator_can_revoke_pause_or_narrow_authority',
  'nodex_cannot_self_upgrade_authority',
  'manual_packet_execution_requirement_preserved',
  'autonomous_final_approval_not_granted',
]);

const LEGACY_AUTHORITY_LABELS = Object.freeze([
  'zak_final_authority_preserved',
  'zak_final_authority_claim_structure_preserved',
]);

function uniqueStrings(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(new Set(values.filter((value) => typeof value === 'string' && value.length > 0)));
}

function includesAll(values, requiredValues) {
  const set = new Set(uniqueStrings(values));
  return requiredValues.every((value) => set.has(value));
}

function createZakFinalAuthorityContract(input = {}) {
  const invariants = uniqueStrings(input.invariants || REQUIRED_INVARIANTS);
  const nonGrants = uniqueStrings(input.nonGrants || ZAK_FINAL_AUTHORITY_CONTRACT_NON_GRANTS);
  const requiredApprovals = uniqueStrings(
    input.requiredApprovals || ZAK_FINAL_AUTHORITY_CONTRACT_REQUIRED_APPROVALS,
  );
  const legacyAuthorityLabels = uniqueStrings(input.legacyAuthorityLabels || LEGACY_AUTHORITY_LABELS);

  return {
    canonicalAuthorityContract: 'ZakFinalAuthorityContract',
    contractKind: 'root_invariant_and_per_seam_gate',
    operatorFinalAuthority: 'highest_non_automatable_authority_layer',
    status: input.status || ZAK_FINAL_AUTHORITY_CONTRACT_STATUSES.ACTIVE,
    duplicateAuthoritySourcesAllowed: false,
    legacyAuthorityLabels,
    legacyLabelRelationship: [
      'legacy labels are compatibility/provenance labels only',
      'legacy labels do not define a separate authority system',
      'legacy labels grant no authority by themselves',
      'legacy labels cannot bypass ZakFinalAuthorityContract',
    ],
    requiredApprovals,
    invariants,
    nonGrants,
    approvalRules: {
      modelOutputApprovalAccepted: false,
      generatedCodeApprovalAccepted: false,
      autonomousFinalApprovalGranted: false,
      authoritySelfExpansionAllowed: false,
      approvalReuseOutsideExplicitScopeAllowed: false,
      revocationAllowed: true,
      manualPacketExecutionRequired: true,
    },
    grants: {
      fileMoveAuthority: false,
      commitAuthority: false,
      stagingAuthority: false,
      autonomousApproval: false,
      privilegeEscalation: false,
    },
  };
}

function validateZakFinalAuthorityContract(contract) {
  const errors = [];

  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return {
      valid: false,
      errors: ['contract must be an object'],
    };
  }

  if (contract.canonicalAuthorityContract !== 'ZakFinalAuthorityContract') {
    errors.push('canonicalAuthorityContract must be ZakFinalAuthorityContract');
  }

  if (contract.duplicateAuthoritySourcesAllowed !== false) {
    errors.push('duplicateAuthoritySourcesAllowed must be false');
  }

  if (!includesAll(contract.legacyAuthorityLabels, LEGACY_AUTHORITY_LABELS)) {
    errors.push('legacyAuthorityLabels must include zak_final_authority compatibility labels');
  }

  if (!includesAll(contract.requiredApprovals, ZAK_FINAL_AUTHORITY_CONTRACT_REQUIRED_APPROVALS)) {
    errors.push('requiredApprovals must include all required operator approvals');
  }

  if (!includesAll(contract.invariants, REQUIRED_INVARIANTS)) {
    errors.push('invariants must include all Zak final authority invariants');
  }

  if (!includesAll(contract.nonGrants, ZAK_FINAL_AUTHORITY_CONTRACT_NON_GRANTS)) {
    errors.push('nonGrants must include all explicit non-grants');
  }

  const approvalRules = contract.approvalRules || {};
  if (approvalRules.modelOutputApprovalAccepted !== false) {
    errors.push('model output cannot be accepted as operator approval');
  }
  if (approvalRules.generatedCodeApprovalAccepted !== false) {
    errors.push('generated code cannot simulate operator approval');
  }
  if (approvalRules.autonomousFinalApprovalGranted !== false) {
    errors.push('autonomous final approval must remain false');
  }
  if (approvalRules.authoritySelfExpansionAllowed !== false) {
    errors.push('authority self-expansion must remain false');
  }
  if (approvalRules.approvalReuseOutsideExplicitScopeAllowed !== false) {
    errors.push('approval reuse outside explicit scope must remain false');
  }
  if (approvalRules.revocationAllowed !== true) {
    errors.push('operator revocation/pause/narrowing must remain allowed');
  }
  if (approvalRules.manualPacketExecutionRequired !== true) {
    errors.push('manual packet execution requirement must remain true');
  }

  const grants = contract.grants || {};
  if (grants.fileMoveAuthority !== false) {
    errors.push('file move authority must not be granted by this contract');
  }
  if (grants.commitAuthority !== false) {
    errors.push('commit authority must not be granted by this contract');
  }
  if (grants.stagingAuthority !== false) {
    errors.push('staging authority must not be granted by this contract');
  }
  if (grants.autonomousApproval !== false) {
    errors.push('autonomous approval must not be granted by this contract');
  }
  if (grants.privilegeEscalation !== false) {
    errors.push('privilege escalation must not be granted by this contract');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertZakFinalAuthorityContract(contract) {
  const result = validateZakFinalAuthorityContract(contract);
  if (!result.valid) {
    throw new Error(`Invalid ZakFinalAuthorityContract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function summarizeZakFinalAuthorityContract(contract) {
  const result = validateZakFinalAuthorityContract(contract);

  return {
    canonicalAuthorityContract: contract && contract.canonicalAuthorityContract,
    valid: result.valid,
    errors: result.errors,
    duplicateAuthoritySourcesAllowed: contract && contract.duplicateAuthoritySourcesAllowed,
    requiredApprovalCount: Array.isArray(contract && contract.requiredApprovals)
      ? contract.requiredApprovals.length
      : 0,
    invariantCount: Array.isArray(contract && contract.invariants) ? contract.invariants.length : 0,
    nonGrantCount: Array.isArray(contract && contract.nonGrants) ? contract.nonGrants.length : 0,
  };
}

module.exports = {
  ZAK_FINAL_AUTHORITY_CONTRACT_STATUSES,
  ZAK_FINAL_AUTHORITY_CONTRACT_REQUIRED_APPROVALS,
  ZAK_FINAL_AUTHORITY_CONTRACT_NON_GRANTS,
  createZakFinalAuthorityContract,
  validateZakFinalAuthorityContract,
  assertZakFinalAuthorityContract,
  summarizeZakFinalAuthorityContract,
};
