const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LEARNING_DIR = "Learning";
const SNAPSHOT_FILE = "CONTEXT_SNAPSHOT.json";

const SNAPSHOT_AUTHORITY = Object.freeze({
  activeAuthority: false,
  scope: "diagnostic_only",
  instructionAuthority: false,
  generatedContextArtifact: true,
  note: "This file is evidence for inspection only. It must not be treated as active instructions."
});

function getPaths(rootDir = ROOT) {
  return {
    root: rootDir,
    runs: path.join(rootDir, LEARNING_DIR, "runs"),
    state: path.join(rootDir, LEARNING_DIR, "state"),
    history: path.join(rootDir, LEARNING_DIR, "history"),
    output: path.join(rootDir, SNAPSHOT_FILE)
  };
}

function safeReadJSON(filePath) {
  if (!filePath) return null;

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function listFilesByModifiedTime(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .map(name => {
      const fullPath = path.join(dir, name);
      const stat = fs.statSync(fullPath);

      return {
        name,
        path: fullPath,
        isFile: stat.isFile(),
        time: stat.mtime.getTime()
      };
    })
    .filter(file => file.isFile)
    .sort((a, b) => {
      if (b.time !== a.time) return b.time - a.time;
      return a.name.localeCompare(b.name);
    });
}

function getLatestFile(dir) {
  const files = listFilesByModifiedTime(dir);
  return files.length > 0 ? files[0].path : null;
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeBooleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

function normalizeFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getTaskState(stateData, runData) {
  if (stateData && typeof stateData === "object" && !Array.isArray(stateData)) {
    return stateData;
  }

  if (runData && runData.task_state && typeof runData.task_state === "object" && !Array.isArray(runData.task_state)) {
    return runData.task_state;
  }

  return {};
}

function summarizeExecution(run) {
  if (!run) return null;

  const evaluation = run.evaluation_summary && typeof run.evaluation_summary === "object"
    ? run.evaluation_summary
    : (run.evaluation && typeof run.evaluation === "object" ? run.evaluation : null);

  const evaluationSuccess = normalizeBooleanOrNull(evaluation ? evaluation.success : null);
  const success = evaluationSuccess !== null ? evaluationSuccess : normalizeBooleanOrNull(run.success);

  const performanceMs = normalizeFiniteNumber(
    evaluation && evaluation.performance_ms !== undefined
      ? evaluation.performance_ms
      : (run.duration_ms !== undefined
        ? run.duration_ms
        : (run.durationMs !== undefined ? run.durationMs : run?.metrics?.execution_time_ms))
  );

  const error = normalizeOptionalString(
    run.failure_type ||
    (evaluation ? evaluation.error_type : null) ||
    run.error ||
    (success === false ? run.stderr : null)
  );

  return {
    run_id: normalizeOptionalString(run.run_id),
    success,
    correctness: normalizeFiniteNumber(evaluation ? evaluation.correctness : null),
    performance_ms: performanceMs,
    error
  };
}

function getRecentFailures(historyDir, limit = 5) {
  const files = listFilesByModifiedTime(historyDir).slice(0, limit);

  return files.map(file => {
    const data = safeReadJSON(file.path);
    if (!data) return null;

    return {
      type: normalizeOptionalString(data.failure_type),
      summary: normalizeOptionalString(data.result_summary)
    };
  }).filter(Boolean);
}

function getActiveFiles(rootDir = ROOT, limit = 25) {
  function walk(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;

    const entries = fs.readdirSync(dir).sort((a, b) => a.localeCompare(b));

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!["node_modules", LEARNING_DIR, ".git", "Sandbox"].includes(entry)) {
          walk(fullPath, fileList);
        }
      } else if (entry.endsWith(".js") || entry.endsWith(".py")) {
        fileList.push(path.relative(rootDir, fullPath).replace(/\\/g, "/"));
      }
    });

    return fileList;
  }

  return walk(rootDir).slice(0, limit);
}

function buildSnapshot({ rootDir = ROOT } = {}) {
  const paths = getPaths(rootDir);
  const latestRunFile = getLatestFile(paths.runs);
  const latestStateFile = getLatestFile(paths.state);

  const runData = safeReadJSON(latestRunFile);
  const stateData = safeReadJSON(latestStateFile);
  const taskState = getTaskState(stateData, runData);
  const lastExecution = summarizeExecution(runData);
  const recentFailures = getRecentFailures(paths.history);

  const currentGoal = normalizeOptionalString(taskState.goal || runData?.goal);
  const lastRunId = normalizeOptionalString(taskState.run_id || runData?.run_id);

  return {
    version: 1,
    authority: { ...SNAPSHOT_AUTHORITY },
    system_state: {
      current_goal: currentGoal,
      last_run_id: lastRunId,
      status: normalizeBooleanOrNull(taskState.success) === true ? "idle" : "running"
    },
    last_execution: lastExecution,
    recent_failures: recentFailures,
    active_files: getActiveFiles(rootDir),
    timestamp: new Date().toISOString()
  };
}

function runContextExport({ rootDir = ROOT } = {}) {
  const paths = getPaths(rootDir);
  const snapshot = buildSnapshot({ rootDir });

  fs.writeFileSync(paths.output, JSON.stringify(snapshot, null, 2));

  console.log("Context snapshot updated: diagnostic only");
  return snapshot;
}

module.exports = {
  getPaths,
  safeReadJSON,
  getLatestFile,
  summarizeExecution,
  getRecentFailures,
  getActiveFiles,
  buildSnapshot,
  runContextExport
};
