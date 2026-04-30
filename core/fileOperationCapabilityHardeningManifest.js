'use strict';

const FILE_OPERATION_CAPABILITY_HARDENING_STATUSES = Object.freeze({
  PLANNED: 'planned',
  READY: 'ready',
  BLOCKED: 'blocked'
});

const FILE_OPERATION_REQUIRED_HARDENING_REQUIREMENTS = Object.freeze([
  'requireExplicitSingleMovePairByDefault',
  'requireFreshPlanForEveryMovePair',
  'requireFreshPreflightForEveryMovePair',
  'requireSha256BeforeAfter',
  'requireFileSizeBeforeAfter',
  'requireLastWriteTimeBeforeAfter',
  'requireCanonicalPathCapture',
  'requireCaseAndSeparatorPathNormalization',
  'requireJoinedCommandOutputStrings',
  'requireSymlinkOrJunctionCheck',
  'requireDestinationParentVerification',
  'requireOverwriteCollisionBlockUnlessExplicitApproval',
  'requireDeniedSystemPathCheck',
  'requireAllowedRootCheck',
  'requireOneDriveOfflinePlaceholderCheck',
  'requireCleanWorkingTreeBeforeAndAfter',
  'requireFullHarnessBeforeAndAfterExecution',
  'requireNoCommitOrStaging',
  'requireNoSourceMutationForExternalArtifactMoves',
  'requireClosureAfterExecution',
  'requirePostClosureSpineAudit'
]);

const FILE_OPERATION_CAPABILITY_HARDENING_BLOCKED_AUTHORITIES = Object.freeze({
  runtimeFileOperationAuthorityGranted: false,
  broadFilesystemCapabilityGranted: false,
  fileMoveExecutionAllowedNow: false,
  fileMoveAllowedNow: false,
  commitAllowedNow: false,
  stagingAllowedNow: false,
  authorityExpansionFromAdvisoryReview: false
});

const EXPECTED_CANDIDATE_FILES = Object.freeze([
  'core/fileOperationCapabilityHardeningManifest.js',
  'tests/run.js'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDefaultRequirements() {
  return FILE_OPERATION_REQUIRED_HARDENING_REQUIREMENTS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
}

function createFileOperationCapabilityHardeningManifest(overrides = {}) {
  const manifest = {
    schema: 'nodex.file_operation_capability.hardening_manifest.v1',
    status: FILE_OPERATION_CAPABILITY_HARDENING_STATUSES.READY,
    scope: 'file_operation_capability_hardening_manifest_only',
    purpose: 'Reusable validation requirements for bounded local file operations before broader filesystem capability planning.',
    candidateFiles: clone(EXPECTED_CANDIDATE_FILES),
    acceptedHardeningRequirements: createDefaultRequirements(),
    authorityBoundary: clone(FILE_OPERATION_CAPABILITY_HARDENING_BLOCKED_AUTHORITIES),
    implementationBoundary: {
      sourceMutationScope: 'candidate_files_only',
      grantsRuntimeAuthority: false,
      grantsBroadFilesystemCapability: false,
      grantsCommitAuthority: false,
      grantsStagingAuthority: false
    }
  };

  return {
    ...manifest,
    ...overrides,
    acceptedHardeningRequirements: {
      ...manifest.acceptedHardeningRequirements,
      ...(overrides.acceptedHardeningRequirements || {})
    },
    authorityBoundary: {
      ...manifest.authorityBoundary,
      ...(overrides.authorityBoundary || {})
    },
    implementationBoundary: {
      ...manifest.implementationBoundary,
      ...(overrides.implementationBoundary || {})
    }
  };
}

function validateFileOperationCapabilityHardeningManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['manifest must be an object'] };
  }

  if (manifest.schema !== 'nodex.file_operation_capability.hardening_manifest.v1') {
    errors.push('schema must be nodex.file_operation_capability.hardening_manifest.v1');
  }

  if (!Object.values(FILE_OPERATION_CAPABILITY_HARDENING_STATUSES).includes(manifest.status)) {
    errors.push('status is invalid');
  }

  if (manifest.scope !== 'file_operation_capability_hardening_manifest_only') {
    errors.push('scope must remain file_operation_capability_hardening_manifest_only');
  }

  const files = Array.isArray(manifest.candidateFiles) ? manifest.candidateFiles : [];
  if (files.length !== EXPECTED_CANDIDATE_FILES.length || EXPECTED_CANDIDATE_FILES.some((file, index) => files[index] !== file)) {
    errors.push('candidateFiles must match approved hardening implementation files exactly');
  }

  for (const key of FILE_OPERATION_REQUIRED_HARDENING_REQUIREMENTS) {
    if (!manifest.acceptedHardeningRequirements || manifest.acceptedHardeningRequirements[key] !== true) {
      errors.push(`${key} must be true`);
    }
  }

  for (const [key, expected] of Object.entries(FILE_OPERATION_CAPABILITY_HARDENING_BLOCKED_AUTHORITIES)) {
    if (!manifest.authorityBoundary || manifest.authorityBoundary[key] !== expected) {
      errors.push(`${key} must remain ${expected}`);
    }
  }

  if (!manifest.implementationBoundary || manifest.implementationBoundary.sourceMutationScope !== 'candidate_files_only') {
    errors.push('implementation source mutation scope must be candidate_files_only');
  }

  if (manifest.implementationBoundary && manifest.implementationBoundary.grantsRuntimeAuthority !== false) {
    errors.push('implementation must not grant runtime authority');
  }

  if (manifest.implementationBoundary && manifest.implementationBoundary.grantsBroadFilesystemCapability !== false) {
    errors.push('implementation must not grant broad filesystem capability');
  }

  if (manifest.implementationBoundary && manifest.implementationBoundary.grantsCommitAuthority !== false) {
    errors.push('implementation must not grant commit authority');
  }

  if (manifest.implementationBoundary && manifest.implementationBoundary.grantsStagingAuthority !== false) {
    errors.push('implementation must not grant staging authority');
  }

  return { valid: errors.length === 0, errors };
}

function assertFileOperationCapabilityHardeningManifest(manifest) {
  const result = validateFileOperationCapabilityHardeningManifest(manifest);
  if (!result.valid) {
    throw new Error(`Invalid FileOperationCapabilityHardeningManifest: ${result.errors.join('; ')}`);
  }
  return manifest;
}

function summarizeFileOperationCapabilityHardeningManifest(manifest) {
  const validation = validateFileOperationCapabilityHardeningManifest(manifest);
  return {
    schema: manifest && manifest.schema,
    status: manifest && manifest.status,
    valid: validation.valid,
    errors: validation.errors,
    requirementCount: FILE_OPERATION_REQUIRED_HARDENING_REQUIREMENTS.length,
    candidateFiles: manifest && manifest.candidateFiles,
    noRuntimeFileOperationAuthorityGranted: manifest && manifest.authorityBoundary && manifest.authorityBoundary.runtimeFileOperationAuthorityGranted === false,
    noBroadFilesystemCapabilityGranted: manifest && manifest.authorityBoundary && manifest.authorityBoundary.broadFilesystemCapabilityGranted === false,
    fileMoveExecutionAllowedNow: manifest && manifest.authorityBoundary && manifest.authorityBoundary.fileMoveExecutionAllowedNow === true,
    commitAllowedNow: manifest && manifest.authorityBoundary && manifest.authorityBoundary.commitAllowedNow === true,
    stagingAllowedNow: manifest && manifest.authorityBoundary && manifest.authorityBoundary.stagingAllowedNow === true
  };
}

module.exports = {
  FILE_OPERATION_CAPABILITY_HARDENING_STATUSES,
  FILE_OPERATION_REQUIRED_HARDENING_REQUIREMENTS,
  FILE_OPERATION_CAPABILITY_HARDENING_BLOCKED_AUTHORITIES,
  createFileOperationCapabilityHardeningManifest,
  validateFileOperationCapabilityHardeningManifest,
  assertFileOperationCapabilityHardeningManifest,
  summarizeFileOperationCapabilityHardeningManifest
};
