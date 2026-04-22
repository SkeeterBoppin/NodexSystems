const { formatLearningForPrompt } = require("./learning");

function formatSuccessGuidance(learningState = {}) {
  const guidance = learningState.success_guidance || [];
  if (guidance.length === 0) {
    return "- No successful strategy memory yet; use baseline pipeline, valid JSON, and bounded execution.";
  }

  return guidance.map(item => `- ${item}`).join("\n");
}

function formatFailureConstraints(learningState = {}) {
  const constraints = learningState.guidance || [];
  if (constraints.length === 0) {
    return "- No recent failure constraints beyond system rules.";
  }

  return constraints.map(item => `- ${item}`).join("\n");
}

function formatTopAttemptExamples(learningState = {}) {
  const topAttempts = (learningState.top_attempts || []).slice(0, 2);
  if (topAttempts.length === 0) {
    return "No top attempts available yet.";
  }

  return topAttempts.map((attempt, index) => (
    `EXAMPLE ${index + 1} | score=${attempt.score} | weight=${attempt.weight} | strategy=${attempt.strategy || "unknown"}\nSTRUCTURE TO REUSE: ${JSON.stringify(attempt.structures || attempt.codeShape || {})}\nCODE:\n${attempt.code}`
  )).join("\n\n");
}

function formatStrategySelection(learningState = {}) {
  const selected = learningState.selected_strategy || {};
  const directives = selected.directives || [];

  return JSON.stringify({
    mode: selected.mode || "baseline_exploration",
    reason: selected.reason || "no_prior_strategy_signal",
    directives
  }, null, 2);
}

function formatStrategyCandidate(strategyCandidate = {}) {
  if (!strategyCandidate.name) {
    return "No candidate strategy supplied; use selected strategy mode.";
  }

  return JSON.stringify({
    name: strategyCandidate.name,
    purpose: strategyCandidate.purpose || "",
    directives: strategyCandidate.directives || [],
    candidate: strategyCandidate.candidate,
    totalCandidates: strategyCandidate.totalCandidates
  }, null, 2);
}

function formatStructuralPatterns(learningState = {}) {
  const patterns = learningState.structural_patterns || {};
  return JSON.stringify({
    pipeline_patterns: patterns.pipeline_patterns || [],
    transformation_strategies: patterns.transformation_strategies || [],
    algorithm_choices: patterns.algorithm_choices || []
  }, null, 2);
}

function formatPatternComposition(learningState = {}) {
  return JSON.stringify(learningState.pattern_composition || { compositions: [] }, null, 2);
}

function formatAdaptiveExploration(learningState = {}) {
  return JSON.stringify(learningState.adaptive_exploration || {}, null, 2);
}

function formatPublishConfidence(learningState = {}) {
  return JSON.stringify(learningState.publish_confidence || {}, null, 2);
}

function buildEvolutionPrompt({
  rules,
  currentState,
  failures,
  audit,
  score,
  executionSummary,
  pastFailures,
  successMemory,
  learningState = {},
  strategyCandidate = {},
  attempt
}) {
return `
STRICT OUTPUT CONTRACT (HIGHEST PRIORITY — MUST FOLLOW)

Your output MUST begin EXACTLY with this line:
import json

You MUST output ONLY valid Python code.

Your code MUST include ALL of the following functions exactly:

import json

def input_stage():
    records = [{"value": n, "group": "even" if n % 2 == 0 else "odd"} for n in range(1, 7)]
    return {"records": records}

def transformation_stage(data):
    transformed = [item["value"] * 2 for item in data["records"] if item["group"] == "even"]
    return {"items": transformed}

def analysis_stage(data):
    total = sum(data["items"])
    count = len(data["items"])
    if count > 0:
        return {"total": total, "count": count, "average": total / count}
    return {"total": 0, "count": 0, "average": 0}

def output_stage(data):
    output = {
        "status": "success",
        "result": data
    }
    print(json.dumps(output))

def main():
    data = input_stage()
    data = transformation_stage(data)
    data = analysis_stage(data)
    output_stage(data)

if __name__ == "__main__":
    main()

MANDATORY RULES:
- You MUST define ALL five functions exactly as named above
- You MUST NOT rename them
- You MUST NOT skip any stage
- You MUST NOT change execution order
- You MUST NOT use trivial hardcoded lists such as [1, 2, 3] or [1, 2, 3, 4] as the main dataset
- input_stage() MUST create deterministic structured data using range(), records, or derived values instead of a static simple list literal
- You MUST NOT print anything except inside output_stage
- You MUST output EXACTLY one print(json.dumps(output))
- You MUST NOT output ANY text before "import json"
- You MUST NOT output ANY text after the code

If ANY rule is violated -> output is rejected

-------------------------

You are evolving a system.
-------------------------
SYSTEM RULES:
${rules}
-------------------------
LAST SUCCESSFUL STATE:
${currentState}
-------------------------
KNOWN FAILURES:
${failures}
-------------------------
STRUCTURED LEARNING SIGNAL:
${formatLearningForPrompt(learningState)}
-------------------------
FAILURE CONSTRAINTS FROM RECENT ATTEMPTS:
${formatFailureConstraints(learningState)}
-------------------------
PREFERRED STRATEGIES FROM SUCCESSFUL ATTEMPTS:
${formatSuccessGuidance(learningState)}
-------------------------
DEEP STRUCTURAL PATTERNS:
${formatStructuralPatterns(learningState)}
-------------------------
COMPOSABLE PATTERN STRUCTURES:
${formatPatternComposition(learningState)}
-------------------------
ADAPTIVE EXPLORATION POLICY:
${formatAdaptiveExploration(learningState)}
-------------------------
PUBLISH CONFIDENCE TARGET:
${formatPublishConfidence(learningState)}
-------------------------
TOP-K SUCCESSFUL ATTEMPT EXAMPLES:
${formatTopAttemptExamples(learningState)}
-------------------------
SELECTED STRATEGY MODE:
${formatStrategySelection(learningState)}
-------------------------
THIS CANDIDATE STRATEGY:
${formatStrategyCandidate(strategyCandidate)}
-------------------------
AUDIT RESULTS:
${audit}
-------------------------
PREVIOUS PERFORMANCE:
Score: ${score}
INSTRUCTION:
- If score is low -> improve correctness and execution
- If score is high -> introduce new capability while maintaining stability
- You MUST attempt to outperform previous score
- Treat STRUCTURED LEARNING SIGNAL as operational feedback from recent attempts
- Follow THIS CANDIDATE STRATEGY first; it is competing against other candidates
- Prefer strategies with higher strategy_performance.expected_value
- Build FROM the TOP-K structure when a top attempt is available: preserve pipeline shape, stage order, JSON output style, and bounded execution
- Build FROM COMPOSABLE PATTERN STRUCTURES when available: combine the named pipeline, transformation, and algorithm bundle instead of treating patterns as isolated hints
- This candidate must clear the publish confidence threshold to replace the previous best
- If ADAPTIVE EXPLORATION POLICY says focused search, stay close to the best structure and improve score quality
- If ADAPTIVE EXPLORATION POLICY says expanded search, change domain or transformation strategy while keeping successful execution traits
- Do not copy TOP-K examples verbatim; change the problem data, transformation details, and output content
- If trend.improving is false, increase domain variation while preserving top successful execution patterns
- If lastFailureReason is import_blocked or dynamic_import_blocked, avoid non-allowlisted imports
- If lastFailureReason is filesystem_blocked, use only relative Sandbox-safe file paths
- If lastFailureReason is execution_timeout, reduce loop bounds and data size
-------------------------
CRITICAL ENFORCEMENT RULES:
1. Output ONLY valid Python code
2. Do NOT include markdown, explanations, numbered steps, WHY sections, PROBLEM sections, or any prose before or after the code
3. If audit contains "No concrete implementation structure detected" or "High abstraction":
   You MUST respond with concrete executable Python only
4. DO NOT output abstract ideas without implementation
-------------------------
SUCCESS PRIORITY RULE:
- You SHOULD produce working, correct code
- Runtime errors are OPTIONAL, not required
-------------------------
GOAL:
- You MUST print output using json.dumps() and print ONLY the JSON
- Output MUST be printed using json.dumps()
- Do NOT print Python dicts directly
- Maximize successful execution
- Produce valid structured output
-------------------------
SUCCESS CONDITIONS:
- You MUST NEVER intentionally introduce runtime errors for testing or demonstration
- Any intentional runtime error will be treated as a critical failure
-You MUST NOT intentionally introduce runtime errors
- The system MUST successfully execute without raising exceptions
- Output MUST be valid JSON
- Output MUST contain:
  - "status"
  - "result" OR "errors"
- Prefer:
  status = "success"
-------------------------
FAILURE HANDLING:
- Runtime errors are ONLY allowed if necessary
- Do NOT force errors artificially
-------------------------
STRICT PROHIBITIONS:
- Do NOT use undefined variables
- Do NOT misspell module names
If a previous failure occurred:
-> prioritize fixing it, not avoiding it abstractly
-------------------------
REASONING REQUIREMENT:
- Do NOT provide reasoning outside the Python code
- Prioritize correct, working execution over explanation
Outputs that execute successfully are VALID without explanation
-------------------------
FORMAT REQUIREMENTS:

Return ONLY executable Python code.

The code MUST be directly executable as-is.
The code MUST NOT include:
- markdown fences
- explanations
- numbered steps
- WHY:
- PROBLEM:
- any prose before the code
- any prose after the code

COMPLEXITY ENFORCEMENT:

Your solution MUST implement the required five-stage pipeline.

STRICT PIPELINE ENFORCEMENT:
- You MUST define exactly these functions with these exact signatures:
  def input_stage():
  def transformation_stage(data):
  def analysis_stage(data):
  def output_stage(data):
  def main():
- main() MUST call them in this exact order:
  input_stage() -> transformation_stage(data) -> analysis_stage(data) -> output_stage(data)
- Data returned from each stage MUST be passed into the next stage in order
- Do NOT rename, merge, skip, or reorder any stage
- output_stage(data) MUST create the final output object
- output_stage(data) MUST contain the only print(json.dumps(output))
- The program MUST contain exactly ONE print(json.dumps(output))
- No other print statements are allowed
- The file MUST end by calling main() through:
  if __name__ == "__main__":
      main()

If this is not satisfied:
-> the system will reject your output
-------------------------
EXPLORATION RULE:
You MAY introduce a new idea if it improves correctness or capability
It must:
- be concrete
- include reasoning
- pass all validation rules
Avoid repeating identical structures across iterations.
-------------------------
DEPENDENCY HANDLING RULE:
If execution fails due to missing module:
- You MUST NOT reuse that dependency
- You MUST replace it with built-in Python functionality
Example:
jsonschema -> replace with manual validation logic
Do NOT require external packages unless explicitly installed.
-------------------------
Return ONLY:
PREFERENCES:
- concrete, minimal abstraction
STRATEGIES:
- MUST follow format AND reasoning rules
CORE:
- only if necessary
-------------------------
ATTEMPT NUMBER: ${attempt}
ADAPTATION RULE:
- If attempt > 1:
  -> You MUST change strategy from previous attempt
  -> You SHOULD improve correctness and avoid repeating failures
 - You SHOULD correct previous failure patterns when relevant
-------------------------
EXECUTION FEEDBACK:
${executionSummary}
-------------------------
FAILURE MEMORY:
${pastFailures}
-------------------------
SUCCESS MEMORY:
${successMemory}
-------------------------
IMPROVEMENT ENFORCEMENT:
- Focus on producing correct, working output
- Fix any issues only if they directly impact execution
- Do NOT introduce or analyze failures unless necessary
- If a failure involved:
  - undefined variable
  - missing import
  -> you MUST fix it directly
Repeating ANY previous failure will cause the system to reject the output and retry.
-------------------------
LEARNING MODE:

PROGRESSION RULE:

Each successful execution MUST:

- Increase problem complexity slightly
- Introduce a new function, structure, or capability
- Avoid repeating the same type of solution

You MUST NOT:
- Repeat simple patterns (e.g., basic math, trivial classification)
- Stay at the same difficulty level

If the previous solution was simple:
-> You MUST make the next one more complex

Examples of progression:
- single function -> multi-step system
- static data -> dynamic input handling
- basic logic -> structured processing pipeline
If the last execution had NO errors:

- You MUST introduce a small structural improvement
- You MUST increase complexity slightly
- You MUST explore a new approach or pattern

If the last execution HAD errors:

- You MUST fix the root cause
- You MUST NOT repeat the same failure pattern

You are always either:
- improving
- or correcting

You are NEVER allowed to repeat the same solution unchanged.
--------------------------------------

DIVERSITY RULE:

You MUST NOT solve the same type of problem in consecutive successful executions.

If the last solution involved:
- number classification
- basic arithmetic
- simple transformations

Then the next solution MUST shift to a DIFFERENT domain, such as:
- string processing
- file handling
- data structures (lists, dicts, trees)
- multi-step pipelines
- stateful systems

You MUST change problem domain, not just implementation.
`;
}

module.exports = {
  formatSuccessGuidance,
  formatFailureConstraints,
  formatTopAttemptExamples,
  formatStrategySelection,
  formatStrategyCandidate,
  formatStructuralPatterns,
  formatPatternComposition,
  formatAdaptiveExploration,
  formatPublishConfidence,
  buildEvolutionPrompt
};
