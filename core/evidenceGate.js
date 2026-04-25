const SUPPORTED_EVIDENCE_KINDS = new Set(["inspection", "syntax", "targeted_command", "runtime", "test"]);
const SUPPORTED_EVIDENCE_RESULTS = new Set(["pass", "fail", "info"]);
const SEAM_ID_PATTERN = /^[a-z0-9_]+$/;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (isRecord(value)) {
    const clone = {};

    Object.keys(value).forEach(key => {
      clone[key] = cloneValue(value[key]);
    });

    return clone;
  }

  return value;
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNonEmptyString(value, label) {
  assertCondition(typeof value === "string", `${label} must be a string`);
  assertCondition(value.trim().length > 0, `${label} must be a non-empty string`);
}

function normalizeRepoFilePath(pathValue, label) {
  assertCondition(typeof pathValue === "string", `${label} must be a string`);

  let normalized = pathValue.trim();
  assertCondition(normalized.length > 0, `${label} must not be empty`);

  normalized = normalized.replace(/\\/g, "/");
  const hadUncPrefix = normalized.startsWith("//");

  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  normalized = normalized.replace(/\/+/g, "/");

  assertCondition(normalized.length > 0, `${label} must not be empty`);
  assertCondition(!hadUncPrefix, `${label} must be repo-relative`);
  assertCondition(!/^[A-Za-z]:/.test(normalized), `${label} must be repo-relative`);
  assertCondition(!normalized.startsWith("/"), `${label} must be repo-relative`);
  assertCondition(!normalized.endsWith("/"), `${label} must be a file path`);

  normalized.split("/").forEach(segment => {
    assertCondition(segment.length > 0, `${label} contains an empty path segment`);
    assertCondition(segment !== "..", `${label} must not contain ".."`);
  });

  return normalized;
}

function normalizeFileList(files, label) {
  assertCondition(Array.isArray(files), `${label} must be an array`);
  assertCondition(files.length > 0, `${label} must be a non-empty array`);

  const seen = new Set();

  return files.map((pathValue, index) => {
    const normalizedPath = normalizeRepoFilePath(pathValue, `${label}[${index}]`);
    assertCondition(!seen.has(normalizedPath), `${label} contains a duplicate path: ${normalizedPath}`);
    seen.add(normalizedPath);
    return normalizedPath;
  });
}

function normalizeEvidenceList(evidence, label, claimedFiles) {
  assertCondition(Array.isArray(evidence), `${label} must be an array`);
  assertCondition(evidence.length > 0, `${label} must be a non-empty array`);

  return evidence.map((entry, index) => {
    const entryLabel = `${label}[${index}]`;
    assertCondition(isRecord(entry), `${entryLabel} must be an object`);

    const normalizedEntry = cloneValue(entry);

    assertCondition(typeof normalizedEntry.kind === "string", `${entryLabel}.kind must be a string`);
    assertCondition(SUPPORTED_EVIDENCE_KINDS.has(normalizedEntry.kind), `${entryLabel}.kind is not supported`);

    assertNonEmptyString(normalizedEntry.subject, `${entryLabel}.subject`);
    normalizedEntry.subject = normalizeRepoFilePath(normalizedEntry.subject, `${entryLabel}.subject`);
    assertCondition(claimedFiles.has(normalizedEntry.subject), `${entryLabel}.subject must reference a claimed file`);

    assertCondition(typeof normalizedEntry.result === "string", `${entryLabel}.result must be a string`);
    assertCondition(SUPPORTED_EVIDENCE_RESULTS.has(normalizedEntry.result), `${entryLabel}.result is not supported`);
    assertNonEmptyString(normalizedEntry.summary, `${entryLabel}.summary`);

    if (normalizedEntry.label !== undefined) {
      assertNonEmptyString(normalizedEntry.label, `${entryLabel}.label`);
    }

    if (normalizedEntry.data !== undefined) {
      assertCondition(isRecord(normalizedEntry.data), `${entryLabel}.data must be an object`);
    }

    return normalizedEntry;
  });
}

function normalizeEvidenceGateRecord(input) {
  assertCondition(isRecord(input), "evidence gate record must be an object");
  assertCondition(input.version === 1, "version must be 1");
  assertNonEmptyString(input.seamId, "seamId");
  assertCondition(SEAM_ID_PATTERN.test(input.seamId), "seamId must match /^[a-z0-9_]+$/");

  const clonedRecord = cloneValue(input);
  const files = normalizeFileList(clonedRecord.files, "files");

  return {
    ...clonedRecord,
    files,
    evidence: normalizeEvidenceList(clonedRecord.evidence, "evidence", new Set(files))
  };
}

function createEvidenceGateRecord(input) {
  return normalizeEvidenceGateRecord(input);
}

function validateEvidenceGateRecord(input) {
  normalizeEvidenceGateRecord(input);
  return true;
}

module.exports = {
  createEvidenceGateRecord,
  validateEvidenceGateRecord
};
