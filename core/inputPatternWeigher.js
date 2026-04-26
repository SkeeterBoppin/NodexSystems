"use strict";

const {
  PATTERN_TYPES,
  PATTERN_EFFECTS
} = require("./contextPatternGraph");

const { createContextUseGraph } = require("./contextUseGraph");

const INPUT_RISK_FLAGS = Object.freeze([
  "scope_expansion_during_active_seam",
  "authority_boundary_risk",
  "weak_context_source_dependency",
  "formatting_drift_risk",
  "commit_gate_required",
  "live_repo_evidence_required"
]);
const ALLOWED_NEXT_ACTIONS = Object.freeze([
  "inspect",
  "classify",
  "plan",
  "validate",
  "commit_gate"
]);
const BLOCKED_ACTIONS = Object.freeze([
  "patch_without_evidence",
  "delete",
  "broad_refactor",
  "trust_memory_as_proof"
]);

const BLOCKED_USES = Object.freeze([
  "proof",
  "autonomous_authority",
  "semantic_truth",
  "user_profile_inference"
]);
const RESULT_STATUSES = Object.freeze([
  "hypothesis"
]);
const REQUIRED_RESULT_FIELDS = Object.freeze([
  "inputId",
  "activeSeam",
  "matchedPatterns",
  "riskFlags",
  "allowedNextActions",
  "blockedActions",
  "blockedUses",
  "status"
]);
const REQUIRED_MATCHED_PATTERN_FIELDS = Object.freeze([
  "patternType",
  "confidence",
  "effect",
  "requiredValidation"
]);

const PATTERN_TYPE_SET = new Set(PATTERN_TYPES);
const PATTERN_EFFECT_SET = new Set(PATTERN_EFFECTS);
const RISK_FLAG_SET = new Set(INPUT_RISK_FLAGS);
const ALLOWED_NEXT_ACTION_SET = new Set(ALLOWED_NEXT_ACTIONS);
const BLOCKED_ACTION_SET = new Set(BLOCKED_ACTIONS);
const BLOCKED_USE_SET = new Set(BLOCKED_USES);
const RESULT_STATUS_SET = new Set(RESULT_STATUSES);
const REQUIRED_VALIDATIONS = new Set([
  "ContextUseGraph",
  "EvidenceGate",
  "ValidityGraph",
  "test_harness",
  "manual_confirmation"
]);

const PATTERN_EFFECT_BY_TYPE = Object.freeze({
  scope_expansion_during_active_seam: "route_to_current_boundary_closure",
  weak_context_source_dependency: "require_live_repo_or_evidence_file_check",
  authority_leak_recurrence: "require_authority_leak_audit_or_context_use_gate",
  validated_safe_seam_shape: "reuse_proven_gate_sequence",
  formatting_drift_recurrence: "add_formatting_or_post_cleanup_probe"
});

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

function hasForbiddenTruthField(value) {
  return [
    "semanticTruth",
    "truth",
    "isTrue",
    "truthValue"
  ].some(field => Object.prototype.hasOwnProperty.call(value, field));
}

function hasForbiddenUserTrackingField(value) {
  return [
    "userPattern",
    "userProfile",
    "persistedUserProfile",
    "humanContextState",
    "emotionalState",
    "psychologicalProfile",
    "userEmotion",
    "diagnosis",
    "crossSessionUserPattern"
  ].some(field => Object.prototype.hasOwnProperty.call(value, field));
}

function stableInputId(inputText = "", activeSeam = "unknown") {
  const source = `${activeSeam}\n${inputText}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash * 31) + source.charCodeAt(index)) >>> 0;
  }

  return `input_${hash.toString(16).padStart(8, "0")}`;
}

function createMatchedPattern({
  inputId,
  patternType,
  confidence,
  requiredValidation,
  matchedSignal
}) {
  const effect = PATTERN_EFFECT_BY_TYPE[patternType];

  return {
    patternType,
    confidence,
    effect,
    requiredValidation,
    matchedSignal,
    patternId: `${inputId}_${patternType}`
  };
}

function validateMatchedPattern(pattern = {}) {
  const errors = [];

  if (!isPlainObject(pattern)) {
    return ["matched pattern must be an object"];
  }

  for (const field of REQUIRED_MATCHED_PATTERN_FIELDS) {
    if (!(field in pattern)) {
      errors.push(`matched pattern missing required field: ${field}`);
    }
  }

  if ("patternType" in pattern && !PATTERN_TYPE_SET.has(pattern.patternType)) {
    errors.push(`unknown matched pattern type: ${pattern.patternType}`);
  }

  if ("effect" in pattern && !PATTERN_EFFECT_SET.has(pattern.effect)) {
    errors.push(`unknown matched pattern effect: ${pattern.effect}`);
  }

  if ("requiredValidation" in pattern && !REQUIRED_VALIDATIONS.has(pattern.requiredValidation)) {
    errors.push(`unknown matched pattern requiredValidation: ${pattern.requiredValidation}`);
  }

  if (typeof pattern.confidence !== "number" || !Number.isFinite(pattern.confidence)) {
    errors.push("matched pattern confidence must be a finite number");
  } else if (pattern.confidence < 0 || pattern.confidence > 1) {
    errors.push("matched pattern confidence must be between 0 and 1");
  }

  return errors;
}

function validateInputPatternResult(result = {}) {
  const errors = [];

  if (!isPlainObject(result)) {
    return {
      valid: false,
      errors: ["result must be an object"]
    };
  }

  for (const field of REQUIRED_RESULT_FIELDS) {
    if (!(field in result)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  for (const field of ["inputId", "activeSeam", "status"]) {
    if (field in result && !isNonEmptyString(result[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if ("status" in result && !RESULT_STATUS_SET.has(result.status)) {
    errors.push(`unknown status: ${result.status}`);
  }

  if (!Array.isArray(result.matchedPatterns)) {
    errors.push("matchedPatterns must be an array");
  } else {
    for (const pattern of result.matchedPatterns) {
      errors.push(...validateMatchedPattern(pattern));
    }
  }

  if (!Array.isArray(result.riskFlags)) {
    errors.push("riskFlags must be an array");
  } else {
    for (const riskFlag of result.riskFlags) {
      if (!RISK_FLAG_SET.has(riskFlag)) {
        errors.push(`unknown riskFlag: ${riskFlag}`);
      }
    }
  }

  if (!Array.isArray(result.allowedNextActions)) {
    errors.push("allowedNextActions must be an array");
  } else {
    for (const action of result.allowedNextActions) {
      if (!ALLOWED_NEXT_ACTION_SET.has(action)) {
        errors.push(`unknown allowedNextAction: ${action}`);
      }
    }
  }

  if (!Array.isArray(result.blockedActions)) {
    errors.push("blockedActions must be an array");
  } else {
    for (const action of result.blockedActions) {
      if (!BLOCKED_ACTION_SET.has(action)) {
        errors.push(`unknown blockedAction: ${action}`);
      }
    }
  }

  if (!Array.isArray(result.blockedUses)) {
    errors.push("blockedUses must be an array");
  } else {
    for (const use of result.blockedUses) {
      if (!BLOCKED_USE_SET.has(use)) {
        errors.push(`unknown blockedUse: ${use}`);
      }
    }

    for (const requiredUse of BLOCKED_USES) {
      if (!result.blockedUses.includes(requiredUse)) {
        errors.push(`blockedUses must include ${requiredUse}`);
      }
    }
  }

  if (hasForbiddenTruthField(result)) {
    errors.push("semantic truth fields are not accepted by InputPatternWeigher");
  }

  if (hasForbiddenUserTrackingField(result)) {
    errors.push("user-pattern, emotion, profile, and human-state fields are not implemented in InputPatternWeigher v1");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createInputPatternResult(result = {}) {
  const cloned = {
    ...result,
    matchedPatterns: Array.isArray(result.matchedPatterns)
      ? result.matchedPatterns.map(pattern => Object.freeze({ ...pattern }))
      : [],
    riskFlags: uniqueStrings(result.riskFlags),
    allowedNextActions: uniqueStrings(result.allowedNextActions),
    blockedActions: uniqueStrings(result.blockedActions),
    blockedUses: uniqueStrings(result.blockedUses)
  };

  const validation = validateInputPatternResult(cloned);

  if (!validation.valid) {
    throw new Error(`Invalid input pattern result: ${validation.errors.join("; ")}`);
  }

  return Object.freeze({
    ...cloned,
    matchedPatterns: Object.freeze([...cloned.matchedPatterns]),
    riskFlags: Object.freeze([...cloned.riskFlags]),
    allowedNextActions: Object.freeze([...cloned.allowedNextActions]),
    blockedActions: Object.freeze([...cloned.blockedActions]),
    blockedUses: Object.freeze([...cloned.blockedUses])
  });
}

function addPattern({ matchedPatterns, riskFlags, inputId, patternType, confidence, requiredValidation, riskFlag, matchedSignal }) {
  matchedPatterns.push(createMatchedPattern({
    inputId,
    patternType,
    confidence,
    requiredValidation,
    matchedSignal
  }));

  if (riskFlag) {
    riskFlags.push(riskFlag);
  }
}

function weighInputPattern(input = {}, options = {}) {
  if (!isPlainObject(input)) {
    throw new Error("input must be an object");
  }

  if (hasForbiddenTruthField(input) || hasForbiddenUserTrackingField(input)) {
    throw new Error("InputPatternWeigher v1 rejects truth, user-pattern, emotion, profile, and human-state fields");
  }

  const inputText = String(input.inputText || "");
  const activeSeam = isNonEmptyString(input.activeSeam) ? input.activeSeam : "unknown";
  const inputId = isNonEmptyString(input.inputId) ? input.inputId : stableInputId(inputText, activeSeam);
  const repoState = isPlainObject(input.repoState) ? input.repoState : {};
  const evidenceState = isPlainObject(input.evidenceState) ? input.evidenceState : {};
  const contextUseGraph = options.contextUseGraph || createContextUseGraph();

  const lower = inputText.toLowerCase();
  const matchedPatterns = [];
  const riskFlags = [];

  const dirtyState =
    repoState.dirty === true ||
    repoState.workingTreeClean === false ||
    /dirty state|working tree.*dirty|uncommitted|pending commit|commit gate/i.test(inputText);

  const featureExpansion =
    /\b(add|build|implement|create|connect|expand|new feature|next graph|new module|finish it)\b/i.test(inputText);

  if (dirtyState && featureExpansion) {
    addPattern({
      matchedPatterns,
      riskFlags,
      inputId,
      patternType: "scope_expansion_during_active_seam",
      confidence: 0.86,
      requiredValidation: "ContextUseGraph",
      riskFlag: "scope_expansion_during_active_seam",
      matchedSignal: "feature request while active seam or dirty state is present"
    });
  }

  const weakContext =
    /\b(memory|summary|transcript|uploaded|pasted|context|source doc|chat history)\b/i.test(inputText) &&
    !/\b(live repo|git status|test harness|evidence file|working tree|actual repo)\b/i.test(inputText);

  if (weakContext) {
    addPattern({
      matchedPatterns,
      riskFlags,
      inputId,
      patternType: "weak_context_source_dependency",
      confidence: 0.78,
      requiredValidation: "ContextUseGraph",
      riskFlag: "weak_context_source_dependency",
      matchedSignal: "input references context-like source without live evidence marker"
    });
  }

  const authorityRisk =
    /\b(trust|authoritative|source of truth|proof|validated|success|memory|evidence)\b/i.test(inputText) &&
    /\b(model|codex|assistant|generated|summary|llm|ai output)\b/i.test(inputText);

  if (authorityRisk) {
    addPattern({
      matchedPatterns,
      riskFlags,
      inputId,
      patternType: "authority_leak_recurrence",
      confidence: 0.82,
      requiredValidation: "EvidenceGate",
      riskFlag: "authority_boundary_risk",
      matchedSignal: "model/generated output appears near authority wording"
    });
  }

  const safeSeam =
    /inspect/i.test(inputText) &&
    /classify/i.test(inputText) &&
    /plan/i.test(inputText) &&
    /(apply|implement)/i.test(inputText) &&
    /(commit|commit gate)/i.test(inputText);

  if (safeSeam) {
    addPattern({
      matchedPatterns,
      riskFlags,
      inputId,
      patternType: "validated_safe_seam_shape",
      confidence: 0.9,
      requiredValidation: "test_harness",
      riskFlag: null,
      matchedSignal: "input follows validated seam sequence"
    });
  }

  const formattingDrift =
    /\b(formatting|indentation|newline|line ending|trailing whitespace|drift|generated artifact)\b/i.test(inputText);

  if (formattingDrift) {
    addPattern({
      matchedPatterns,
      riskFlags,
      inputId,
      patternType: "formatting_drift_recurrence",
      confidence: 0.76,
      requiredValidation: "test_harness",
      riskFlag: "formatting_drift_risk",
      matchedSignal: "input references formatting or drift"
    });
  }

  if (evidenceState.requiresCommitGate === true && !riskFlags.includes("commit_gate_required")) {
    riskFlags.push("commit_gate_required");
  }

  if (matchedPatterns.length > 0 && !riskFlags.includes("live_repo_evidence_required")) {
    riskFlags.push("live_repo_evidence_required");
  }

  const allowedNextActions = riskFlags.includes("scope_expansion_during_active_seam")
    ? ["inspect", "validate", "commit_gate"]
    : ["inspect", "classify", "plan", "validate", "commit_gate"];

  const result = createInputPatternResult({
    inputId,
    activeSeam,
    matchedPatterns,
    riskFlags,
    allowedNextActions,
    blockedActions: [...BLOCKED_ACTIONS],
    blockedUses: [...BLOCKED_USES],
    status: "hypothesis"
  });

  return Object.freeze({
    ...result,
    contextSurfaceCount: contextUseGraph.surfaces.length
  });
}

function createInputPatternWeigher(options = {}) {
  const contextUseGraph = options.contextUseGraph || createContextUseGraph();

  return Object.freeze({
    version: 1,
    contextUseGraph,
    weigh(input) {
      return weighInputPattern(input, { contextUseGraph });
    }
  });
}

function assertInputPatternResultNotProof(result) {
  const created = createInputPatternResult(result);

  for (const requiredUse of BLOCKED_USES) {
    if (!created.blockedUses.includes(requiredUse)) {
      throw new Error(`input pattern result missing blocked use: ${requiredUse}`);
    }
  }

  return true;
}

function classifyInputPatternResult(result) {
  const created = createInputPatternResult(result);
  assertInputPatternResultNotProof(created);

  return {
    inputId: created.inputId,
    activeSeam: created.activeSeam,
    status: created.status,
    matchedPatternCount: created.matchedPatterns.length,
    riskFlags: [...created.riskFlags],
    allowedNextActions: [...created.allowedNextActions],
    blockedActions: [...created.blockedActions],
    canAffectRouting: created.status === "hypothesis",
    canServeAsProof: false,
    canDecideSemanticTruth: false,
    canActAutonomously: false,
    canTrackUserPatterns: false,
    reason: "input pattern result may affect routing only"
  };
}

module.exports = {
  INPUT_RISK_FLAGS,
  ALLOWED_NEXT_ACTIONS,
  BLOCKED_ACTIONS,
  createInputPatternResult,
  validateInputPatternResult,
  weighInputPattern,
  createInputPatternWeigher,
  classifyInputPatternResult,
  assertInputPatternResultNotProof
};
