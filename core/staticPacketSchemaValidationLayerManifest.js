"use strict";

const STATIC_PACKET_SCHEMA_VALIDATION_LAYER_MANIFEST_VERSION =
  "static_packet_schema_validation_layer_manifest.v1";

const KNOWN_PROBE_MISMATCH_CLASSES = Object.freeze([
  "readiness_probe_state_manifest_boundary_mismatch",
  "readiness_probe_generic_authority_field_mismatch",
  "readiness_probe_state_schema_overassertion",
]);

const REQUIRED_VALIDATION_CONTROLS = Object.freeze([
  "static_packet_schema_validation_layer",
  "pre_operator_packet_lint_gate",
  "manifest_state_boundary_contract",
  "known_probe_mismatch_classification",
  "required_export_schema_check",
  "authority_flag_schema_check",
  "forbidden_generic_authority_field_check",
  "state_schema_overassertion_check",
  "pass_and_fail_evidence_path_check",
  "exact_dirty_scope_check",
]);

const DEFAULT_BLOCKED_AUTHORITIES = Object.freeze([
  "packet_generation_authority",
  "packet_execution_authority",
  "packet_commit_authority",
  "packet_push_authority",
  "runtime_execution",
  "tool_execution",
  "model_output_approval",
  "generated_code_approval",
  "advisory_output_authority",
  "authority_expansion",
]);

function cloneArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function uniqueStrings(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${fieldName} must be an array`);
  }

  const seen = new Set();

  for (const item of value) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new TypeError(`${fieldName} must contain non-empty strings only`);
    }

    if (seen.has(item)) {
      throw new Error(`${fieldName} contains duplicate entry: ${item}`);
    }

    seen.add(item);
  }

  return Array.from(seen);
}

function getStaticPacketSchemaValidationLayerManifest(overrides = {}) {
  const manifest = {
    version: STATIC_PACKET_SCHEMA_VALIDATION_LAYER_MANIFEST_VERSION,
    type: "metadata_only_static_packet_schema_validation_layer",
    localEvidenceAuthorityRequired: true,
    preOperatorPacketLintGateRequired: true,
    manifestStateBoundaryContractRequired: true,
    knownProbeMismatchClassificationRequired: true,
    passAndFailEvidenceRequired: true,
    exactDirtyScopesRequired: true,
    packetGenerationAuthorityGranted: false,
    packetExecutionAuthorityGranted: false,
    packetCommitAuthorityGranted: false,
    packetPushAuthorityGranted: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    modelOutputApprovalAllowed: false,
    generatedCodeApprovalAllowed: false,
    authorityExpansionAllowed: false,
    advisoryOutputAuthorityGranted: false,
    promptOnlyEnforcementAllowed: false,
    knownProbeMismatchClasses: cloneArray(KNOWN_PROBE_MISMATCH_CLASSES),
    validationControls: cloneArray(REQUIRED_VALIDATION_CONTROLS),
    blockedAuthorities: cloneArray(DEFAULT_BLOCKED_AUTHORITIES),
  };

  return Object.freeze({
    ...manifest,
    ...overrides,
    knownProbeMismatchClasses: Object.freeze(
      uniqueStrings(
        overrides.knownProbeMismatchClasses || manifest.knownProbeMismatchClasses,
        "knownProbeMismatchClasses"
      )
    ),
    validationControls: Object.freeze(
      uniqueStrings(
        overrides.validationControls || manifest.validationControls,
        "validationControls"
      )
    ),
    blockedAuthorities: Object.freeze(
      uniqueStrings(
        overrides.blockedAuthorities || manifest.blockedAuthorities,
        "blockedAuthorities"
      )
    ),
  });
}

function validateStaticPacketSchemaValidationLayerManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== "object") {
    return {
      valid: false,
      errors: ["manifest must be an object"],
    };
  }

  if (manifest.version !== STATIC_PACKET_SCHEMA_VALIDATION_LAYER_MANIFEST_VERSION) {
    errors.push("version mismatch");
  }

  if (manifest.type !== "metadata_only_static_packet_schema_validation_layer") {
    errors.push("type must be metadata_only_static_packet_schema_validation_layer");
  }

  if (Object.prototype.hasOwnProperty.call(manifest, "authorityGranted")) {
    errors.push("authorityGranted must not be present on manifest");
  }

  const requiredTrueFields = [
    "localEvidenceAuthorityRequired",
    "preOperatorPacketLintGateRequired",
    "manifestStateBoundaryContractRequired",
    "knownProbeMismatchClassificationRequired",
    "passAndFailEvidenceRequired",
    "exactDirtyScopesRequired",
  ];

  for (const field of requiredTrueFields) {
    if (manifest[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  const requiredFalseFields = [
    "packetGenerationAuthorityGranted",
    "packetExecutionAuthorityGranted",
    "packetCommitAuthorityGranted",
    "packetPushAuthorityGranted",
    "runtimeExecutionAllowed",
    "toolExecutionAllowed",
    "modelOutputApprovalAllowed",
    "generatedCodeApprovalAllowed",
    "authorityExpansionAllowed",
    "advisoryOutputAuthorityGranted",
    "promptOnlyEnforcementAllowed",
  ];

  for (const field of requiredFalseFields) {
    if (manifest[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  try {
    const knownProbeMismatchClasses = uniqueStrings(
      manifest.knownProbeMismatchClasses,
      "knownProbeMismatchClasses"
    );

    for (const mismatchClass of KNOWN_PROBE_MISMATCH_CLASSES) {
      if (!knownProbeMismatchClasses.includes(mismatchClass)) {
        errors.push(`knownProbeMismatchClasses missing ${mismatchClass}`);
      }
    }
  } catch (error) {
    errors.push(error.message);
  }

  try {
    const validationControls = uniqueStrings(
      manifest.validationControls,
      "validationControls"
    );

    for (const control of REQUIRED_VALIDATION_CONTROLS) {
      if (!validationControls.includes(control)) {
        errors.push(`validationControls missing ${control}`);
      }
    }
  } catch (error) {
    errors.push(error.message);
  }

  try {
    const blockedAuthorities = uniqueStrings(
      manifest.blockedAuthorities,
      "blockedAuthorities"
    );

    for (const authority of DEFAULT_BLOCKED_AUTHORITIES) {
      if (!blockedAuthorities.includes(authority)) {
        errors.push(`blockedAuthorities missing ${authority}`);
      }
    }
  } catch (error) {
    errors.push(error.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertStaticPacketSchemaValidationLayerManifest(manifest) {
  const result = validateStaticPacketSchemaValidationLayerManifest(manifest);

  if (!result.valid) {
    throw new Error(
      `Invalid static packet schema validation layer manifest: ${result.errors.join("; ")}`
    );
  }

  return manifest;
}

function createStaticPacketSchemaValidationLayerState(overrides = {}) {
  const manifest = getStaticPacketSchemaValidationLayerManifest();

  return Object.freeze({
    manifestVersion: manifest.version,
    schemaValidated: true,
    packetLintGateSatisfied: true,
    localEvidenceAuthorityVerified: true,
    knownProbeMismatchClassesCovered: true,
    sourceMutationAllowed: false,
    implementationAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    packetExecutedByNodex: false,
    packetCommittedByNodex: false,
    packetPushedByNodex: false,
    generatedCodeApprovalAllowed: false,
    modelOutputApprovalAllowed: false,
    advisoryOutputAuthorityGranted: false,
    authorityExpansionAllowed: false,
    ...overrides,
  });
}

function validateStaticPacketSchemaValidationLayerState(state) {
  const errors = [];

  if (!state || typeof state !== "object") {
    return {
      valid: false,
      errors: ["state must be an object"],
    };
  }

  if (state.manifestVersion !== STATIC_PACKET_SCHEMA_VALIDATION_LAYER_MANIFEST_VERSION) {
    errors.push("state manifestVersion mismatch");
  }

  const requiredTrueFields = [
    "schemaValidated",
    "packetLintGateSatisfied",
    "localEvidenceAuthorityVerified",
    "knownProbeMismatchClassesCovered",
  ];

  for (const field of requiredTrueFields) {
    if (state[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  const requiredFalseFields = [
    "sourceMutationAllowed",
    "implementationAllowed",
    "runtimeExecutionAllowed",
    "toolExecutionAllowed",
    "packetExecutedByNodex",
    "packetCommittedByNodex",
    "packetPushedByNodex",
    "generatedCodeApprovalAllowed",
    "modelOutputApprovalAllowed",
    "advisoryOutputAuthorityGranted",
    "authorityExpansionAllowed",
  ];

  for (const field of requiredFalseFields) {
    if (state[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertStaticPacketSchemaValidationLayerState(state) {
  const result = validateStaticPacketSchemaValidationLayerState(state);

  if (!result.valid) {
    throw new Error(
      `Invalid static packet schema validation layer state: ${result.errors.join("; ")}`
    );
  }

  return state;
}

function hasAnyAuthority(manifest, state) {
  return Boolean(
    manifest.packetGenerationAuthorityGranted ||
      manifest.packetExecutionAuthorityGranted ||
      manifest.packetCommitAuthorityGranted ||
      manifest.packetPushAuthorityGranted ||
      manifest.runtimeExecutionAllowed ||
      manifest.toolExecutionAllowed ||
      manifest.modelOutputApprovalAllowed ||
      manifest.generatedCodeApprovalAllowed ||
      manifest.authorityExpansionAllowed ||
      manifest.advisoryOutputAuthorityGranted ||
      state.sourceMutationAllowed ||
      state.implementationAllowed ||
      state.runtimeExecutionAllowed ||
      state.toolExecutionAllowed ||
      state.packetExecutedByNodex ||
      state.packetCommittedByNodex ||
      state.packetPushedByNodex ||
      state.generatedCodeApprovalAllowed ||
      state.modelOutputApprovalAllowed ||
      state.advisoryOutputAuthorityGranted ||
      state.authorityExpansionAllowed
  );
}

function classifyStaticPacketSchemaValidationLayerReadiness(input = {}) {
  const manifest = input.manifest || getStaticPacketSchemaValidationLayerManifest();
  const state = input.state || createStaticPacketSchemaValidationLayerState();
  const manifestValidation = validateStaticPacketSchemaValidationLayerManifest(manifest);
  const stateValidation = validateStaticPacketSchemaValidationLayerState(state);
  const observedMismatchClass = input.observedMismatchClass || "";

  if (!manifestValidation.valid || !stateValidation.valid) {
    return Object.freeze({
      status: "blocked_invalid_static_packet_schema_validation_layer",
      allowed: false,
      authorityGranted: false,
      errors: Object.freeze([
        ...manifestValidation.errors,
        ...stateValidation.errors,
      ]),
    });
  }

  if (hasAnyAuthority(manifest, state)) {
    return Object.freeze({
      status: "blocked_authority_grant_detected",
      allowed: false,
      authorityGranted: true,
      errors: Object.freeze(["authority grant detected"]),
    });
  }

  if (observedMismatchClass !== "") {
    if (manifest.knownProbeMismatchClasses.includes(observedMismatchClass)) {
      return Object.freeze({
        status: "known_probe_mismatch_detected",
        allowed: false,
        authorityGranted: false,
        mismatchClass: observedMismatchClass,
        requiredLocalEvidence: true,
      });
    }

    return Object.freeze({
      status: "unknown_probe_mismatch_detected",
      allowed: false,
      authorityGranted: false,
      mismatchClass: observedMismatchClass,
      requiredLocalEvidence: true,
    });
  }

  return Object.freeze({
    status: "metadata_only_static_packet_schema_validation_ready",
    allowed: true,
    authorityGranted: false,
    validationControls: Object.freeze(cloneArray(manifest.validationControls)),
    knownProbeMismatchClasses: Object.freeze(cloneArray(manifest.knownProbeMismatchClasses)),
  });
}

function summarizeStaticPacketSchemaValidationLayer(input = {}) {
  const manifest = input.manifest || getStaticPacketSchemaValidationLayerManifest();
  const state = input.state || createStaticPacketSchemaValidationLayerState();
  const classification = classifyStaticPacketSchemaValidationLayerReadiness({
    manifest,
    state,
    observedMismatchClass: input.observedMismatchClass,
  });

  return Object.freeze({
    version: STATIC_PACKET_SCHEMA_VALIDATION_LAYER_MANIFEST_VERSION,
    status: classification.status,
    authorityGranted: classification.authorityGranted,
    validationControlCount: manifest.validationControls.length,
    knownProbeMismatchClassCount: manifest.knownProbeMismatchClasses.length,
    sourceMutationAllowed: state.sourceMutationAllowed,
    implementationAllowed: state.implementationAllowed,
    runtimeExecutionAllowed: state.runtimeExecutionAllowed,
    toolExecutionAllowed: state.toolExecutionAllowed,
    packetExecutedByNodex: state.packetExecutedByNodex,
    packetCommittedByNodex: state.packetCommittedByNodex,
    packetPushedByNodex: state.packetPushedByNodex,
  });
}

module.exports = {
  STATIC_PACKET_SCHEMA_VALIDATION_LAYER_MANIFEST_VERSION,
  getStaticPacketSchemaValidationLayerManifest,
  validateStaticPacketSchemaValidationLayerManifest,
  assertStaticPacketSchemaValidationLayerManifest,
  createStaticPacketSchemaValidationLayerState,
  validateStaticPacketSchemaValidationLayerState,
  assertStaticPacketSchemaValidationLayerState,
  classifyStaticPacketSchemaValidationLayerReadiness,
  summarizeStaticPacketSchemaValidationLayer,
};
