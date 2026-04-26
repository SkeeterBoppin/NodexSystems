# DEBUG SKILL: generation_seam

## Mission
Diagnose one failure seam only.
Do not fix beyond instrumentation unless explicitly told.

## Allowed files
- llm/ollamaClient.js
- evolution/promptBuilder.js
- evolution/evolver.js

## Forbidden changes
- scoring
- replay
- execution
- controller
- learning pipeline
- validators
- cleanEvolutionOutput
- architecture

## Required outputs
Write structured debug evidence to:
C:\Users\Zak\OneDrive\Desktop\Nodex Evidence\debug_generation_<timestamp>.txt

## Required sections
[PROMPT]
[HTTP RAW]
[PARSED OUTPUT]
[EVOLVER RAW OUTPUT]
[ERRORS]
[CONCLUSION]

## Required checks
- raw output
- typeof output
- null / undefined
- empty string
- trimmed length
- full length
- thrown error

## Execution mode
Run one controlled check only.
Never run full autonomous loop unless explicitly requested.

## Decision rule
Do not fix until exact failure point is proven.
