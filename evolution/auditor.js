const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

function audit(text) {
  const issues = [];
  const codeStart = text.indexOf("import json");

  if (codeStart === -1) {
    issues.push("No executable Python code detected");
    return issues;
  }

  const code = text.slice(codeStart);

  if (!code.includes("def main")) {
    issues.push("Missing main function");
  }

  if (!code.includes("print(json.dumps")) {
    issues.push("Missing JSON output");
  }

  return issues;
}

function runAuditFile({
  inputFile = path.join(ROOT_DIR, "evolution.txt"),
  outputFile = path.join(ROOT_DIR, "audit.txt"),
  log = console.log
} = {}) {
  const input = fs.readFileSync(inputFile, "utf-8");
  const issues = audit(input);

  if (issues.length === 0) {
    log("Audit passed - no major issues detected");
  } else {
    log("AUDIT RESULTS:");
    issues.forEach(issue => log("- " + issue));
  }

  fs.writeFileSync(outputFile, issues.join("\n"));
  return issues;
}

module.exports = {
  audit,
  runAuditFile
};
