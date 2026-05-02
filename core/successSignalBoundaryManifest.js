'use strict';

const SUCCESS_SIGNAL_BOUNDARY_STATUSES = Object.freeze({
  VALID: 'valid',
  INVALID: 'invalid',
  BLOCKED: 'blocked'
});

const SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS = Object.freeze({
  REWARD_AUTHORITY: 'reward_authority',
  SUCCESS_SIGNAL_AUTHORITY: 'success_signal_authority',
  GRAPH_EXPANSION: 'graph_expansion',
  MODEL_OUTPUT_APPROVAL: 'model_output_approval',
  GENERATED_CODE_APPROVAL: 'generated_code_approval',
  AUTHORITY_SELF_EXPANSION: 'authority_self_expansion',
  NON_DETERMINISTIC_SIGNAL: 'non_deterministic_signal'
});

const SUCCESS_SIGNAL_BOUNDARY_REQUIRED_FIELDS = Object.freeze([
  'seam',
  'deterministicSignals',
  'rewardAuthorityGranted',
  'rewardAuthorityAllowedNow',
  'successSignalAuthorityGranted',
  'successSignalAuthorityAllowedNow',
  'graphExpansionAllowedNow',
  'modelOutputApprovalGranted',
  'modelOutputApprovalAllowedNow',
  'generatedCodeApprovalGranted',
  'generatedCodeApprovalAllowedNow'
]);

const FORBIDDEN_TRUE_FIELDS = Object.freeze([
  ['rewardAuthorityGranted', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.REWARD_AUTHORITY],
  ['rewardAuthorityAllowedNow', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.REWARD_AUTHORITY],
  ['successSignalAuthorityGranted', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.SUCCESS_SIGNAL_AUTHORITY],
  ['successSignalAuthorityAllowedNow', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.SUCCESS_SIGNAL_AUTHORITY],
  ['graphExpansionAllowedNow', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.GRAPH_EXPANSION],
  ['modelOutputApprovalGranted', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.MODEL_OUTPUT_APPROVAL],
  ['modelOutputApprovalAllowedNow', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.MODEL_OUTPUT_APPROVAL],
  ['generatedCodeApprovalGranted', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.GENERATED_CODE_APPROVAL],
  ['generatedCodeApprovalAllowedNow', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.GENERATED_CODE_APPROVAL],
  ['authoritySelfExpansionGranted', SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.AUTHORITY_SELF_EXPANSION]
]);

const FORBIDDEN_FIELDS = Object.freeze([
  'rewardScore',
  'rewardRank',
  'rewardWeight',
  'autonomousPriority',
  'graphExpansionTargets',
  'modelOutputApproved',
  'generatedCodeApproved'
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeDeterministicSignals(signals) {
  if (signals === undefined) {
    return [];
  }
  if (!Array.isArray(signals)) {
    return signals;
  }
  return signals.map((signal) => {
    if (typeof signal === 'string') {
      return signal.trim();
    }
    return signal;
  });
}

function createSuccessSignalBoundaryManifest(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError('Success signal boundary input must be an object.');
  }

  return {
    seam: input.seam || 'SuccessSignalBoundaryImplementation v1',
    deterministicSignals: normalizeDeterministicSignals(input.deterministicSignals),
    rewardAuthorityGranted: input.rewardAuthorityGranted === true,
    rewardAuthorityAllowedNow: input.rewardAuthorityAllowedNow === true,
    successSignalAuthorityGranted: input.successSignalAuthorityGranted === true,
    successSignalAuthorityAllowedNow: input.successSignalAuthorityAllowedNow === true,
    graphExpansionAllowedNow: input.graphExpansionAllowedNow === true,
    modelOutputApprovalGranted: input.modelOutputApprovalGranted === true,
    modelOutputApprovalAllowedNow: input.modelOutputApprovalAllowedNow === true,
    generatedCodeApprovalGranted: input.generatedCodeApprovalGranted === true,
    generatedCodeApprovalAllowedNow: input.generatedCodeApprovalAllowedNow === true,
    promptOutputAuthorityGranted: input.promptOutputAuthorityGranted === true,
    selfApprovalAuthorityGranted: input.selfApprovalAuthorityGranted === true,
    authoritySelfExpansionGranted: input.authoritySelfExpansionGranted === true,
    blocked: Array.isArray(input.blocked)
      ? Array.from(new Set(input.blocked.map(String))).sort()
      : [
          SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.REWARD_AUTHORITY,
          SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.SUCCESS_SIGNAL_AUTHORITY,
          SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.GRAPH_EXPANSION,
          SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.MODEL_OUTPUT_APPROVAL,
          SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.GENERATED_CODE_APPROVAL
        ].sort()
  };
}

function validateSuccessSignalBoundaryManifest(manifest) {
  const errors = [];
  const blockedReasons = new Set();

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      status: SUCCESS_SIGNAL_BOUNDARY_STATUSES.INVALID,
      errors: ['manifest must be an object'],
      blockedReasons: []
    };
  }

  for (const field of SUCCESS_SIGNAL_BOUNDARY_REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(manifest, field)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (!Array.isArray(manifest.deterministicSignals) || manifest.deterministicSignals.length === 0) {
    errors.push('deterministicSignals must be a non-empty array');
    blockedReasons.add(SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.NON_DETERMINISTIC_SIGNAL);
  } else {
    for (const signal of manifest.deterministicSignals) {
      if (typeof signal !== 'string' || signal.trim() === '') {
        errors.push('deterministicSignals must contain only non-empty strings');
        blockedReasons.add(SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.NON_DETERMINISTIC_SIGNAL);
      }
    }
  }

  for (const [field, reason] of FORBIDDEN_TRUE_FIELDS) {
    if (manifest[field] === true) {
      errors.push(`${field} must remain false`);
      blockedReasons.add(reason);
    }
  }

  for (const field of FORBIDDEN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(manifest, field)) {
      errors.push(`${field} is outside the success-signal boundary`);
      if (field.startsWith('reward')) {
        blockedReasons.add(SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.REWARD_AUTHORITY);
      } else if (field.startsWith('graph')) {
        blockedReasons.add(SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.GRAPH_EXPANSION);
      } else if (field.startsWith('model')) {
        blockedReasons.add(SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.MODEL_OUTPUT_APPROVAL);
      } else if (field.startsWith('generated')) {
        blockedReasons.add(SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS.GENERATED_CODE_APPROVAL);
      }
    }
  }

  const valid = errors.length === 0;
  return {
    valid,
    status: valid ? SUCCESS_SIGNAL_BOUNDARY_STATUSES.VALID : SUCCESS_SIGNAL_BOUNDARY_STATUSES.BLOCKED,
    errors,
    blockedReasons: Array.from(blockedReasons).sort()
  };
}

function classifySuccessSignalBoundaryManifest(manifest) {
  const validation = validateSuccessSignalBoundaryManifest(manifest);
  return {
    status: validation.status,
    valid: validation.valid,
    blockedReasons: validation.blockedReasons,
    errors: validation.errors
  };
}

function assertSuccessSignalBoundaryDoesNotGrantAuthority(manifest) {
  const validation = validateSuccessSignalBoundaryManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Success signal boundary violation: ${validation.errors.join('; ')}`);
  }
  return manifest;
}

function summarizeSuccessSignalBoundaryManifest(manifest) {
  const classification = classifySuccessSignalBoundaryManifest(manifest);
  return {
    seam: manifest && manifest.seam,
    status: classification.status,
    deterministicSignalCount: Array.isArray(manifest && manifest.deterministicSignals)
      ? manifest.deterministicSignals.length
      : 0,
    blockedReasons: classification.blockedReasons,
    authorityGranted: false,
    graphExpansionAllowedNow: false,
    modelOutputApprovalAllowedNow: false,
    generatedCodeApprovalAllowedNow: false
  };
}

module.exports = Object.freeze({
  SUCCESS_SIGNAL_BOUNDARY_STATUSES,
  SUCCESS_SIGNAL_BOUNDARY_BLOCKED_REASONS,
  SUCCESS_SIGNAL_BOUNDARY_REQUIRED_FIELDS,
  createSuccessSignalBoundaryManifest,
  validateSuccessSignalBoundaryManifest,
  classifySuccessSignalBoundaryManifest,
  assertSuccessSignalBoundaryDoesNotGrantAuthority,
  summarizeSuccessSignalBoundaryManifest
});
