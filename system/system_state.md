# NODEX SYSTEM — CURRENT STATE (AUTHORITATIVE)

## SYSTEM IDENTITY

Name: Nodex System
Type: Deterministic AI Execution Engine
Architecture: Modular, Tool-Routed, Evaluation-Driven
Role: Generate → Execute → Evaluate → Improve (closed loop)

Human Role: Orchestrator (Zak)
AI Role: Constrained Execution + System Evolution

---

## CURRENT PHASE

PHASE: 1 — CORE LOOP STABILIZATION
STATUS: FUNCTIONAL BUT VALIDATION-BLOCKED

---

## CONFIRMED WORKING COMPONENTS

Execution Layer:
- node evolve.js runs successfully
- Python sandbox execution working
- Combined execution pipeline functional

Generation Layer:
- Candidate generation (3–5 strategies) working
- Prompt builder active and loading correctly

Evaluation Layer:
- Scoring system operational
- Audit logic active
- Multi-candidate comparison working

Memory Layer:
- replayStore functional
- taskState persistence working
- evolution logs writing correctly

Routing Layer:
- tool registry implemented
- routing logic previously validated

---

## CURRENT FAILURE POINT

Error:
validation_missing_pipeline

Occurs in:
evolution/validators.js

Trigger Condition:
Missing required pipeline structure in generated output

Required structure:
- def input_stage
- def transformation_stage
- def analysis_stage
- def output_stage
- def main

---

## ROOT CAUSE

LLM output is not structurally reliable.

Observed issues:
- Non-code text before/after code blocks
- Partial pipeline generation
- Missing required functions
- Formatting inconsistencies

System incorrectly assumes:
LLM → clean structured output

Reality:
LLM → noisy, semi-structured output

---

## CRITICAL SYSTEM WEAKNESS

Boundary failure at:

LLM OUTPUT → SYSTEM VALIDATION

Specifically:
cleanEvolutionOutput(...) is insufficient

---

## REQUIRED FIX (ACTIVE TASK)

Location:
evolution/validators.js

Function:
cleanEvolutionOutput(...)

Objective:
- Extract ONLY valid Python code
- Remove all non-code text
- Ensure full pipeline block is preserved
- Guarantee validator receives clean input

---

## HARD CONSTRAINTS

DO NOT:
- Modify promptBuilder.js
- Modify evolver.js
- Modify scoring system
- Expand architecture
- Add abstraction layers
- Introduce speculative fixes

---

## ALLOWED ACTIONS

- Surgical fix to cleanEvolutionOutput
- String parsing / extraction improvements
- Minimal validation pre-processing
- Deterministic code isolation

---

## SYSTEM PRINCIPLES (ENFORCED)

1. LLM OUTPUT IS UNTRUSTED INPUT
2. SYSTEM MUST ENFORCE STRUCTURE, NOT REQUEST IT
3. VALIDATION MUST BE DETERMINISTIC
4. NO RELIANCE ON PROMPT COMPLIANCE
5. ALL FAILURES ARE BOUNDARY FAILURES

---

## NEXT EXECUTION STEP

1. Fix cleanEvolutionOutput
2. Run: node evolve.js
3. Observe:
   - Selected candidate
   - Validation result

---

## SUCCESS CONDITION

System progresses past:

validation_missing_pipeline

and reaches:
- execution success
OR
- next deterministic failure

---

## STRATEGIC CONTEXT

You are closing:

PHASE 1: CORE SYSTEM RELIABILITY

This is the boundary where:
AI output becomes enforceable system input

Failure to fix this = system instability at scale

---

## END STATE TARGET

Stable loop:

Generate → Clean → Validate → Execute → Score → Learn

WITHOUT:
- manual correction
- prompt dependency
- structural drift

---

## OWNER NOTE

This system is being built from:
- minimal coding background
- maximum structural reasoning

Priority is:
CORRECTNESS > CLEANNESS > COMPLEXITY

---

END OF STATE
