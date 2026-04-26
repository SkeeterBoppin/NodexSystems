"use strict";

const CONTEXT_USE_RULES = [
  {
    "ruleId": "live_repo_precedence",
    "effect": "Live repo inspection and tests override memory, summaries, transcripts, and generated artifacts."
  },
  {
    "ruleId": "model_output_proposal_only",
    "effect": "Model/Codex output may propose actions but cannot become evidence, memory, or instruction without validation."
  },
  {
    "ruleId": "diagnostic_snapshot_not_instruction",
    "effect": "Diagnostic snapshots can support inspection but cannot serve as active instructions."
  },
  {
    "ruleId": "memory_continuity_not_proof",
    "effect": "Memory can preserve continuity but cannot prove current repo state."
  },
  {
    "ruleId": "context_promotion_requires_gate",
    "effect": "Any context promoted into action authority must pass EvidenceGate or an explicitly named validator."
  }
];

const CONTEXT_USE_SURFACES = [
  {
    "surfaceId": "agents_md",
    "path": "AGENTS.md",
    "sourceKind": "instruction_contract",
    "surfaceType": "instruction_contract",
    "authorityClass": "validated_context_contract",
    "allowedUsage": [
      "planning",
      "routing_constraint",
      "human_instruction_context"
    ],
    "blockedUsage": [
      "proof",
      "runtime_state",
      "test_result"
    ],
    "requiredGate": "live_repo_evidence_precedence",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "context_md",
    "path": "CONTEXT.md",
    "sourceKind": "legacy_context_artifact",
    "surfaceType": "legacy_context_artifact",
    "authorityClass": "legacy_generated_or_manual_context",
    "allowedUsage": [
      "legacy_inspection_only"
    ],
    "blockedUsage": [
      "active_instruction",
      "proof",
      "automatic_memory"
    ],
    "requiredGate": "manual_revalidation",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "core_contextexporter_js",
    "path": "core/contextExporter.js",
    "sourceKind": "diagnostic_context_snapshot_generator",
    "surfaceType": "diagnostic_context_snapshot_generator",
    "authorityClass": "diagnostic_only",
    "allowedUsage": [
      "inspection",
      "debugging",
      "context_surface_discovery"
    ],
    "blockedUsage": [
      "instruction_authority",
      "proof",
      "memory_without_validation"
    ],
    "requiredGate": "diagnostic_label_required",
    "freshness": "current_commit",
    "validationState": "diagnostic_only",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "core_contextledger_js",
    "path": "core/contextLedger.js",
    "sourceKind": "runtime_context_ledger_logic",
    "surfaceType": "runtime_context_ledger_logic",
    "authorityClass": "validated_runtime_logic",
    "allowedUsage": [
      "runtime_record_validation",
      "claim_history_support"
    ],
    "blockedUsage": [
      "filesystem_authority_assumption"
    ],
    "requiredGate": "schema_validation",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "core_evidencegate_js",
    "path": "core/evidenceGate.js",
    "sourceKind": "evidence_gate_logic",
    "surfaceType": "evidence_gate_logic",
    "authorityClass": "proof_boundary_logic",
    "allowedUsage": [
      "state_transition_validation",
      "evidence_record_validation"
    ],
    "blockedUsage": [
      "model_judgment_substitute",
      "ungated_context_promotion"
    ],
    "requiredGate": "strict_evidence_record_validation",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "core_replaystore_js",
    "path": "core/replayStore.js",
    "sourceKind": "replay_state_store",
    "surfaceType": "replay_state_store",
    "authorityClass": "runtime_state_store_pending_schema_gate",
    "allowedUsage": [
      "debug_replay",
      "task_history"
    ],
    "blockedUsage": [
      "proof",
      "instruction_authority",
      "model_output_authority"
    ],
    "requiredGate": "future_replay_state_schema_gate",
    "freshness": "current_commit",
    "validationState": "pending_inspection",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "core_transcriptevidenceadapter_js",
    "path": "core/transcriptEvidenceAdapter.js",
    "sourceKind": "transcript_to_evidence_adapter",
    "surfaceType": "transcript_to_evidence_adapter",
    "authorityClass": "evidence_extraction_logic",
    "allowedUsage": [
      "transcript_parsing",
      "evidence_candidate_generation"
    ],
    "blockedUsage": [
      "proof_without_adapter_validation",
      "direct_memory_promotion"
    ],
    "requiredGate": "adapter_validation_then_evidence_gate",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "core_transcriptparser_js",
    "path": "core/transcriptParser.js",
    "sourceKind": "transcript_to_evidence_adapter",
    "surfaceType": "transcript_to_evidence_adapter",
    "authorityClass": "evidence_extraction_logic",
    "allowedUsage": [
      "transcript_parsing",
      "evidence_candidate_generation"
    ],
    "blockedUsage": [
      "proof_without_adapter_validation",
      "direct_memory_promotion"
    ],
    "requiredGate": "adapter_validation_then_evidence_gate",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "core_validitygraph_js",
    "path": "core/validityGraph.js",
    "sourceKind": "validity_authority_graph_logic",
    "surfaceType": "validity_authority_graph_logic",
    "authorityClass": "validated_runtime_logic",
    "allowedUsage": [
      "claim_ranking",
      "stale_claim_suppression",
      "blocked_action_derivation"
    ],
    "blockedUsage": [
      "semantic_truth_oracle",
      "ungated_memory_write"
    ],
    "requiredGate": "claim_schema_validation",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "evolution_auditor_js",
    "path": "evolution/auditor.js",
    "sourceKind": "legacy_evolution_surface",
    "surfaceType": "legacy_evolution_surface",
    "authorityClass": "legacy_model_output_pipeline",
    "allowedUsage": [
      "candidate_generation",
      "sandboxed_experimentation"
    ],
    "blockedUsage": [
      "direct_context_promotion",
      "direct_memory_authority",
      "proof"
    ],
    "requiredGate": "evidence_gate_before_promotion",
    "freshness": "current_commit",
    "validationState": "proposal_only",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "evolution_evolver_js",
    "path": "evolution/evolver.js",
    "sourceKind": "legacy_evolution_surface",
    "surfaceType": "legacy_evolution_surface",
    "authorityClass": "legacy_model_output_pipeline",
    "allowedUsage": [
      "candidate_generation",
      "sandboxed_experimentation"
    ],
    "blockedUsage": [
      "direct_context_promotion",
      "direct_memory_authority",
      "proof"
    ],
    "requiredGate": "evidence_gate_before_promotion",
    "freshness": "current_commit",
    "validationState": "proposal_only",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "evolution_learning_js",
    "path": "evolution/learning.js",
    "sourceKind": "legacy_evolution_surface",
    "surfaceType": "legacy_evolution_surface",
    "authorityClass": "legacy_model_output_pipeline",
    "allowedUsage": [
      "candidate_generation",
      "sandboxed_experimentation"
    ],
    "blockedUsage": [
      "direct_context_promotion",
      "direct_memory_authority",
      "proof"
    ],
    "requiredGate": "evidence_gate_before_promotion",
    "freshness": "current_commit",
    "validationState": "proposal_only",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "evolution_promptbuilder_js",
    "path": "evolution/promptBuilder.js",
    "sourceKind": "legacy_evolution_surface",
    "surfaceType": "legacy_evolution_surface",
    "authorityClass": "legacy_model_output_pipeline",
    "allowedUsage": [
      "candidate_generation",
      "sandboxed_experimentation"
    ],
    "blockedUsage": [
      "direct_context_promotion",
      "direct_memory_authority",
      "proof"
    ],
    "requiredGate": "evidence_gate_before_promotion",
    "freshness": "current_commit",
    "validationState": "proposal_only",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "evolution_scorer_js",
    "path": "evolution/scorer.js",
    "sourceKind": "legacy_evolution_surface",
    "surfaceType": "legacy_evolution_surface",
    "authorityClass": "legacy_model_output_pipeline",
    "allowedUsage": [
      "candidate_generation",
      "sandboxed_experimentation"
    ],
    "blockedUsage": [
      "direct_context_promotion",
      "direct_memory_authority",
      "proof"
    ],
    "requiredGate": "evidence_gate_before_promotion",
    "freshness": "current_commit",
    "validationState": "proposal_only",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "evolution_validators_js",
    "path": "evolution/validators.js",
    "sourceKind": "legacy_evolution_surface",
    "surfaceType": "legacy_evolution_surface",
    "authorityClass": "legacy_model_output_pipeline",
    "allowedUsage": [
      "candidate_generation",
      "sandboxed_experimentation"
    ],
    "blockedUsage": [
      "direct_context_promotion",
      "direct_memory_authority",
      "proof"
    ],
    "requiredGate": "evidence_gate_before_promotion",
    "freshness": "current_commit",
    "validationState": "proposal_only",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "ledger_quarantine_ledger_record_v1_20260425_201046_json",
    "path": "ledger/quarantine_ledger_record_v1_20260425_201046.json",
    "sourceKind": "ledger_artifact",
    "surfaceType": "ledger_artifact",
    "authorityClass": "repo_local_record_pending_policy",
    "allowedUsage": [
      "historical_record_inspection"
    ],
    "blockedUsage": [
      "runtime_context_ledger_requirement"
    ],
    "requiredGate": "ledger_policy_check",
    "freshness": "current_commit",
    "validationState": "pending_inspection",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "memory_system_rules_md",
    "path": "memory/SYSTEM_RULES.MD",
    "sourceKind": "memory_surface",
    "surfaceType": "memory_surface",
    "authorityClass": "continuity_context_pending_context_use_graph",
    "allowedUsage": [
      "continuity",
      "planning",
      "candidate_context"
    ],
    "blockedUsage": [
      "proof",
      "live_repo_override",
      "ungated_action_authority"
    ],
    "requiredGate": "memory_capsule_or_context_use_graph",
    "freshness": "current_commit",
    "validationState": "pending_inspection",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "memory_contextmanager_js",
    "path": "memory/contextManager.js",
    "sourceKind": "memory_surface",
    "surfaceType": "memory_surface",
    "authorityClass": "continuity_context_pending_context_use_graph",
    "allowedUsage": [
      "continuity",
      "planning",
      "candidate_context"
    ],
    "blockedUsage": [
      "proof",
      "live_repo_override",
      "ungated_action_authority"
    ],
    "requiredGate": "memory_capsule_or_context_use_graph",
    "freshness": "current_commit",
    "validationState": "pending_inspection",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "memory_memorystore_js",
    "path": "memory/memoryStore.js",
    "sourceKind": "memory_surface",
    "surfaceType": "memory_surface",
    "authorityClass": "continuity_context_pending_context_use_graph",
    "allowedUsage": [
      "continuity",
      "planning",
      "candidate_context"
    ],
    "blockedUsage": [
      "proof",
      "live_repo_override",
      "ungated_action_authority"
    ],
    "requiredGate": "memory_capsule_or_context_use_graph",
    "freshness": "current_commit",
    "validationState": "pending_inspection",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "system_system_state_md",
    "path": "system/system_state.md",
    "sourceKind": "system_state_document",
    "surfaceType": "system_state_document",
    "authorityClass": "validated_context_snapshot",
    "allowedUsage": [
      "planning",
      "state_reconstruction",
      "continuity"
    ],
    "blockedUsage": [
      "proof",
      "runtime_state",
      "test_result"
    ],
    "requiredGate": "live_repo_evidence_precedence",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "tests_run_js",
    "path": "tests/run.js",
    "sourceKind": "test_surface",
    "surfaceType": "test_surface",
    "authorityClass": "validation_surface",
    "allowedUsage": [
      "validation",
      "regression_protection"
    ],
    "blockedUsage": [
      "runtime_memory",
      "instruction_authority"
    ],
    "requiredGate": "test_harness_execution",
    "freshness": "current_commit",
    "validationState": "validated",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "tools_writefiletool_js",
    "path": "tools/writeFileTool.js",
    "sourceKind": "generic_write_tool",
    "surfaceType": "generic_write_tool",
    "authorityClass": "capability_boundary_pending_registry",
    "allowedUsage": [
      "bounded_file_write_after_tool_policy"
    ],
    "blockedUsage": [
      "unrestricted_write",
      "authority_write_without_policy"
    ],
    "requiredGate": "tool_capability_registry",
    "freshness": "current_commit",
    "validationState": "pending_inspection",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "context_snapshot_json",
    "path": "CONTEXT_SNAPSHOT.json",
    "sourceKind": "generated_context_artifact",
    "surfaceType": "generated_context_artifact",
    "authorityClass": "deauthorized_generated_context",
    "allowedUsage": [
      "diagnostic_inspection_only"
    ],
    "blockedUsage": [
      "active_instruction",
      "memory",
      "proof",
      "repo_state"
    ],
    "requiredGate": "deauthorized_artifact_guard",
    "freshness": "unknown",
    "validationState": "deauthorized",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "codex_context_txt",
    "path": "CODEX_CONTEXT.txt",
    "sourceKind": "generated_context_artifact",
    "surfaceType": "generated_context_artifact",
    "authorityClass": "deauthorized_generated_context",
    "allowedUsage": [
      "diagnostic_inspection_only"
    ],
    "blockedUsage": [
      "active_instruction",
      "memory",
      "proof",
      "repo_state"
    ],
    "requiredGate": "deauthorized_artifact_guard",
    "freshness": "unknown",
    "validationState": "deauthorized",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  },
  {
    "surfaceId": "learning_live_snapshot_json",
    "path": "Learning/live_snapshot.json",
    "sourceKind": "generated_context_artifact",
    "surfaceType": "generated_context_artifact",
    "authorityClass": "deauthorized_generated_context",
    "allowedUsage": [
      "diagnostic_inspection_only"
    ],
    "blockedUsage": [
      "active_instruction",
      "memory",
      "proof",
      "repo_state"
    ],
    "requiredGate": "deauthorized_artifact_guard",
    "freshness": "unknown",
    "validationState": "deauthorized",
    "precedence": "live_repo_evidence_precedes_memory_and_summaries"
  }
];

const REQUIRED_SURFACE_FIELDS = Object.freeze([
  "surfaceId",
  "path",
  "sourceKind",
  "surfaceType",
  "authorityClass",
  "allowedUsage",
  "blockedUsage",
  "requiredGate",
  "freshness",
  "validationState",
  "precedence"
]);
const KNOWN_ALLOWED_USAGES = Object.freeze(new Set([
  "planning",
  "routing_constraint",
  "human_instruction_context",
  "state_reconstruction",
  "continuity",
  "inspection",
  "debugging",
  "context_surface_discovery",
  "runtime_record_validation",
  "claim_history_support",
  "state_transition_validation",
  "evidence_record_validation",
  "transcript_parsing",
  "evidence_candidate_generation",
  "claim_ranking",
  "stale_claim_suppression",
  "blocked_action_derivation",
  "candidate_generation",
  "sandboxed_experimentation",
  "historical_record_inspection",
  "validation",
  "regression_protection",
  "bounded_file_write_after_tool_policy",
  "diagnostic_inspection_only",
  "legacy_inspection_only",
  "task_history",
  "debug_replay",
  "candidate_context"
]));
const KNOWN_BLOCKED_USAGES = Object.freeze(new Set([
  "proof",
  "runtime_state",
  "runtime_memory",
  "test_result",
  "active_instruction",
  "automatic_memory",
  "instruction_authority",
  "memory_without_validation",
  "filesystem_authority_assumption",
  "model_judgment_substitute",
  "ungated_context_promotion",
  "proof_without_adapter_validation",
  "direct_memory_promotion",
  "semantic_truth_oracle",
  "ungated_memory_write",
  "direct_context_promotion",
  "direct_memory_authority",
  "runtime_context_ledger_requirement",
  "live_repo_override",
  "ungated_action_authority",
  "unrestricted_write",
  "authority_write_without_policy",
  "memory",
  "repo_state",
  "model_output_authority"
]));

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

function cloneSurface(surface) {
  return {
    ...surface,
    allowedUsage: uniqueStrings(surface.allowedUsage),
    blockedUsage: uniqueStrings(surface.blockedUsage)
  };
}

function validateContextSurface(surface = {}) {
  const errors = [];

  if (!isPlainObject(surface)) {
    return {
      valid: false,
      errors: ["surface must be an object"]
    };
  }

  for (const field of REQUIRED_SURFACE_FIELDS) {
    if (!(field in surface)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  for (const field of [
    "surfaceId",
    "path",
    "sourceKind",
    "surfaceType",
    "authorityClass",
    "requiredGate",
    "freshness",
    "validationState",
    "precedence"
  ]) {
    if (field in surface && !isNonEmptyString(surface[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (!Array.isArray(surface.allowedUsage)) {
    errors.push("allowedUsage must be an array");
  } else if (!surface.allowedUsage.every(isNonEmptyString)) {
    errors.push("allowedUsage must contain only non-empty strings");
  }

  if (!Array.isArray(surface.blockedUsage)) {
    errors.push("blockedUsage must be an array");
  } else if (!surface.blockedUsage.every(isNonEmptyString)) {
    errors.push("blockedUsage must contain only non-empty strings");
  }

  const allowed = uniqueStrings(surface.allowedUsage || []);
  const blocked = uniqueStrings(surface.blockedUsage || []);
  const overlap = allowed.filter(usage => blocked.includes(usage));

  if (overlap.length > 0) {
    errors.push(`allowedUsage and blockedUsage overlap: ${overlap.join(", ")}`);
  }

  for (const usage of allowed) {
    if (!KNOWN_ALLOWED_USAGES.has(usage)) {
      errors.push(`unknown allowed usage: ${usage}`);
    }
  }

  for (const usage of blocked) {
    if (!KNOWN_BLOCKED_USAGES.has(usage)) {
      errors.push(`unknown blocked usage: ${usage}`);
    }
  }

  if ("semanticTruth" in surface || "truth" in surface || "isTrue" in surface) {
    errors.push("semantic truth fields are not accepted by ContextUseGraph");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createContextSurface(surface = {}) {
  const cloned = cloneSurface(surface);
  const validation = validateContextSurface(cloned);

  if (!validation.valid) {
    throw new Error(`Invalid context surface: ${validation.errors.join("; ")}`);
  }

  return Object.freeze({
    ...cloned,
    allowedUsage: Object.freeze([...cloned.allowedUsage]),
    blockedUsage: Object.freeze([...cloned.blockedUsage])
  });
}

function createContextUseGraph(surfaces = CONTEXT_USE_SURFACES, rules = CONTEXT_USE_RULES) {
  if (!Array.isArray(surfaces)) {
    throw new Error("surfaces must be an array");
  }

  const byId = new Map();
  const byPath = new Map();

  for (const surface of surfaces) {
    const created = createContextSurface(surface);

    if (byId.has(created.surfaceId)) {
      throw new Error(`Duplicate context surface id: ${created.surfaceId}`);
    }

    if (byPath.has(created.path)) {
      throw new Error(`Duplicate context surface path: ${created.path}`);
    }

    byId.set(created.surfaceId, created);
    byPath.set(created.path, created);
  }

  return Object.freeze({
    version: 1,
    rules: Object.freeze([...rules]),
    surfaces: Object.freeze([...byId.values()]),
    byId,
    byPath
  });
}

function getContextSurface(graph, idOrPath) {
  if (!graph || !graph.byId || !graph.byPath) {
    throw new Error("graph must be created by createContextUseGraph");
  }

  if (!isNonEmptyString(idOrPath)) {
    throw new Error("idOrPath must be a non-empty string");
  }

  return graph.byId.get(idOrPath) || graph.byPath.get(idOrPath) || null;
}

function classifyContextUsage(surface, usage) {
  const created = createContextSurface(surface);

  if (!isNonEmptyString(usage)) {
    return {
      allowed: false,
      blocked: true,
      usage,
      requiredGate: created.requiredGate,
      reason: "usage must be a non-empty string"
    };
  }

  if (created.blockedUsage.includes(usage)) {
    return {
      allowed: false,
      blocked: true,
      usage,
      requiredGate: created.requiredGate,
      reason: `usage ${usage} is explicitly blocked for ${created.path}`
    };
  }

  if (created.allowedUsage.includes(usage)) {
    return {
      allowed: true,
      blocked: false,
      usage,
      requiredGate: created.requiredGate,
      reason: `usage ${usage} is explicitly allowed for ${created.path}`
    };
  }

  return {
    allowed: false,
    blocked: false,
    usage,
    requiredGate: created.requiredGate,
    reason: `usage ${usage} is not declared for ${created.path}; gate required`
  };
}

function canUseContextFor(surface, usage) {
  const classification = classifyContextUsage(surface, usage);
  return classification.allowed === true && classification.blocked === false;
}

function assertContextUsageAllowed(surface, usage) {
  const classification = classifyContextUsage(surface, usage);

  if (!classification.allowed || classification.blocked) {
    throw new Error(classification.reason);
  }

  return classification;
}

module.exports = {
  CONTEXT_USE_RULES,
  CONTEXT_USE_SURFACES,
  createContextSurface,
  validateContextSurface,
  createContextUseGraph,
  getContextSurface,
  canUseContextFor,
  assertContextUsageAllowed,
  classifyContextUsage
};
