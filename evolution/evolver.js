const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { readText, appendText, writeText, readMemoryText, ROOT_DIR } = require("../memory/memoryStore");
const { generate } = require("../llm/ollamaClient");
const { buildEvolutionPrompt } = require("./promptBuilder");
const { cleanEvolutionOutput, validateEvolution } = require("./validators");
const { scoreEvolution, scoreExecutionOutput } = require("./scorer");
const { runAuditFile } = require("./auditor");
const { runFromEvolutionFile, readSandboxFile } = require("../execution/pythonSandbox");
const { runContextProcessor } = require("../memory/contextManager");
const { buildRunRecord, recordRun } = require("../core/replayStore");
const { evaluateExecution, evaluationScore } = require("../core/evaluation");
const {
  DEFAULT_PARALLEL_ATTEMPTS,
  buildExecutionMetrics,
  buildStrategyCandidates,
  calculateAdaptiveExploration,
  calculateAttemptWeight,
  calculatePublishConfidence,
  loadLearningState,
  recordAttempt,
  summarizeCodeShape
} = require("./learning");

function readExecutionArtifact(fileName, sandboxRoot) {
  try {
    return readSandboxFile(fileName, sandboxRoot);
  } catch {
    return "";
  }
}

function candidateRoot(attempt) {
  const dir = path.join(os.tmpdir(), "nodex-evolution-candidates", `attempt-${attempt}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function candidatePaths(attempt, candidate) {
  const root = candidateRoot(attempt);
  const candidateDir = path.join(root, `candidate-${candidate}`);
  const sandboxRoot = path.join(candidateDir, "workspace");
  fs.mkdirSync(sandboxRoot, { recursive: true });

  return {
    candidateDir,
    sandboxRoot,
    evolutionFile: path.join(candidateDir, "evolution.txt"),
    auditFile: path.join(candidateDir, "audit.txt")
  };
}

async function getEvolution({
  audit,
  executionSummary = "",
  score = 0,
  pastFailures = "",
  successMemory = "",
  learningState = {},
  strategyCandidate = {},
  attempt = 1
}) {
  const rules = readMemoryText("SYSTEM_RULES.md", readMemoryText("SYSTEM_RULES.MD", ""));
  const currentState = "";
  const failures = "[]";

  const prompt = buildEvolutionPrompt({
    rules,
    currentState,
    failures,
    audit,
    score,
    executionSummary,
    pastFailures,
    successMemory,
    learningState,
    strategyCandidate,
    attempt
  });

  return generate({ prompt, apiKey: "", retries: 3 });
}

function rememberAttempt(attemptRecord, currentLearningState) {
  try {
    return recordAttempt(attemptRecord);
  } catch (err) {
    console.log("Learning record skipped:", err.message);
    return currentLearningState;
  }
}

async function generateCandidates({
  attempt,
  audit,
  executionSummary,
  score,
  pastFailures,
  successMemory,
  learningState,
  parallelAttempts
}) {
  const strategies = buildStrategyCandidates(learningState, parallelAttempts);

  return Promise.all(strategies.map(async (strategyCandidate, index) => {
    const candidateNumber = index + 1;
    const candidateStrategy = {
      ...strategyCandidate,
      candidate: candidateNumber,
      totalCandidates: strategies.length
    };

    try {
      const raw = await getEvolution({
        audit,
        executionSummary,
        score,
        pastFailures,
        successMemory,
        learningState,
        strategyCandidate: candidateStrategy,
        attempt
      });

      return {
        attempt,
        candidate: candidateNumber,
        strategy: candidateStrategy.name,
        strategyCandidate: candidateStrategy,
        raw,
        generationError: ""
      };
    } catch (err) {
      return {
        attempt,
        candidate: candidateNumber,
        strategy: candidateStrategy.name,
        strategyCandidate: candidateStrategy,
        raw: "",
        generationError: err.message || "generation failed"
      };
    }
  }));
}

function buildCandidateRecord(candidate, overrides = {}) {
  const record = {
    attempt: candidate.attempt,
    candidate: candidate.candidate,
    strategy: candidate.strategy,
    strategyCandidate: candidate.strategyCandidate,
    evolution: candidate.evolution || "",
    codeShape: summarizeCodeShape(candidate.evolution || ""),
    ...overrides
  };

  record.weight = Number(record.weight || calculateAttemptWeight(record));
  return record;
}

function evaluateCandidate(candidate, { successThreshold, publishThreshold }) {
  if (candidate.generationError) {
    return buildCandidateRecord(candidate, {
      phase: "generation",
      status: "error",
      score: 0,
      failureReason: "generation_failed",
      publishThreshold,
      metrics: buildExecutionMetrics({
        executionResult: {
          status: "error",
          output: "",
          error: candidate.generationError
        }
      })
    });
  }

  const evolution = cleanEvolutionOutput(candidate.raw);
  candidate.evolution = evolution;

  const validation = validateEvolution(evolution);
  if (!validation.valid) {
    return buildCandidateRecord(candidate, {
      phase: "validation",
      status: "error",
      validation,
      score: 0,
      successThreshold,
      publishThreshold,
      failureReason: `validation_${validation.reason.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
    });
  }

  let score = scoreEvolution(evolution);
  const paths = candidatePaths(candidate.attempt, candidate.candidate);
  fs.writeFileSync(paths.evolutionFile, evolution);

  const auditIssues = runAuditFile({
    inputFile: paths.evolutionFile,
    outputFile: paths.auditFile,
    log: () => {}
  });
  const auditResults = fs.existsSync(paths.auditFile) ? fs.readFileSync(paths.auditFile, "utf-8") : "";

  if (auditIssues.length > 0 || auditResults.trim().length > 0) {
    return buildCandidateRecord(candidate, {
      phase: "audit",
      status: "error",
      auditResults,
      score,
      successThreshold,
      publishThreshold,
      failureReason: "audit_failed"
    });
  }

  let executionResult = { status: "error", output: "", error: "Execution did not run" };
  try {
    executionResult = runFromEvolutionFile({
      evolutionFile: paths.evolutionFile,
      sandboxRoot: paths.sandboxRoot,
      timeout: 5000,
      log: () => {}
    });
  } catch (err) {
    executionResult = { status: "error", output: "", error: err.message };
  }

  const executionSummary = readExecutionArtifact("execution_summary.txt", paths.sandboxRoot);
  const executionOutput = readExecutionArtifact("execution.txt", paths.sandboxRoot);
  const metrics = buildExecutionMetrics({
    executionResult,
    executionOutput,
    executionSummary
  });
  const evaluation = executionResult.evaluation || evaluateExecution({
    status: executionResult.status || "error",
    output: executionOutput || executionResult.output || "",
    error: executionSummary || executionResult.error || "",
    durationMs: executionResult.durationMs || metrics.durationMs,
    errorClass: metrics.errorClass,
    expectJson: true
  });

  score = scoreExecutionOutput(score, executionOutput, executionSummary, executionResult);

  const cleanExecution = executionSummary.trim().length === 0 && metrics.errorClass === "none";
  const meetsPublishThreshold = Number(score || 0) >= Number(publishThreshold || successThreshold || 0);
  const selectedStatus = cleanExecution && meetsPublishThreshold ? "success" : cleanExecution ? "hold" : "error";
  const phase = selectedStatus === "success" ? "candidate_success" : cleanExecution ? "candidate_hold" : "execution";
  const failureReason = selectedStatus === "success" ? "success" : cleanExecution ? "score_below_publish_threshold" : metrics.errorClass;

  const taskState = {
    task_id: `task_${randomUUID()}`,
    run_id: `run_${randomUUID()}`,
    goal: `evolution_attempt_${candidate.attempt}_candidate_${candidate.candidate}`,
    selected_tool: "execute_python",
    success: selectedStatus === "success",
    evaluation_score: evaluationScore(evaluation),
    failure_type: selectedStatus === "success" ? null : failureReason
  };

  const replay = recordRun(buildRunRecord({
    taskState,
    goal: taskState.goal,
    input: {
      attempt: candidate.attempt,
      candidate: candidate.candidate,
      strategy: candidate.strategy,
      phase
    },
    generatedCode: evolution,
    strategyId: candidate.strategy || "evolution_candidate",
    executionCommand: executionResult.command || null,
    stdout: executionOutput || executionResult.output || "",
    stderr: executionSummary || executionResult.error || "",
    durationMs: metrics.durationMs,
    selectedTools: ["execute_python"],
    evaluation
  }));

  return buildCandidateRecord(candidate, {
    phase,
    status: selectedStatus,
    metrics,
    score,
    successThreshold,
    publishThreshold,
    publishable: selectedStatus === "success",
    failureReason,
    evaluation,
    replay
  });
}

function statusRank(status = "error") {
  if (status === "success") return 2;
  if (status === "hold") return 1;
  return 0;
}

function phaseRank(phase = "generation") {
  if (phase === "candidate_success") return 5;
  if (phase === "candidate_hold") return 4;
  if (phase === "execution") return 3;
  if (phase === "audit") return 2;
  if (phase === "validation") return 1;
  return 0;
}

function normalizeEvolutionSignature(evolution = "") {
  return String(evolution || "").replace(/\r\n/g, "\n").trim();
}

function selectBestCandidate(records = []) {
  return records
    .slice()
    .sort((a, b) =>
      statusRank(b.status) - statusRank(a.status) ||
      phaseRank(b.phase) - phaseRank(a.phase) ||
      Number(b.score || 0) - Number(a.score || 0) ||
      Number(b.weight || 0) - Number(a.weight || 0) ||
      Number(a.candidate || 0) - Number(b.candidate || 0)
    )[0] || null;
}

function publishBestCandidate(best, { publishThreshold } = {}) {
  if (!best || !best.evolution || best.status !== "success") return false;
  if (Number(best.score || 0) < Number(publishThreshold || 0)) return false;

  writeText("evolution.txt", best.evolution);
  runAuditFile();
  try {
    runFromEvolutionFile({ timeout: 5000 });
  } catch {}
  return true;
}

async function runEvolution({ maxAttempts = 999, successThreshold = 25, parallelAttempts = DEFAULT_PARALLEL_ATTEMPTS } = {}) {
  console.log("EVOLVE SCRIPT STARTED");

  readText("CONTEXT.md", "");

  try {
    let attempts = 0;
    let evolution = "";
    let auditResults = "";
    let executionSummary = "";
    let pastFailures = "";
    let successMemory = "";
    let learningState = loadLearningState();
    let score = 0;
    let publishedEvolution = "";
    let consecutiveQualifiedRuns = 0;
    let lastQualifiedEvolutionSignature = "";
    const REQUIRED_CONSECUTIVE_SUCCESSES = 3;

    while (true) {
      score = 0;

      if (attempts >= maxAttempts) {
        console.log("Max attempts reached - stopping");
        break;
      }

      attempts++;
      const adaptiveExploration = calculateAdaptiveExploration(learningState, parallelAttempts);
      const publishConfidence = calculatePublishConfidence(learningState, successThreshold);
      const activeParallelAttempts = adaptiveExploration.target_parallel_attempts;
      console.log(`\n--- Attempt ${attempts} | candidates: ${activeParallelAttempts} | publish>=${publishConfidence.threshold} | ${adaptiveExploration.reason} ---`);

      const audit = readText("audit.txt", "");
      executionSummary = readExecutionArtifact("execution_summary.txt");

      const generatedCandidates = await generateCandidates({
        attempt: attempts,
        audit: auditResults || audit,
        executionSummary,
        score,
        pastFailures,
        successMemory,
        learningState: {
          ...learningState,
          adaptive_exploration: adaptiveExploration,
          publish_confidence: publishConfidence
        },
        parallelAttempts: activeParallelAttempts
      });

      const evaluatedCandidates = generatedCandidates.map(candidate =>
        evaluateCandidate(candidate, {
          successThreshold,
          publishThreshold: publishConfidence.threshold
        })
      );

      for (const record of evaluatedCandidates) {
        learningState = rememberAttempt(record, learningState);
      }

      const best = selectBestCandidate(evaluatedCandidates);
      if (!best) {
        console.log("No candidates produced");
        continue;
      }

      console.log(
        `Selected candidate ${best.candidate} (${best.strategy}) score=${best.score} weight=${best.weight} status=${best.status} failureReason=${best.failureReason || ""} phase=${best.phase || ""} validationReason=${best.validation && best.validation.reason ? best.validation.reason : ""} errorClass=${best.metrics && best.metrics.errorClass ? best.metrics.errorClass : ""} threshold=${publishConfidence.threshold}`
      );
      evolution = best.evolution || evolution;
      score = best.score || 0;
      pastFailures = best.status === "success" ? "" : best.failureReason || pastFailures;
      successMemory = best.status === "success" ? best.evolution || successMemory : successMemory;

      const publishEligible =
        best.status === "success" &&
        Number(best.score || 0) >= Number(publishConfidence.threshold || 0);
      const qualifiedEvolutionSignature = publishEligible
        ? normalizeEvolutionSignature(best.evolution || "")
        : "";

      const artifactMatched =
        publishEligible &&
        !!lastQualifiedEvolutionSignature &&
        qualifiedEvolutionSignature === lastQualifiedEvolutionSignature;

      if (publishEligible) {
        if (artifactMatched) {
          consecutiveQualifiedRuns += 1;
        } else {
          consecutiveQualifiedRuns = 1;
          lastQualifiedEvolutionSignature = qualifiedEvolutionSignature;
        }
      } else {
        consecutiveQualifiedRuns = 0;
        lastQualifiedEvolutionSignature = "";
      }

      if (best.status === "success") {
        console.log(
          `Reliability gate: publishEligible=${publishEligible} artifactMatched=${artifactMatched} streak=${consecutiveQualifiedRuns}/${REQUIRED_CONSECUTIVE_SUCCESSES}`
        );

        if (publishEligible && consecutiveQualifiedRuns >= REQUIRED_CONSECUTIVE_SUCCESSES) {
          const published = publishBestCandidate(best, { publishThreshold: publishConfidence.threshold });
          if (published) {
            publishedEvolution = best.evolution || "";
            console.log("Success - finalizing");
            break;
          }
        } else if (publishEligible) {
          console.log(
            `Qualified run, but reliability gate not yet met (${consecutiveQualifiedRuns}/${REQUIRED_CONSECUTIVE_SUCCESSES}). Previous best preserved.`
          );
        }
      } else if (best.status === "hold") {
        console.log(
          `Candidate held back: score ${best.score} did not clear publish threshold ${publishConfidence.threshold}. Previous best remains active.`
        );
      }
    }

    if (publishedEvolution) {
      console.log("Published evolution captured for return only; CONTEXT.md write disabled.");
    } else {
      console.log("No candidate cleared publish threshold - previous best preserved");
    }

    runContextProcessor();

    console.log("System evolved");
    return { status: "success", output: publishedEvolution || evolution, error: "" };
  } catch (err) {
    console.error(err);
    return { status: "error", output: "", error: err.message };
  }
}

module.exports = {
  DEFAULT_PARALLEL_ATTEMPTS,
  getEvolution,
  runEvolution,
  readExecutionArtifact,
  candidateRoot,
  candidatePaths,
  generateCandidates,
  evaluateCandidate,
  selectBestCandidate,
  publishBestCandidate,
  rememberAttempt,
  statusRank
};
