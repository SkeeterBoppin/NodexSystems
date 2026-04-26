"use strict";

const CONTROL_COVERAGE_MATRIX_STATUSES = Object.freeze({
  VALID: "valid",
  INVALID: "invalid",
});

const CONTROL_COVERAGE_MATRIX_COVERAGE_DIMENSIONS = Object.freeze({
  UNIT: "unit",
  INTEGRATION: "integration",
  SYSTEM: "system",
  REGRESSION: "regression",
  NEGATIVE_PATH: "negative_path",
  FAULT_INJECTION: "fault_injection",
  BOUNDARY: "boundary",
  PROVENANCE: "provenance",
  REPLAY: "replay",
  AUDIT: "audit",
});

const CONTROL_COVERAGE_MATRIX_REJECTION_REASONS = Object.freeze({
  NOT_OBJECT: "not_object",
  MISSING_FIELD: "missing_required_field",
  INVALID_STRING_FIELD: "invalid_string_field",
  INVALID_ARRAY_FIELD: "invalid_array_field",
  INSUFFICIENT_COVERAGE_DIMENSIONS: "insufficient_coverage_dimensions",
  INSUFFICIENT_CONTROL_ROWS: "insufficient_control_rows",
  INSUFFICIENT_FAULT_INJECTION_CASES: "insufficient_fault_injection_cases",
  INSUFFICIENT_REQUIRED_OUTPUTS: "insufficient_required_outputs",
  PRODUCER_VERIFIER_NOT_SEPARATED: "producer_verifier_not_separated",
  AUTHORITY_FIELD_PRESENT: "authority_field_present",
});

const REQUIRED_FIELDS = Object.freeze([
  "manifestId",
  "sourceGap",
  "sourceGateName",
  "coverageDimensions",
  "controlRows",
  "faultInjectionCases",
  "requiredOutputs",
  "boundaryCoverage",
  "coverageAssertions",
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
  "coverageDimensions",
  "controlRows",
  "faultInjectionCases",
  "requiredOutputs",
  "boundaryCoverage",
  "coverageAssertions",
  "rejectionRules",
]);

const MINIMUM_COUNTS = Object.freeze({
  coverageDimensions: 10,
  controlRows: 12,
  faultInjectionCases: 10,
  requiredOutputs: 5,
});

const AUTHORITY_FIELD_NAMES = Object.freeze([
  "pass",
  "allowed_now",
  "activationApproved",
  "runtimeApproved",
  "permissionGranted",
  "capabilityToken",
  "coverageAuthorityGranted",
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

function createControlCoverageMatrixManifest(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("Control coverage matrix manifest input must be a plain object");
  }

  return Object.freeze(cloneManifestValue(input));
}

function validateControlCoverageMatrixManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      status: CONTROL_COVERAGE_MATRIX_STATUSES.INVALID,
      errors: [CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.NOT_OBJECT],
      authorityFields: [],
    };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!hasOwn(manifest, field)) {
      errors.push(`${CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.MISSING_FIELD}:${field}`);
    }
  }

  for (const field of STRING_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyString(manifest[field])) {
      errors.push(`${CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.INVALID_STRING_FIELD}:${field}`);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyStringArray(manifest[field])) {
      errors.push(`${CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.INVALID_ARRAY_FIELD}:${field}`);
    }
  }

  if (Array.isArray(manifest.coverageDimensions) && manifest.coverageDimensions.length < MINIMUM_COUNTS.coverageDimensions) {
    errors.push(CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.INSUFFICIENT_COVERAGE_DIMENSIONS);
  }

  if (Array.isArray(manifest.controlRows) && manifest.controlRows.length < MINIMUM_COUNTS.controlRows) {
    errors.push(CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.INSUFFICIENT_CONTROL_ROWS);
  }

  if (Array.isArray(manifest.faultInjectionCases) && manifest.faultInjectionCases.length < MINIMUM_COUNTS.faultInjectionCases) {
    errors.push(CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.INSUFFICIENT_FAULT_INJECTION_CASES);
  }

  if (Array.isArray(manifest.requiredOutputs) && manifest.requiredOutputs.length < MINIMUM_COUNTS.requiredOutputs) {
    errors.push(CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.INSUFFICIENT_REQUIRED_OUTPUTS);
  }

  if (
    hasOwn(manifest, "producer") &&
    hasOwn(manifest, "verifier") &&
    isNonEmptyString(manifest.producer) &&
    manifest.producer === manifest.verifier
  ) {
    errors.push(CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.PRODUCER_VERIFIER_NOT_SEPARATED);
  }

  const authorityFields = collectAuthorityFields(manifest);
  for (const authorityField of authorityFields) {
    errors.push(`${CONTROL_COVERAGE_MATRIX_REJECTION_REASONS.AUTHORITY_FIELD_PRESENT}:${authorityField}`);
  }

  return {
    valid: errors.length === 0,
    status:
      errors.length === 0
        ? CONTROL_COVERAGE_MATRIX_STATUSES.VALID
        : CONTROL_COVERAGE_MATRIX_STATUSES.INVALID,
    errors,
    authorityFields,
  };
}

function classifyControlCoverageMatrixManifest(manifest) {
  const validation = validateControlCoverageMatrixManifest(manifest);

  return {
    status: validation.status,
    valid: validation.valid,
    errorCount: validation.errors.length,
    errors: validation.errors,
    authorityFields: validation.authorityFields,
  };
}

function assertControlCoverageMatrixManifestNotAuthority(manifest) {
  const authorityFields = collectAuthorityFields(manifest);

  if (authorityFields.length > 0) {
    throw new Error(`Control coverage matrix manifest contains authority fields: ${authorityFields.join(", ")}`);
  }

  return true;
}

function summarizeControlCoverageMatrixManifest(manifest) {
  const validation = validateControlCoverageMatrixManifest(manifest);
  const coverageDimensions = Array.isArray(manifest && manifest.coverageDimensions) ? manifest.coverageDimensions : [];
  const controlRows = Array.isArray(manifest && manifest.controlRows) ? manifest.controlRows : [];
  const faultInjectionCases = Array.isArray(manifest && manifest.faultInjectionCases) ? manifest.faultInjectionCases : [];
  const requiredOutputs = Array.isArray(manifest && manifest.requiredOutputs) ? manifest.requiredOutputs : [];
  const boundaryCoverage = Array.isArray(manifest && manifest.boundaryCoverage) ? manifest.boundaryCoverage : [];
  const coverageAssertions = Array.isArray(manifest && manifest.coverageAssertions) ? manifest.coverageAssertions : [];

  return {
    manifestId: isPlainObject(manifest) ? manifest.manifestId : undefined,
    sourceGap: isPlainObject(manifest) ? manifest.sourceGap : undefined,
    sourceGateName: isPlainObject(manifest) ? manifest.sourceGateName : undefined,
    status: validation.status,
    valid: validation.valid,
    coverageDimensionCount: coverageDimensions.length,
    controlRowCount: controlRows.length,
    faultInjectionCaseCount: faultInjectionCases.length,
    requiredOutputCount: requiredOutputs.length,
    boundaryCoverageCount: boundaryCoverage.length,
    coverageAssertionCount: coverageAssertions.length,
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
  CONTROL_COVERAGE_MATRIX_STATUSES,
  CONTROL_COVERAGE_MATRIX_COVERAGE_DIMENSIONS,
  CONTROL_COVERAGE_MATRIX_REJECTION_REASONS,
  createControlCoverageMatrixManifest,
  validateControlCoverageMatrixManifest,
  classifyControlCoverageMatrixManifest,
  assertControlCoverageMatrixManifestNotAuthority,
  summarizeControlCoverageMatrixManifest,
};
