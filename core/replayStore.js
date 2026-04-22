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
  loadRunRecord
};
