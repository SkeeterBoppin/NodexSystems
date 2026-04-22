const fs = require("fs");
const path = require("path");
const { normalizeResult } = require("./commandTool");

const ROOT_DIR = path.resolve(__dirname, "..");
const ALLOWED_PREFIXES = [
  `Sandbox${path.sep}`,
  `Learning${path.sep}`
];

function resolveWritablePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new Error("write_file requires input.path");
  }

  if (path.isAbsolute(relativePath)) {
    throw new Error("write_file path must be relative to the repo root");
  }

  const normalized = path.normalize(relativePath);
  if (!ALLOWED_PREFIXES.some(prefix => normalized.startsWith(prefix))) {
    throw new Error("write_file path must stay within Sandbox/ or Learning/");
  }

  const resolved = path.resolve(ROOT_DIR, normalized);
  const relative = path.relative(ROOT_DIR, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("write_file path escapes the repo root");
  }

  return resolved;
}

async function run(input = {}) {
  try {
    const filePath = resolveWritablePath(input.path);
    const content = String(input.content || "");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);

    return normalizeResult("success", input.path, "", {
      data: {
        path: input.path,
        bytes: Buffer.byteLength(content)
      }
    });
  } catch (err) {
    return normalizeResult("error", "", err.message);
  }
}

module.exports = {
  name: "write_file",
  run
};
