const fs = require("fs");
const path = require("path");
const { normalizeResult } = require("./commandTool");

const ROOT_DIR = path.resolve(__dirname, "..");

function resolveRepoPath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new Error("read_file requires input.path");
  }

  if (path.isAbsolute(relativePath)) {
    throw new Error("read_file path must be relative to the repo root");
  }

  const resolved = path.resolve(ROOT_DIR, relativePath);
  const relative = path.relative(ROOT_DIR, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("read_file path escapes the repo root");
  }

  return resolved;
}

async function run(input = {}) {
  try {
    const filePath = resolveRepoPath(input.path);
    const content = fs.readFileSync(filePath, "utf-8");
    return normalizeResult("success", content, "", {
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
  name: "read_file",
  run
};
