"use strict";

const COMMIT_GATE_REQUIRED_STEPS = Object.freeze([
  "expected_dirty_state_check",
  "syntax_checks",
  "targeted_probe",
  "full_test_harness",
  "unstaged_diff_check",
  "stage_exact_files_only",
  "staged_diff_check",
  "staged_diff_summary",
  "commit",
  "post_commit_clean_tree",
  "post_commit_full_harness",
  "post_harness_clean_tree",
  "external_evidence_record"
]);

const COMMIT_GATE_STATUSES = Object.freeze([
  "pending",
  "passed",
  "failed",
  "blocked"
]);

const COMMIT_GATE_BLOCKING_REASONS = Object.freeze([
  "unexpected_dirty_state",
  "missing_expected_dirty_state",
  "syntax_check_failed",
  "targeted_probe_failed",
  "test_harness_failed",
  "unstaged_diff_check_failed",
  "staged_diff_check_failed",
  "broad_staging_detected",
  "post_commit_dirty_tree",
  "post_harness_dirty_tree",
  "missing_external_evidence",
  "model_output_used_as_proof"
]);

const REQUIRED_RECORD_FIELDS = Object.freeze([
  "gateId",
  "seam",
  "expectedFiles",
  "actualFiles",
  "steps",
  "evidencePath",
  "status"
]);

const REQUIRED_STEP_FIELDS = Object.freeze([
  "step",
  "status",
  "evidence"
]);

const STEP_SET = new Set(COMMIT_GATE_REQUIRED_STEPS);
const STATUS_SET = new Set(COMMIT_GATE_STATUSES);
const BLOCKING_REASON_SET = new Set(COMMIT_GATE_BLOCKING_REASONS);

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

function sortedUniqueStrings(values) {
  return uniqueStrings(values).sort();
}

function sameStringSet(left = [], right = []) {
  const a = sortedUniqueStrings(left);
  const b = sortedUniqueStrings(right);

  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function hasRuntimeMutationIntent(record) {
  return Boolean(
    record.runGit ||
    record.gitExecution ||
    record.autoStage ||
    record.autoCommit ||
    record.autoFix ||
    record.executeCommand ||
    record.modelOutputUsedAsProof
  );
}

function validateCommitGateStep(step = {}) {
  const errors = [];

  if (!isPlainObject(step)) {
    return ["step record must be an object"];
  }

  for (const field of REQUIRED_STEP_FIELDS) {
    if (!(field in step)) {
      errors.push("missing step field: " + field);
    }
  }

  if ("step" in step && !STEP_SET.has(step.step)) {
    errors.push("unknown commit gate step: " + step.step);
  }

  if ("status" in step && !STATUS_SET.has(step.status)) {
    errors.push("unknown commit gate step status: " + step.status);
  }

  if ("evidence" in step && !(isNonEmptyString(step.evidence) || isPlainObject(step.evidence))) {
    errors.push("step evidence must be a non-empty string or object");
  }

  if ("blockingReason" in step && !BLOCKING_REASON_SET.has(step.blockingReason)) {
    errors.push("unknown blockingReason: " + step.blockingReason);
  }

  return errors;
}

function validateCommitGateRecord(record = {}) {
  const errors = [];

  if (!isPlainObject(record)) {
    return {
      valid: false,
      errors: ["record must be an object"]
    };
  }

  for (const field of REQUIRED_RECORD_FIELDS) {
    if (!(field in record)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of ["gateId", "seam", "evidencePath", "status"]) {
    if (field in record && !isNonEmptyString(record[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("status" in record && !STATUS_SET.has(record.status)) {
    errors.push("unknown status: " + record.status);
  }

  if (!Array.isArray(record.expectedFiles) || record.expectedFiles.length === 0) {
    errors.push("expectedFiles must be a non-empty array");
  } else if (!record.expectedFiles.every(isNonEmptyString)) {
    errors.push("expectedFiles must contain only non-empty strings");
  }

  if (!Array.isArray(record.actualFiles) || record.actualFiles.length === 0) {
    errors.push("actualFiles must be a non-empty array");
  } else if (!record.actualFiles.every(isNonEmptyString)) {
    errors.push("actualFiles must contain only non-empty strings");
  }

  if (Array.isArray(record.expectedFiles) && Array.isArray(record.actualFiles) && !sameStringSet(record.expectedFiles, record.actualFiles)) {
    errors.push("actualFiles must exactly match expectedFiles");
  }

  if (!Array.isArray(record.steps)) {
    errors.push("steps must be an array");
  } else {
    const stepNames = [];

    for (const step of record.steps) {
      errors.push(...validateCommitGateStep(step));
      if (isPlainObject(step) && isNonEmptyString(step.step)) {
        stepNames.push(step.step);
      }
    }

    for (const requiredStep of COMMIT_GATE_REQUIRED_STEPS) {
      if (!stepNames.includes(requiredStep)) {
        errors.push("missing required commit gate step: " + requiredStep);
      }
    }
  }

  if (Array.isArray(record.blockingReasons)) {
    for (const reason of record.blockingReasons) {
      if (!BLOCKING_REASON_SET.has(reason)) {
        errors.push("unknown record blockingReason: " + reason);
      }
    }
  }

  if (hasRuntimeMutationIntent(record)) {
    errors.push("CommitGate v1 must not execute git, stage files, commit, auto-fix, or use model output as proof");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createCommitGateRecord(record = {}) {
  const cloned = {
    ...record,
    expectedFiles: sortedUniqueStrings(record.expectedFiles),
    actualFiles: sortedUniqueStrings(record.actualFiles),
    steps: Array.isArray(record.steps)
      ? record.steps.map(step => Object.freeze({ ...step }))
      : [],
    blockingReasons: uniqueStrings(record.blockingReasons)
  };

  const validation = validateCommitGateRecord(cloned);

  if (!validation.valid) {
    throw new Error("Invalid commit gate record: " + validation.errors.join("; "));
  }

  return Object.freeze({
    ...cloned,
    expectedFiles: Object.freeze([...cloned.expectedFiles]),
    actualFiles: Object.freeze([...cloned.actualFiles]),
    steps: Object.freeze([...cloned.steps]),
    blockingReasons: Object.freeze([...cloned.blockingReasons])
  });
}

function evaluateCommitGateRecord(record = {}) {
  const validation = validateCommitGateRecord(record);

  if (!validation.valid) {
    return Object.freeze({
      gateId: isPlainObject(record) ? record.gateId || null : null,
      seam: isPlainObject(record) ? record.seam || null : null,
      eligible: false,
      status: "blocked",
      blockingReasons: Object.freeze(["invalid_commit_gate_record"]),
      errors: Object.freeze([...validation.errors]),
      canRunGit: false,
      canStageFiles: false,
      canCommit: false,
      canAutoFix: false,
      canUseModelOutputAsProof: false
    });
  }

  const created = createCommitGateRecord(record);
  const failedSteps = created.steps.filter(step => step.status !== "passed");
  const blockingReasons = uniqueStrings([
    ...(created.blockingReasons || []),
    ...failedSteps.map(step => step.blockingReason).filter(isNonEmptyString)
  ]);

  const eligible =
    created.status === "passed" &&
    failedSteps.length === 0 &&
    blockingReasons.length === 0 &&
    sameStringSet(created.expectedFiles, created.actualFiles);

  return Object.freeze({
    gateId: created.gateId,
    seam: created.seam,
    eligible,
    status: eligible ? "passed" : "blocked",
    failedSteps: Object.freeze(failedSteps.map(step => step.step)),
    blockingReasons: Object.freeze(blockingReasons),
    errors: Object.freeze([]),
    expectedFiles: Object.freeze([...created.expectedFiles]),
    actualFiles: Object.freeze([...created.actualFiles]),
    canRunGit: false,
    canStageFiles: false,
    canCommit: false,
    canAutoFix: false,
    canUseModelOutputAsProof: false
  });
}

function assertCommitGatePassed(record = {}) {
  const evaluation = evaluateCommitGateRecord(record);

  if (!evaluation.eligible) {
    throw new Error("CommitGate blocked: " + [
      ...evaluation.errors,
      ...evaluation.blockingReasons,
      ...evaluation.failedSteps
    ].join("; "));
  }

  return true;
}

function summarizeCommitGateRecord(record = {}) {
  const evaluation = evaluateCommitGateRecord(record);

  return Object.freeze({
    gateId: evaluation.gateId,
    seam: evaluation.seam,
    eligible: evaluation.eligible,
    status: evaluation.status,
    expectedFileCount: evaluation.expectedFiles ? evaluation.expectedFiles.length : 0,
    actualFileCount: evaluation.actualFiles ? evaluation.actualFiles.length : 0,
    failedStepCount: evaluation.failedSteps ? evaluation.failedSteps.length : 0,
    blockingReasonCount: evaluation.blockingReasons ? evaluation.blockingReasons.length : 0,
    canRunGit: false,
    canStageFiles: false,
    canCommit: false,
    canAutoFix: false,
    canUseModelOutputAsProof: false
  });
}

module.exports = {
  COMMIT_GATE_REQUIRED_STEPS,
  COMMIT_GATE_STATUSES,
  COMMIT_GATE_BLOCKING_REASONS,
  createCommitGateRecord,
  validateCommitGateRecord,
  evaluateCommitGateRecord,
  assertCommitGatePassed,
  summarizeCommitGateRecord
};
