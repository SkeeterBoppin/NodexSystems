"use strict";

const VALIDITY_GRAPH_DEPENDENCY_STATUSES = Object.freeze({
  VALID: "valid",
  INVALID: "invalid",
});

const VALIDITY_GRAPH_DEPENDENCY_NODE_TYPES = Object.freeze({
  BOUNDARY: "boundary",
  COMPONENT: "component",
  EVIDENCE: "evidence",
});

const VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS = Object.freeze({
  NOT_OBJECT: "not_object",
  MISSING_FIELD: "missing_required_field",
  INVALID_STRING_FIELD: "invalid_string_field",
  INVALID_ARRAY_FIELD: "invalid_array_field",
  INSUFFICIENT_BOUNDARY_NODES: "insufficient_boundary_nodes",
  INSUFFICIENT_COMPONENT_NODES: "insufficient_component_nodes",
  INSUFFICIENT_MONOTONICITY_RULES: "insufficient_monotonicity_rules",
  INSUFFICIENT_IMPOSSIBLE_STATES: "insufficient_impossible_states",
  INSUFFICIENT_EDGE_EXPLANATIONS: "insufficient_edge_explanations",
  PRODUCER_VERIFIER_NOT_SEPARATED: "producer_verifier_not_separated",
  AUTHORITY_FIELD_PRESENT: "authority_field_present",
});

const REQUIRED_FIELDS = Object.freeze([
  "manifestId",
  "sourceGap",
  "sourceGateName",
  "boundaryNodes",
  "componentNodes",
  "evidenceNodes",
  "dependencyEdges",
  "monotonicityRules",
  "impossibleStates",
  "edgeExplanations",
  "sourceCommit",
  "schemaVersion",
  "producer",
  "verifier",
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
  "boundaryNodes",
  "componentNodes",
  "evidenceNodes",
  "dependencyEdges",
  "monotonicityRules",
  "impossibleStates",
  "edgeExplanations",
]);

const MINIMUM_COUNTS = Object.freeze({
  boundaryNodes: 12,
  componentNodes: 17,
  monotonicityRules: 10,
  impossibleStates: 8,
  edgeExplanations: 6,
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

function createValidityGraphDependencyManifest(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("Validity graph dependency manifest input must be a plain object");
  }

  return Object.freeze(cloneManifestValue(input));
}

function validateValidityGraphDependencyManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      status: VALIDITY_GRAPH_DEPENDENCY_STATUSES.INVALID,
      errors: [VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.NOT_OBJECT],
      authorityFields: [],
    };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!hasOwn(manifest, field)) {
      errors.push(`${VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.MISSING_FIELD}:${field}`);
    }
  }

  for (const field of STRING_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyString(manifest[field])) {
      errors.push(`${VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.INVALID_STRING_FIELD}:${field}`);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (hasOwn(manifest, field) && !isNonEmptyStringArray(manifest[field])) {
      errors.push(`${VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.INVALID_ARRAY_FIELD}:${field}`);
    }
  }

  if (Array.isArray(manifest.boundaryNodes) && manifest.boundaryNodes.length < MINIMUM_COUNTS.boundaryNodes) {
    errors.push(VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.INSUFFICIENT_BOUNDARY_NODES);
  }

  if (Array.isArray(manifest.componentNodes) && manifest.componentNodes.length < MINIMUM_COUNTS.componentNodes) {
    errors.push(VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.INSUFFICIENT_COMPONENT_NODES);
  }

  if (Array.isArray(manifest.monotonicityRules) && manifest.monotonicityRules.length < MINIMUM_COUNTS.monotonicityRules) {
    errors.push(VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.INSUFFICIENT_MONOTONICITY_RULES);
  }

  if (Array.isArray(manifest.impossibleStates) && manifest.impossibleStates.length < MINIMUM_COUNTS.impossibleStates) {
    errors.push(VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.INSUFFICIENT_IMPOSSIBLE_STATES);
  }

  if (Array.isArray(manifest.edgeExplanations) && manifest.edgeExplanations.length < MINIMUM_COUNTS.edgeExplanations) {
    errors.push(VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.INSUFFICIENT_EDGE_EXPLANATIONS);
  }

  if (
    hasOwn(manifest, "producer") &&
    hasOwn(manifest, "verifier") &&
    isNonEmptyString(manifest.producer) &&
    manifest.producer === manifest.verifier
  ) {
    errors.push(VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.PRODUCER_VERIFIER_NOT_SEPARATED);
  }

  const authorityFields = collectAuthorityFields(manifest);
  for (const authorityField of authorityFields) {
    errors.push(`${VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS.AUTHORITY_FIELD_PRESENT}:${authorityField}`);
  }

  return {
    valid: errors.length === 0,
    status:
      errors.length === 0
        ? VALIDITY_GRAPH_DEPENDENCY_STATUSES.VALID
        : VALIDITY_GRAPH_DEPENDENCY_STATUSES.INVALID,
    errors,
    authorityFields,
  };
}

function classifyValidityGraphDependencyManifest(manifest) {
  const validation = validateValidityGraphDependencyManifest(manifest);

  return {
    status: validation.status,
    valid: validation.valid,
    errorCount: validation.errors.length,
    errors: validation.errors,
    authorityFields: validation.authorityFields,
  };
}

function assertValidityGraphDependencyManifestNotAuthority(manifest) {
  const authorityFields = collectAuthorityFields(manifest);

  if (authorityFields.length > 0) {
    throw new Error(`Validity graph dependency manifest contains authority fields: ${authorityFields.join(", ")}`);
  }

  return true;
}

function summarizeValidityGraphDependencyManifest(manifest) {
  const validation = validateValidityGraphDependencyManifest(manifest);
  const boundaryNodes = Array.isArray(manifest && manifest.boundaryNodes) ? manifest.boundaryNodes : [];
  const componentNodes = Array.isArray(manifest && manifest.componentNodes) ? manifest.componentNodes : [];
  const evidenceNodes = Array.isArray(manifest && manifest.evidenceNodes) ? manifest.evidenceNodes : [];
  const dependencyEdges = Array.isArray(manifest && manifest.dependencyEdges) ? manifest.dependencyEdges : [];
  const monotonicityRules = Array.isArray(manifest && manifest.monotonicityRules) ? manifest.monotonicityRules : [];
  const impossibleStates = Array.isArray(manifest && manifest.impossibleStates) ? manifest.impossibleStates : [];
  const edgeExplanations = Array.isArray(manifest && manifest.edgeExplanations) ? manifest.edgeExplanations : [];

  return {
    manifestId: isPlainObject(manifest) ? manifest.manifestId : undefined,
    sourceGap: isPlainObject(manifest) ? manifest.sourceGap : undefined,
    sourceGateName: isPlainObject(manifest) ? manifest.sourceGateName : undefined,
    status: validation.status,
    valid: validation.valid,
    boundaryNodeCount: boundaryNodes.length,
    componentNodeCount: componentNodes.length,
    evidenceNodeCount: evidenceNodes.length,
    dependencyEdgeCount: dependencyEdges.length,
    monotonicityRuleCount: monotonicityRules.length,
    impossibleStateCount: impossibleStates.length,
    edgeExplanationCount: edgeExplanations.length,
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
  VALIDITY_GRAPH_DEPENDENCY_STATUSES,
  VALIDITY_GRAPH_DEPENDENCY_NODE_TYPES,
  VALIDITY_GRAPH_DEPENDENCY_REJECTION_REASONS,
  createValidityGraphDependencyManifest,
  validateValidityGraphDependencyManifest,
  classifyValidityGraphDependencyManifest,
  assertValidityGraphDependencyManifestNotAuthority,
  summarizeValidityGraphDependencyManifest,
};
