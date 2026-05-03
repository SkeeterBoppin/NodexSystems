'use strict';

const PACKET_GENERATION_ASSISTANT_BOUNDARY_MANIFEST_VERSION =
  'packet_generation_assistant_boundary_manifest.v1';

const DEFAULT_BLOCKED_AUTHORITIES = Object.freeze([
  'manual_commit',
  'manual_staging',
  'reset',
  'runtime_execution',
  'tool_execution',
  'packet_execution_by_nodex',
  'packet_commit_by_nodex',
  'packet_push_by_nodex',
  'generated_code_approval',
  'model_output_approval',
  'prompt_output_authority',
  'self_approval_authority',
  'authority_self_expansion',
  'reward_authority',
  'autonomous_priority_authority',
  'success_signal_authority',
  'graph_expansion',
]);

const REQUIRED_BOUNDARY_CONTROLS = Object.freeze([
  'local_evidence_authority_only',
  'schema_bound_packet_drafts',
  'explicit_evidence_paths',
  'exact_dirty_scopes',
  'blocked_authorities_default_false',
  'tracked_live_context_commit_self_reference_blocked',
  'nested_here_string_collision_hazard_blocked',
  'pass_and_fail_evidence_required',
]);

function cloneArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function uniqueStrings(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${fieldName} must be an array`);
  }

  const seen = new Set();

  for (const item of value) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new TypeError(`${fieldName} must contain non-empty strings only`);
    }

    if (seen.has(item)) {
      throw new Error(`${fieldName} contains duplicate entry: ${item}`);
    }

    seen.add(item);
  }

  return Array.from(seen);
}

function getPacketGenerationAssistantBoundaryManifest(overrides = {}) {
  const manifest = {
    version: PACKET_GENERATION_ASSISTANT_BOUNDARY_MANIFEST_VERSION,
    type: 'metadata_only_manifest_validator',
    localEvidenceAuthorityRequired: true,
    schemaBoundPacketDraftsRequired: true,
    explicitEvidencePathsRequired: true,
    exactDirtyScopesRequired: true,
    trackedLiveContextCommitSelfReferenceBlocked: true,
    nestedHereStringCollisionHazardBlocked: true,
    passAndFailEvidenceRequired: true,
    packetGenerationAuthorityGranted: false,
    packetExecutionAuthorityGranted: false,
    packetCommitAuthorityGranted: false,
    packetPushAuthorityGranted: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    modelOutputApprovalAllowed: false,
    generatedCodeApprovalAllowed: false,
    authorityExpansionAllowed: false,
    promptOnlyEnforcementAllowed: false,
    blockedAuthorities: cloneArray(DEFAULT_BLOCKED_AUTHORITIES),
    requiredBoundaryControls: cloneArray(REQUIRED_BOUNDARY_CONTROLS),
  };

  return Object.freeze({
    ...manifest,
    ...overrides,
    blockedAuthorities: Object.freeze(
      uniqueStrings(
        overrides.blockedAuthorities || manifest.blockedAuthorities,
        'blockedAuthorities'
      )
    ),
    requiredBoundaryControls: Object.freeze(
      uniqueStrings(
        overrides.requiredBoundaryControls || manifest.requiredBoundaryControls,
        'requiredBoundaryControls'
      )
    ),
  });
}

function validatePacketGenerationAssistantBoundaryManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return {
      valid: false,
      errors: ['manifest must be an object'],
    };
  }

  if (manifest.version !== PACKET_GENERATION_ASSISTANT_BOUNDARY_MANIFEST_VERSION) {
    errors.push('version mismatch');
  }

  if (manifest.type !== 'metadata_only_manifest_validator') {
    errors.push('type must be metadata_only_manifest_validator');
  }

  const requiredTrueFields = [
    'localEvidenceAuthorityRequired',
    'schemaBoundPacketDraftsRequired',
    'explicitEvidencePathsRequired',
    'exactDirtyScopesRequired',
    'trackedLiveContextCommitSelfReferenceBlocked',
    'nestedHereStringCollisionHazardBlocked',
    'passAndFailEvidenceRequired',
  ];

  for (const field of requiredTrueFields) {
    if (manifest[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  const requiredFalseFields = [
    'packetGenerationAuthorityGranted',
    'packetExecutionAuthorityGranted',
    'packetCommitAuthorityGranted',
    'packetPushAuthorityGranted',
    'runtimeExecutionAllowed',
    'toolExecutionAllowed',
    'modelOutputApprovalAllowed',
    'generatedCodeApprovalAllowed',
    'authorityExpansionAllowed',
    'promptOnlyEnforcementAllowed',
  ];

  for (const field of requiredFalseFields) {
    if (manifest[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  try {
    const blockedAuthorities = uniqueStrings(
      manifest.blockedAuthorities,
      'blockedAuthorities'
    );

    for (const authority of DEFAULT_BLOCKED_AUTHORITIES) {
      if (!blockedAuthorities.includes(authority)) {
        errors.push(`blockedAuthorities missing ${authority}`);
      }
    }
  } catch (error) {
    errors.push(error.message);
  }

  try {
    const requiredBoundaryControls = uniqueStrings(
      manifest.requiredBoundaryControls,
      'requiredBoundaryControls'
    );

    for (const control of REQUIRED_BOUNDARY_CONTROLS) {
      if (!requiredBoundaryControls.includes(control)) {
        errors.push(`requiredBoundaryControls missing ${control}`);
      }
    }
  } catch (error) {
    errors.push(error.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertPacketGenerationAssistantBoundaryManifest(manifest) {
  const result = validatePacketGenerationAssistantBoundaryManifest(manifest);

  if (!result.valid) {
    throw new Error(
      `Invalid packet generation assistant boundary manifest: ${result.errors.join('; ')}`
    );
  }

  return manifest;
}

function isPacketGenerationAssistantBoundaryAuthorityGranted(manifest) {
  assertPacketGenerationAssistantBoundaryManifest(manifest);

  return Boolean(
    manifest.packetGenerationAuthorityGranted ||
      manifest.packetExecutionAuthorityGranted ||
      manifest.packetCommitAuthorityGranted ||
      manifest.packetPushAuthorityGranted ||
      manifest.runtimeExecutionAllowed ||
      manifest.toolExecutionAllowed ||
      manifest.modelOutputApprovalAllowed ||
      manifest.generatedCodeApprovalAllowed ||
      manifest.authorityExpansionAllowed
  );
}

function createPacketGenerationAssistantBoundaryState(overrides = {}) {
  const manifest = getPacketGenerationAssistantBoundaryManifest();

  return Object.freeze({
    manifestVersion: manifest.version,
    localEvidenceAuthorityVerified: false,
    masterSourceCheckPassRequired: true,
    selectedNextSeamRequired: true,
    packetDraftCreated: false,
    packetExecutedByNodex: false,
    packetCommittedByNodex: false,
    packetPushedByNodex: false,
    authorityGranted: false,
    sourceMutationAllowed: false,
    implementationAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    generatedCodeApprovalAllowed: false,
    modelOutputApprovalAllowed: false,
    trackedLiveContextCommitSelfReferenceBlocked: true,
    nestedHereStringCollisionHazardBlocked: true,
    ...overrides,
  });
}

function validatePacketGenerationAssistantBoundaryState(state) {
  const errors = [];

  if (!state || typeof state !== 'object') {
    return {
      valid: false,
      errors: ['state must be an object'],
    };
  }

  if (state.manifestVersion !== PACKET_GENERATION_ASSISTANT_BOUNDARY_MANIFEST_VERSION) {
    errors.push('state manifestVersion mismatch');
  }

  const requiredTrueFields = [
    'masterSourceCheckPassRequired',
    'selectedNextSeamRequired',
    'trackedLiveContextCommitSelfReferenceBlocked',
    'nestedHereStringCollisionHazardBlocked',
  ];

  for (const field of requiredTrueFields) {
    if (state[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  const requiredFalseFields = [
    'packetDraftCreated',
    'packetExecutedByNodex',
    'packetCommittedByNodex',
    'packetPushedByNodex',
    'authorityGranted',
    'sourceMutationAllowed',
    'implementationAllowed',
    'runtimeExecutionAllowed',
    'toolExecutionAllowed',
    'generatedCodeApprovalAllowed',
    'modelOutputApprovalAllowed',
  ];

  for (const field of requiredFalseFields) {
    if (state[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertPacketGenerationAssistantBoundaryState(state) {
  const result = validatePacketGenerationAssistantBoundaryState(state);

  if (!result.valid) {
    throw new Error(
      `Invalid packet generation assistant boundary state: ${result.errors.join('; ')}`
    );
  }

  return state;
}

module.exports = {
  PACKET_GENERATION_ASSISTANT_BOUNDARY_MANIFEST_VERSION,
  getPacketGenerationAssistantBoundaryManifest,
  validatePacketGenerationAssistantBoundaryManifest,
  assertPacketGenerationAssistantBoundaryManifest,
  isPacketGenerationAssistantBoundaryAuthorityGranted,
  createPacketGenerationAssistantBoundaryState,
  validatePacketGenerationAssistantBoundaryState,
  assertPacketGenerationAssistantBoundaryState,
};