'use strict';

const FILE_OPERATION_CAPABILITY_BOUNDARY_STATUSES = Object.freeze({
  VALID: 'valid',
  INVALID: 'invalid',
});

const FILE_OPERATION_CAPABILITY_BOUNDARY_BLOCKED_REASONS = Object.freeze({
  BROAD_FILESYSTEM_CAPABILITY_BLOCKED: 'broad_filesystem_capability_blocked',
  FILE_MOVE_EXECUTION_BLOCKED: 'file_move_execution_blocked',
  SOURCE_MUTATION_BLOCKED: 'source_mutation_blocked',
  GENERATED_CODE_APPROVAL_BLOCKED: 'generated_code_approval_blocked',
  MODEL_OUTPUT_APPROVAL_BLOCKED: 'model_output_approval_blocked',
  AUTHORITY_SELF_EXPANSION_BLOCKED: 'authority_self_expansion_blocked',
  RUNTIME_ADAPTERS_BLOCKED: 'runtime_adapters_blocked',
  FILESYSTEM_EXECUTION_ADAPTERS_BLOCKED: 'filesystem_execution_adapters_blocked',
  AGENT_HANDOFF_RUNTIME_WIRING_BLOCKED: 'agent_handoff_runtime_wiring_blocked',
});

const DEFAULT_ALLOWED_METADATA_OPERATIONS = Object.freeze([
  'file_operation_boundary_manifest_validation',
  'file_operation_boundary_manifest_classification',
  'file_operation_boundary_manifest_summary',
]);

const DEFAULT_APPROVED_IMPLEMENTATION_FILES = Object.freeze([
  'core/fileOperationCapabilityBoundaryManifest.js',
  'tests/run.js',
]);

function cloneArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function createFileOperationCapabilityBoundaryManifest(overrides = {}) {
  const manifest = {
    schema: 'nodex.file_operation_capability_boundary.manifest.v1',
    boundary: 'file_operation_capability_boundary',
    metadataOnly: true,
    narrowFileOperationCapabilityBoundary: true,
    allowedMetadataOperations: DEFAULT_ALLOWED_METADATA_OPERATIONS.slice(),
    approvedImplementationFiles: DEFAULT_APPROVED_IMPLEMENTATION_FILES.slice(),
    blockedReasons: Object.values(FILE_OPERATION_CAPABILITY_BOUNDARY_BLOCKED_REASONS),
    broadFilesystemCapabilityGranted: false,
    fileMoveExecutionAllowed: false,
    sourceMutationAllowed: false,
    generatedCodeApprovalGranted: false,
    modelOutputApprovalGranted: false,
    authoritySelfExpansionGranted: false,
    runtimeAdaptersAllowed: false,
    filesystemExecutionAdaptersAllowed: false,
    agentHandoffRuntimeWiringAllowed: false,
    defensiveArtifactWriterRequired: true,
    ...overrides,
  };

  manifest.allowedMetadataOperations = cloneArray(manifest.allowedMetadataOperations);
  manifest.approvedImplementationFiles = cloneArray(manifest.approvedImplementationFiles);
  manifest.blockedReasons = cloneArray(manifest.blockedReasons);

  return Object.freeze(manifest);
}

function validateFileOperationCapabilityBoundaryManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return {
      status: FILE_OPERATION_CAPABILITY_BOUNDARY_STATUSES.INVALID,
      valid: false,
      errors: ['manifest must be an object'],
    };
  }

  if (manifest.schema !== 'nodex.file_operation_capability_boundary.manifest.v1') {
    errors.push('schema mismatch');
  }

  if (manifest.boundary !== 'file_operation_capability_boundary') {
    errors.push('boundary mismatch');
  }

  if (manifest.metadataOnly !== true) {
    errors.push('metadataOnly must be true');
  }

  if (manifest.narrowFileOperationCapabilityBoundary !== true) {
    errors.push('narrowFileOperationCapabilityBoundary must be true');
  }

  if (!Array.isArray(manifest.allowedMetadataOperations) || manifest.allowedMetadataOperations.length === 0) {
    errors.push('allowedMetadataOperations must be a non-empty array');
  }

  if (!Array.isArray(manifest.approvedImplementationFiles)) {
    errors.push('approvedImplementationFiles must be an array');
  } else {
    for (const requiredFile of DEFAULT_APPROVED_IMPLEMENTATION_FILES) {
      if (!manifest.approvedImplementationFiles.includes(requiredFile)) {
        errors.push(`missing approved implementation file: ${requiredFile}`);
      }
    }
  }

  const blockedBooleanFields = [
    ['broadFilesystemCapabilityGranted', 'broad filesystem capability must remain blocked'],
    ['fileMoveExecutionAllowed', 'file move execution must remain blocked'],
    ['sourceMutationAllowed', 'source mutation must remain blocked in runtime capability manifest'],
    ['generatedCodeApprovalGranted', 'generated-code approval must remain blocked'],
    ['modelOutputApprovalGranted', 'model-output approval must remain blocked'],
    ['authoritySelfExpansionGranted', 'authority self-expansion must remain blocked'],
    ['runtimeAdaptersAllowed', 'runtime adapters must remain blocked'],
    ['filesystemExecutionAdaptersAllowed', 'filesystem execution adapters must remain blocked'],
    ['agentHandoffRuntimeWiringAllowed', 'AgentHandoffRunner runtime wiring must remain blocked'],
  ];

  for (const [field, message] of blockedBooleanFields) {
    if (manifest[field] !== false) {
      errors.push(message);
    }
  }

  if (manifest.defensiveArtifactWriterRequired !== true) {
    errors.push('defensiveArtifactWriterRequired must be true');
  }

  if (!Array.isArray(manifest.blockedReasons)) {
    errors.push('blockedReasons must be an array');
  } else {
    const requiredReasons = Object.values(FILE_OPERATION_CAPABILITY_BOUNDARY_BLOCKED_REASONS);
    for (const reason of requiredReasons) {
      if (!manifest.blockedReasons.includes(reason)) {
        errors.push(`missing blocked reason: ${reason}`);
      }
    }
  }

  return {
    status: errors.length === 0
      ? FILE_OPERATION_CAPABILITY_BOUNDARY_STATUSES.VALID
      : FILE_OPERATION_CAPABILITY_BOUNDARY_STATUSES.INVALID,
    valid: errors.length === 0,
    errors,
  };
}

function classifyFileOperationCapabilityBoundary(manifest) {
  const validation = validateFileOperationCapabilityBoundaryManifest(manifest);

  return {
    status: validation.status,
    valid: validation.valid,
    blocked: {
      broadFilesystemCapability: manifest && manifest.broadFilesystemCapabilityGranted === false,
      fileMoveExecution: manifest && manifest.fileMoveExecutionAllowed === false,
      sourceMutation: manifest && manifest.sourceMutationAllowed === false,
      generatedCodeApproval: manifest && manifest.generatedCodeApprovalGranted === false,
      modelOutputApproval: manifest && manifest.modelOutputApprovalGranted === false,
      authoritySelfExpansion: manifest && manifest.authoritySelfExpansionGranted === false,
    },
    errors: validation.errors,
  };
}

function assertFileOperationCapabilityBoundaryBlocksBroadFilesystem(manifest) {
  const validation = validateFileOperationCapabilityBoundaryManifest(manifest);
  if (!validation.valid) {
    throw new Error(`invalid file-operation capability boundary: ${validation.errors.join('; ')}`);
  }
  if (manifest.broadFilesystemCapabilityGranted !== false) {
    throw new Error('broad filesystem capability must remain blocked');
  }
  return true;
}

function assertFileOperationCapabilityBoundaryBlocksFileMoveExecution(manifest) {
  const validation = validateFileOperationCapabilityBoundaryManifest(manifest);
  if (!validation.valid) {
    throw new Error(`invalid file-operation capability boundary: ${validation.errors.join('; ')}`);
  }
  if (manifest.fileMoveExecutionAllowed !== false) {
    throw new Error('file move execution must remain blocked');
  }
  return true;
}

function summarizeFileOperationCapabilityBoundaryManifest(manifest) {
  const classification = classifyFileOperationCapabilityBoundary(manifest);

  return {
    schema: manifest && manifest.schema,
    boundary: manifest && manifest.boundary,
    metadataOnly: manifest && manifest.metadataOnly === true,
    status: classification.status,
    valid: classification.valid,
    blocked: classification.blocked,
    approvedImplementationFiles: manifest ? cloneArray(manifest.approvedImplementationFiles) : [],
    allowedMetadataOperations: manifest ? cloneArray(manifest.allowedMetadataOperations) : [],
    errors: classification.errors,
  };
}

module.exports = {
  FILE_OPERATION_CAPABILITY_BOUNDARY_STATUSES,
  FILE_OPERATION_CAPABILITY_BOUNDARY_BLOCKED_REASONS,
  createFileOperationCapabilityBoundaryManifest,
  validateFileOperationCapabilityBoundaryManifest,
  classifyFileOperationCapabilityBoundary,
  assertFileOperationCapabilityBoundaryBlocksBroadFilesystem,
  assertFileOperationCapabilityBoundaryBlocksFileMoveExecution,
  summarizeFileOperationCapabilityBoundaryManifest,
};
