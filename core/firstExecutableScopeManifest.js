'use strict';

const FIRST_EXECUTABLE_SCOPE_TYPES = Object.freeze({
  METADATA_CLASSIFICATION_ONLY: 'metadata_classification_only',
  NO_SIDE_EFFECT_CONTRACT_DEFINITION: 'no_side_effect_contract_definition',
  OPERATOR_REVIEW_REQUIRED: 'operator_review_required',
  EVIDENCE_POINTER_REQUIRED: 'evidence_pointer_required',
  EXPLICIT_DENIAL_PATH: 'explicit_denial_path',
});

const FIRST_EXECUTABLE_SCOPE_STATUSES = Object.freeze({
  PLANNED: 'planned',
  METADATA_ONLY_READY: 'metadata_only_ready',
  BLOCKED: 'blocked',
});

const FIRST_EXECUTABLE_SCOPE_FORBIDDEN_SURFACES = Object.freeze([
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
  'model-output authority',
  'replay authority',
  'external review authority',
  'Deep Research authority',
  'packet helper execution authority',
  'automatic execution',
  'background execution',
  'unreviewed generated command execution',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function defaultAllowedScopeKinds() {
  return Object.values(FIRST_EXECUTABLE_SCOPE_TYPES);
}

function defaultCandidateScopes() {
  return [
    {
      name: 'metadata classification only',
      scopeType: FIRST_EXECUTABLE_SCOPE_TYPES.METADATA_CLASSIFICATION_ONLY,
      status: FIRST_EXECUTABLE_SCOPE_STATUSES.METADATA_ONLY_READY,
      description: 'Classify the first executable boundary without granting execution authority.',
      operatorReviewRequired: true,
      evidencePointerRequired: true,
      explicitDenialPathRequired: true,
      sideEffectsAllowed: false,
      executionAuthorityAllowed: false,
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
      authorityGranted: false,
      requiredEvidence: [
        'operator-reviewed scope identifier',
        'forbidden surface matrix',
        'explicit denial-path validation',
        'full harness pass',
      ],
    },
    {
      name: 'no side-effect contract definition',
      scopeType: FIRST_EXECUTABLE_SCOPE_TYPES.NO_SIDE_EFFECT_CONTRACT_DEFINITION,
      status: FIRST_EXECUTABLE_SCOPE_STATUSES.PLANNED,
      description: 'Define a future no-side-effect contract before any adapter or runtime action can be considered.',
      operatorReviewRequired: true,
      evidencePointerRequired: true,
      explicitDenialPathRequired: true,
      sideEffectsAllowed: false,
      executionAuthorityAllowed: false,
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
      authorityGranted: false,
      requiredEvidence: [
        'side-effect surface inventory',
        'deny-by-default validator',
        'operator approval checkpoint',
        'negative execution probe',
      ],
    },
    {
      name: 'explicit denial path',
      scopeType: FIRST_EXECUTABLE_SCOPE_TYPES.EXPLICIT_DENIAL_PATH,
      status: FIRST_EXECUTABLE_SCOPE_STATUSES.PLANNED,
      description: 'Require explicit denial for unsupported executable requests and authority grants.',
      operatorReviewRequired: true,
      evidencePointerRequired: true,
      explicitDenialPathRequired: true,
      sideEffectsAllowed: false,
      executionAuthorityAllowed: false,
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
      authorityGranted: false,
      requiredEvidence: [
        'unsupported surface list',
        'blocked transition reason',
        'stop condition record',
        'no source mutation proof',
      ],
    },
  ];
}

function createFirstExecutableScopeManifest(overrides = {}) {
  const manifest = {
    schema: 'nodex.first_executable_scope.manifest.v1',
    metadataOnly: true,
    authorityGranted: false,
    sourceMutationAllowedNow: false,
    implementationAllowedNow: false,
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
    automaticExecutionAllowed: false,
    backgroundExecutionAllowed: false,
    unreviewedGeneratedCommandExecutionAllowed: false,
    allowedScopeKinds: defaultAllowedScopeKinds(),
    forbiddenSurfaces: [...FIRST_EXECUTABLE_SCOPE_FORBIDDEN_SURFACES],
    candidateScopes: defaultCandidateScopes(),
    ...overrides,
  };

  return manifest;
}

function validateCandidateScope(scope, index) {
  const errors = [];

  if (!isPlainObject(scope)) {
    return [`candidateScopes[${index}] must be an object`];
  }

  if (typeof scope.name !== 'string' || scope.name.length === 0) {
    errors.push(`candidateScopes[${index}].name must be a non-empty string`);
  }

  if (!Object.values(FIRST_EXECUTABLE_SCOPE_TYPES).includes(scope.scopeType)) {
    errors.push(`candidateScopes[${index}].scopeType must be recognized`);
  }

  if (!Object.values(FIRST_EXECUTABLE_SCOPE_STATUSES).includes(scope.status)) {
    errors.push(`candidateScopes[${index}].status must be recognized`);
  }

  const trueFields = [
    'operatorReviewRequired',
    'evidencePointerRequired',
    'explicitDenialPathRequired',
  ];

  for (const field of trueFields) {
    if (scope[field] !== true) {
      errors.push(`candidateScopes[${index}].${field} must be true`);
    }
  }

  const falseFields = [
    'sideEffectsAllowed',
    'executionAuthorityAllowed',
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
    'authorityGranted',
  ];

  for (const field of falseFields) {
    if (scope[field] !== false) {
      errors.push(`candidateScopes[${index}].${field} must be false`);
    }
  }

  if (!Array.isArray(scope.requiredEvidence) || scope.requiredEvidence.length === 0) {
    errors.push(`candidateScopes[${index}].requiredEvidence must be a non-empty array`);
  }

  return errors;
}

function validateFirstExecutableScopeManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return { valid: false, errors: ['manifest must be an object'] };
  }

  const trueFields = [
    'metadataOnly',
  ];

  for (const field of trueFields) {
    if (manifest[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  const falseFields = [
    'authorityGranted',
    'sourceMutationAllowedNow',
    'implementationAllowedNow',
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
    'automaticExecutionAllowed',
    'backgroundExecutionAllowed',
    'unreviewedGeneratedCommandExecutionAllowed',
  ];

  for (const field of falseFields) {
    if (manifest[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (!Array.isArray(manifest.allowedScopeKinds)) {
    errors.push('allowedScopeKinds must be an array');
  } else {
    for (const kind of defaultAllowedScopeKinds()) {
      if (!manifest.allowedScopeKinds.includes(kind)) {
        errors.push(`allowedScopeKinds missing: ${kind}`);
      }
    }
  }

  if (!Array.isArray(manifest.forbiddenSurfaces)) {
    errors.push('forbiddenSurfaces must be an array');
  } else {
    for (const surface of FIRST_EXECUTABLE_SCOPE_FORBIDDEN_SURFACES) {
      if (!manifest.forbiddenSurfaces.includes(surface)) {
        errors.push(`forbiddenSurfaces missing: ${surface}`);
      }
    }
  }

  if (!Array.isArray(manifest.candidateScopes) || manifest.candidateScopes.length === 0) {
    errors.push('candidateScopes must be a non-empty array');
  } else {
    for (const [index, scope] of manifest.candidateScopes.entries()) {
      errors.push(...validateCandidateScope(scope, index));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertFirstExecutableScopeDoesNotGrantAuthority(manifest) {
  const validation = validateFirstExecutableScopeManifest(manifest);
  if (!validation.valid) {
    throw new Error(`First executable scope manifest invalid: ${validation.errors.join('; ')}`);
  }
  return true;
}

function classifyFirstExecutableScopeReadiness(manifest) {
  const validation = validateFirstExecutableScopeManifest(manifest);

  if (!validation.valid) {
    return {
      ready: false,
      status: FIRST_EXECUTABLE_SCOPE_STATUSES.BLOCKED,
      reasons: validation.errors,
      implementationAllowedNow: false,
      sourceMutationAllowedNow: false,
      authorityGranted: false,
    };
  }

  return {
    ready: true,
    status: FIRST_EXECUTABLE_SCOPE_STATUSES.METADATA_ONLY_READY,
    reasons: [],
    implementationAllowedNow: false,
    sourceMutationAllowedNow: false,
    authorityGranted: false,
  };
}

function summarizeFirstExecutableScopeManifest(manifest) {
  const classification = classifyFirstExecutableScopeReadiness(manifest);

  return {
    schema: manifest && manifest.schema,
    metadataOnly: manifest && manifest.metadataOnly === true,
    authorityGranted: false,
    candidateScopeCount: Array.isArray(manifest && manifest.candidateScopes) ? manifest.candidateScopes.length : 0,
    forbiddenSurfaceCount: FIRST_EXECUTABLE_SCOPE_FORBIDDEN_SURFACES.length,
    allowedScopeKindCount: defaultAllowedScopeKinds().length,
    ready: classification.ready,
    status: classification.status,
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
    packetHelperExecutionAllowed: false,
  };
}

module.exports = Object.freeze({
  FIRST_EXECUTABLE_SCOPE_TYPES,
  FIRST_EXECUTABLE_SCOPE_STATUSES,
  FIRST_EXECUTABLE_SCOPE_FORBIDDEN_SURFACES,
  createFirstExecutableScopeManifest,
  validateFirstExecutableScopeManifest,
  summarizeFirstExecutableScopeManifest,
  assertFirstExecutableScopeDoesNotGrantAuthority,
  classifyFirstExecutableScopeReadiness,
});