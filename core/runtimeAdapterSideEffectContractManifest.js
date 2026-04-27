'use strict';

const RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_TYPES = Object.freeze({
  METADATA_ONLY_CONTRACT: 'metadata_only_contract',
  DENY_BY_DEFAULT: 'deny_by_default',
  SIDE_EFFECT_CLASSIFICATION: 'side_effect_classification',
  NO_RUNTIME_ADAPTER_INVOCATION: 'no_runtime_adapter_invocation',
  NO_TOOL_ADAPTER_INVOCATION: 'no_tool_adapter_invocation',
});

const RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_STATUSES = Object.freeze({
  PLANNED: 'planned',
  METADATA_ONLY_READY: 'metadata_only_ready',
  BLOCKED: 'blocked',
});

const RUNTIME_ADAPTER_SIDE_EFFECT_FORBIDDEN_SURFACES = Object.freeze([
  'runtime adapter side-effect authority',
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
  'external review authority',
  'Deep Research authority',
  'model-output authority',
  'replay authority',
  'network side effects',
  'filesystem side effects',
  'environment mutation',
  'credential access',
]);

const RUNTIME_ADAPTER_SIDE_EFFECT_CLASSES = Object.freeze([
  'none',
  'read_only_metadata',
  'filesystem_write',
  'process_spawn',
  'network_io',
  'git_mutation',
  'permission_change',
  'credential_access',
  'runtime_adapter_invocation',
  'tool_adapter_invocation',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function defaultSideEffectRows() {
  return [
    {
      name: 'deny by default runtime adapter contract',
      contractType: RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_TYPES.DENY_BY_DEFAULT,
      status: RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_STATUSES.METADATA_ONLY_READY,
      sideEffectClass: 'none',
      denyByDefaultRequired: true,
      metadataOnly: true,
      authorityGranted: false,
      runtimeAdapterInvocationAllowed: false,
      toolAdapterInvocationAllowed: false,
      runtimeIntegrationAllowed: false,
      actualDryRunExecutionAllowed: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
      runtimeFileWritesAllowed: false,
      filesystemWritesAllowed: false,
      processExecutionAllowed: false,
      processSpawnAllowed: false,
      networkIOAllowed: false,
      gitExecutionAllowedByNodex: false,
      gitMutationAllowed: false,
      permissionGrantsAllowed: false,
      credentialAccessAllowed: false,
      environmentMutationAllowed: false,
      agentHandoffRuntimeWiringAllowed: false,
      packetHelperExecutionAllowed: false,
      requiredEvidence: [
        'deny-by-default assertion',
        'no runtime adapter invocation assertion',
        'no tool adapter invocation assertion',
        'full harness pass',
      ],
    },
    {
      name: 'read-only metadata classification',
      contractType: RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_TYPES.SIDE_EFFECT_CLASSIFICATION,
      status: RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_STATUSES.METADATA_ONLY_READY,
      sideEffectClass: 'read_only_metadata',
      denyByDefaultRequired: true,
      metadataOnly: true,
      authorityGranted: false,
      runtimeAdapterInvocationAllowed: false,
      toolAdapterInvocationAllowed: false,
      runtimeIntegrationAllowed: false,
      actualDryRunExecutionAllowed: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
      runtimeFileWritesAllowed: false,
      filesystemWritesAllowed: false,
      processExecutionAllowed: false,
      processSpawnAllowed: false,
      networkIOAllowed: false,
      gitExecutionAllowedByNodex: false,
      gitMutationAllowed: false,
      permissionGrantsAllowed: false,
      credentialAccessAllowed: false,
      environmentMutationAllowed: false,
      agentHandoffRuntimeWiringAllowed: false,
      packetHelperExecutionAllowed: false,
      requiredEvidence: [
        'classification-only record',
        'no side-effect execution',
        'local evidence pointer',
        'operator review gate',
      ],
    },
  ];
}

function createRuntimeAdapterSideEffectContractManifest(overrides = {}) {
  return {
    schema: 'nodex.runtime_adapter_side_effect_contract.manifest.v1',
    metadataOnly: true,
    authorityGranted: false,
    denyByDefaultRequired: true,
    runtimeAdapterInvocationAllowed: false,
    toolAdapterInvocationAllowed: false,
    runtimeIntegrationAllowed: false,
    actualDryRunExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    filesystemWritesAllowed: false,
    processExecutionAllowed: false,
    processSpawnAllowed: false,
    networkIOAllowed: false,
    gitExecutionAllowedByNodex: false,
    gitMutationAllowed: false,
    permissionGrantsAllowed: false,
    credentialAccessAllowed: false,
    environmentMutationAllowed: false,
    agentHandoffRuntimeWiringAllowed: false,
    modelOutputAuthorityAllowed: false,
    replayAuthorityAllowed: false,
    packetHelperExecutionAllowed: false,
    externalReviewAuthorityAllowed: false,
    deepResearchAuthorityAllowed: false,
    sideEffectClasses: [...RUNTIME_ADAPTER_SIDE_EFFECT_CLASSES],
    forbiddenSurfaces: [...RUNTIME_ADAPTER_SIDE_EFFECT_FORBIDDEN_SURFACES],
    sideEffectRows: defaultSideEffectRows(),
    ...overrides,
  };
}

function validateSideEffectRow(row, index) {
  const errors = [];

  if (!isPlainObject(row)) {
    return [`sideEffectRows[${index}] must be an object`];
  }

  if (typeof row.name !== 'string' || row.name.length === 0) {
    errors.push(`sideEffectRows[${index}].name must be a non-empty string`);
  }

  if (!Object.values(RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_TYPES).includes(row.contractType)) {
    errors.push(`sideEffectRows[${index}].contractType must be recognized`);
  }

  if (!Object.values(RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_STATUSES).includes(row.status)) {
    errors.push(`sideEffectRows[${index}].status must be recognized`);
  }

  if (!RUNTIME_ADAPTER_SIDE_EFFECT_CLASSES.includes(row.sideEffectClass)) {
    errors.push(`sideEffectRows[${index}].sideEffectClass must be recognized`);
  }

  for (const field of ['denyByDefaultRequired', 'metadataOnly']) {
    if (row[field] !== true) {
      errors.push(`sideEffectRows[${index}].${field} must be true`);
    }
  }

  const falseFields = [
    'authorityGranted',
    'runtimeAdapterInvocationAllowed',
    'toolAdapterInvocationAllowed',
    'runtimeIntegrationAllowed',
    'actualDryRunExecutionAllowed',
    'runtimeExecutionAllowed',
    'toolExecutionAllowed',
    'runtimeFileWritesAllowed',
    'filesystemWritesAllowed',
    'processExecutionAllowed',
    'processSpawnAllowed',
    'networkIOAllowed',
    'gitExecutionAllowedByNodex',
    'gitMutationAllowed',
    'permissionGrantsAllowed',
    'credentialAccessAllowed',
    'environmentMutationAllowed',
    'agentHandoffRuntimeWiringAllowed',
    'packetHelperExecutionAllowed',
  ];

  for (const field of falseFields) {
    if (row[field] !== false) {
      errors.push(`sideEffectRows[${index}].${field} must be false`);
    }
  }

  if (!Array.isArray(row.requiredEvidence) || row.requiredEvidence.length === 0) {
    errors.push(`sideEffectRows[${index}].requiredEvidence must be a non-empty array`);
  }

  return errors;
}

function validateRuntimeAdapterSideEffectContractManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return { valid: false, errors: ['manifest must be an object'] };
  }

  for (const field of ['metadataOnly', 'denyByDefaultRequired']) {
    if (manifest[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  const falseFields = [
    'authorityGranted',
    'runtimeAdapterInvocationAllowed',
    'toolAdapterInvocationAllowed',
    'runtimeIntegrationAllowed',
    'actualDryRunExecutionAllowed',
    'runtimeExecutionAllowed',
    'toolExecutionAllowed',
    'runtimeFileWritesAllowed',
    'filesystemWritesAllowed',
    'processExecutionAllowed',
    'processSpawnAllowed',
    'networkIOAllowed',
    'gitExecutionAllowedByNodex',
    'gitMutationAllowed',
    'permissionGrantsAllowed',
    'credentialAccessAllowed',
    'environmentMutationAllowed',
    'agentHandoffRuntimeWiringAllowed',
    'modelOutputAuthorityAllowed',
    'replayAuthorityAllowed',
    'packetHelperExecutionAllowed',
    'externalReviewAuthorityAllowed',
    'deepResearchAuthorityAllowed',
  ];

  for (const field of falseFields) {
    if (manifest[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (!Array.isArray(manifest.sideEffectClasses)) {
    errors.push('sideEffectClasses must be an array');
  } else {
    for (const sideEffectClass of RUNTIME_ADAPTER_SIDE_EFFECT_CLASSES) {
      if (!manifest.sideEffectClasses.includes(sideEffectClass)) {
        errors.push(`sideEffectClasses missing: ${sideEffectClass}`);
      }
    }
  }

  if (!Array.isArray(manifest.forbiddenSurfaces)) {
    errors.push('forbiddenSurfaces must be an array');
  } else {
    for (const surface of RUNTIME_ADAPTER_SIDE_EFFECT_FORBIDDEN_SURFACES) {
      if (!manifest.forbiddenSurfaces.includes(surface)) {
        errors.push(`forbiddenSurfaces missing: ${surface}`);
      }
    }
  }

  if (!Array.isArray(manifest.sideEffectRows) || manifest.sideEffectRows.length === 0) {
    errors.push('sideEffectRows must be a non-empty array');
  } else {
    for (const [index, row] of manifest.sideEffectRows.entries()) {
      errors.push(...validateSideEffectRow(row, index));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertRuntimeAdapterSideEffectContractDoesNotGrantAuthority(manifest) {
  const validation = validateRuntimeAdapterSideEffectContractManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Runtime adapter side-effect contract manifest invalid: ${validation.errors.join('; ')}`);
  }
  return true;
}

function classifyRuntimeAdapterSideEffectContractReadiness(manifest) {
  const validation = validateRuntimeAdapterSideEffectContractManifest(manifest);

  if (!validation.valid) {
    return {
      ready: false,
      status: RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_STATUSES.BLOCKED,
      reasons: validation.errors,
      implementationAllowedNow: false,
      sourceMutationAllowedNow: false,
      runtimeIntegrationAllowed: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
      runtimeFileWritesAllowed: false,
      processExecutionAllowed: false,
      authorityGranted: false,
    };
  }

  return {
    ready: true,
    status: RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_STATUSES.METADATA_ONLY_READY,
    reasons: [],
    implementationAllowedNow: false,
    sourceMutationAllowedNow: false,
    runtimeIntegrationAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    processExecutionAllowed: false,
    authorityGranted: false,
  };
}

function summarizeRuntimeAdapterSideEffectContractManifest(manifest) {
  const classification = classifyRuntimeAdapterSideEffectContractReadiness(manifest);

  return {
    schema: manifest && manifest.schema,
    metadataOnly: manifest && manifest.metadataOnly === true,
    authorityGranted: false,
    denyByDefaultRequired: manifest && manifest.denyByDefaultRequired === true,
    sideEffectClassCount: RUNTIME_ADAPTER_SIDE_EFFECT_CLASSES.length,
    forbiddenSurfaceCount: RUNTIME_ADAPTER_SIDE_EFFECT_FORBIDDEN_SURFACES.length,
    sideEffectRowCount: Array.isArray(manifest && manifest.sideEffectRows) ? manifest.sideEffectRows.length : 0,
    ready: classification.ready,
    status: classification.status,
    implementationAllowedNow: false,
    sourceMutationAllowedNow: false,
    runtimeAdapterInvocationAllowed: false,
    toolAdapterInvocationAllowed: false,
    runtimeIntegrationAllowed: false,
    actualDryRunExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    filesystemWritesAllowed: false,
    processExecutionAllowed: false,
    processSpawnAllowed: false,
    networkIOAllowed: false,
    gitExecutionAllowedByNodex: false,
    gitMutationAllowed: false,
    permissionGrantsAllowed: false,
    credentialAccessAllowed: false,
    environmentMutationAllowed: false,
    agentHandoffRuntimeWiringAllowed: false,
    packetHelperExecutionAllowed: false,
  };
}

module.exports = Object.freeze({
  RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_TYPES,
  RUNTIME_ADAPTER_SIDE_EFFECT_CONTRACT_STATUSES,
  RUNTIME_ADAPTER_SIDE_EFFECT_FORBIDDEN_SURFACES,
  createRuntimeAdapterSideEffectContractManifest,
  validateRuntimeAdapterSideEffectContractManifest,
  summarizeRuntimeAdapterSideEffectContractManifest,
  assertRuntimeAdapterSideEffectContractDoesNotGrantAuthority,
  classifyRuntimeAdapterSideEffectContractReadiness,
});