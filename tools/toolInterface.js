const VALID_STATUSES = new Set(["pending", "running", "complete", "failed"]);

function normalizeToolStatus(status) {
  if (status === "success" || status === "complete") return "complete";
  if (status === "running") return "running";
  if (status === "pending") return "pending";
  return "failed";
}

function createToolState({
  name,
  inputs = {},
  outputs = {},
  status = "pending",
  error = null
}) {
  const normalizedStatus = normalizeToolStatus(status);

  return {
    name,
    inputs,
    outputs,
    status: VALID_STATUSES.has(normalizedStatus) ? normalizedStatus : "failed",
    error: error || null
  };
}

function createToolDefinition({
  key,
  aliases = [],
  tool,
  inputs = {},
  outputs = {}
}) {
  return {
    key,
    aliases,
    tool,
    schema: {
      name: key,
      inputs,
      outputs,
      status: "pending",
      error: null
    }
  };
}

function toToolState(definition, inputs, rawResult = {}) {
  return createToolState({
    name: definition.schema.name,
    inputs,
    outputs: {
      output: rawResult.output || "",
      error: rawResult.error || "",
      command: rawResult.command || null,
      duration_ms: Number(rawResult.durationMs || 0),
      evaluation: rawResult.evaluation || null,
      data: rawResult.data || null
    },
    status: rawResult.status || "failed",
    error: rawResult.error || null
  });
}

function projectLegacyResult(toolState) {
  return {
    status: toolState.status === "complete" ? "success" : toolState.status === "running" ? "running" : "error",
    output: toolState.outputs.output || "",
    error: toolState.error || "",
    tool_state: toolState,
    evaluation: toolState.outputs.evaluation || null,
    durationMs: Number(toolState.outputs.duration_ms || 0),
    command: toolState.outputs.command || null
  };
}

module.exports = {
  VALID_STATUSES,
  normalizeToolStatus,
  createToolState,
  createToolDefinition,
  toToolState,
  projectLegacyResult
};
