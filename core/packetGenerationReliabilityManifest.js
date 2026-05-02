'use strict';

const PACKET_GENERATION_RELIABILITY_FAILURE_CLASSES = Object.freeze([
  'PowerShell parser errors',
  'PowerShell type mismatch while writing failure artifacts',
  'wrong Git argument array construction',
  'git warning text parsed as filenames',
  'stale downloaded packet reruns',
  'filename drift from reupload packets',
  'continuity snapshot lag behind local evidence',
  'prompt-output authority leakage',
]);

const PACKET_GENERATION_RELIABILITY_CONTROLS = Object.freeze([
  'packet string construction must prefer arrays and ConvertTo-Json over manual escaped JSON',
  'file artifact names must remain canonical and overwrite stale local artifacts instead of REUPLOAD suffixes',
  'Git status comparisons must normalize porcelain status lines and ignore command warnings',
  'failure artifact writers must accept scalar failure text only and avoid mismatched typed collections',
  'generated packets must include explicit prior evidence verification before write or mutation',
  'packets that mutate must compare exact dirty/staged sets before and after mutation',
  'live-context continuity must remain separate from local evidence authority',
]);

const PACKET_GENERATION_RELIABILITY_BLOCKED_AUTHORITIES = Object.freeze([
  'file_move_execution',
  'broad_filesystem_capability',
  'generated_code_approval',
  'model_output_approval',
  'authority_self_expansion',
]);

const PACKET_GENERATION_RELIABILITY_CANONICAL_ARTIFACT_POLICY = Object.freeze({
  canonicalFilenamesRequired: true,
  reuploadSuffixAllowed: false,
  overwriteStaleGeneratedArtifacts: true,
  staleDownloadedPacketRerunAllowed: false,
});

const PACKET_GENERATION_RELIABILITY_POWERSHELL_POLICY = Object.freeze({
  manualEscapedJsonAllowed: false,
  convertToJsonRequiredForStructuredEvidence: true,
  arrayFirstCommandArgumentsRequired: true,
  scalarFailureArtifactTextRequired: true,
  parseGitWarningsAsPathsAllowed: false,
});

const PACKET_GENERATION_RELIABILITY_GIT_POLICY = Object.freeze({
  porcelainStatusRequired: true,
  exactDirtySetComparisonRequired: true,
  exactStagedSetComparisonRequired: true,
  warningTextPathParsingAllowed: false,
});

const PACKET_GENERATION_RELIABILITY_CONTINUITY_POLICY = Object.freeze({
  localEvidenceAuthority: true,
  liveContextSnapshotAuthority: false,
  continuitySnapshotMayLagLocalEvidence: true,
  inferPassedSeamFromLiveContextAllowed: false,
});

function cloneArray(values) {
  return values.slice();
}

function getPacketGenerationReliabilityManifest() {
  return Object.freeze({
    schema: 'nodex.packet_generation_reliability.manifest.v1',
    metadataOnly: true,
    failureClasses: cloneArray(PACKET_GENERATION_RELIABILITY_FAILURE_CLASSES),
    controls: cloneArray(PACKET_GENERATION_RELIABILITY_CONTROLS),
    blockedAuthorities: cloneArray(PACKET_GENERATION_RELIABILITY_BLOCKED_AUTHORITIES),
    canonicalArtifactPolicy: PACKET_GENERATION_RELIABILITY_CANONICAL_ARTIFACT_POLICY,
    powershellPolicy: PACKET_GENERATION_RELIABILITY_POWERSHELL_POLICY,
    gitPolicy: PACKET_GENERATION_RELIABILITY_GIT_POLICY,
    continuityPolicy: PACKET_GENERATION_RELIABILITY_CONTINUITY_POLICY,
    fileMoveExecutionAllowedNow: false,
    broadFilesystemCapabilityGranted: false,
    generatedCodeApprovalGranted: false,
    modelOutputApprovalGranted: false,
    authoritySelfExpansionGranted: false,
    packetGenerationApprovalAuthorityGranted: false,
    sourceMutationAuthorityGranted: false,
  });
}

function validatePacketGenerationReliabilityManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new TypeError('packet generation reliability manifest must be an object');
  }

  if (manifest.schema !== 'nodex.packet_generation_reliability.manifest.v1') {
    throw new Error('unexpected packet generation reliability schema');
  }

  if (manifest.metadataOnly !== true) {
    throw new Error('packet generation reliability manifest must be metadata-only');
  }

  const hardFalseFlags = [
    'fileMoveExecutionAllowedNow',
    'broadFilesystemCapabilityGranted',
    'generatedCodeApprovalGranted',
    'modelOutputApprovalGranted',
    'authoritySelfExpansionGranted',
    'packetGenerationApprovalAuthorityGranted',
    'sourceMutationAuthorityGranted',
  ];

  for (const flag of hardFalseFlags) {
    if (manifest[flag] !== false) {
      throw new Error(`${flag} must remain false`);
    }
  }

  for (const failureClass of PACKET_GENERATION_RELIABILITY_FAILURE_CLASSES) {
    if (!manifest.failureClasses.includes(failureClass)) {
      throw new Error(`missing packet generation failure class: ${failureClass}`);
    }
  }

  for (const control of PACKET_GENERATION_RELIABILITY_CONTROLS) {
    if (!manifest.controls.includes(control)) {
      throw new Error(`missing packet generation reliability control: ${control}`);
    }
  }

  return true;
}

function createPacketGenerationReliabilityDecision(input = {}) {
  const manifest = getPacketGenerationReliabilityManifest();
  validatePacketGenerationReliabilityManifest(manifest);

  return Object.freeze({
    schema: 'nodex.packet_generation_reliability.decision.v1',
    requestedAction: String(input.requestedAction || 'unspecified'),
    allowed: false,
    reason: 'packet_generation_reliability_manifest_is_metadata_only',
    metadataOnly: true,
    sourceMutationAllowedNow: false,
    commitAllowedNow: false,
    stagingAllowedNow: false,
    liveContextCommitAllowedNow: false,
    liveContextStagingAllowedNow: false,
    fileMoveExecutionAllowedNow: false,
    broadFilesystemCapabilityGranted: false,
    generatedCodeApprovalGranted: false,
    modelOutputApprovalGranted: false,
    authoritySelfExpansionGranted: false,
    packetGenerationApprovalAuthorityGranted: false,
  });
}

function assertNoPacketGenerationAuthority(decision) {
  if (!decision || typeof decision !== 'object') {
    throw new TypeError('packet generation reliability decision must be an object');
  }

  const hardFalseFlags = [
    'allowed',
    'sourceMutationAllowedNow',
    'commitAllowedNow',
    'stagingAllowedNow',
    'liveContextCommitAllowedNow',
    'liveContextStagingAllowedNow',
    'fileMoveExecutionAllowedNow',
    'broadFilesystemCapabilityGranted',
    'generatedCodeApprovalGranted',
    'modelOutputApprovalGranted',
    'authoritySelfExpansionGranted',
    'packetGenerationApprovalAuthorityGranted',
  ];

  for (const flag of hardFalseFlags) {
    if (decision[flag] !== false) {
      throw new Error(`${flag} must remain false`);
    }
  }

  return true;
}

module.exports = {
  PACKET_GENERATION_RELIABILITY_FAILURE_CLASSES,
  PACKET_GENERATION_RELIABILITY_CONTROLS,
  PACKET_GENERATION_RELIABILITY_BLOCKED_AUTHORITIES,
  PACKET_GENERATION_RELIABILITY_CANONICAL_ARTIFACT_POLICY,
  PACKET_GENERATION_RELIABILITY_POWERSHELL_POLICY,
  PACKET_GENERATION_RELIABILITY_GIT_POLICY,
  PACKET_GENERATION_RELIABILITY_CONTINUITY_POLICY,
  getPacketGenerationReliabilityManifest,
  validatePacketGenerationReliabilityManifest,
  createPacketGenerationReliabilityDecision,
  assertNoPacketGenerationAuthority,
};