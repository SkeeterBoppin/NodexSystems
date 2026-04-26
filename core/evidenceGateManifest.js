"use strict";

const EVIDENCE_GATE_MANIFEST_STATUSES = Object.freeze({
  VALID: "valid",
  INVALID: "invalid",
});

const EVIDENCE_GATE_MANIFEST_REQUIRED_FIELDS = Object.freeze([
  "manifestId",
  "seam",
  "boundary",
  "requiredArtifacts",
  "acceptedValidationCommands",
  "acceptedOutputs",
  "sourceCommit",
  "configVersion",
  "schemaVersion",
  "freshnessLimit",
  "producer",
  "verifier",
  "artifactHashes",
  "rejectionRules",
]);

const EVIDENCE_GATE_MANIFEST_REJECTION_REASONS = Object.freeze({
  NOT_OBJECT: "not_object",
  MISSING_FIELD: "missing_required_field",
  INVALID_STRING_FIELD: "invalid_string_field",
  INVALID_ARRAY_FIELD: "invalid_array_field",
  INVALID_BOUNDARY_FIELD: "invalid_boundary_field",
  INVALID_ARTIFACT_HASHES: "invalid_artifact_hashes",
  PRODUCER_VERIFIER_NOT_SEPARATED: "producer_verifier_not_separated",
  AUTHORITY_FIELD_PRESENT: "authority_field_present",
});

const STRING_FIELDS = Object.freeze([
  "manifestId",
  "seam",
  "sourceCommit",
  "configVersion",
  "schemaVersion",
  "freshnessLimit",
  "producer",
  "verifier",
]);

const ARRAY_FIELDS = Object.freeze([
  "requiredArtifacts",
  "acceptedValidationCommands",
  "acceptedOutputs",
  "rejectionRules",
]);

const AUTHORITY_FIELD_NAMES = Object.freeze([
  "pass",
  "allowed_now",
  "activationApproved",
  "runtimeApproved",
  "permissionGranted",
  "capabilityToken",
  "activationAllowed",
  "runtimeIntegrationAllowed",
  "actualDryRunExecutionAllowed",
  "runtimeExecutionAllowed",
  "toolExecutionAllowed",
  "runtimeFileWritesAllowed",
  "processExecutionAllowed",
  "gitExecutionAllowedByNodex",
  "permissionGrantsAllowed",
  "agentHandoffRuntimeWiringAllowed",
  "modelOutputAuthorityAllowed",
  "replayAuthorityAllowed",
  "externalReviewAuthorityAllowed",
  "deepResearchAuthorityAllowed",
]);

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isNonEmptyString(item))
  );
}

function cloneManifestValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneManifestValue(item));
  }
  if (isPlainObject(value)) {
    const clone = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      clone[key] = cloneManifestValue(nestedValue);
    }
    return clone;
  }
  return value;
}

function collectAuthorityFields(value, path = [], found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectAuthorityFields(item, path.concat(String(index)), found));
    return found;
  }

  if (!isPlainObject(value)) {
    return found;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPath = path.concat(key);
    if (AUTHORITY_FIELD_NAMES.includes(key)) {
      found.push(nestedPath.join("."));
    }
    collectAuthorityFields(nestedValue, nestedPath, found);
  }

  return found;
}

function validateArtifactHashes(artifactHashes) {
  if (!isPlainObject(artifactHashes)) {
    return false;
  }

  const entries = Object.entries(artifactHashes);
  return (
    entries.length > 0 &&
    entries.every(([key, value]) => isNonEmptyString(key) && isNonEmptyString(value))
  );
}

function createEvidenceGateManifest(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("EvidenceGate manifest input must be a plain object");
  }

  return Object.freeze(cloneManifestValue(input));
}

function validateEvidenceGateManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      status: EVIDENCE_GATE_MANIFEST_STATUSES.INVALID,
      errors: [EVIDENCE_GATE_MANIFEST_REJECTION_REASONS.NOT_OBJECT],
      authorityFields: [],
    };
  }

  for (const field of EVIDENCE_GATE_MANIFEST_REQUIRED_FIELDS) {
    if (!hasOwn(manifest, field)) {
      errors.push(`${EVIDENCE_GATE_MANIFEST_REJECTION_REASONS.MISSING_FIELD}:${field}`);
    }
  }

  for (const field of STRING_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyString(manifest[field])) {
      errors.push(`${EVIDENCE_GATE_MANIFEST_REJECTION_REASONS.INVALID_STRING_FIELD}:${field}`);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyStringArray(manifest[field])) {
      errors.push(`${EVIDENCE_GATE_MANIFEST_REJECTION_REASONS.INVALID_ARRAY_FIELD}:${field}`);
    }
  }

  if (
    hasOwn(manifest, "boundary") &&
    !isNonEmptyString(manifest.boundary) &&
    !isNonEmptyStringArray(manifest.boundary)
  ) {
    errors.push(EVIDENCE_GATE_MANIFEST_REJECTION_REASONS.INVALID_BOUNDARY_FIELD);
  }

  if (hasOwn(manifest, "artifactHashes") && !validateArtifactHashes(manifest.artifactHashes)) {
    errors.push(EVIDENCE_GATE_MANIFEST_REJECTION_REASONS.INVALID_ARTIFACT_HASHES);
  }

  if (
    hasOwn(manifest, "producer") &&
    hasOwn(manifest, "verifier") &&
    isNonEmptyString(manifest.producer) &&
    manifest.producer === manifest.verifier
  ) {
    errors.push(EVIDENCE_GATE_MANIFEST_REJECTION_REASONS.PRODUCER_VERIFIER_NOT_SEPARATED);
  }

  const authorityFields = collectAuthorityFields(manifest);
  for (const authorityField of authorityFields) {
    errors.push(`${EVIDENCE_GATE_MANIFEST_REJECTION_REASONS.AUTHORITY_FIELD_PRESENT}:${authorityField}`);
  }

  return {
    valid: errors.length === 0,
    status:
      errors.length === 0
        ? EVIDENCE_GATE_MANIFEST_STATUSES.VALID
        : EVIDENCE_GATE_MANIFEST_STATUSES.INVALID,
    errors,
    authorityFields,
  };
}

function classifyEvidenceGateManifest(manifest) {
  const validation = validateEvidenceGateManifest(manifest);

  return {
    status: validation.status,
    valid: validation.valid,
    errorCount: validation.errors.length,
    errors: validation.errors,
    authorityFields: validation.authorityFields,
  };
}

function assertEvidenceGateManifestNotAuthority(manifest) {
  const authorityFields = collectAuthorityFields(manifest);

  if (authorityFields.length > 0) {
    throw new Error(`EvidenceGate manifest contains authority fields: ${authorityFields.join(", ")}`);
  }

  return true;
}

function summarizeEvidenceGateManifest(manifest) {
  const validation = validateEvidenceGateManifest(manifest);
  const requiredArtifacts = Array.isArray(manifest && manifest.requiredArtifacts)
    ? manifest.requiredArtifacts
    : [];
  const rejectionRules = Array.isArray(manifest && manifest.rejectionRules)
    ? manifest.rejectionRules
    : [];

  return {
    manifestId: isPlainObject(manifest) ? manifest.manifestId : undefined,
    seam: isPlainObject(manifest) ? manifest.seam : undefined,
    boundary: isPlainObject(manifest) ? manifest.boundary : undefined,
    status: validation.status,
    valid: validation.valid,
    requiredArtifactCount: requiredArtifacts.length,
    rejectionRuleCount: rejectionRules.length,
    authorityFieldCount: validation.authorityFields.length,
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
  };
}

module.exports = {
  EVIDENCE_GATE_MANIFEST_STATUSES,
  EVIDENCE_GATE_MANIFEST_REQUIRED_FIELDS,
  EVIDENCE_GATE_MANIFEST_REJECTION_REASONS,
  createEvidenceGateManifest,
  validateEvidenceGateManifest,
  classifyEvidenceGateManifest,
  assertEvidenceGateManifestNotAuthority,
  summarizeEvidenceGateManifest,
};
