const { spawn } = require("child_process");
const { evaluateExecution } = require("../core/evaluation");

const DEFAULT_TOOL_TIMEOUT_MS = Number(process.env.NODEX_TOOL_TIMEOUT_MS || 120000);

function normalizeResult(status, output = "", error = "", extras = {}) {
  return {
    status: status === "success" ? "success" : status === "running" ? "running" : "error",
    output: output || "",
    error: error || "",
    ...extras
  };
}

function parseCommand(command) {
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return parts.map(part => part.replace(/^"|"$/g, ""));
}

function createCommandTool({ name, envVar }) {
  return {
    name,
    async run(input = {}) {
      const command = process.env[envVar];

      if (!command) {
        return normalizeResult("error", "", `${name} tool is not configured. Set ${envVar}.`);
      }

      const [bin, ...args] = parseCommand(command);
      const timeoutMs = DEFAULT_TOOL_TIMEOUT_MS;

      if (!bin) {
        return normalizeResult("error", "", `${envVar} is empty or invalid.`);
      }

      const commandInfo = {
        bin,
        args,
        shell: false,
        timeout_ms: timeoutMs
      };

      return new Promise(resolve => {
        const startedAt = Date.now();
        const child = spawn(bin, args, {
          stdio: ["pipe", "pipe", "pipe"],
          shell: false,
          windowsHide: true
        });

        let stdout = "";
        let stderr = "";
        let finished = false;
        let timedOut = false;

        const finish = (status, output, error) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          const durationMs = Date.now() - startedAt;
          const evaluation = evaluateExecution({
            status,
            output,
            error,
            durationMs,
            errorClass: timedOut ? "tool_timeout" : status === "success" ? "none" : "tool_failure",
            expectJson: false
          });

          resolve(normalizeResult(status, output, error, {
            durationMs,
            command: commandInfo,
            stdout,
            stderr,
            evaluation
          }));
        };

        const timer = setTimeout(() => {
          timedOut = true;
          child.kill();
        }, timeoutMs);

        child.stdout.on("data", chunk => {
          stdout += chunk.toString();
        });

        child.stderr.on("data", chunk => {
          stderr += chunk.toString();
        });

        child.on("error", err => {
          finish("error", stdout.trim(), err.message);
        });

        child.on("close", code => {
          if (timedOut) {
            finish("error", stdout.trim(), `${name} command timed out after ${timeoutMs}ms`);
            return;
          }

          if (code === 0) {
            finish("success", stdout.trim(), "");
            return;
          }

          finish("error", stdout.trim(), stderr.trim() || `${name} command exited with code ${code}`);
        });

        child.stdin.write(JSON.stringify(input));
        child.stdin.end();
      });
    }
  };
}

module.exports = {
  DEFAULT_TOOL_TIMEOUT_MS,
  createCommandTool,
  normalizeResult,
  parseCommand
};
