"use strict";

const SUPPORTED_EVIDENCE_KINDS = new Set(["inspection", "syntax", "targeted_command", "runtime", "test"]);
const SUPPORTED_EVIDENCE_RESULTS = new Set(["pass", "fail", "info"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPlainObject(value) {
  if (!isRecord(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
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

function cloneCandidate(candidate) {
  return cloneValue(candidate);
}

function normalizeSubject(subject) {
  if (typeof subject !== "string") {
    return null;
  }

  const trimmed = subject.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function adaptTranscriptEvidenceCandidates(input) {
  if (!isRecord(input)) {
    throw new Error("input must be an object");
  }

  if (!Array.isArray(input.candidates)) {
    throw new Error("input.candidates must be an array");
  }

  const evidence = [];
  const excluded = [];

  input.candidates.forEach(candidate => {
    const clonedCandidate = cloneCandidate(candidate);
    const kind = isRecord(candidate) && typeof candidate.kind === "string" ? candidate.kind : null;

    if (kind === "git" || !SUPPORTED_EVIDENCE_KINDS.has(kind)) {
      excluded.push({
        reason: "unsupported_kind",
        candidate: clonedCandidate
      });
      return;
    }

    if (typeof candidate.result !== "string" || !SUPPORTED_EVIDENCE_RESULTS.has(candidate.result)) {
      excluded.push({
        reason: "unsupported_result",
        candidate: clonedCandidate
      });
      return;
    }

    if (!hasNonEmptyString(candidate.summary)) {
      excluded.push({
        reason: "missing_summary",
        candidate: clonedCandidate
      });
      return;
    }

    const subject = normalizeSubject(candidate.subject);

    if (subject === null) {
      excluded.push({
        reason: "missing_subject",
        candidate: clonedCandidate
      });
      return;
    }

    if (candidate.data !== undefined && !isPlainObject(candidate.data)) {
      excluded.push({
        reason: "invalid_data",
        candidate: clonedCandidate
      });
      return;
    }

    if (candidate.label !== undefined && !hasNonEmptyString(candidate.label)) {
      excluded.push({
        reason: "invalid_label",
        candidate: clonedCandidate
      });
      return;
    }

    const entry = {
      kind,
      subject,
      result: candidate.result,
      summary: candidate.summary
    };

    if (candidate.label !== undefined) {
      entry.label = candidate.label;
    }

    if (candidate.data !== undefined) {
      entry.data = cloneValue(candidate.data);
    }

    evidence.push(entry);
  });

  return {
    evidence,
    excluded
  };
}

module.exports = {
  adaptTranscriptEvidenceCandidates
};
