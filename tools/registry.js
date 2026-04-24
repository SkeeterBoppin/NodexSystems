const imageTool = require("./imageTool");
const videoTool = require("./videoTool");
const audioTool = require("./audioTool");
const ffmpegTool = require("./ffmpegTool");
const mathTool = require("./mathTool");
const geometryTool = require("./geometryTool");
const unitTool = require("./unitTool");
const trigTool = require("./trigTool");
const pythonTool = require("./pythonTool");
const readFileTool = require("./readFileTool");
const writeFileTool = require("./writeFileTool");
const { createToolDefinition } = require("./toolInterface");

function register(definitions) {
  const canonical = new Map();
  const aliases = new Map();

  definitions.forEach(definition => {
    canonical.set(definition.key, definition);
    aliases.set(definition.key, definition.key);
    definition.aliases.forEach(alias => {
      aliases.set(alias, definition.key);
    });
  });

  function normalizeName(name) {
    return aliases.get(name) || null;
  }

  return {
    list() {
      return Array.from(canonical.keys());
    },
    listDefinitions() {
      return Array.from(canonical.values());
    },
    normalizeName,
    getDefinition(name) {
      const canonicalName = normalizeName(name);
      return canonicalName ? canonical.get(canonicalName) : undefined;
    },
    get(name) {
      const definition = this.getDefinition(name);
      return definition ? definition.tool : undefined;
    },
    has(name) {
      return Boolean(this.getDefinition(name));
    }
  };
}

function createRegistry() {
  return register([
    createToolDefinition({
      key: "image",
      tool: imageTool,
      inputs: { prompt: "string" },
      outputs: { output: "string" }
    }),
    createToolDefinition({
      key: "video",
      tool: videoTool,
      inputs: { prompt: "string" },
      outputs: { output: "string" }
    }),
    createToolDefinition({
      key: "audio",
      tool: audioTool,
      inputs: { prompt: "string" },
      outputs: { output: "string" }
    }),
    createToolDefinition({
      key: "ffmpeg",
      tool: ffmpegTool,
      inputs: { prompt: "string" },
      outputs: { output: "string" }
    }),
    createToolDefinition({
      key: "math",
      aliases: ["unit_math", "compute"],
      tool: mathTool,
      inputs: {
        operation: "add|subtract|multiply|divide|power|sqrt|abs|round|constant",
        operands: "number[]",
        value: "number",
        constant: "pi|e",
        decimals: "number"
      },
      outputs: { output: "string", data: "object" }
    }),
    createToolDefinition({
      key: "geometry",
      aliases: ["geo"],
      tool: geometryTool,
      inputs: {
        operation: "circle_area|circle_circumference|rectangle_area|triangle_area|right_triangle_hypotenuse|distance_2d",
        radius: "number",
        width: "number",
        height: "number",
        base: "number",
        a: "number",
        b: "number",
        x1: "number",
        y1: "number",
        x2: "number",
        y2: "number"
      },
      outputs: { output: "string", data: "object" }
    }),
    createToolDefinition({
      key: "unit",
      aliases: ["units", "convert_unit"],
      tool: unitTool,
      inputs: {
        operation: "convert",
        value: "number",
        from: "string",
        to: "string"
      },
      outputs: { output: "string", data: "object" }
    }),
    createToolDefinition({
      key: "trig",
      aliases: ["trigonometry"],
      tool: trigTool,
      inputs: {
        operation: "sin|cos|tan|asin|acos|atan",
        angle: "number",
        angleUnit: "rad|deg",
        value: "number",
        resultUnit: "rad|deg"
      },
      outputs: { output: "string", data: "object" }
    }),
    createToolDefinition({
      key: "execute_python",
      aliases: ["code", "python"],
      tool: pythonTool,
      inputs: { code: "string", text: "string", prompt: "string" },
      outputs: { output: "string", evaluation: "object" }
    }),
    createToolDefinition({
      key: "read_file",
      tool: readFileTool,
      inputs: { path: "string" },
      outputs: { output: "string", data: "object" }
    }),
    createToolDefinition({
      key: "write_file",
      tool: writeFileTool,
      inputs: { path: "string", content: "string" },
      outputs: { output: "string", data: "object" }
    })
  ]);
}

module.exports = {
  createRegistry
};
