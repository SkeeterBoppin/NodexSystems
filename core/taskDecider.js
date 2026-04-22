const { generate } = require("../llm/ollamaClient");

const VALID_TOOLS = new Set([
  "image",
  "video",
  "audio",
  "ffmpeg",
  "execute_python",
  "read_file",
  "write_file",
  "code",
  "python"
]);

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found");
  }

  return JSON.parse(text.slice(start, end + 1));
}

function normalizeTool(tool) {
  if (tool === "code" || tool === "python") {
    return "execute_python";
  }

  return VALID_TOOLS.has(tool) ? tool : "execute_python";
}

function normalizeDecision(decision, originalInput) {
  const tool = normalizeTool(decision.tool);
  const input = decision.input && typeof decision.input === "object"
    ? decision.input
    : { prompt: originalInput };

  if (!input.prompt && typeof originalInput === "string") {
    input.prompt = originalInput;
  }

  return {
    tool,
    input,
    decision_source: decision.decision_source || "llm"
  };
}

function extractRepoPath(userInput) {
  const text = String(userInput || "");
  const quotedMatch = text.match(/["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  const rootedMatch = text.match(/\b(?:Sandbox|Learning|memory|core|tools|evolution|execution|llm)[\\/][^\s]+/);
  if (rootedMatch) {
    return rootedMatch[0];
  }

  const fileMatch = text.match(/\b[^\s]+\.(?:txt|json|md|js|py)\b/);
  return fileMatch ? fileMatch[0] : null;
}

function fallbackDecision(userInput) {
  const text = String(userInput || "").toLowerCase();
  const inferredPath = extractRepoPath(userInput);

  if (/(read|show|open)\b/.test(text) && inferredPath) {
    return {
      tool: "read_file",
      input: { path: inferredPath, prompt: userInput },
      decision_source: "fallback"
    };
  }

  if (/(write|save|store)\b/.test(text) && inferredPath) {
    return {
      tool: "write_file",
      input: { path: inferredPath, content: "", prompt: userInput },
      decision_source: "fallback"
    };
  }

  if (/(ffmpeg|assemble|combine|render|mux)/.test(text)) {
    return { tool: "ffmpeg", input: { prompt: userInput }, decision_source: "fallback" };
  }

  if (/(video|animation|animated|animatediff)/.test(text)) {
    return { tool: "video", input: { prompt: userInput }, decision_source: "fallback" };
  }

  if (/(audio|voice|speech|tts|narration)/.test(text)) {
    return { tool: "audio", input: { prompt: userInput }, decision_source: "fallback" };
  }

  if (/(image|picture|photo|comfyui|illustration|render)/.test(text)) {
    return { tool: "image", input: { prompt: userInput }, decision_source: "fallback" };
  }

  return { tool: "execute_python", input: { prompt: userInput }, decision_source: "fallback" };
}

function buildDecisionPrompt(userInput) {
  return `Classify this Nodex task into exactly one tool.

Tools:
- image: image generation through local image pipeline
- video: video or animation generation
- audio: speech, sound, voice, or TTS generation
- ffmpeg: final assembly, muxing, rendering, or media combining
- execute_python: Python execution or general code tasks
- read_file: read a local project file by relative path
- write_file: write a local project file within allowed writable areas

Return ONLY JSON with this shape:
{"tool":"image|video|audio|ffmpeg|execute_python|read_file|write_file","input":{"prompt":"original request"}}

Task:
${userInput}`;
}

async function decideTask(userInput, { llmGenerate = generate } = {}) {
  try {
    const response = await llmGenerate({ prompt: buildDecisionPrompt(userInput), retries: 1 });
    const parsed = extractJson(response);
    return normalizeDecision(parsed, userInput);
  } catch {
    return fallbackDecision(userInput);
  }
}

module.exports = {
  VALID_TOOLS,
  extractJson,
  normalizeTool,
  normalizeDecision,
  extractRepoPath,
  fallbackDecision,
  buildDecisionPrompt,
  decideTask
};
