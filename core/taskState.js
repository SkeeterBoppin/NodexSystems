const { randomUUID } = require("crypto");

function createId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

function createTaskState({
  taskId,
  runId,
  goal = "",
  strategyId = "default",
  currentStep = "created",
  input = {},
  output = "",
  selectedTool = "none",
  success = false,
  evaluationScore = 0,
  failureType = null,
  retryCount = 0,
  timestamp
} = {}) {
  return {
    task_id: taskId || createId("task"),
    run_id: runId || createId("run"),
    goal,
    strategy_id: strategyId,
    current_step: currentStep,
    input,
    output,
    selected_tool: selectedTool,
    success: Boolean(success),
    evaluation_score: Number(evaluationScore || 0),
    failure_type: failureType || null,
    retry_count: Number(retryCount || 0),
    timestamp: timestamp || new Date().toISOString()
  };
}

function updateTaskState(state, patch = {}) {
  if (!state || typeof state !== "object") {
    return createTaskState(patch);
  }

  return {
    ...state,
    ...patch,
    task_id: state.task_id,
    run_id: state.run_id,
    timestamp: state.timestamp
  };
}

function finalizeTaskState(state, {
  output = "",
  success = false,
  evaluationScore = 0,
  failureType = null,
  currentStep
} = {}) {
  return updateTaskState(state, {
    current_step: currentStep || (success ? "complete" : "failed"),
    output,
    success: Boolean(success),
    evaluation_score: Number(evaluationScore || 0),
    failure_type: failureType || null
  });
}

module.exports = {
  createId,
  createTaskState,
  updateTaskState,
  finalizeTaskState
};
