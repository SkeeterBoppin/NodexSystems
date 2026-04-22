const { createRegistry } = require("../tools/registry");
const { createToolState, toToolState, projectLegacyResult } = require("../tools/toolInterface");

function normalizeToolName(tool, registry = createRegistry()) {
  if (!tool) return null;
  return registry.normalizeName(tool) || tool;
}

async function routeTask(decision, { registry = createRegistry() } = {}) {
  const input = (decision && decision.input) || {};
  const requestedTool = decision && decision.tool;
  const toolName = normalizeToolName(requestedTool, registry);

  if (!toolName || !registry.has(toolName)) {
    const failureState = createToolState({
      name: toolName || requestedTool || "unknown",
      inputs: input,
      status: "failed",
      error: `Unknown tool: ${requestedTool || "none"}`
    });
    return projectLegacyResult(failureState);
  }

  const definition = registry.getDefinition(toolName);

  try {
    const rawResult = await definition.tool.run(input);
    const toolState = toToolState(definition, input, rawResult);
    return {
      ...projectLegacyResult(toolState),
      selected_tool: definition.key
    };
  } catch (err) {
    const failureState = createToolState({
      name: definition.key,
      inputs: input,
      status: "failed",
      error: err.message
    });
    return {
      ...projectLegacyResult(failureState),
      selected_tool: definition.key
    };
  }
}

module.exports = {
  normalizeToolName,
  routeTask
};
