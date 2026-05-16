const ANOMALY_PROMOTION_BOUNDARY_STATUSES = Object.freeze({
  ACTIVE: 'active',
  CLASSIFIED: 'classified',
  BLOCKED: 'blocked',
  RESOLVED: 'resolved',
  RETIRED: 'retired'
});

const ANOMALY_PROMOTION_BOUNDARY_CLASSIFICATIONS = Object.freeze({
  EXPECTED_PASS_OBSERVED_FAIL: 'expected_pass_observed_fail',
  EXPECTED_FAIL_OBSERVED_PASS: 'expected_fail_observed_pass',
  TEST_PASS_PROBE_MISMATCH: 'test_pass_probe_mismatch',
  DIRTY_STATE_MISMATCH: 'dirty_state_mismatch',
  STALE_CONTINUITY_CONFLICT: 'stale_continuity_conflict',
  REPEATED_SCRIPT_FAILURE: 'repeated_script_failure',
  UNEXPECTED_MISSING_PATH: 'unexpected_missing_path',
  UNEXPECTED_EXTRA_MUTATION: 'unexpected_extra_mutation',
  PARSER_BOUNDARY_FAILURE: 'parser_boundary_failure',
  REVIEW_BOUNDARY_FALSE_POSITIVE: 'review_boundary_false_positive',
  PACKET_SURFACE_HYGIENE_VIOLATION: 'packet_surface_hygiene_violation'
});

const ANOMALY_PROMOTION_BOUNDARY_AUTHORITY_EFFECTS = Object.freeze({
  BLOCK_CONTINUATION: 'block_continuation',
  REQUIRE_REPAIR_PLAN: 'require_repair_plan',
  REQUIRE_INQUIRY: 'require_inquiry',
  REQUIRE_OPERATOR_DIRECTION: 'require_operator_direction',
  ALLOW_CLASSIFICATION_ONLY: 'allow_classification_only'
});

const BLOCKED_AUTHORITY_EFFECTS = new Set([
  'grant_implementation',
  'grant_source_mutation',
  'grant_runtime_execution',
  'grant_tool_execution',
  'grant_commit',
  'grant_push',
  'grant_authority_expansion'
]);

const REQUIRED_RECORD_FIELDS = Object.freeze([
  'anomalyId',
  'expected',
  'observed',
  'classification',
  'sourceIds',
  'authorityEffect',
  'nextRequired',
  'status',
  'createdAt'
]);

const VALID_STATUSES = new Set(Object.values(ANOMALY_PROMOTION_BOUNDARY_STATUSES));
const VALID_CLASSIFICATIONS = new Set(Object.values(ANOMALY_PROMOTION_BOUNDARY_CLASSIFICATIONS));
const VALID_AUTHORITY_EFFECTS = new Set(Object.values(ANOMALY_PROMOTION_BOUNDARY_AUTHORITY_EFFECTS));

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(new Set(values.filter(isNonEmptyString).map((value) => value.trim())));
}

function createAnomalyPromotionRecord(input = {}) {
  const now = input.createdAt || new Date(0).toISOString();

  return Object.freeze({
    anomalyId: input.anomalyId || '',
    expected: input.expected || '',
    observed: input.observed || '',
    classification: input.classification || '',
    sourceIds: uniqueStrings(input.sourceIds),
    authorityEffect: input.authorityEffect || ANOMALY_PROMOTION_BOUNDARY_AUTHORITY_EFFECTS.BLOCK_CONTINUATION,
    nextRequired: input.nextRequired || '',
    status: input.status || ANOMALY_PROMOTION_BOUNDARY_STATUSES.ACTIVE,
    createdAt: now
  });
}

function validateAnomalyPromotionRecord(record) {
  const errors = [];

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return Object.freeze({
      valid: false,
      errors: Object.freeze(['record must be an object'])
    });
  }

  for (const field of REQUIRED_RECORD_FIELDS) {
    if (!(field in record)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (!isNonEmptyString(record.anomalyId)) {
    errors.push('anomalyId must be a non-empty string');
  }

  if (!isNonEmptyString(record.expected)) {
    errors.push('expected must be a non-empty string');
  }

  if (!isNonEmptyString(record.observed)) {
    errors.push('observed must be a non-empty string');
  }

  if (!VALID_CLASSIFICATIONS.has(record.classification)) {
    errors.push(`classification is not allowed: ${record.classification}`);
  }

  if (!Array.isArray(record.sourceIds) || record.sourceIds.length === 0 || !record.sourceIds.every(isNonEmptyString)) {
    errors.push('sourceIds must contain at least one non-empty string');
  }

  if (!VALID_AUTHORITY_EFFECTS.has(record.authorityEffect)) {
    errors.push(`authorityEffect is not allowed: ${record.authorityEffect}`);
  }

  if (BLOCKED_AUTHORITY_EFFECTS.has(record.authorityEffect)) {
    errors.push(`authorityEffect is blocked: ${record.authorityEffect}`);
  }

  if (!isNonEmptyString(record.nextRequired)) {
    errors.push('nextRequired must be a non-empty string');
  }

  if (!VALID_STATUSES.has(record.status)) {
    errors.push(`status is not allowed: ${record.status}`);
  }

  if (!isNonEmptyString(record.createdAt)) {
    errors.push('createdAt must be a non-empty string');
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function classifyAnomalyPromotionRecord(record) {
  const validation = validateAnomalyPromotionRecord(record);

  if (!validation.valid) {
    return Object.freeze({
      classification: '',
      authorityEffect: ANOMALY_PROMOTION_BOUNDARY_AUTHORITY_EFFECTS.BLOCK_CONTINUATION,
      nextRequired: 'repair_plan_or_inquiry',
      valid: false,
      errors: validation.errors
    });
  }

  return Object.freeze({
    classification: record.classification,
    authorityEffect: record.authorityEffect,
    nextRequired: record.nextRequired,
    valid: true,
    errors: Object.freeze([])
  });
}

function assertAnomalyPromotionDoesNotGrantAuthority(record) {
  const validation = validateAnomalyPromotionRecord(record);

  if (!validation.valid) {
    return Object.freeze({
      ok: false,
      errors: validation.errors
    });
  }

  if (BLOCKED_AUTHORITY_EFFECTS.has(record.authorityEffect)) {
    return Object.freeze({
      ok: false,
      errors: Object.freeze([`blocked authority effect: ${record.authorityEffect}`])
    });
  }

  return Object.freeze({
    ok: true,
    errors: Object.freeze([])
  });
}

function summarizeAnomalyPromotionRecord(record) {
  const classification = classifyAnomalyPromotionRecord(record);

  return Object.freeze({
    anomalyId: record && record.anomalyId ? record.anomalyId : '',
    classification: classification.classification,
    authorityEffect: classification.authorityEffect,
    nextRequired: classification.nextRequired,
    valid: classification.valid
  });
}

module.exports = {
  ANOMALY_PROMOTION_BOUNDARY_STATUSES,
  ANOMALY_PROMOTION_BOUNDARY_CLASSIFICATIONS,
  ANOMALY_PROMOTION_BOUNDARY_AUTHORITY_EFFECTS,
  createAnomalyPromotionRecord,
  validateAnomalyPromotionRecord,
  classifyAnomalyPromotionRecord,
  assertAnomalyPromotionDoesNotGrantAuthority,
  summarizeAnomalyPromotionRecord
};
