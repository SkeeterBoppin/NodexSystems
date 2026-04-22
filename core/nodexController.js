const { decideTask } = require("./taskDecider");
const { routeTask } = require("./toolRouter");
const { createTaskState, updateTaskState, finalizeTaskState } = require("./taskState");
const { buildRunRecord, recordRun } = require("./replayStore");
const { evaluateExecution, evaluationScore } = require("./evaluation");

async function runNodex(userInput, options = {}) {
  const goal = typeof userInput === "string" ? userInput : JSON.stringify(userInput || "");
  let taskState = createTaskState({
    goal,
    currentStep: "deciding",
    input: { prompt: goal },
    selectedTool: "none",
    strategyId: "routed_task"
  });

  let decision = null;
  let result = null;
  let evaluation = null;

  try {
    decision = await decideTask(userInput, options);

    taskState = updateTaskState(taskState, {
      current_step: "routing",
      input: decision.input || { prompt: goal },
      selected_tool: decision.tool || "none",
      strategy_id: decision.decision_source || "routed_task"
    });

    result = await routeTask(decision, options);

    const selectedTool = (result && result.selected_tool) || (decision && decision.tool) || "none";

    evaluation = result.evaluation || evaluateExecution({
      status: result.status,
      output: result.output,
      error: result.error,
      durationMs: result.durationMs,
      errorClass: result.status === "success" ? "none" : "tool_failure",
      expectJson: selectedTool === "execute_python"
    });

    const success = result.status === "success" && evaluation.success !== false;

    taskState = updateTaskState(taskState, {
      selected_tool: selectedTool
    });

    taskState = finalizeTaskState(taskState, {
      output: result.output || "",
      success,
      evaluationScore: evaluationScore(evaluation),
      failureType: success ? null : (evaluation.error_type || "tool_failure"),
      currentStep: success ? "complete" : "failed"
    });
  } catch (err) {
    result = {
      status: "error",
      output: "",
      error: err.message,
      durationMs: 0,
      command: null
    };

    evaluation = evaluateExecution({
      status: "error",
      output: "",
      error: err.message,
      durationMs: 0,
      errorClass: "tool_failure",
      expectJson: false
    });

    taskState = finalizeTaskState(taskState, {
      output: "",
      success: false,
      evaluationScore: evaluationScore(evaluation),
      failureType: evaluation.error_type || "tool_failure",
      currentStep: "failed"
    });
  }

  const selectedTool = (result && result.selected_tool) || (decision && decision.tool) || "none";

  taskState = updateTaskState(taskState, {
    selected_tool: selectedTool
  });

  recordRun(buildRunRecord({
    taskState,
    goal,
    input: {
      user_input: goal,
      normalized_input: (decision && decision.input) || { prompt: goal },
      decision_source: decision && decision.decision_source ? decision.decision_source : "unknown"
    },
    generatedCode: selectedTool === "execute_python"
      ? ((decision && decision.input && (decision.input.code || decision.input.text || decision.input.prompt || "")) || "")
      : "",
    strategyId: taskState.strategy_id || "routed_task",
    executionCommand: result && result.command ? result.command : null,
    stdout: result && result.output ? result.output : "",
    stderr: result && result.error ? result.error : "",
    durationMs: result && result.durationMs ? result.durationMs : 0,
    selectedTools: [selectedTool],
    evaluation,
    variance: decision && decision.decision_source === "llm"
      ? { deterministic: false, sources: ["llm_decision"] }
      : { deterministic: true, sources: [] }
  }));

  return {
    status: result.status,
    tool: decision && decision.tool ? decision.tool : selectedTool,
    output: result.output,
    error: result.error
  };
}

module.exports = {
  runNodex
};
