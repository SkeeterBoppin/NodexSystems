"use strict";

const { createContextUseGraph } = require("./contextUseGraph");

const PATTERN_TYPES = Object.freeze([
  "scope_expansion_during_active_seam",
  "authority_leak_recurrence",
  "formatting_drift_recurrence",
  "weak_context_source_dependency",
  "validated_safe_seam_shape"
]);
const PATTERN_EFFECTS = Object.freeze([
  "route_to_current_boundary_closure",
  "require_authority_leak_audit_or_context_use_gate",
  "add_formatting_or_post_cleanup_probe",
  "require_live_repo_or_evidence_file_check",
  "reuse_proven_gate_sequence"
]);
const PATTERN_STATUSES = Object.freeze([
  "hypothesis",
  "validated",
  "rejected",
  "deferred"
]);

const SOURCE_KINDS = Object.freeze([
  "user_input",
  "repo_state",
  "evidence_file",
  "test_output",
  "git_state",
  "tool_output"
]);
const REQUIRED_BLOCKED_USES = Object.freeze([
  "proof",
  "autonomous_authority",
  "semantic_truth"
]);
const REQUIRED_VALIDATIONS = Object.freeze([
  "EvidenceGate",
  "ValidityGraph",
  "ContextUseGraph",
  "manual_confirmation",
  "test_harness"
]);

const PATTERN_TYPE_SET = new Set(PATTERN_TYPES);
const PATTERN_EFFECT_SET = new Set(PATTERN_EFFECTS);
const PATTERN_STATUS_SET = new Set(PATTERN_STATUSES);
const SOURCE_KIND_SET = new Set(SOURCE_KINDS);
const REQUIRED_VALIDATION_SET = new Set(REQUIRED_VALIDATIONS);

const REQUIRED_OBSERVATION_FIELDS = Object.freeze([
  "patternId",
  "patternType",
  "sourceKind",
  "observedSurface",
  "matchedSignals",
  "confidence",
  "effect",
  "blockedUses",
  "requiredValidation",
  "status"
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];

  return Array.from(new Set(values.filter(isNonEmptyString)));
}

function hasForbiddenTruthField(observation) {
  return [
    "semanticTruth",
    "truth",
    "isTrue",
    "truthValue"
  ].some(field => Object.prototype.hasOwnProperty.call(observation, field));
}

function hasForbiddenUserPatternField(observation) {
  return [
    "userPattern",
    "humanContextState",
    "emotionalState",
    "psychologicalProfile",
    "userEmotion",
    "diagnosis"
  ].some(field => Object.prototype.hasOwnProperty.call(observation, field));
}

function cloneObservation(observation) {
  return {
    ...observation,
    matchedSignals: uniqueStrings(observation.matchedSignals),
    blockedUses: uniqueStrings(observation.blockedUses)
  };
}

function validatePatternObservation(observation = {}) {
  const errors = [];

  if (!isPlainObject(observation)) {
    return {
      valid: false,
      errors: ["observation must be an object"]
    };
  }

  for (const field of REQUIRED_OBSERVATION_FIELDS) {
    if (!(field in observation)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  for (const field of [
    "patternId",
    "patternType",
    "sourceKind",
    "observedSurface",
    "effect",
    "requiredValidation",
    "status"
  ]) {
    if (field in observation && !isNonEmptyString(observation[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (isNonEmptyString(observation.patternType) && !PATTERN_TYPE_SET.has(observation.patternType)) {
    errors.push(`unknown patternType: ${observation.patternType}`);
  }

  if (isNonEmptyString(observation.sourceKind) && !SOURCE_KIND_SET.has(observation.sourceKind)) {
    errors.push(`unknown sourceKind: ${observation.sourceKind}`);
  }

  if (isNonEmptyString(observation.effect) && !PATTERN_EFFECT_SET.has(observation.effect)) {
    errors.push(`unknown pattern effect: ${observation.effect}`);
  }

  if (isNonEmptyString(observation.requiredValidation) && !REQUIRED_VALIDATION_SET.has(observation.requiredValidation)) {
    errors.push(`unknown requiredValidation: ${observation.requiredValidation}`);
  }

  if (isNonEmptyString(observation.status) && !PATTERN_STATUS_SET.has(observation.status)) {
    errors.push(`unknown status: ${observation.status}`);
  }

  if (!Array.isArray(observation.matchedSignals)) {
    errors.push("matchedSignals must be an array");
  } else if (observation.matchedSignals.length === 0) {
    errors.push("matchedSignals must not be empty");
  } else if (!observation.matchedSignals.every(isNonEmptyString)) {
    errors.push("matchedSignals must contain only non-empty strings");
  }

  if (!Array.isArray(observation.blockedUses)) {
    errors.push("blockedUses must be an array");
  } else if (!observation.blockedUses.every(isNonEmptyString)) {
    errors.push("blockedUses must contain only non-empty strings");
  } else {
    for (const requiredUse of REQUIRED_BLOCKED_USES) {
      if (!observation.blockedUses.includes(requiredUse)) {
        errors.push(`blockedUses must include ${requiredUse}`);
      }
    }
  }

  if (typeof observation.confidence !== "number" || !Number.isFinite(observation.confidence)) {
    errors.push("confidence must be a finite number");
  } else if (observation.confidence < 0 || observation.confidence > 1) {
    errors.push("confidence must be between 0 and 1");
  }

  if (hasForbiddenTruthField(observation)) {
    errors.push("semantic truth fields are not accepted by ContextPatternGraph");
  }

  if (hasForbiddenUserPatternField(observation)) {
    errors.push("user-pattern and human-state fields are not implemented in ContextPatternGraph v1");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createPatternObservation(observation = {}) {
  const cloned = cloneObservation(observation);
  const validation = validatePatternObservation(cloned);

  if (!validation.valid) {
    throw new Error(`Invalid pattern observation: ${validation.errors.join("; ")}`);
  }

  return Object.freeze({
    ...cloned,
    matchedSignals: Object.freeze([...cloned.matchedSignals]),
    blockedUses: Object.freeze([...cloned.blockedUses])
  });
}

function createContextPatternGraph(observations = [], options = {}) {
  if (!Array.isArray(observations)) {
    throw new Error("observations must be an array");
  }

  const contextUseGraph = options.contextUseGraph || createContextUseGraph();
  const byId = new Map();

  for (const observation of observations) {
    const created = createPatternObservation(observation);

    if (byId.has(created.patternId)) {
      throw new Error(`Duplicate pattern observation id: ${created.patternId}`);
    }

    byId.set(created.patternId, created);
  }

  return Object.freeze({
    version: 1,
    observations: Object.freeze([...byId.values()]),
    byId,
    contextUseGraph
  });
}

function getPatternObservation(graph, patternId) {
  if (!graph || !graph.byId) {
    throw new Error("graph must be created by createContextPatternGraph");
  }

  if (!isNonEmptyString(patternId)) {
    throw new Error("patternId must be a non-empty string");
  }

  return graph.byId.get(patternId) || null;
}

function assertPatternNotProof(observation) {
  const created = createPatternObservation(observation);

  for (const requiredUse of REQUIRED_BLOCKED_USES) {
    if (!created.blockedUses.includes(requiredUse)) {
      throw new Error(`pattern observation missing blocked use: ${requiredUse}`);
    }
  }

  return true;
}

function classifyPatternObservation(observation) {
  const created = createPatternObservation(observation);
  assertPatternNotProof(created);

  const canAffectRouting =
    (created.status === "hypothesis" || created.status === "validated") &&
    created.confidence > 0 &&
    isNonEmptyString(created.effect);

  return {
    patternId: created.patternId,
    patternType: created.patternType,
    sourceKind: created.sourceKind,
    status: created.status,
    confidence: created.confidence,
    effect: created.effect,
    requiredValidation: created.requiredValidation,
    canAffectRouting,
    canServeAsProof: false,
    canDecideSemanticTruth: false,
    canActAutonomously: false,
    reason: canAffectRouting
      ? "pattern observation may affect routing only"
      : "pattern observation cannot affect routing in current status"
  };
}

function canPatternAffectRouting(observation) {
  return classifyPatternObservation(observation).canAffectRouting === true;
}

module.exports = {
  PATTERN_TYPES,
  PATTERN_EFFECTS,
  PATTERN_STATUSES,
  createPatternObservation,
  validatePatternObservation,
  createContextPatternGraph,
  getPatternObservation,
  classifyPatternObservation,
  canPatternAffectRouting,
  assertPatternNotProof
};
