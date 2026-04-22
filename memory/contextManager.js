const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTEXT_FILE = path.join(ROOT_DIR, "CONTEXT.md");
const MAX_ITEMS = 60;

function extractLines(text) {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith("* "))
    .map(line => line.slice(2));
}

function dedupe(lines) {
  const seen = new Map();

  lines.forEach((line, index) => {
    seen.set(line, index);
  });

  return Array.from(seen.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([line]) => line);
}

function isContradiction(a, b) {
  const first = a.toLowerCase();
  const second = b.toLowerCase();

  return (
    (first.includes("increase") && second.includes("reduce")) ||
    (first.includes("strict") && second.includes("flexible")) ||
    (first.includes("centralized") && second.includes("decentralized")) ||
    (first.includes("allow") && second.includes("block")) ||
    (first.includes("enable") && second.includes("disable"))
  );
}

function resolveContradictions(lines) {
  const result = [];
  const removed = [];

  for (let i = 0; i < lines.length; i++) {
    let keep = true;

    for (let j = i + 1; j < lines.length; j++) {
      if (isContradiction(lines[i], lines[j])) {
        removed.push(lines[i]);
        keep = false;
        break;
      }
    }

    if (keep) {
      result.push(lines[i]);
    }
  }

  return { cleaned: result, removed };
}

function trim(lines) {
  if (lines.length <= MAX_ITEMS) return lines;
  return lines.slice(-MAX_ITEMS);
}

function rebuild(originalText, cleanedLines) {
  const headerMatch = originalText.match(/^[\s\S]*?(?=\n\* )/);
  const header = headerMatch ? headerMatch[0].trim() : "## PREFERENCES";

  return header + "\n\n" + cleanedLines.map(line => "* " + line).join("\n") + "\n";
}

function processContext(raw) {
  let lines = extractLines(raw);
  lines = [...new Set(lines)];
  lines = dedupe(lines);

  const { cleaned, removed } = resolveContradictions(lines);
  const finalLines = trim(cleaned);
  const output = rebuild(raw, finalLines);

  return { output, finalLines, removed };
}

function runContextProcessor({ contextFile = CONTEXT_FILE } = {}) {
  const raw = fs.readFileSync(contextFile, "utf-8");
  const { output, finalLines, removed } = processContext(raw);

  fs.writeFileSync(contextFile, output);

  if (removed.length > 0) {
    fs.writeFileSync(
      path.join(path.dirname(contextFile), "context_audit.log"),
      removed.map(line => "REMOVED: " + line).join("\n"),
      { flag: "a" }
    );
  }

  console.log("Context processed");
  console.log("Final count:", finalLines.length);
  console.log("Removed contradictions:", removed.length);

  return { finalCount: finalLines.length, removedCount: removed.length };
}

module.exports = {
  extractLines,
  dedupe,
  isContradiction,
  resolveContradictions,
  trim,
  rebuild,
  processContext,
  runContextProcessor
};
