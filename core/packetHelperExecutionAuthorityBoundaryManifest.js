'use strict';

const PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_TYPES = Object.freeze({
  METADATA_ONLY_BOUNDARY: 'metadata_only_boundary',
  OPERATOR_GATE_REQUIRED: 'operator_gate_required',
  NO_AUTO_RUN: 'no_auto_run',
  EXPLICIT_DENIAL_PATH: 'explicit_denial_path',
  AUDIT_ONLY_RECORD: 'audit_only_record',
});

const PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_STATUSES = Object.freeze({
  PLANNED: 'planned',
  METADATA_ONLY_READY: 'metadata_only_ready',
  BLOCKED: 'blocked',
});

const PACKET_HELPER_EXECUTION_AUTHORITY_FORBIDDEN_SURFACES = Object.freeze([
  'packet helper execution authority',
  'automatic packet execution',
  'automatic command execution',
  'background execution',
  'unreviewed generated command execution',
  'source mutation',
  'runtime file writes',
  'process execution',
  'git execution by Nodex',
  'permission grants',
  'AgentHandoffRunner runtime wiring',
  'runtime execution authority',
  'tool execution authority',
  'activation authority',
  'runtime integration authority',
  'external review authority',
  'Deep Research authority',
  'model-output authority',
  'replay authority',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function defaultBoundaryRows() {
  return [
    {
      name: 'operator gate required',
      boundaryType: PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_TYPES.OPERATOR_GATE_REQUIRED,
      status: PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_STATUSES.METADATA_ONLY_READY,
      operatorGateRequired: true,
      explicitUserRunRequired: true,
      helperAutoRunAllowed: false,
      commandExecutionAllowed: false,
      packetHelperExecutionAllowed: false,
      sourceMutationAllowedNow: false,
      implementationAllowedNow: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
      runtimeFileWritesAllowed: false,
      processExecutionAllowed: false,
      gitExecutionAllowedByNodex: false,
      permissionGrantsAllowed: false,
      agentHandoffRuntimeWiringAllowed: false,
      authorityGranted: false,
      requiredEvidence: [
        'user-run command boundary',
        'no auto-run assertion',
        'blocked command execution assertion',
        'full harness pass',
      ],
    },
    {
      name: 'no auto-run packet helper',
      boundaryType: PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_TYPES.NO_AUTO_RUN,
      status: PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_STATUSES.METADATA_ONLY_READY,
      operatorGateRequired: true,
      explicitUserRunRequired: true,
      helperAutoRunAllowed: false,
      commandExecutionAllowed: false,
      packetHelperExecutionAllowed: false,
      sourceMutationAllowedNow: false,
      implementationAllowedNow: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
      runtimeFileWritesAllowed: false,
      processExecutionAllowed: false,
      gitExecutionAllowedByNodex: false,
      permissionGrantsAllowed: false,
      agentHandoffRuntimeWiringAllowed: false,
      authorityGranted: false,
      requiredEvidence: [
        'automatic execution denial',
        'background execution denial',
        'clipboard summary separation',
        'operator review gate',
      ],
    },
    {
      name: 'explicit denial path',
      boundaryType: PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_TYPES.EXPLICIT_DENIAL_PATH,
      status: PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_STATUSES.PLANNED,
      operatorGateRequired: true,
      explicitUserRunRequired: true,
      helperAutoRunAllowed: false,
      commandExecutionAllowed: false,
      packetHelperExecutionAllowed: false,
      sourceMutationAllowedNow: false,
      implementationAllowedNow: false,
      runtimeExecutionAllowed: false,
      toolExecutionAllowed: false,
      runtimeFileWritesAllowed: false,
      processExecutionAllowed: false,
      gitExecutionAllowedByNodex: false,
      permissionGrantsAllowed: false,
      agentHandoffRuntimeWiringAllowed: false,
      authorityGranted: false,
      requiredEvidence: [
        'unsupported request stop condition',
        'no background execution proof',
        'no authority grant proof',
        'local evidence pointer',
      ],
    },
  ];
}

function createPacketHelperExecutionAuthorityBoundaryManifest(overrides = {}) {
  return {
    schema: 'nodex.packet_helper_execution_authority_boundary.manifest.v1',
    metadataOnly: true,
    authorityGranted: false,
    operatorGateRequired: true,
    explicitUserRunRequired: true,
    helperAutoRunAllowed: false,
    automaticPacketExecutionAllowed: false,
    automaticCommandExecutionAllowed: false,
    backgroundExecutionAllowed: false,
    unreviewedGeneratedCommandExecutionAllowed: false,
    packetHelperExecutionAllowed: false,
    commandExecutionAllowed: false,
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
    forbiddenSurfaces: [...PACKET_HELPER_EXECUTION_AUTHORITY_FORBIDDEN_SURFACES],
    boundaryRows: defaultBoundaryRows(),
    ...overrides,
  };
}

function validateBoundaryRow(row, index) {
  const errors = [];

  if (!isPlainObject(row)) return [`boundaryRows[${index}] must be an object`];
  if (typeof row.name !== 'string' || row.name.length === 0) errors.push(`boundaryRows[${index}].name must be a non-empty string`);
  if (!Object.values(PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_TYPES).includes(row.boundaryType)) errors.push(`boundaryRows[${index}].boundaryType must be recognized`);
  if (!Object.values(PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_STATUSES).includes(row.status)) errors.push(`boundaryRows[${index}].status must be recognized`);

  for (const field of ['operatorGateRequired', 'explicitUserRunRequired']) {
    if (row[field] !== true) errors.push(`boundaryRows[${index}].${field} must be true`);
  }

  for (const field of [
    'helperAutoRunAllowed',
    'commandExecutionAllowed',
    'packetHelperExecutionAllowed',
    'sourceMutationAllowedNow',
    'implementationAllowedNow',
    'runtimeExecutionAllowed',
    'toolExecutionAllowed',
    'runtimeFileWritesAllowed',
    'processExecutionAllowed',
    'gitExecutionAllowedByNodex',
    'permissionGrantsAllowed',
    'agentHandoffRuntimeWiringAllowed',
    'authorityGranted',
  ]) {
    if (row[field] !== false) errors.push(`boundaryRows[${index}].${field} must be false`);
  }

  if (!Array.isArray(row.requiredEvidence) || row.requiredEvidence.length === 0) errors.push(`boundaryRows[${index}].requiredEvidence must be a non-empty array`);
  return errors;
}

function validatePacketHelperExecutionAuthorityBoundaryManifest(manifest) {
  const errors = [];
  if (!isPlainObject(manifest)) return { valid: false, errors: ['manifest must be an object'] };

  for (const field of ['metadataOnly', 'operatorGateRequired', 'explicitUserRunRequired']) {
    if (manifest[field] !== true) errors.push(`${field} must be true`);
  }

  for (const field of [
    'authorityGranted',
    'helperAutoRunAllowed',
    'automaticPacketExecutionAllowed',
    'automaticCommandExecutionAllowed',
    'backgroundExecutionAllowed',
    'unreviewedGeneratedCommandExecutionAllowed',
    'packetHelperExecutionAllowed',
    'commandExecutionAllowed',
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
  ]) {
    if (manifest[field] !== false) errors.push(`${field} must be false`);
  }

  if (!Array.isArray(manifest.forbiddenSurfaces)) errors.push('forbiddenSurfaces must be an array');
  else for (const surface of PACKET_HELPER_EXECUTION_AUTHORITY_FORBIDDEN_SURFACES) if (!manifest.forbiddenSurfaces.includes(surface)) errors.push(`forbiddenSurfaces missing: ${surface}`);

  if (!Array.isArray(manifest.boundaryRows) || manifest.boundaryRows.length === 0) errors.push('boundaryRows must be a non-empty array');
  else for (const [index, row] of manifest.boundaryRows.entries()) errors.push(...validateBoundaryRow(row, index));

  return { valid: errors.length === 0, errors };
}

function assertPacketHelperExecutionAuthorityBoundaryDoesNotGrantAuthority(manifest) {
  const validation = validatePacketHelperExecutionAuthorityBoundaryManifest(manifest);
  if (!validation.valid) throw new Error(`Packet helper execution authority boundary manifest invalid: ${validation.errors.join('; ')}`);
  return true;
}

function classifyPacketHelperExecutionAuthorityBoundaryReadiness(manifest) {
  const validation = validatePacketHelperExecutionAuthorityBoundaryManifest(manifest);
  if (!validation.valid) return { ready: false, status: PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_STATUSES.BLOCKED, reasons: validation.errors, implementationAllowedNow: false, sourceMutationAllowedNow: false, packetHelperExecutionAllowed: false, commandExecutionAllowed: false, authorityGranted: false };
  return { ready: true, status: PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_STATUSES.METADATA_ONLY_READY, reasons: [], implementationAllowedNow: false, sourceMutationAllowedNow: false, packetHelperExecutionAllowed: false, commandExecutionAllowed: false, authorityGranted: false };
}

function summarizePacketHelperExecutionAuthorityBoundaryManifest(manifest) {
  const classification = classifyPacketHelperExecutionAuthorityBoundaryReadiness(manifest);
  return {
    schema: manifest && manifest.schema,
    metadataOnly: manifest && manifest.metadataOnly === true,
    authorityGranted: false,
    operatorGateRequired: manifest && manifest.operatorGateRequired === true,
    explicitUserRunRequired: manifest && manifest.explicitUserRunRequired === true,
    forbiddenSurfaceCount: PACKET_HELPER_EXECUTION_AUTHORITY_FORBIDDEN_SURFACES.length,
    boundaryRowCount: Array.isArray(manifest && manifest.boundaryRows) ? manifest.boundaryRows.length : 0,
    ready: classification.ready,
    status: classification.status,
    implementationAllowedNow: false,
    sourceMutationAllowedNow: false,
    packetHelperExecutionAllowed: false,
    commandExecutionAllowed: false,
    helperAutoRunAllowed: false,
    automaticPacketExecutionAllowed: false,
    automaticCommandExecutionAllowed: false,
    backgroundExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    runtimeFileWritesAllowed: false,
    processExecutionAllowed: false,
    gitExecutionAllowedByNodex: false,
    permissionGrantsAllowed: false,
    agentHandoffRuntimeWiringAllowed: false,
  };
}

module.exports = Object.freeze({
  PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_TYPES,
  PACKET_HELPER_EXECUTION_AUTHORITY_BOUNDARY_STATUSES,
  PACKET_HELPER_EXECUTION_AUTHORITY_FORBIDDEN_SURFACES,
  createPacketHelperExecutionAuthorityBoundaryManifest,
  validatePacketHelperExecutionAuthorityBoundaryManifest,
  summarizePacketHelperExecutionAuthorityBoundaryManifest,
  assertPacketHelperExecutionAuthorityBoundaryDoesNotGrantAuthority,
  classifyPacketHelperExecutionAuthorityBoundaryReadiness,
});