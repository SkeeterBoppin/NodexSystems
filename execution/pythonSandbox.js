const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { evaluateExecution } = require("../core/evaluation");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_SANDBOX_ROOT = path.resolve(ROOT_DIR, "Sandbox");
const DEFAULT_TIMEOUT_MS = Number(process.env.NODEX_EXECUTION_TIMEOUT_MS || 5000);
const SAFETY_TIMEOUT_MS = Number(process.env.NODEX_SAFETY_TIMEOUT_MS || 3000);

function ensureSandboxRoot(sandboxRoot = DEFAULT_SANDBOX_ROOT) {
  const resolvedRoot = path.resolve(sandboxRoot);
  fs.mkdirSync(resolvedRoot, { recursive: true });
  return fs.realpathSync(resolvedRoot);
}

function isContainedByRoot(targetPath, rootPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative === "" || (
    relative &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
}

function nearestExistingParent(targetPath) {
  let current = path.resolve(targetPath);

  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }

  return current;
}

function isSafePath(targetPath, sandboxRoot = DEFAULT_SANDBOX_ROOT) {
  if (typeof targetPath !== "string" || targetPath.trim() === "") {
    return false;
  }

  const root = ensureSandboxRoot(sandboxRoot);
  const resolvedTarget = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(root, targetPath);

  if (!isContainedByRoot(resolvedTarget, root)) {
    return false;
  }

  if (fs.existsSync(resolvedTarget)) {
    return isContainedByRoot(fs.realpathSync(resolvedTarget), root);
  }

  const existingParent = nearestExistingParent(path.dirname(resolvedTarget));
  if (!existingParent) {
    return false;
  }

  return isContainedByRoot(fs.realpathSync(existingParent), root);
}

function resolveSandboxPath(targetPath, sandboxRoot = DEFAULT_SANDBOX_ROOT) {
  if (!isSafePath(targetPath, sandboxRoot)) {
    throw new Error(`Unsafe sandbox path rejected: ${targetPath}`);
  }

  const root = ensureSandboxRoot(sandboxRoot);
  return path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(root, targetPath);
}

function writeSandboxFile(targetPath, value, sandboxRoot = DEFAULT_SANDBOX_ROOT) {
  const safePath = resolveSandboxPath(targetPath, sandboxRoot);
  fs.mkdirSync(path.dirname(safePath), { recursive: true });
  fs.writeFileSync(safePath, value);
  return safePath;
}

function readSandboxFile(targetPath, sandboxRoot = DEFAULT_SANDBOX_ROOT) {
  return fs.readFileSync(resolveSandboxPath(targetPath, sandboxRoot), "utf-8");
}

function extractCode(text) {
  if (text.includes("```")) {
    const matches = [...text.matchAll(/```python([\s\S]*?)```/g)];
    return matches.map(match => match[1].trim());
  }

  return [text.trim()];
}

function combineCodeBlocks(text) {
  const codeBlocks = extractCode(text).filter(Boolean);
  return codeBlocks.join("\n\n");
}

function createAstValidatorScript() {
  return `
import ast
import json
import sys

ALLOWED_MODULES = {
    "json", "math", "statistics", "collections", "itertools",
    "functools", "operator", "re", "datetime", "decimal", "fractions"
}
BLOCKED_MODULES = {
    "os", "sys", "subprocess", "shutil", "socket", "pathlib", "io",
    "ctypes", "multiprocessing", "threading", "asyncio", "http", "https",
    "urllib", "requests", "ssl", "platform", "builtins", "importlib",
    "pkgutil", "inspect", "site", "runpy", "types"
}
BLOCKED_CALLS = {
    "__import__", "eval", "exec", "compile", "input", "breakpoint",
    "globals", "locals", "vars", "dir", "getattr", "setattr", "delattr"
}
BLOCKED_NAMES = {
    "process", "global", "child_process", "require"
}
BLOCKED_ATTRIBUTES = {
    "system", "popen", "spawn", "fork", "exec", "execv", "execve",
    "remove", "unlink", "rmdir", "rmtree", "chmod", "chown"
}
ALLOWED_DUNDER_NAMES = {"__name__"}

def reject(reason, detail):
    print(json.dumps({"safe": False, "reason": reason, "detail": detail}))
    raise SystemExit(0)

def module_root(name):
    return (name or "").split(".")[0]

source = sys.stdin.read()

try:
    tree = ast.parse(source, filename="combined.py")
except SyntaxError as exc:
    reject("PythonSyntaxError", str(exc))

for node in ast.walk(tree):
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "__import__":
        reject("DynamicImportBlocked", "__import__")

for node in ast.walk(tree):
    if isinstance(node, ast.Import):
        for alias in node.names:
            root = module_root(alias.name)
            if root in BLOCKED_MODULES:
                reject("ForbiddenModule", root)
            if root not in ALLOWED_MODULES:
                reject("ModuleNotAllowed", root)

    if isinstance(node, ast.ImportFrom):
        if node.level != 0:
            reject("RelativeImportBlocked", str(node.level))
        root = module_root(node.module)
        if root in BLOCKED_MODULES:
            reject("ForbiddenModule", root)
        if root not in ALLOWED_MODULES:
            reject("ModuleNotAllowed", root)

    if isinstance(node, ast.Call):
        func = node.func
        if isinstance(func, ast.Name):
            if func.id in BLOCKED_CALLS:
                reason = "DynamicImportBlocked" if func.id == "__import__" else "RuntimeEscapeBlocked"
                reject(reason, func.id)
            if func.id in BLOCKED_NAMES:
                reject("NodeEscapeBlocked", func.id)
        if isinstance(func, ast.Attribute):
            if func.attr.startswith("__"):
                reject("DunderAttributeBlocked", func.attr)
            if func.attr in BLOCKED_ATTRIBUTES:
                reject("DangerousAttributeBlocked", func.attr)

    if isinstance(node, ast.Name):
        if node.id in BLOCKED_NAMES:
            reject("NodeEscapeBlocked", node.id)
        if node.id.startswith("__") and node.id not in ALLOWED_DUNDER_NAMES:
            reject("DunderNameBlocked", node.id)

    if isinstance(node, ast.Attribute):
        if node.attr.startswith("__"):
            reject("DunderAttributeBlocked", node.attr)

print(json.dumps({"safe": True, "reason": "OK", "detail": ""}))
`.trim();
}

function runAstSafetyCheck(code, {
  pythonCommand = process.env.NODEX_PYTHON_COMMAND || "python",
  timeout = SAFETY_TIMEOUT_MS
} = {}) {
  const result = spawnSync(pythonCommand, ["-I", "-c", createAstValidatorScript()], {
    input: code,
    encoding: "utf-8",
    env: {},
    timeout,
    windowsHide: true
  });

  if (result.error) {
    return {
      safe: false,
      reason: result.error.code === "ETIMEDOUT" ? "SafetyValidationTimeout" : "SafetyValidationFailed",
      detail: result.error.message
    };
  }

  try {
    return JSON.parse((result.stdout || "").trim());
  } catch {
    return {
      safe: false,
      reason: "SafetyValidationFailed",
      detail: result.stderr || result.stdout || "AST validator produced no parseable result"
    };
  }
}

function checkSafety(code, options = {}) {
  return runAstSafetyCheck(code, options);
}

function validatePythonCommand(pythonCommand) {
  if (typeof pythonCommand !== "string" || !pythonCommand.trim()) {
    throw new Error("Invalid python command");
  }

  return pythonCommand.trim();
}

function buildPythonCommand(pythonCommand, runnerPath, sandboxRoot, timeout) {
  return {
    bin: validatePythonCommand(pythonCommand),
    args: ["-I", runnerPath],
    cwd: ensureSandboxRoot(sandboxRoot),
    timeout_ms: Number(timeout || DEFAULT_TIMEOUT_MS),
    shell: false
  };
}

function createPythonRunner() {
  return `
import builtins
import contextlib
import io
import json
import os
import sys
import traceback

ALLOWED_MODULES = {
    "json", "math", "statistics", "collections", "itertools",
    "functools", "operator", "re", "datetime", "decimal", "fractions"
}
NULLIFIED_MODULES = {
    "os", "pathlib", "subprocess", "shutil", "socket", "ctypes"
}
BLOCKED_BUILTINS = {
    "eval", "exec", "compile", "input", "breakpoint",
    "globals", "locals", "vars", "dir", "getattr", "setattr", "delattr"
}

SANDBOX_ROOT = os.path.realpath(os.getcwd())
ORIGINAL_OPEN = builtins.open
ORIGINAL_IMPORT = builtins.__import__

def ensure_text(value):
    if value is None:
        return ""
    return value if isinstance(value, str) else str(value)

def is_safe_path(target_path):
    if not isinstance(target_path, (str, bytes, os.PathLike)):
        raise PermissionError("Unsafe sandbox path rejected: non-path value")
    candidate = os.fspath(target_path)
    if candidate == "":
        raise PermissionError("Unsafe sandbox path rejected: empty path")
    resolved = os.path.realpath(candidate if os.path.isabs(candidate) else os.path.join(SANDBOX_ROOT, candidate))
    try:
        return os.path.commonpath([SANDBOX_ROOT, resolved]) == SANDBOX_ROOT
    except ValueError:
        return False

def resolve_safe_path(target_path):
    candidate = os.fspath(target_path)
    resolved = os.path.realpath(candidate if os.path.isabs(candidate) else os.path.join(SANDBOX_ROOT, candidate))
    if not is_safe_path(resolved):
        raise PermissionError("Unsafe sandbox path rejected: " + ensure_text(target_path))
    return resolved

def restricted_open(file, mode="r", *args, **kwargs):
    safe_path = resolve_safe_path(file)
    if any(flag in mode for flag in ("w", "a", "x", "+")):
        os.makedirs(os.path.dirname(safe_path), exist_ok=True)
    return ORIGINAL_OPEN(safe_path, mode, *args, **kwargs)

def restricted_import(name, globals=None, locals=None, fromlist=(), level=0):
    if level != 0:
        raise ImportError("Relative imports are blocked")
    root = ensure_text(name).split(".")[0]
    if root not in ALLOWED_MODULES:
        raise ImportError("Module is blocked: " + root)
    return ORIGINAL_IMPORT(name, globals, locals, fromlist, level)

def blocked_builtin(*args, **kwargs):
    raise RuntimeError("RuntimeEscapeBlocked")

def build_safe_builtins():
    safe = dict(builtins.__dict__)
    safe["open"] = restricted_open
    safe["__import__"] = restricted_import
    for name in BLOCKED_BUILTINS:
        safe[name] = blocked_builtin
    return safe

for module_name in NULLIFIED_MODULES:
    sys.modules[module_name] = None

def execute_user_code():
    user_code_path = os.path.join(SANDBOX_ROOT, "combined.py")
    with ORIGINAL_OPEN(user_code_path, "r", encoding="utf-8") as handle:
        source = handle.read()

    compiled = compile(source, user_code_path, "exec")
    safe_builtins = build_safe_builtins()
    globals_dict = {
        "__name__": "__main__",
        "__builtins__": safe_builtins
    }

    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()
    exit_code = 0

    with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
        try:
            exec(compiled, globals_dict, globals_dict)
        except SystemExit as exc:
            code = exc.code
            if code not in (None, 0):
                exit_code = code if isinstance(code, int) else 1
                if code and not isinstance(code, int):
                    print(ensure_text(code), file=sys.stderr)
        except Exception:
            exit_code = 1
            traceback.print_exc()

    stdout_text = stdout_buffer.getvalue()
    stderr_text = stderr_buffer.getvalue()

    if exit_code == 0 and not stdout_text.strip():
        if stderr_text and not stderr_text.endswith("\\n"):
            stderr_text += "\\n"
        stderr_text += "MissingOutput: generated code produced no stdout\\n"
        exit_code = 1

    sys.stdout.write(stdout_text)
    sys.stderr.write(stderr_text)
    raise SystemExit(exit_code)

if __name__ == "__main__":
    execute_user_code()
`.trim();
}

function classifySandboxError(error = "") {
  const text = String(error || "");
  if (!text.trim()) return "none";
  if (/ExecutionTimeout|ETIMEDOUT|timed out/i.test(text)) return "execution_timeout";
  if (/ForbiddenModule|ModuleNotAllowed|ImportError/i.test(text)) return "import_blocked";
  if (/DynamicImportBlocked|__import__/i.test(text)) return "dynamic_import_blocked";
  if (/PermissionError|Unsafe sandbox path|outside Sandbox/i.test(text)) return "filesystem_blocked";
  if (/PythonSyntaxError|SyntaxError/i.test(text)) return "python_syntax_error";
  if (/Traceback/i.test(text)) return "runtime_exception";
  if (/MissingOutput/i.test(text)) return "runtime_error";
  return "runtime_error";
}

function writeExecutionResult({
  status,
  output = "",
  error = "",
  durationMs = 0,
  timedOut = false,
  errorClass,
  command = null,
  expectJsonOutput = false
}, sandboxRoot) {
  const resolvedErrorClass = errorClass || classifySandboxError(error);
  const evaluation = evaluateExecution({
    status: status === "success" ? "success" : "error",
    output,
    error,
    durationMs,
    errorClass: resolvedErrorClass,
    expectJson: Boolean(expectJsonOutput)
  });

  const meta = {
    status: status === "success" ? "success" : "error",
    durationMs,
    outputBytes: Buffer.byteLength(String(output || "")),
    errorBytes: Buffer.byteLength(String(error || "")),
    errorClass: resolvedErrorClass,
    timedOut,
    timestamp: new Date().toISOString(),
    command,
    evaluation
  };

  writeSandboxFile("execution.txt", output, sandboxRoot);
  writeSandboxFile("execution_summary.txt", error, sandboxRoot);
  writeSandboxFile("execution_meta.json", JSON.stringify(meta, null, 2), sandboxRoot);

  return {
    status: meta.status,
    output,
    error,
    durationMs,
    errorClass: resolvedErrorClass,
    timedOut,
    command,
    evaluation
  };
}

function runPythonCode(code, {
  sandboxRoot = DEFAULT_SANDBOX_ROOT,
  pythonCommand = process.env.NODEX_PYTHON_COMMAND || "python",
  timeout = DEFAULT_TIMEOUT_MS,
  expectJsonOutput = false,
  log = console.log
} = {}) {
  const startedAt = Date.now();
  ensureSandboxRoot(sandboxRoot);

  let validatedPythonCommand = "";
  try {
    validatedPythonCommand = validatePythonCommand(pythonCommand);
  } catch (err) {
    return writeExecutionResult({
      status: "error",
      output: "",
      error: err.message,
      durationMs: Date.now() - startedAt,
      timedOut: false,
      errorClass: "tool_failure",
      command: null,
      expectJsonOutput
    }, sandboxRoot);
  }

  const safety = checkSafety(code, { pythonCommand: validatedPythonCommand });
  if (!safety.safe) {
    return writeExecutionResult({
      status: "error",
      output: "",
      error: safety.reason,
      durationMs: Date.now() - startedAt,
      timedOut: safety.reason === "SafetyValidationTimeout",
      errorClass: safety.reason,
      command: null,
      expectJsonOutput
    }, sandboxRoot);
  }

  writeSandboxFile("combined.py", code, sandboxRoot);
  writeSandboxFile("runner.py", createPythonRunner(), sandboxRoot);

  log("\n--- Running Sandbox/combined.py ---");

  const runnerPath = resolveSandboxPath("runner.py", sandboxRoot);
  const commandInfo = buildPythonCommand(validatedPythonCommand, runnerPath, sandboxRoot, timeout);
  const executionStartedAt = Date.now();
  const result = spawnSync(commandInfo.bin, commandInfo.args, {
    cwd: commandInfo.cwd,
    encoding: "utf-8",
    env: {},
    timeout,
    windowsHide: true
  });
  const durationMs = Date.now() - executionStartedAt;

  if (result.error) {
    const timedOut = result.error.code === "ETIMEDOUT";
    const error = timedOut
      ? `ExecutionTimeout: exceeded ${timeout}ms`
      : result.error.message;

    log("\n--- EXECUTION ERROR ---");
    log(error);

    return writeExecutionResult({
      status: "error",
      output: result.stdout || "",
      error,
      durationMs,
      timedOut,
      errorClass: classifySandboxError(error),
      command: commandInfo,
      expectJsonOutput
    }, sandboxRoot);
  }

  const output = String(result.stdout || "");
  let error = String(result.stderr || "");

  if (result.status !== 0 && !error.trim()) {
    error = `ExecutionFailed: process exited with code ${result.status}`;
  }

  if (result.status === 0 && !output.trim()) {
    error = error.trim()
      ? `${error.trim()}\nMissingOutput: generated code produced no stdout`
      : "MissingOutput: generated code produced no stdout";
  }

  log("\n--- EXECUTION OUTPUT ---");
  log(output);

  log("\n--- EXECUTION ERROR ---");
  log(error);

  const status = result.status === 0 && output.trim() && !error.trim() ? "success" : "error";

  return writeExecutionResult({
    status,
    output,
    error,
    durationMs,
    timedOut: false,
    errorClass: classifySandboxError(error),
    command: commandInfo,
    expectJsonOutput
  }, sandboxRoot);
}

function runFromEvolutionText(text, options = {}) {
  const combinedCode = combineCodeBlocks(text);

  if (!combinedCode.trim()) {
    return writeExecutionResult({
      status: "error",
      output: "",
      error: "No executable code found",
      durationMs: 0,
      errorClass: "audit_failed",
      command: null,
      expectJsonOutput: true
    }, options.sandboxRoot || DEFAULT_SANDBOX_ROOT);
  }

  return runPythonCode(combinedCode, {
    ...options,
    expectJsonOutput: true
  });
}

function runFromEvolutionFile({
  evolutionFile = path.join(ROOT_DIR, "evolution.txt"),
  ...options
} = {}) {
  const evolution = fs.readFileSync(evolutionFile, "utf-8");
  return runFromEvolutionText(evolution, options);
}

module.exports = {
  ROOT_DIR,
  DEFAULT_SANDBOX_ROOT,
  DEFAULT_TIMEOUT_MS,
  SAFETY_TIMEOUT_MS,
  ensureSandboxRoot,
  isContainedByRoot,
  nearestExistingParent,
  isSafePath,
  resolveSandboxPath,
  writeSandboxFile,
  readSandboxFile,
  extractCode,
  combineCodeBlocks,
  createAstValidatorScript,
  runAstSafetyCheck,
  checkSafety,
  validatePythonCommand,
  buildPythonCommand,
  createPythonRunner,
  classifySandboxError,
  writeExecutionResult,
  runPythonCode,
  runFromEvolutionText,
  runFromEvolutionFile
};
