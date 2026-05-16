const SYNC_FINALIZATION_RULE_MANIFEST_VERSION = "sync_finalization_rule_manifest_v1";
const SYNC_FINALIZATION_RULE_FAILURE_CLASS = "advisory_marker_stale_after_sync_lifecycle";

const SYNC_FINALIZATION_RULE_ALLOWED_CLASSIFICATIONS = Object.freeze([
  "advisory_marker_stale_after_sync_lifecycle",
  "sync_lifecycle_terminal_evidence_supersedes_marker",
  "marker_snapshot_not_current_authority"
]);

const SYNC_FINALIZATION_RULE_BLOCKED_CONVERSIONS = Object.freeze([
  "stale_marker_to_conflict_when_terminal_evidence_passed",
  "stale_marker_to_new_marker_sync_loop",
  "marker_text_to_authority_over_local_evidence",
  "expected_marker_state_to_pass_without_terminal_evidence",
  "post_push_master_source_check_to_live_context_update_loop"
]);

const SYNC_FINALIZATION_RULE_REQUIREMENTS = Object.freeze([
  "final_sync_state_from_terminal_evidence_after_push",
  "marker_files_are_advisory_snapshots",
  "completed_live_context_push_may_select_master_source_check",
  "verified_post_push_stale_marker_is_not_conflict",
  "future_marker_generation_points_to_master_source_check_or_advisory_snapshot",
  "no_marker_update_loop_for_stale_marker_created_by_sync_lifecycle"
]);

const REQUIRED_FALSE_AUTHORITY_FIELDS = Object.freeze([
  "authorityGranted",
  "implementationAuthorityGranted",
  "sourceMutationAuthorityGranted",
  "liveContextMutationAuthorityGranted",
  "commitAuthorityGranted",
  "pushAuthorityGranted",
  "runtimeExecutionAuthorityGranted",
  "toolExecutionAuthorityGranted",
  "modelOutputAuthorityGranted",
  "packetExecutionByNodexAuthorityGranted",
  "authorityExpansionGranted"
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function copyArray(value) {
  return value.map(item => item);
}

function uniqueArray(values) {
  return Array.from(new Set(values));
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function arrayEquals(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function buildSyncFinalizationRuleManifest(overrides = {}) {
  if (!isPlainObject(overrides)) {
    throw new TypeError("overrides must be an object");
  }

  const manifest = {
    version: SYNC_FINALIZATION_RULE_MANIFEST_VERSION,
    metadataOnly: true,
    authorityGranted: false,
    implementationAuthorityGranted: false,
    sourceMutationAuthorityGranted: false,
    liveContextMutationAuthorityGranted: false,
    commitAuthorityGranted: false,
    pushAuthorityGranted: false,
    runtimeExecutionAuthorityGranted: false,
    toolExecutionAuthorityGranted: false,
    modelOutputAuthorityGranted: false,
    packetExecutionByNodexAuthorityGranted: false,
    authorityExpansionGranted: false,
    failureClass: SYNC_FINALIZATION_RULE_FAILURE_CLASS,
    allowedClassifications: copyArray(SYNC_FINALIZATION_RULE_ALLOWED_CLASSIFICATIONS),
    blockedConversions: copyArray(SYNC_FINALIZATION_RULE_BLOCKED_CONVERSIONS),
    ruleRequirements: copyArray(SYNC_FINALIZATION_RULE_REQUIREMENTS),
    terminalEvidenceOutranksMarkerText: true,
    markerTextAuthority: false,
    staleMarkerConflictWhenRefsVerified: false,
    staleMarkerCanStartNewMarkerSyncLoop: false,
    completedSyncMaySelectMasterSourceCheck: true,
    localEvidenceAuthorityRequired: true,
    sourceHierarchy: [
      "live_terminal_output",
      "git_status_diff_harness_output",
      "local_evidence",
      "committed_repo_state",
      "architecture_docs",
      "assistant_memory"
    ]
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (Array.isArray(value)) {
      manifest[key] = copyArray(value);
    } else if (isPlainObject(value)) {
      manifest[key] = { ...value };
    } else {
      manifest[key] = value;
    }
  }

  return manifest;
}

function validateSyncFinalizationRuleManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      errors: ["manifest must be an object"]
    };
  }

  if (manifest.version !== SYNC_FINALIZATION_RULE_MANIFEST_VERSION) {
    errors.push("version must be sync_finalization_rule_manifest_v1");
  }

  if (manifest.metadataOnly !== true) {
    errors.push("metadataOnly must be true");
  }

  for (const field of REQUIRED_FALSE_AUTHORITY_FIELDS) {
    if (manifest[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (manifest.failureClass !== SYNC_FINALIZATION_RULE_FAILURE_CLASS) {
    errors.push("failureClass must be advisory_marker_stale_after_sync_lifecycle");
  }

  if (!arrayEquals(manifest.allowedClassifications, SYNC_FINALIZATION_RULE_ALLOWED_CLASSIFICATIONS)) {
    errors.push("allowedClassifications must match sync finalization rule allowed classifications");
  }

  if (!arrayEquals(manifest.blockedConversions, SYNC_FINALIZATION_RULE_BLOCKED_CONVERSIONS)) {
    errors.push("blockedConversions must match sync finalization rule blocked conversions");
  }

  if (!arrayEquals(manifest.ruleRequirements, SYNC_FINALIZATION_RULE_REQUIREMENTS)) {
    errors.push("ruleRequirements must match sync finalization rule requirements");
  }

  if (manifest.terminalEvidenceOutranksMarkerText !== true) {
    errors.push("terminalEvidenceOutranksMarkerText must be true");
  }

  if (manifest.markerTextAuthority !== false) {
    errors.push("markerTextAuthority must be false");
  }

  if (manifest.staleMarkerConflictWhenRefsVerified !== false) {
    errors.push("staleMarkerConflictWhenRefsVerified must be false");
  }

  if (manifest.staleMarkerCanStartNewMarkerSyncLoop !== false) {
    errors.push("staleMarkerCanStartNewMarkerSyncLoop must be false");
  }

  if (manifest.completedSyncMaySelectMasterSourceCheck !== true) {
    errors.push("completedSyncMaySelectMasterSourceCheck must be true");
  }

  if (manifest.localEvidenceAuthorityRequired !== true) {
    errors.push("localEvidenceAuthorityRequired must be true");
  }

  if (!Array.isArray(manifest.sourceHierarchy) || manifest.sourceHierarchy[0] !== "live_terminal_output") {
    errors.push("sourceHierarchy must begin with live_terminal_output");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function assertSyncFinalizationRuleManifest(manifest) {
  const validation = validateSyncFinalizationRuleManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Invalid SyncFinalizationRule manifest: ${validation.errors.join("; ")}`);
  }
  return true;
}

function classifySyncLifecycleMarkerState(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("input must be an object");
  }

  const terminalEvidencePassed = input.terminalEvidencePassed === true || input.pushEvidencePassed === true;
  const refsVerified = input.localRemoteRefsVerified === true || input.localRemoteRefsMatch === true;
  const markerGeneratedBeforeSyncCompletion = input.markerGeneratedBeforeSyncCompletion === true;

  const markerLatestCompletedSeam = normalizeText(input.markerLatestCompletedSeam);
  const markerCurrentOpenSeam = normalizeText(input.markerCurrentOpenSeam);
  const evidenceLatestCompletedSeam = normalizeText(input.evidenceLatestCompletedSeam);
  const evidenceCurrentOpenSeam = normalizeText(input.evidenceCurrentOpenSeam);
  const expectedNextSeam = normalizeText(input.expectedNextSeam) || "MasterSourceCheck v1";

  const markerDiffersFromEvidence = (
    markerLatestCompletedSeam !== "" &&
    evidenceLatestCompletedSeam !== "" &&
    markerLatestCompletedSeam !== evidenceLatestCompletedSeam
  ) || (
    markerCurrentOpenSeam !== "" &&
    evidenceCurrentOpenSeam !== "" &&
    markerCurrentOpenSeam !== evidenceCurrentOpenSeam
  );

  const advisoryStale = terminalEvidencePassed
    && refsVerified
    && (markerGeneratedBeforeSyncCompletion || markerDiffersFromEvidence);

  if (advisoryStale) {
    return {
      classification: SYNC_FINALIZATION_RULE_FAILURE_CLASS,
      conflict: false,
      markerAdvisoryStale: true,
      authoritativeSource: "terminal_evidence",
      markerTextAuthority: false,
      terminalEvidenceAuthority: true,
      allowedNextSeam: expectedNextSeam,
      startMarkerSyncLoop: false,
      blockedConversions: copyArray(SYNC_FINALIZATION_RULE_BLOCKED_CONVERSIONS)
    };
  }

  if (!terminalEvidencePassed || !refsVerified) {
    return {
      classification: "marker_snapshot_not_current_authority",
      conflict: true,
      markerAdvisoryStale: false,
      authoritativeSource: "insufficient_terminal_evidence",
      markerTextAuthority: false,
      terminalEvidenceAuthority: terminalEvidencePassed && refsVerified,
      allowedNextSeam: "MasterSourceCheck v1",
      startMarkerSyncLoop: false,
      blockedConversions: copyArray(SYNC_FINALIZATION_RULE_BLOCKED_CONVERSIONS)
    };
  }

  return {
    classification: "sync_lifecycle_terminal_evidence_supersedes_marker",
    conflict: false,
    markerAdvisoryStale: false,
    authoritativeSource: "terminal_evidence",
    markerTextAuthority: false,
    terminalEvidenceAuthority: true,
    allowedNextSeam: expectedNextSeam,
    startMarkerSyncLoop: false,
    blockedConversions: copyArray(SYNC_FINALIZATION_RULE_BLOCKED_CONVERSIONS)
  };
}

module.exports = {
  SYNC_FINALIZATION_RULE_MANIFEST_VERSION,
  SYNC_FINALIZATION_RULE_FAILURE_CLASS,
  SYNC_FINALIZATION_RULE_BLOCKED_CONVERSIONS,
  SYNC_FINALIZATION_RULE_ALLOWED_CLASSIFICATIONS,
  buildSyncFinalizationRuleManifest,
  classifySyncLifecycleMarkerState,
  validateSyncFinalizationRuleManifest,
  assertSyncFinalizationRuleManifest
};
