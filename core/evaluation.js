function round(value, decimals = 2) {
  const scale = 10 ** decimals;
  return Math.round(Number(value || 0) * scale) / scale;
}

function parseJsonOutput(output = "") {
  const text = String(output || "").trim();
  if (!text) {
    return { valid: false, value: null };
  }

  try {
    return { valid: true, value: JSON.parse(text) };
  } catch {
    const line = text.split(/\r?\n/).find(item => item.trim().startsWith("{"));
    if (!line) {
      return { valid: false, value: null };
    }

    try {
      return { valid: true, value: JSON.parse(line) };
    } catch {
      return { valid: false, value: null };
    }
  }
}

function mapErrorType({ errorClass = "", status = "error", error = "", durationMs = 0 }) {
  const normalized = String(errorClass || "").toLowerCase();
  const text = String(error || "").toLowerCase();

  if (/syntax/.test(normalized) || /syntaxerror/.test(text)) return "syntax";
  if (/timeout/.test(normalized) || Number(durationMs || 0) > 5000) return "performance";
  if (/runtime/.test(normalized) || /traceback/.test(text)) return "runtime";
  if (/tool/.test(normalized)) return "tool_failure";
  if (/import_blocked|dynamic_import_blocked|filesystem_blocked/.test(normalized)) return "tool_failure";
  if (status !== "success" && !text.trim()) return "logic";
  if (text.trim()) return "tool_failure";
  return null;
}

function evaluateExecution({
  status = "error",
  output = "",
  error = "",
  durationMs = 0,
  errorClass = "none",
  expectJson = false
} = {}) {
  const issues = [];
  const parsed = parseJsonOutput(output);
  const trimmedOutput = String(output || "").trim();
  const trimmedError = String(error || "").trim();

  if (!trimmedOutput) issues.push("missing_output");
  if (trimmedError) issues.push("stderr_present");
  if (expectJson && !parsed.valid) issues.push("invalid_json_output");
  if (errorClass && errorClass !== "none") issues.push(errorClass);

  let correctness = 0;
  if (status === "success" && !trimmedError) {
    correctness = expectJson ? (parsed.valid ? 1 : 0.6) : 1;
  } else if (trimmedOutput) {
    correctness = expectJson ? (parsed.valid ? 0.45 : 0.2) : 0.35;
  }

  return {
    success: status === "success" && !trimmedError,
    correctness: round(correctness),
    performance_ms: Number(durationMs || 0),
    issues,
    error_type: mapErrorType({ errorClass, status, error, durationMs })
  };
}

function evaluationScore(evaluation = {}) {
  return Math.round(Number(evaluation.correctness || 0) * 100);
}

module.exports = {
  round,
  parseJsonOutput,
  mapErrorType,
  evaluateExecution,
  evaluationScore
};
