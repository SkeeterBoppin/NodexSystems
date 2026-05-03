'use strict';

const FAILURE_FINGERPRINT_CLASSES = Object.freeze({
  BARE_GIT_DASH_C_WITHOUT_SUBCOMMAND_ARGS: 'bare_git_dash_C_without_subcommand_args',
  STRICTMODE_SCALAR_COUNT_ACCESS: 'strictmode_scalar_count_access',
  INLINE_IF_EXPRESSION_IN_HASHTABLE: 'inline_if_expression_in_hashtable',
  ARGUMENT_TYPES_DO_NOT_MATCH: 'argument_types_do_not_match',
  INVALID_FAILURE_ARTIFACT_WRITE: 'invalid_failure_artifact_write',
  DIFF_CHECK_WARNING_MISCLASSIFIED: 'diff_check_warning_misclassified',
  CONTRACT_PROBE_FIELD_MISMATCH: 'contract_probe_field_mismatch',
  CLASSIFICATION_STATUS_ASSUMPTION_MISMATCH: 'classification_status_assumption_mismatch',
  POWERSHELL_BACKGROUND_JOB_ACCIDENTAL_AMPERSAND: 'powershell_background_job_accidental_ampersand',
  EMPTY_GIT_STATUS_REJECTED: 'empty_git_status_rejected'
});

const FAILURE_FINGERPRINT_REQUIRED_FIELDS = Object.freeze([
  'failureClass',
  'sourceSeam',
  'observedFailure',
  'deterministicDenyRule',
  'blocksRepeatedPacketFailure',
  'probabilisticLearningAllowed'
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toStringValue(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
}

function knownFailureClasses() {
  return Object.values(FAILURE_FINGERPRINT_CLASSES);
}

function createFailureFingerprintManifest(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError('Failure fingerprint input must be an object.');
  }

  return {
    failureClass: toStringValue(input.failureClass),
    sourceSeam: toStringValue(input.sourceSeam),
    observedFailure: toStringValue(input.observedFailure),
    deterministicDenyRule: toStringValue(input.deterministicDenyRule),
    blocksRepeatedPacketFailure: input.blocksRepeatedPacketFailure === true,
    probabilisticLearningAllowed: input.probabilisticLearningAllowed === true,
    repairClass: toStringValue(input.repairClass || ''),
    rawTerminalOutput: toStringValue(input.rawTerminalOutput || ''),
    normalizedFingerprint: toStringValue(input.normalizedFingerprint || input.failureClass || '')
  };
}

function validateFailureFingerprintManifest(manifest) {
  const errors = [];
  const knownClasses = knownFailureClasses();

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      status: 'invalid',
      errors: ['manifest must be an object'],
      blockedReasons: []
    };
  }

  for (const field of FAILURE_FINGERPRINT_REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(manifest, field)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (!knownClasses.includes(manifest.failureClass)) {
    errors.push('failureClass must be a known deterministic failure class');
  }

  if (typeof manifest.sourceSeam !== 'string' || manifest.sourceSeam.trim() === '') {
    errors.push('sourceSeam must be a non-empty string');
  }

  if (typeof manifest.observedFailure !== 'string' || manifest.observedFailure.trim() === '') {
    errors.push('observedFailure must be a non-empty string');
  }

  if (typeof manifest.deterministicDenyRule !== 'string' || manifest.deterministicDenyRule.trim() === '') {
    errors.push('deterministicDenyRule must be a non-empty string');
  }

  if (manifest.blocksRepeatedPacketFailure !== true) {
    errors.push('blocksRepeatedPacketFailure must be true');
  }

  if (manifest.probabilisticLearningAllowed === true) {
    errors.push('probabilisticLearningAllowed must remain false');
  }

  const valid = errors.length === 0;
  return {
    valid,
    status: valid ? 'blocked' : 'invalid',
    errors,
    blockedReasons: valid ? [manifest.failureClass] : []
  };
}

function classifyFailureFingerprintManifest(manifest) {
  const validation = validateFailureFingerprintManifest(manifest);
  return {
    status: validation.status,
    valid: validation.valid,
    blockedReasons: validation.blockedReasons,
    errors: validation.errors
  };
}

function assertFailureFingerprintBlocksRepeatedPacketFailure(manifest) {
  const validation = validateFailureFingerprintManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Failure fingerprint violation: ${validation.errors.join('; ')}`);
  }
  return manifest;
}

function summarizeFailureFingerprintManifest(manifest) {
  const classification = classifyFailureFingerprintManifest(manifest);
  return {
    failureClass: manifest && manifest.failureClass,
    sourceSeam: manifest && manifest.sourceSeam,
    status: classification.status,
    valid: classification.valid,
    blocksRepeatedPacketFailure: manifest && manifest.blocksRepeatedPacketFailure === true,
    probabilisticLearningAllowed: manifest && manifest.probabilisticLearningAllowed === true,
    blockedReasons: classification.blockedReasons
  };
}

module.exports = Object.freeze({
  FAILURE_FINGERPRINT_CLASSES,
  FAILURE_FINGERPRINT_REQUIRED_FIELDS,
  createFailureFingerprintManifest,
  validateFailureFingerprintManifest,
  classifyFailureFingerprintManifest,
  assertFailureFingerprintBlocksRepeatedPacketFailure,
  summarizeFailureFingerprintManifest
});