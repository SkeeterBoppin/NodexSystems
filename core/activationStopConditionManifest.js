"use strict";

const ACTIVATION_STOP_CONDITION_MANIFEST_STATUSES = Object.freeze({
  VALID: "valid",
  INVALID: "invalid",
});

const ACTIVATION_STOP_CONDITION_CATEGORIES = Object.freeze({
  BLOCKED_BOUNDARY_TOGGLE: "blockedBoundaryToggleStopConditions",
  ARTIFACT: "artifactStopConditions",
  CAPABILITY: "capabilityStopConditions",
  RUNTIME: "runtimeStopConditions",
});

const ACTIVATION_STOP_CONDITION_REJECTION_REASONS = Object.freeze({
  NOT_OBJECT: "not_object",
  MISSING_FIELD: "missing_required_field",
  INVALID_STRING_FIELD: "invalid_string_field",
  INVALID_ARRAY_FIELD: "invalid_array_field",
  INSUFFICIENT_BOUNDARY_COVERAGE: "insufficient_boundary_coverage",
  INSUFFICIENT_STOP_CONDITIONS: "insufficient_stop_conditions",
  PRODUCER_VERIFIER_NOT_SEPARATED: "producer_verifier_not_separated",
  AUTHORITY_FIELD_PRESENT: "authority_field_present",
});

const REQUIRED_FIELDS = Object.freeze([
  "manifestId",
  "sourceGap",
  "sourceGateName",
  "boundaryCoverage",
  "blockedBoundaryToggleStopConditions",
  "artifactStopConditions",
  "capabilityStopConditions",
  "runtimeStopConditions",
  "requiredEvidence",
  "sourceCommit",
  "schemaVersion",
  "producer",
  "verifier",
  "rejectionRules",
]);

const STRING_FIELDS = Object.freeze([
  "manifestId",
  "sourceGap",
  "sourceGateName",
  "sourceCommit",
  "schemaVersion",
  "producer",
  "verifier",
]);

const ARRAY_FIELDS = Object.freeze([
  "boundaryCoverage",
  "blockedBoundaryToggleStopConditions",
  "artifactStopConditions",
  "capabilityStopConditions",
  "runtimeStopConditions",
  "requiredEvidence",
  "rejectionRules",
]);

const STOP_CONDITION_CATEGORIES = Object.freeze([
  ACTIVATION_STOP_CONDITION_CATEGORIES.BLOCKED_BOUNDARY_TOGGLE,
  ACTIVATION_STOP_CONDITION_CATEGORIES.ARTIFACT,
  ACTIVATION_STOP_CONDITION_CATEGORIES.CAPABILITY,
  ACTIVATION_STOP_CONDITION_CATEGORIES.RUNTIME,
]);

const MINIMUM_COUNTS = Object.freeze({
  boundaryCoverage: 12,
  blockedBoundaryToggleStopConditions: 6,
  artifactStopConditions: 6,
  capabilityStopConditions: 7,
  runtimeStopConditions: 6,
  totalStopConditions: 25,
});

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
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => isNonEmptyString(item));
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

function getTotalStopConditionCount(manifest) {
  if (!isPlainObject(manifest)) {
    return 0;
  }

  return STOP_CONDITION_CATEGORIES.reduce((total, category) => {
    const value = manifest[category];
    return total + (Array.isArray(value) ? value.length : 0);
  }, 0);
}

function createActivationStopConditionManifest(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("Activation stop condition manifest input must be a plain object");
  }

  return Object.freeze(cloneManifestValue(input));
}

function validateActivationStopConditionManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      status: ACTIVATION_STOP_CONDITION_MANIFEST_STATUSES.INVALID,
      errors: [ACTIVATION_STOP_CONDITION_REJECTION_REASONS.NOT_OBJECT],
      authorityFields: [],
      totalStopConditionCount: 0,
    };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!hasOwn(manifest, field)) {
      errors.push(`${ACTIVATION_STOP_CONDITION_REJECTION_REASONS.MISSING_FIELD}:${field}`);
    }
  }

  for (const field of STRING_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyString(manifest[field])) {
      errors.push(`${ACTIVATION_STOP_CONDITION_REJECTION_REASONS.INVALID_STRING_FIELD}:${field}`);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyStringArray(manifest[field])) {
      errors.push(`${ACTIVATION_STOP_CONDITION_REJECTION_REASONS.INVALID_ARRAY_FIELD}:${field}`);
    }
  }

  if (
    Array.isArray(manifest.boundaryCoverage) &&
    manifest.boundaryCoverage.length < MINIMUM_COUNTS.boundaryCoverage
  ) {
    errors.push(ACTIVATION_STOP_CONDITION_REJECTION_REASONS.INSUFFICIENT_BOUNDARY_COVERAGE);
  }

  for (const category of STOP_CONDITION_CATEGORIES) {
    if (Array.isArray(manifest[category]) && manifest[category].length < MINIMUM_COUNTS[category]) {
      errors.push(`${ACTIVATION_STOP_CONDITION_REJECTION_REASONS.INSUFFICIENT_STOP_CONDITIONS}:${category}`);
    }
  }

  const totalStopConditionCount = getTotalStopConditionCount(manifest);
  if (totalStopConditionCount > 0 && totalStopConditionCount < MINIMUM_COUNTS.totalStopConditions) {
    errors.push(`${ACTIVATION_STOP_CONDITION_REJECTION_REASONS.INSUFFICIENT_STOP_CONDITIONS}:total`);
  }

  if (
    hasOwn(manifest, "producer") &&
    hasOwn(manifest, "verifier") &&
    isNonEmptyString(manifest.producer) &&
    manifest.producer === manifest.verifier
  ) {
    errors.push(ACTIVATION_STOP_CONDITION_REJECTION_REASONS.PRODUCER_VERIFIER_NOT_SEPARATED);
  }

  const authorityFields = collectAuthorityFields(manifest);
  for (const authorityField of authorityFields) {
    errors.push(`${ACTIVATION_STOP_CONDITION_REJECTION_REASONS.AUTHORITY_FIELD_PRESENT}:${authorityField}`);
  }

  return {
    valid: errors.length === 0,
    status:
      errors.length === 0
        ? ACTIVATION_STOP_CONDITION_MANIFEST_STATUSES.VALID
        : ACTIVATION_STOP_CONDITION_MANIFEST_STATUSES.INVALID,
    errors,
    authorityFields,
    totalStopConditionCount,
  };
}

function classifyActivationStopConditionManifest(manifest) {
  const validation = validateActivationStopConditionManifest(manifest);

  return {
    status: validation.status,
    valid: validation.valid,
    errorCount: validation.errors.length,
    errors: validation.errors,
    authorityFields: validation.authorityFields,
    totalStopConditionCount: validation.totalStopConditionCount,
  };
}

function assertActivationStopConditionManifestNotAuthority(manifest) {
  const authorityFields = collectAuthorityFields(manifest);

  if (authorityFields.length > 0) {
    throw new Error(`Activation stop condition manifest contains authority fields: ${authorityFields.join(", ")}`);
  }

  return true;
}

function summarizeActivationStopConditionManifest(manifest) {
  const validation = validateActivationStopConditionManifest(manifest);
  const boundaryCoverage = Array.isArray(manifest && manifest.boundaryCoverage)
    ? manifest.boundaryCoverage
    : [];
  const requiredEvidence = Array.isArray(manifest && manifest.requiredEvidence)
    ? manifest.requiredEvidence
    : [];
  const rejectionRules = Array.isArray(manifest && manifest.rejectionRules)
    ? manifest.rejectionRules
    : [];

  return {
    manifestId: isPlainObject(manifest) ? manifest.manifestId : undefined,
    sourceGap: isPlainObject(manifest) ? manifest.sourceGap : undefined,
    sourceGateName: isPlainObject(manifest) ? manifest.sourceGateName : undefined,
    status: validation.status,
    valid: validation.valid,
    boundaryCoverageCount: boundaryCoverage.length,
    requiredEvidenceCount: requiredEvidence.length,
    rejectionRuleCount: rejectionRules.length,
    totalStopConditionCount: validation.totalStopConditionCount,
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
  ACTIVATION_STOP_CONDITION_MANIFEST_STATUSES,
  ACTIVATION_STOP_CONDITION_CATEGORIES,
  ACTIVATION_STOP_CONDITION_REJECTION_REASONS,
  createActivationStopConditionManifest,
  validateActivationStopConditionManifest,
  classifyActivationStopConditionManifest,
  assertActivationStopConditionManifestNotAuthority,
  summarizeActivationStopConditionManifest,
};
