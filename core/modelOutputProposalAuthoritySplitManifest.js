"use strict";

const MODEL_OUTPUT_PROPOSAL_AUTHORITY_SPLIT_STATUSES = Object.freeze({
  VALID: "valid",
  INVALID: "invalid",
});

const MODEL_OUTPUT_PROPOSAL_FIELD_TYPES = Object.freeze({
  PROPOSAL: "proposal",
  EVIDENCE_POINTER: "evidence_pointer",
  RATIONALE: "rationale",
  CONSTRAINT: "constraint",
  REQUESTED_ACTION: "requested_action",
  REVIEW_NOTE: "review_note",
  LOCAL_VALIDATION_POINTER: "local_validation_pointer",
  NON_AUTHORITY_CLASSIFICATION: "non_authority_classification",
});

const MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS = Object.freeze({
  NOT_OBJECT: "not_object",
  MISSING_FIELD: "missing_required_field",
  INVALID_STRING_FIELD: "invalid_string_field",
  INVALID_ARRAY_FIELD: "invalid_array_field",
  INSUFFICIENT_PROPOSAL_FIELDS: "insufficient_proposal_fields",
  INSUFFICIENT_FORBIDDEN_AUTHORITY_FIELDS: "insufficient_forbidden_authority_fields",
  INSUFFICIENT_REJECTION_RULES: "insufficient_rejection_rules",
  INSUFFICIENT_ADVERSARIAL_TESTS: "insufficient_adversarial_tests",
  INSUFFICIENT_LOCAL_VALIDATORS: "insufficient_local_validators",
  PRODUCER_VERIFIER_NOT_SEPARATED: "producer_verifier_not_separated",
  AUTHORITY_FIELD_PRESENT: "authority_field_present",
  PROPOSAL_FIELD_CONFLICTS_WITH_AUTHORITY: "proposal_field_conflicts_with_authority",
});

const REQUIRED_FIELDS = Object.freeze([
  "manifestId",
  "sourceGap",
  "sourceGateName",
  "proposalFields",
  "forbiddenAuthorityFields",
  "rejectionRules",
  "adversarialTests",
  "localValidators",
  "boundaryCoverage",
  "authorityFieldPolicy",
  "sourceCommit",
  "schemaVersion",
  "producer",
  "verifier",
]);

const STRING_FIELDS = Object.freeze([
  "manifestId",
  "sourceGap",
  "sourceGateName",
  "authorityFieldPolicy",
  "sourceCommit",
  "schemaVersion",
  "producer",
  "verifier",
]);

const ARRAY_FIELDS = Object.freeze([
  "proposalFields",
  "forbiddenAuthorityFields",
  "rejectionRules",
  "adversarialTests",
  "localValidators",
  "boundaryCoverage",
]);

const MINIMUM_COUNTS = Object.freeze({
  proposalFields: 8,
  forbiddenAuthorityFields: 13,
  rejectionRules: 10,
  adversarialTests: 10,
  localValidators: 6,
});

const AUTHORITY_FIELD_NAMES = Object.freeze([
  "pass",
  "allowed_now",
  "activationApproved",
  "runtimeApproved",
  "permissionGranted",
  "capabilityToken",
  "approvalArtifact",
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

function createModelOutputProposalAuthoritySplitManifest(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("Model output proposal authority split manifest input must be a plain object");
  }

  return Object.freeze(cloneManifestValue(input));
}

function validateModelOutputProposalAuthoritySplitManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      status: MODEL_OUTPUT_PROPOSAL_AUTHORITY_SPLIT_STATUSES.INVALID,
      errors: [MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.NOT_OBJECT],
      authorityFields: [],
      conflictingProposalFields: [],
    };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!hasOwn(manifest, field)) {
      errors.push(`${MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.MISSING_FIELD}:${field}`);
    }
  }

  for (const field of STRING_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyString(manifest[field])) {
      errors.push(`${MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.INVALID_STRING_FIELD}:${field}`);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyStringArray(manifest[field])) {
      errors.push(`${MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.INVALID_ARRAY_FIELD}:${field}`);
    }
  }

  if (Array.isArray(manifest.proposalFields) && manifest.proposalFields.length < MINIMUM_COUNTS.proposalFields) {
    errors.push(MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.INSUFFICIENT_PROPOSAL_FIELDS);
  }

  if (Array.isArray(manifest.forbiddenAuthorityFields) && manifest.forbiddenAuthorityFields.length < MINIMUM_COUNTS.forbiddenAuthorityFields) {
    errors.push(MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.INSUFFICIENT_FORBIDDEN_AUTHORITY_FIELDS);
  }

  if (Array.isArray(manifest.rejectionRules) && manifest.rejectionRules.length < MINIMUM_COUNTS.rejectionRules) {
    errors.push(MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.INSUFFICIENT_REJECTION_RULES);
  }

  if (Array.isArray(manifest.adversarialTests) && manifest.adversarialTests.length < MINIMUM_COUNTS.adversarialTests) {
    errors.push(MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.INSUFFICIENT_ADVERSARIAL_TESTS);
  }

  if (Array.isArray(manifest.localValidators) && manifest.localValidators.length < MINIMUM_COUNTS.localValidators) {
    errors.push(MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.INSUFFICIENT_LOCAL_VALIDATORS);
  }

  if (
    hasOwn(manifest, "producer") &&
    hasOwn(manifest, "verifier") &&
    isNonEmptyString(manifest.producer) &&
    manifest.producer === manifest.verifier
  ) {
    errors.push(MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.PRODUCER_VERIFIER_NOT_SEPARATED);
  }

  const authorityFields = collectAuthorityFields(manifest);
  for (const authorityField of authorityFields) {
    errors.push(`${MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.AUTHORITY_FIELD_PRESENT}:${authorityField}`);
  }

  const forbiddenAuthorityFieldSet = new Set(
    Array.isArray(manifest.forbiddenAuthorityFields) ? manifest.forbiddenAuthorityFields : []
  );
  const conflictingProposalFields = Array.isArray(manifest.proposalFields)
    ? manifest.proposalFields.filter((field) => forbiddenAuthorityFieldSet.has(field) || AUTHORITY_FIELD_NAMES.includes(field))
    : [];

  for (const conflictingField of conflictingProposalFields) {
    errors.push(`${MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS.PROPOSAL_FIELD_CONFLICTS_WITH_AUTHORITY}:${conflictingField}`);
  }

  return {
    valid: errors.length === 0,
    status:
      errors.length === 0
        ? MODEL_OUTPUT_PROPOSAL_AUTHORITY_SPLIT_STATUSES.VALID
        : MODEL_OUTPUT_PROPOSAL_AUTHORITY_SPLIT_STATUSES.INVALID,
    errors,
    authorityFields,
    conflictingProposalFields,
  };
}

function classifyModelOutputProposalAuthoritySplitManifest(manifest) {
  const validation = validateModelOutputProposalAuthoritySplitManifest(manifest);

  return {
    status: validation.status,
    valid: validation.valid,
    errorCount: validation.errors.length,
    errors: validation.errors,
    authorityFields: validation.authorityFields,
    conflictingProposalFields: validation.conflictingProposalFields,
  };
}

function assertModelOutputProposalAuthoritySplitManifestNotAuthority(manifest) {
  const validation = validateModelOutputProposalAuthoritySplitManifest(manifest);

  if (validation.authorityFields.length > 0 || validation.conflictingProposalFields.length > 0) {
    throw new Error(
      `Model output proposal authority split manifest contains authority fields: ${validation.authorityFields.concat(validation.conflictingProposalFields).join(", ")}`
    );
  }

  return true;
}

function summarizeModelOutputProposalAuthoritySplitManifest(manifest) {
  const validation = validateModelOutputProposalAuthoritySplitManifest(manifest);
  const proposalFields = Array.isArray(manifest && manifest.proposalFields) ? manifest.proposalFields : [];
  const forbiddenAuthorityFields = Array.isArray(manifest && manifest.forbiddenAuthorityFields) ? manifest.forbiddenAuthorityFields : [];
  const rejectionRules = Array.isArray(manifest && manifest.rejectionRules) ? manifest.rejectionRules : [];
  const adversarialTests = Array.isArray(manifest && manifest.adversarialTests) ? manifest.adversarialTests : [];
  const localValidators = Array.isArray(manifest && manifest.localValidators) ? manifest.localValidators : [];
  const boundaryCoverage = Array.isArray(manifest && manifest.boundaryCoverage) ? manifest.boundaryCoverage : [];

  return {
    manifestId: isPlainObject(manifest) ? manifest.manifestId : undefined,
    sourceGap: isPlainObject(manifest) ? manifest.sourceGap : undefined,
    sourceGateName: isPlainObject(manifest) ? manifest.sourceGateName : undefined,
    status: validation.status,
    valid: validation.valid,
    proposalFieldCount: proposalFields.length,
    forbiddenAuthorityFieldCount: forbiddenAuthorityFields.length,
    rejectionRuleCount: rejectionRules.length,
    adversarialTestCount: adversarialTests.length,
    localValidatorCount: localValidators.length,
    boundaryCoverageCount: boundaryCoverage.length,
    authorityFieldCount: validation.authorityFields.length,
    conflictingProposalFieldCount: validation.conflictingProposalFields.length,
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
  MODEL_OUTPUT_PROPOSAL_AUTHORITY_SPLIT_STATUSES,
  MODEL_OUTPUT_PROPOSAL_FIELD_TYPES,
  MODEL_OUTPUT_PROPOSAL_AUTHORITY_REJECTION_REASONS,
  createModelOutputProposalAuthoritySplitManifest,
  validateModelOutputProposalAuthoritySplitManifest,
  classifyModelOutputProposalAuthoritySplitManifest,
  assertModelOutputProposalAuthoritySplitManifestNotAuthority,
  summarizeModelOutputProposalAuthoritySplitManifest,
};
