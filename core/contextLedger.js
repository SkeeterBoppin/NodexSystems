const {
  createMemoryCapsule,
  validateMemoryCapsule
} = require("./memoryCapsule");

const RECORD_FIELDS = new Set([
  "version",
  "ledgerId",
  "sequence",
  "recordId",
  "timestamp",
  "memoryCapsule",
  "seam",
  "phase",
  "commit",
  "files",
  "evidence",
  "summary"
]);

const LEDGER_FIELDS = new Set([
  "version",
  "ledgerId",
  "records"
]);

const ID_PATTERN = /^[a-z0-9_]+$/;

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoUnknownFields(value, allowedFields, label) {
  Object.keys(value).forEach(key => {
    assertCondition(allowedFields.has(key), `${label} contains an unknown field: ${key}`);
  });
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)])
    );
  }

  return value;
}

function normalizeId(value, label) {
  assertCondition(typeof value === "string", `${label} must be a string`);

  const normalized = value.trim();
  assertCondition(normalized.length > 0, `${label} must be a non-empty string`);
  assertCondition(ID_PATTERN.test(normalized), `${label} must match /^[a-z0-9_]+$/`);

  return normalized;
}

function normalizeSequence(value) {
  assertCondition(Number.isSafeInteger(value), "sequence must be a safe integer");
  assertCondition(value > 0, "sequence must be a positive safe integer");
  return value;
}

function normalizeTimestamp(value) {
  assertCondition(typeof value === "string", "timestamp must be a string");

  const normalized = value.trim();
  assertCondition(normalized.length > 0, "timestamp must be a non-empty string");

  const parsed = new Date(normalized);
  assertCondition(!Number.isNaN(parsed.getTime()), "timestamp must be a valid Date");

  return parsed.toISOString();
}

function normalizeMemoryCapsule(value) {
  assertCondition(value !== undefined, "memoryCapsule is required");

  const capsule = createMemoryCapsule(value);
  validateMemoryCapsule(capsule);

  return capsule;
}

function createContextLedgerRecord(input) {
  assertCondition(isPlainObject(input), "context ledger record must be a plain object");
  assertNoUnknownFields(input, RECORD_FIELDS, "context ledger record");

  assertCondition(input.version === 1, "context ledger record version must be 1");

  const ledgerId = normalizeId(input.ledgerId, "ledgerId");
  const sequence = normalizeSequence(input.sequence);
  const recordId = normalizeId(input.recordId, "recordId");
  const timestamp = normalizeTimestamp(input.timestamp);
  const memoryCapsule = normalizeMemoryCapsule(input.memoryCapsule);

  return {
    version: 1,
    ledgerId,
    sequence,
    recordId,
    timestamp,
    seam: cloneValue(memoryCapsule.seam),
    phase: memoryCapsule.phase,
    commit: cloneValue(memoryCapsule.commit),
    files: cloneValue(memoryCapsule.files),
    evidence: cloneValue(memoryCapsule.evidence),
    summary: cloneValue(memoryCapsule.summary),
    memoryCapsule: cloneValue(memoryCapsule)
  };
}

function validateContextLedgerRecord(input) {
  createContextLedgerRecord(input);
  return true;
}

function normalizeContextLedger(input) {
  assertCondition(isPlainObject(input), "context ledger must be a plain object");
  assertNoUnknownFields(input, LEDGER_FIELDS, "context ledger");

  assertCondition(input.version === 1, "context ledger version must be 1");

  const ledgerId = normalizeId(input.ledgerId, "ledgerId");

  assertCondition(Array.isArray(input.records), "records must be an array");

  const seenRecordIds = new Set();
  const records = input.records.map((recordInput, index) => {
    const record = createContextLedgerRecord(recordInput);

    assertCondition(
      record.ledgerId === ledgerId,
      `records[${index}].ledgerId must match ledgerId`
    );

    assertCondition(
      record.sequence === index + 1,
      `records[${index}].sequence must equal ${index + 1}`
    );

    assertCondition(
      !seenRecordIds.has(record.recordId),
      `records[${index}].recordId must be unique`
    );

    seenRecordIds.add(record.recordId);

    return record;
  });

  return {
    version: 1,
    ledgerId,
    records: records.map(record => cloneValue(record))
  };
}

function validateContextLedger(input) {
  normalizeContextLedger(input);
  return true;
}

function appendContextLedgerRecord(ledger, recordInput) {
  const normalizedLedger = normalizeContextLedger(ledger);
  const record = createContextLedgerRecord(recordInput);

  assertCondition(
    record.ledgerId === normalizedLedger.ledgerId,
    "record ledgerId must match ledger ledgerId"
  );

  assertCondition(
    record.sequence === normalizedLedger.records.length + 1,
    `record sequence must equal ${normalizedLedger.records.length + 1}`
  );

  assertCondition(
    !normalizedLedger.records.some(existingRecord => existingRecord.recordId === record.recordId),
    "recordId must be unique"
  );

  return {
    version: 1,
    ledgerId: normalizedLedger.ledgerId,
    records: normalizedLedger.records
      .map(existingRecord => cloneValue(existingRecord))
      .concat([cloneValue(record)])
  };
}

module.exports = {
  createContextLedgerRecord,
  validateContextLedgerRecord,
  appendContextLedgerRecord,
  validateContextLedger
};
