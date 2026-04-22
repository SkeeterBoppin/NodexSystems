const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const PATHS = {
  runs: path.join(ROOT, "Learning", "runs"),
  state: path.join(ROOT, "Learning", "state"),
  history: path.join(ROOT, "Learning", "history"),
  output: path.join(ROOT, "CONTEXT_SNAPSHOT.json")
};

function safeReadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    return null;
  }
}

function getLatestFile(dir) {
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(dir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) return null;

  return path.join(dir, files[0].name);
}

function summarizeExecution(run) {
  if (!run) return null;

  return {
    run_id: run.run_id || null,
    success: run?.evaluation?.success ?? null,
    correctness: run?.evaluation?.correctness ?? null,
    performance_ms: run?.metrics?.execution_time_ms ?? null,
    error: run?.error ?? null
  };
}

function getRecentFailures(historyDir, limit = 5) {
  if (!fs.existsSync(historyDir)) return [];

  const files = fs.readdirSync(historyDir).slice(-limit);

  return files.map(file => {
    const data = safeReadJSON(path.join(historyDir, file));
    if (!data) return null;

    return {
      type: data.failure_type || null,
      summary: data.result_summary || null
    };
  }).filter(Boolean);
}

function getActiveFiles() {
  function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!["node_modules", "Learning", ".git"].includes(file)) {
          walk(fullPath, fileList);
        }
      } else {
        if (file.endsWith(".js") || file.endsWith(".py")) {
          fileList.push(path.relative(ROOT, fullPath));
        }
      }
    });

    return fileList;
  }

  return walk(ROOT).slice(0, 25);
}

function buildSnapshot() {
  const latestRunFile = getLatestFile(PATHS.runs);
  const latestStateFile = getLatestFile(PATHS.state);

  const runData = safeReadJSON(latestRunFile);
  const stateData = safeReadJSON(latestStateFile);

  return {
    system_state: {
      current_goal: stateData?.goal || null,
      last_run_id: runData?.run_id || null,
      status: stateData?.success === true ? "idle" : "running"
    },
    last_execution: summarizeExecution(runData),
    recent_failures: getRecentFailures(PATHS.history),
    active_files: getActiveFiles(),
    timestamp: new Date().toISOString()
  };
}

function runContextExport() {
  const snapshot = buildSnapshot();

  fs.writeFileSync(
    PATHS.output,
    JSON.stringify(snapshot, null, 2)
  );

  const codexContext = `
SYSTEM CONTEXT:
${JSON.stringify(snapshot, null, 2)}

INSTRUCTIONS:
- Use this as the current system state
- Do not assume missing data
- Modify existing code only
`;

  fs.writeFileSync(
    path.join(ROOT, "CODEX_CONTEXT.txt"),
    codexContext
  );

  fs.writeFileSync(
    path.join(ROOT, "Learning", "live_snapshot.json"),
    JSON.stringify(snapshot, null, 2)
  );

  console.log("✅ Context updated");
}

module.exports = {
  runContextExport
};