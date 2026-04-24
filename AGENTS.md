# Nodex System - AGENTS.md

## Mission

Nodex is a deterministic AI system under active development.

Its target state is a locally operable, modular, multi-model, multi-tool system that progresses safely through these phases:

1. Stabilization
2. Integration
3. Orchestration
4. Productization
5. One-click app delivery

The objective is not impressive output.
The objective is to reduce failure surface area, enforce structure, preserve determinism, and improve operability through minimal validated changes.

---

## Core rule

Assume all model output is untrusted until verified.

Confidence is not evidence.
Plausibility is not evidence.
Fluent output is not evidence.

Source of truth, in order:
1. live repo state
2. exact file contents
3. exact diff
4. syntax result
5. runtime output
6. summaries and interpretations

---

## Primary priorities

1. Correctness
2. Deterministic behavior
3. Structural clarity
4. Minimal surface-area changes
5. Strict validation
6. Future-proof composability
7. Protection against drift, duplication, and hallucinated rewrites

---

## Default phase rule

Unless explicitly stated otherwise, assume the repo is in Stabilization phase.

Do not behave as though the project is already in Integration, Orchestration, Productization, or One-click App phase unless:
- the current seam is verified
- the operator explicitly moves the project forward
- the required phase preconditions are satisfied

Phase transitions are deliberate, not assumed.

---

## Phase model

### Phase 1 - Stabilization

Goal:
Eliminate exact failure boundaries and improve deterministic execution.

Allowed:
- one-seam fixes
- bounded code corrections
- validation improvements
- logging or observability improvements directly tied to an active boundary

Disallowed:
- broad redesign
- architecture expansion
- speculative integrations
- packaging work
- connecting extra services unless explicitly required for validation

Success condition:
The active seam is verified by direct evidence.

---

### Phase 2 - Integration

Goal:
Connect a new model, tool, server, or app without destabilizing the core system.

Rules:
- integrate through explicit adapters, interfaces, or contracts where feasible
- keep provider-specific logic out of shared orchestration paths when possible
- use configuration instead of scattering hardcoded runtime values
- add health checks, reachability checks, and clear failure handling
- validate the integration in isolation before connecting it to the main loop

Examples:
- Ollama
- LM Studio
- Codex
- local tools
- external helper apps
- media pipelines
- model-specific execution paths

Success condition:
The integration works independently and fails cleanly.

---

### Phase 3 - Orchestration

Goal:
Coordinate multiple models, tools, and runtimes under explicit rules.

Rules:
- preserve deterministic routing behavior
- keep provider capability boundaries explicit
- prefer capability-based routing over ad hoc special-case branching
- validate fallback behavior and failure containment
- do not allow orchestration logic to collapse core boundaries

Success condition:
The system can route, recover, and remain inspectable.

---

### Phase 4 - Productization

Goal:
Turn a developer-operated system into a reproducible local product workflow.

Rules:
- convert manual workflows into explicit startup and control flows
- make dependencies, ports, services, and preconditions visible
- preserve logs, diagnostics, and recoverability
- do not hide instability behind packaging
- do not package unverified subsystems into the default startup path

Success condition:
A clean local setup can reproduce the intended behavior with clear diagnostics.

---

### Phase 5 - One-click app delivery

Goal:
Provide a reliable local entrypoint that starts the validated system end-to-end.

Rules:
- one-click startup must wrap already-validated components
- startup order must be explicit
- failures must surface clearly
- logs and health state must remain accessible
- avoid UI-first patching for backend instability
- do not sacrifice debuggability for convenience

Success condition:
The app starts the validated system reproducibly and fails transparently when prerequisites are not met.

---

## Scope discipline

Do not:
- broad-refactor during debugging
- rewrite large files unless explicitly required
- change multiple files for one boundary unless unavoidable
- introduce new architecture to solve a local defect
- patch adjacent seams before the active seam is verified
- rely on prompt-only fixes where code or validation control is needed
- integrate future phases prematurely

Do:
- isolate the exact failure boundary
- change the smallest possible unit
- preserve working components
- validate immediately after each change
- stop widening scope when the boundary is still unverified
- build future-facing extension points only when the current phase justifies them

---

## Required debugging sequence

For every debugging task:

1. Identify the exact boundary.
2. Name the specific file and function involved.
3. Inspect current repo state before editing.
4. If uncertain, present only 2-3 concrete causes.
5. Apply the smallest justified change.
6. Validate with the smallest relevant check.
7. Report remaining risk and the next seam.

---

## Validation hierarchy

Preferred order:
1. Syntax check
2. Targeted command
3. Runtime behavior
4. Broader test run only if needed

Never claim success without validation evidence.

If a runtime path fails in generation or execution:
- check backend availability first
- check local runtime availability next
- only then change code

If validation misses occur but the loop later recovers and finalizes:
- treat that as candidate noise unless evidence shows true core-loop breakage

If a new integration fails:
- verify the external process is running
- verify endpoint, port, and config
- verify the adapter contract
- only then patch logic

---

## Change acceptance criteria

A change is acceptable only if it:
- targets a specific verified boundary
- preserves known-good behavior
- is smaller than the obvious broad rewrite
- has a clear validation step
- does not introduce unrelated architecture
- does not widen scope without necessity
- does not reduce future integratability without explicit reason

If any condition fails, narrow the change before proceeding.

---

## Known critical seam

The current verified live improvement is the same-artifact reliability gate in:

- evolution/evolver.js

Expected live indicators:
- normalizeEvolutionSignature(...)
- lastQualifiedEvolutionSignature
- artifactMatched in reliability logging

Do not remove, weaken, or casually refactor this continuity gate without explicit reason and revalidation.

---

## High-risk edit target

evolution/evolver.js is a high-risk patch surface.

Common failure modes:
- duplicated helper blocks
- damaged template literals
- malformed multiline string replacements
- regex-based edits that corrupt nearby logic
- broad patching that reintroduces older behavior

Required edit discipline for this file:
- prefer literal, anchored edits
- replace exact target blocks only
- guard against duplicate insertion
- run syntax validation immediately
- run the actual loop after syntax passes

---

## Canonical seam verification sequence

Use this exact sequence when validating the active evolver seam:

git status

Select-String -Path .\evolution\evolver.js -Pattern "normalizeEvolutionSignature|lastQualifiedEvolutionSignature|artifactMatched"

node -c .\evolution\evolver.js
node .\evolve.js

Only run broader tests after seam-level validation is complete.

---

## Repo-state rules

Do not treat pasted historical blobs as authoritative repo state.
Do not assume previous assistant output reflects the current live file.
Re-check the live repo before modifying code.

Trust:
- current file contents
- current terminal output
- current diff

Do not trust:
- memory of earlier states
- mixed pasted versions
- broad summaries without current verification

---

## Environment awareness

Environment failures can look like code failures.

Before changing generation or execution paths, verify relevant services are actually running and reachable.

Examples:
- Ollama availability
- LM Studio or other local model server availability
- Node runtime command availability
- dependency availability
- local app or server process reachability
- expected ports or endpoints

If the backend is down, do not patch generation logic first.

---

## Output contract for agents

Responses must be technical and compact.

Use this structure:
1. Boundary identified
2. Minimal change proposed or made
3. Validation performed
4. Remaining risk
5. Next seam

Do not:
- pad with affirmation
- give generic advice
- say "try this" without cause -> effect reasoning
- hide uncertainty
- overstate confidence

---

## Editing philosophy

Prefer:
- exact edits
- bounded changes
- short validation loops
- preserved working behavior
- explicit contracts
- controlled extensibility

Avoid:
- broad rewrites
- speculative improvements
- cleanup unrelated to the active defect
- architecture expansion during debugging
- multi-file drift for a single issue
- productizing unstable paths

---

## Project posture

Nodex should evolve through enforced structure, not prompt optimism.

It should become more deterministic and more future-capable through:
- stricter validation
- tighter boundaries
- safer edits
- explicit integration contracts
- clearer runtime verification
- composable architecture
- controlled phase progression

Not through:
- longer prompts
- broader rewrites
- unverified assumptions
- stylistic churn
- premature packaging
