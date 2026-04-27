"use strict";

const PACKET_SYSTEM_CONSOLIDATION_STATUSES = Object.freeze({
  PASS: "pass",
  INVALID: "invalid"
});

const PACKET_SYSTEM_CONSOLIDATION_REQUIRED_CAPABILITIES = Object.freeze([
  "capture_command_with_stdout_stderr",
  "verify_latest_prior_evidence_by_glob",
  "verify_json_readback_schema",
  "verify_expected_head",
  "verify_clean_working_tree",
  "verify_expected_dirty_state",
  "verify_approved_file_set",
  "verify_blocked_files_clean",
  "assert_authority_boundaries_false",
  "write_external_json_and_summary",
  "copy_operator_summary_to_clipboard",
  "emit_success_failure_markers"
]);

const PACKET_SYSTEM_CONSOLIDATION_BLOCKED_CAPABILITIES = Object.freeze([
  "runtime_execution",
  "tool_execution",
  "runtime_file_write_execution",
  "process_execution",
  "git_execution_by_nodex",
  "permission_grants",
  "agent_handoff_runtime_wiring",
  "model_output_authority",
  "replay_authority",
  "external_review_authority",
  "deep_research_authority",
  "implicit_seam_advancement"
]);

const DEFAULT_BOUNDARY = Object.freeze({
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
  deepResearchAuthorityAllowed: false
});

const REQUIRED_FALSE_BOUNDARIES = Object.freeze(Object.keys(DEFAULT_BOUNDARY));

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

function cloneRecord(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBoundary(boundary = {}) {
  return {
    ...DEFAULT_BOUNDARY,
    ...(isRecord(boundary) ? boundary : {})
  };
}

function includesAll(actual, expected) {
  const actualSet = new Set(actual);
  return expected.every((item) => actualSet.has(item));
}

function createPacketSystemConsolidationManifest(input = {}) {
  const requiredCapabilities = uniqueStrings(
    Array.isArray(input.requiredCapabilities)
      ? input.requiredCapabilities
      : PACKET_SYSTEM_CONSOLIDATION_REQUIRED_CAPABILITIES
  );

  const blockedCapabilities = uniqueStrings(
    Array.isArray(input.blockedCapabilities)
      ? input.blockedCapabilities
      : PACKET_SYSTEM_CONSOLIDATION_BLOCKED_CAPABILITIES
  );

  const boundary = normalizeBoundary(input.boundary);

  return Object.freeze({
    schema: "nodex.packetSystemConsolidationManifest.v1",
    seam: input.seam || "PacketSystemConsolidationImplementation v1",
    metadataOnly: input.metadataOnly !== false,
    authorityGranted: false,
    helperImplementationAllowed: false,
    runtimeAuthorityAllowed: false,
    toolAuthorityAllowed: false,
    implicitSeamAdvancementAllowed: false,
    sourceMutationAllowed: false,
    commitAllowed: false,
    requiredCapabilities: Object.freeze(requiredCapabilities),
    blockedCapabilities: Object.freeze(blockedCapabilities),
    boundary: Object.freeze(boundary),
    notes: Object.freeze(Array.isArray(input.notes) ? [...input.notes] : [])
  });
}

function validatePacketSystemConsolidationManifest(manifest) {
  const errors = [];

  if (!isRecord(manifest)) {
    return Object.freeze({
      valid: false,
      errors: Object.freeze(["manifest must be an object"])
    });
  }

  if (manifest.schema !== "nodex.packetSystemConsolidationManifest.v1") {
    errors.push("schema must be nodex.packetSystemConsolidationManifest.v1");
  }

  if (manifest.seam !== "PacketSystemConsolidationImplementation v1") {
    errors.push("seam must be PacketSystemConsolidationImplementation v1");
  }

  if (manifest.metadataOnly !== true) {
    errors.push("metadataOnly must be true");
  }

  if (manifest.authorityGranted !== false) {
    errors.push("authorityGranted must remain false");
  }

  if (manifest.helperImplementationAllowed !== false) {
    errors.push("helperImplementationAllowed must remain false");
  }

  if (manifest.runtimeAuthorityAllowed !== false) {
    errors.push("runtimeAuthorityAllowed must remain false");
  }

  if (manifest.toolAuthorityAllowed !== false) {
    errors.push("toolAuthorityAllowed must remain false");
  }

  if (manifest.implicitSeamAdvancementAllowed !== false) {
    errors.push("implicitSeamAdvancementAllowed must remain false");
  }

  if (manifest.sourceMutationAllowed !== false) {
    errors.push("sourceMutationAllowed must remain false");
  }

  if (manifest.commitAllowed !== false) {
    errors.push("commitAllowed must remain false");
  }

  if (!Array.isArray(manifest.requiredCapabilities)) {
    errors.push("requiredCapabilities must be an array");
  } else if (!includesAll(manifest.requiredCapabilities, PACKET_SYSTEM_CONSOLIDATION_REQUIRED_CAPABILITIES)) {
    errors.push("requiredCapabilities must include every required consolidation capability");
  }

  if (!Array.isArray(manifest.blockedCapabilities)) {
    errors.push("blockedCapabilities must be an array");
  } else if (!includesAll(manifest.blockedCapabilities, PACKET_SYSTEM_CONSOLIDATION_BLOCKED_CAPABILITIES)) {
    errors.push("blockedCapabilities must include every blocked consolidation capability");
  }

  if (!isRecord(manifest.boundary)) {
    errors.push("boundary must be an object");
  } else {
    for (const key of REQUIRED_FALSE_BOUNDARIES) {
      if (manifest.boundary[key] !== false) {
        errors.push(`boundary must remain false: ${key}`);
      }
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function classifyPacketSystemConsolidationManifest(manifest) {
  const validation = validatePacketSystemConsolidationManifest(manifest);

  if (!validation.valid) {
    return Object.freeze({
      status: PACKET_SYSTEM_CONSOLIDATION_STATUSES.INVALID,
      reasons: Object.freeze([...validation.errors])
    });
  }

  return Object.freeze({
    status: PACKET_SYSTEM_CONSOLIDATION_STATUSES.PASS,
    reasons: Object.freeze([])
  });
}

function assertPacketSystemConsolidationNotAuthority(manifest) {
  const classification = classifyPacketSystemConsolidationManifest(manifest);

  if (classification.status !== PACKET_SYSTEM_CONSOLIDATION_STATUSES.PASS) {
    throw new Error(`packet system consolidation manifest failed: ${classification.reasons.join(", ")}`);
  }

  return true;
}

function summarizePacketSystemConsolidationManifest(manifest) {
  const validation = validatePacketSystemConsolidationManifest(manifest);
  const classification = classifyPacketSystemConsolidationManifest(manifest);

  return Object.freeze({
    schema: manifest?.schema,
    seam: manifest?.seam,
    metadataOnly: manifest?.metadataOnly === true,
    valid: validation.valid,
    status: classification.status,
    reasons: Object.freeze([...classification.reasons]),
    authorityGranted: false,
    helperImplementationAllowed: manifest?.helperImplementationAllowed === true,
    runtimeAuthorityAllowed: manifest?.runtimeAuthorityAllowed === true,
    toolAuthorityAllowed: manifest?.toolAuthorityAllowed === true,
    implicitSeamAdvancementAllowed: manifest?.implicitSeamAdvancementAllowed === true,
    requiredCapabilityCount: Array.isArray(manifest?.requiredCapabilities) ? manifest.requiredCapabilities.length : 0,
    blockedCapabilityCount: Array.isArray(manifest?.blockedCapabilities) ? manifest.blockedCapabilities.length : 0,
    boundary: cloneRecord(manifest?.boundary || {})
  });
}

module.exports = {
  PACKET_SYSTEM_CONSOLIDATION_STATUSES,
  PACKET_SYSTEM_CONSOLIDATION_BLOCKED_CAPABILITIES,
  PACKET_SYSTEM_CONSOLIDATION_REQUIRED_CAPABILITIES,
  createPacketSystemConsolidationManifest,
  validatePacketSystemConsolidationManifest,
  classifyPacketSystemConsolidationManifest,
  assertPacketSystemConsolidationNotAuthority,
  summarizePacketSystemConsolidationManifest
};
