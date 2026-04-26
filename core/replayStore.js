const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const LEARNING_DIR = path.join(ROOT_DIR, "Learning");
const RUNS_DIR = path.join(LEARNING_DIR, "runs");
const STATE_DIR = path.join(LEARNING_DIR, "state");
const HISTORY_DIR = path.join(LEARNING_DIR, "history");

function ensureReplayDirs(rootDir = ROOT_DIR) {
  const learningDir = path.join(rootDir, "Learning");
  const runsDir = path.join(learningDir, "runs");
  const stateDir = path.join(learningDir, "state");
  const historyDir = path.join(learningDir, "history");

  [learningDir, runsDir, stateDir, historyDir].forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
  });

  return {
    learningDir,
    runsDir,
    stateDir,
    historyDir
  };
}

function buildRunRecord({
  taskState,
  goal = "",
  input = {},
  generatedCode = "",
  strategyId = "default",
  executionCommand = null,
  stdout = "",
  stderr = "",
  durationMs = 0,
  timestamp,
  selectedTools = [],
  evaluation = null,
  variance = null
} = {}) {
  const safeState = taskState || {};
  const recordTimestamp = timestamp || safeState.timestamp || new Date().toISOString();

  return {
    task_id: safeState.task_id || null,
    run_id: safeState.run_id || null,
    goal: goal || safeState.goal || "",
    input: input || safeState.input || {},
    generated_code: generatedCode || "",
    strategy_id: strategyId || safeState.strategy_id || "default",
    execution_command: executionCommand,
    stdout: stdout || "",
    stderr: stderr || "",
    duration_ms: Number(durationMs || 0),
    timestamp: recordTimestamp,
    selected_tool: safeState.selected_tool || selectedTools[0] || "none",
    selected_tools: selectedTools.length > 0 ? selectedTools : (safeState.selected_tool ? [safeState.selected_tool] : []),
    evaluation_summary: evaluation,
    success: Boolean(safeState.success),
    failure_type: safeState.failure_type || null,
    retry_count: Number(safeState.retry_count || 0),
    variance: variance || { deterministic: true, sources: [] },
    task_state: safeState
  };
}

function writeRunRecord(record, { rootDir = ROOT_DIR } = {}) {
  const { runsDir } = ensureReplayDirs(rootDir);
  const filePath = path.join(runsDir, `${record.run_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
  return filePath;
}

function writeTaskState(taskState, { rootDir = ROOT_DIR } = {}) {
  const { stateDir, historyDir } = ensureReplayDirs(rootDir);
  const latestPath = path.join(stateDir, "latest.json");
  const taskPath = path.join(stateDir, `${taskState.task_id}.json`);

  fs.writeFileSync(latestPath, JSON.stringify(taskState, null, 2));
  fs.writeFileSync(taskPath, JSON.stringify(taskState, null, 2));

  if (taskState.success === false && taskState.failure_type) {
    const historyPath = path.join(historyDir, `${taskState.run_id}.json`);
    fs.writeFileSync(historyPath, JSON.stringify({
      run_id: taskState.run_id,
      failure_type: taskState.failure_type,
      result_summary: taskState.output || ""
    }, null, 2));
  }

  return { latestPath, taskPath };
}

function recordRun(record, { rootDir = ROOT_DIR } = {}) {
  const runPath = writeRunRecord(record, { rootDir });
  const statePaths = writeTaskState(record.task_state || {}, { rootDir });
  return {
    runPath,
    statePaths
  };
}

function loadRunRecord(runId, { rootDir = ROOT_DIR } = {}) {
  const filePath = path.join(rootDir, "Learning", "runs", `${runId}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}


const REPLAY_RECORD_TYPES = Object.freeze([
  "debug_replay_record",
  "candidate_evidence_record",
  "tool_result_record",
  "agent_output_record",
  "state_transition_record"
]);

const REPLAY_AUTHORITY_STATES = Object.freeze([
  "historical_debug_record",
  "candidate_evidence",
  "validated_evidence_reference"
]);

const REPLAY_BLOCKED_AUTHORITY_STATES = Object.freeze([
  "proof",
  "live_repo_state",
  "permission_grant",
  "runtime_execution_authority"
]);

const REPLAY_FRESHNESS_STATES = Object.freeze([
  "current_run",
  "recent",
  "historical",
  "stale",
  "unknown"
]);

const REPLAY_VALIDATION_STATES = Object.freeze([
  "unvalidated",
  "schema_validated",
  "freshness_validated",
  "evidence_gate_validated",
  "rejected"
]);

const REPLAY_SIDE_EFFECT_LEVELS = Object.freeze([
  "none",
  "metadata_only",
  "filesystem_read",
  "filesystem_write",
  "process_execution",
  "code_execution",
  "bounded_media_operation",
  "unknown"
]);

const REQUIRED_REPLAY_RECORD_FIELDS = Object.freeze([
  "recordId",
  "recordType",
  "createdAt",
  "source",
  "operation",
  "inputs",
  "outputs",
  "sideEffectLevel",
  "validationState",
  "authorityState",
  "freshnessState"
]);

function isReplayPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isReplayNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isReplayIsoTimestamp(value) {
  return isReplayNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function replayCloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function replaySet(values) {
  return new Set(values);
}

const REPLAY_RECORD_TYPE_SET = replaySet(REPLAY_RECORD_TYPES);
const REPLAY_AUTHORITY_STATE_SET = replaySet(REPLAY_AUTHORITY_STATES);
const REPLAY_BLOCKED_AUTHORITY_STATE_SET = replaySet(REPLAY_BLOCKED_AUTHORITY_STATES);
const REPLAY_FRESHNESS_STATE_SET = replaySet(REPLAY_FRESHNESS_STATES);
const REPLAY_VALIDATION_STATE_SET = replaySet(REPLAY_VALIDATION_STATES);
const REPLAY_SIDE_EFFECT_LEVEL_SET = replaySet(REPLAY_SIDE_EFFECT_LEVELS);

function validateReplayRecord(record = {}) {
  const errors = [];

  if (!isReplayPlainObject(record)) {
    return {
      valid: false,
      errors: ["record must be an object"]
    };
  }

  for (const field of REQUIRED_REPLAY_RECORD_FIELDS) {
    if (!(field in record)) {
      errors.push("missing required field: " + field);
    }
  }

  for (const field of [
    "recordId",
    "recordType",
    "createdAt",
    "operation",
    "sideEffectLevel",
    "validationState",
    "authorityState",
    "freshnessState"
  ]) {
    if (field in record && !isReplayNonEmptyString(record[field])) {
      errors.push(field + " must be a non-empty string");
    }
  }

  if ("recordType" in record && !REPLAY_RECORD_TYPE_SET.has(record.recordType)) {
    errors.push("unknown recordType: " + record.recordType);
  }

  if ("createdAt" in record && !isReplayIsoTimestamp(record.createdAt)) {
    errors.push("createdAt must be an ISO timestamp");
  }

  if ("source" in record && !(isReplayNonEmptyString(record.source) || isReplayPlainObject(record.source))) {
    errors.push("source must be a non-empty string or object");
  }

  if ("inputs" in record && !isReplayPlainObject(record.inputs)) {
    errors.push("inputs must be an object");
  }

  if ("outputs" in record && !isReplayPlainObject(record.outputs)) {
    errors.push("outputs must be an object");
  }

  if ("sideEffectLevel" in record && !REPLAY_SIDE_EFFECT_LEVEL_SET.has(record.sideEffectLevel)) {
    errors.push("unknown sideEffectLevel: " + record.sideEffectLevel);
  }

  if ("validationState" in record && !REPLAY_VALIDATION_STATE_SET.has(record.validationState)) {
    errors.push("unknown validationState: " + record.validationState);
  }

  if ("authorityState" in record) {
    if (REPLAY_BLOCKED_AUTHORITY_STATE_SET.has(record.authorityState)) {
      errors.push("blocked authorityState: " + record.authorityState);
    } else if (!REPLAY_AUTHORITY_STATE_SET.has(record.authorityState)) {
      errors.push("unknown authorityState: " + record.authorityState);
    }
  }

  if ("freshnessState" in record && !REPLAY_FRESHNESS_STATE_SET.has(record.freshnessState)) {
    errors.push("unknown freshnessState: " + record.freshnessState);
  }

  if (
    record.authorityState === "validated_evidence_reference" &&
    record.validationState !== "evidence_gate_validated"
  ) {
    errors.push("validated_evidence_reference requires evidence_gate_validated validationState");
  }

  const hasSideEffect = [
    "filesystem_write",
    "process_execution",
    "code_execution",
    "bounded_media_operation"
  ].includes(record.sideEffectLevel);

  if (hasSideEffect && record.autoReplay === true) {
    errors.push("side-effect replay records must not be automatically replayable");
  }

  if (record.replayAutomatically === true) {
    errors.push("replayAutomatically is not allowed");
  }

  if (record.permissionGrant === true) {
    errors.push("replay records must not grant permissions");
  }

  if (record.runtimeExecutionAuthority === true) {
    errors.push("replay records must not carry runtime execution authority");
  }

  if (record.liveRepoState === true) {
    errors.push("replay records must not claim live repo state");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createReplayRecord(record = {}) {
  const cloned = replayCloneJson(record);
  const validation = validateReplayRecord(cloned);

  if (!validation.valid) {
    throw new Error("Invalid replay record: " + validation.errors.join("; "));
  }

  return Object.freeze(cloned);
}

function classifyReplayRecordAuthority(record = {}) {
  const created = createReplayRecord(record);

  return Object.freeze({
    recordId: created.recordId,
    recordType: created.recordType,
    authorityState: created.authorityState,
    freshnessState: created.freshnessState,
    validationState: created.validationState,
    sideEffectLevel: created.sideEffectLevel,
    canServeAsProof: false,
    canRepresentLiveRepoState: false,
    canGrantPermission: false,
    canReplaySideEffectsAutomatically: false,
    canOverrideLiveRepoEvidence: false,
    requiresEvidenceGate: created.authorityState === "candidate_evidence",
    requiresFreshnessValidation: ["historical", "stale", "unknown"].includes(created.freshnessState),
    reason: "Replay records are historical/debug or candidate evidence records; they are not proof or live repo state."
  });
}

function assertReplayRecordNotProof(record = {}) {
  const created = createReplayRecord(record);
  const classification = classifyReplayRecordAuthority(created);

  if (
    classification.canServeAsProof ||
    classification.canRepresentLiveRepoState ||
    classification.canGrantPermission ||
    classification.canReplaySideEffectsAutomatically ||
    classification.canOverrideLiveRepoEvidence
  ) {
    throw new Error("Replay record crossed authority boundary: " + created.recordId);
  }

  return true;
}

function assertReplayRecordFreshForUse(record = {}) {
  const created = createReplayRecord(record);

  if (["stale", "unknown"].includes(created.freshnessState)) {
    throw new Error("Replay record is not fresh enough for use: " + created.freshnessState);
  }

  if (!["freshness_validated", "evidence_gate_validated"].includes(created.validationState)) {
    throw new Error("Replay record requires freshness validation before use: " + created.validationState);
  }

  return true;
}

module.exports = {
ROOT_DIR,
  LEARNING_DIR,
  RUNS_DIR,
  STATE_DIR,
  HISTORY_DIR,
  ensureReplayDirs,
  buildRunRecord,
  writeRunRecord,
  writeTaskState,
  recordRun,
  loadRunRecord,
  REPLAY_RECORD_TYPES,
  REPLAY_AUTHORITY_STATES,
  REPLAY_BLOCKED_AUTHORITY_STATES,
  REPLAY_FRESHNESS_STATES,
  REPLAY_VALIDATION_STATES,
  createReplayRecord,
  validateReplayRecord,
  classifyReplayRecordAuthority,
  assertReplayRecordNotProof,
  assertReplayRecordFreshForUse
};
