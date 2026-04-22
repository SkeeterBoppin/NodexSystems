const { runFromEvolutionText, runPythonCode } = require("../execution/pythonSandbox");
const { normalizeResult } = require("./commandTool");

async function run(input = {}) {
  const code = typeof input === "string" ? input : input.code || input.text || input.prompt || "";

  if (!code.trim()) {
    return normalizeResult("error", "", "code tool requires input.code, input.text, or input.prompt.");
  }

  const result = code.includes("```")
    ? runFromEvolutionText(code)
    : runPythonCode(code);

  return normalizeResult(result.status, result.output, result.error, {
    durationMs: result.durationMs,
    command: result.command || null,
    evaluation: result.evaluation || null
  });
}

module.exports = {
  name: "code",
  run
};
