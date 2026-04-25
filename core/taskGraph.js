const SUPPORTED_MODES = new Set(["inspect_only", "apply", "validate_only"])
const SUPPORTED_STEP_TYPES = new Set(["inspect", "edit", "validate"])
const SUPPORTED_STEP_STATUSES = new Set(["pending", "in_progress", "passed", "failed"])
const SUPPORTED_EVIDENCE_KINDS = new Set(["inspection", "syntax", "targeted_command", "runtime", "test"])
const SUPPORTED_EVIDENCE_RESULTS = new Set(["pass", "fail"])
const GRAPH_ID_PATTERN = /^[a-z0-9_]+$/
const STEP_ID_PATTERN = /^[a-z0-9_]+$/

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue)
  }

  if (isRecord(value)) {
    const clone = {}
    Object.keys(value).forEach(key => {
      clone[key] = cloneValue(value[key])
    })
    return clone
  }

  return value
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function normalizeRepoPath(pathValue, label, { allowDirectoryPattern = true } = {}) {
  assertCondition(typeof pathValue === "string", `${label} must be a string`)

  let normalized = pathValue.trim()
  assertCondition(normalized.length > 0, `${label} must not be empty`)

  normalized = normalized.replace(/\\/g, "/")
  const hadUncPrefix = normalized.startsWith("//")

  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2)
  }

  normalized = normalized.replace(/\/+/g, "/")

  assertCondition(normalized.length > 0, `${label} must not be empty`)
  assertCondition(!hadUncPrefix, `${label} must be repo-relative`)
  assertCondition(!/^[A-Za-z]:/.test(normalized), `${label} must be repo-relative`)
  assertCondition(!normalized.startsWith("/"), `${label} must be repo-relative`)

  const isDirectoryPattern = normalized.endsWith("/")
  const withoutTrailingSlash = isDirectoryPattern ? normalized.slice(0, -1) : normalized

  assertCondition(withoutTrailingSlash.length > 0, `${label} must not be empty`)

  withoutTrailingSlash.split("/").forEach(segment => {
    assertCondition(segment.length > 0, `${label} contains an empty path segment`)
    assertCondition(segment !== "..", `${label} must not contain ".."`)
  })

  assertCondition(allowDirectoryPattern || !isDirectoryPattern, `${label} must be a file path`)

  return isDirectoryPattern ? `${withoutTrailingSlash}/` : withoutTrailingSlash
}

function pathMatchesPattern(pattern, filePath) {
  if (pattern.endsWith("/")) {
    return filePath.startsWith(pattern)
  }

  return filePath === pattern
}

function pathPatternsOverlap(left, right) {
  const leftIsDirectory = left.endsWith("/")
  const rightIsDirectory = right.endsWith("/")

  if (leftIsDirectory && rightIsDirectory) {
    return left.startsWith(right) || right.startsWith(left)
  }

  if (leftIsDirectory) {
    return right.startsWith(left)
  }

  if (rightIsDirectory) {
    return left.startsWith(right)
  }

  return left === right
}

function validateEvidenceEntry(entry, label) {
  assertCondition(isRecord(entry), `${label} must be an object`)
  assertCondition(typeof entry.kind === "string", `${label}.kind must be a string`)
  assertCondition(SUPPORTED_EVIDENCE_KINDS.has(entry.kind), `${label}.kind is not supported`)
  assertCondition(typeof entry.result === "string", `${label}.result must be a string`)
  assertCondition(SUPPORTED_EVIDENCE_RESULTS.has(entry.result), `${label}.result must be "pass" or "fail"`)

  if (entry.label !== undefined) {
    assertCondition(typeof entry.label === "string", `${label}.label must be a string`)
  }

  if (entry.subject !== undefined) {
    assertCondition(typeof entry.subject === "string", `${label}.subject must be a string`)
  }

  if (entry.summary !== undefined) {
    assertCondition(typeof entry.summary === "string", `${label}.summary must be a string`)
  }

  if (entry.data !== undefined) {
    assertCondition(isRecord(entry.data), `${label}.data must be an object`)
  }
}

function normalizeEvidenceList(evidence, label) {
  assertCondition(Array.isArray(evidence), `${label} must be an array`)

  return evidence.map((entry, index) => {
    const normalizedEntry = cloneValue(entry)
    validateEvidenceEntry(normalizedEntry, `${label}[${index}]`)
    return normalizedEntry
  })
}

function hasPassingEvidence(evidence, gate) {
  return evidence.some(entry => entry.kind === gate && entry.result === "pass")
}

function normalizeTaskGraph(graph) {
  assertCondition(isRecord(graph), "task graph must be an object")
  assertCondition(graph.version === 1, "task graph version must be 1")
  assertCondition(typeof graph.graphId === "string" && graph.graphId.length > 0, "graphId must be a non-empty string")
  assertCondition(GRAPH_ID_PATTERN.test(graph.graphId), "graphId must match /^[a-z0-9_]+$/")
  assertCondition(typeof graph.mode === "string" && SUPPORTED_MODES.has(graph.mode), "mode is not supported")
  assertCondition(Array.isArray(graph.allowedFiles) && graph.allowedFiles.length > 0, "allowedFiles must be a non-empty array")
  assertCondition(Array.isArray(graph.forbiddenFiles), "forbiddenFiles must be an array")
  assertCondition(Array.isArray(graph.steps) && graph.steps.length > 0, "steps must be a non-empty array")

  const clonedGraph = cloneValue(graph)
  const allowedFiles = clonedGraph.allowedFiles.map((pathValue, index) => {
    return normalizeRepoPath(pathValue, `allowedFiles[${index}]`)
  })
  const forbiddenFiles = clonedGraph.forbiddenFiles.map((pathValue, index) => {
    return normalizeRepoPath(pathValue, `forbiddenFiles[${index}]`)
  })

  allowedFiles.forEach((allowedPath, allowedIndex) => {
    forbiddenFiles.forEach((forbiddenPath, forbiddenIndex) => {
      assertCondition(
        !pathPatternsOverlap(allowedPath, forbiddenPath),
        `allowedFiles[${allowedIndex}] overlaps forbiddenFiles[${forbiddenIndex}]`
      )
    })
  })

  const seenStepIds = new Set()
  let inProgressCount = 0
  let allPreviousPassed = true

  const steps = clonedGraph.steps.map((step, index) => {
    const label = `steps[${index}]`

    assertCondition(isRecord(step), `${label} must be an object`)
    assertCondition(typeof step.id === "string" && step.id.length > 0, `${label}.id must be a non-empty string`)
    assertCondition(STEP_ID_PATTERN.test(step.id), `${label}.id must match /^[a-z0-9_]+$/`)
    assertCondition(!seenStepIds.has(step.id), `${label}.id must be unique`)
    seenStepIds.add(step.id)

    assertCondition(typeof step.type === "string" && SUPPORTED_STEP_TYPES.has(step.type), `${label}.type is not supported`)
    assertCondition(typeof step.status === "string" && SUPPORTED_STEP_STATUSES.has(step.status), `${label}.status is not supported`)
    assertCondition(Array.isArray(step.files), `${label}.files must be an array`)

    const normalizedFiles = step.files.map((pathValue, fileIndex) => {
      return normalizeRepoPath(pathValue, `${label}.files[${fileIndex}]`, { allowDirectoryPattern: false })
    })

    normalizedFiles.forEach(filePath => {
      assertCondition(
        allowedFiles.some(pattern => pathMatchesPattern(pattern, filePath)),
        `${label}.files contains a path outside allowedFiles: ${filePath}`
      )
      assertCondition(
        !forbiddenFiles.some(pattern => pathMatchesPattern(pattern, filePath)),
        `${label}.files contains a forbidden path: ${filePath}`
      )
    })

    assertCondition(isRecord(step.validation), `${label}.validation must be an object`)
    assertCondition(typeof step.validation.required === "boolean", `${label}.validation.required must be a boolean`)
    assertCondition(Array.isArray(step.validation.gates), `${label}.validation.gates must be an array`)

    const normalizedGates = step.validation.gates.map((gate, gateIndex) => {
      assertCondition(typeof gate === "string", `${label}.validation.gates[${gateIndex}] must be a string`)
      assertCondition(SUPPORTED_EVIDENCE_KINDS.has(gate), `${label}.validation.gates[${gateIndex}] is not supported`)
      return gate
    })

    const normalizedEvidence = normalizeEvidenceList(step.evidence, `${label}.evidence`)

    if (step.status === "in_progress") {
      inProgressCount += 1
    }

    if ((step.status === "passed" || step.status === "in_progress") && !allPreviousPassed) {
      throw new Error(`${label} cannot be ${step.status} before earlier steps pass`)
    }

    if (step.validation.required && step.status === "passed") {
      normalizedGates.forEach(gate => {
        assertCondition(
          hasPassingEvidence(normalizedEvidence, gate),
          `${label} is missing passing evidence for gate ${gate}`
        )
      })
    }

    if (step.status !== "passed") {
      allPreviousPassed = false
    }

    return {
      ...step,
      files: normalizedFiles,
      validation: {
        ...step.validation,
        required: step.validation.required,
        gates: normalizedGates
      },
      evidence: normalizedEvidence
    }
  })

  assertCondition(inProgressCount <= 1, "task graph can only have one in_progress step")

  return {
    ...clonedGraph,
    allowedFiles,
    forbiddenFiles,
    steps
  }
}

function getNextExecutableStepFromGraph(graph) {
  if (graph.steps.some(step => step.status === "in_progress")) {
    return null
  }

  if (graph.steps.some(step => step.status === "failed")) {
    return null
  }

  const nextStep = graph.steps.find(step => step.status === "pending")
  return nextStep ? cloneValue(nextStep) : null
}

function createTaskGraph(input) {
  return normalizeTaskGraph(input)
}

function validateTaskGraph(graph) {
  normalizeTaskGraph(graph)
  return true
}

function getCurrentStep(graph) {
  const normalizedGraph = normalizeTaskGraph(graph)
  const inProgressStep = normalizedGraph.steps.find(step => step.status === "in_progress")

  if (inProgressStep) {
    return cloneValue(inProgressStep)
  }

  return getNextExecutableStepFromGraph(normalizedGraph)
}

function getNextExecutableStep(graph) {
  const normalizedGraph = normalizeTaskGraph(graph)
  return getNextExecutableStepFromGraph(normalizedGraph)
}

function markStepStarted(graph, stepId) {
  const normalizedGraph = normalizeTaskGraph(graph)
  const nextStep = getNextExecutableStepFromGraph(normalizedGraph)

  assertCondition(nextStep !== null, "no executable step is available to start")
  assertCondition(typeof stepId === "string" && stepId.length > 0, "stepId must be a non-empty string")
  assertCondition(nextStep.id === stepId, `step ${stepId} is not the next executable step`)

  return {
    ...normalizedGraph,
    steps: normalizedGraph.steps.map(step => {
      if (step.id !== stepId) {
        return step
      }

      return {
        ...step,
        status: "in_progress"
      }
    })
  }
}

function markStepPassed(graph, stepId, evidence) {
  const normalizedGraph = normalizeTaskGraph(graph)
  assertCondition(typeof stepId === "string" && stepId.length > 0, "stepId must be a non-empty string")

  const stepIndex = normalizedGraph.steps.findIndex(step => step.id === stepId)
  assertCondition(stepIndex !== -1, `step ${stepId} was not found`)

  const step = normalizedGraph.steps[stepIndex]
  assertCondition(step.status === "in_progress", `step ${stepId} must be in_progress before it can pass`)

  const normalizedEvidence = normalizeEvidenceList(evidence, "evidence")
  const mergedEvidence = step.evidence.concat(normalizedEvidence)

  if (step.validation.required) {
    step.validation.gates.forEach(gate => {
      assertCondition(
        hasPassingEvidence(mergedEvidence, gate),
        `step ${stepId} is missing passing evidence for gate ${gate}`
      )
    })
  }

  return {
    ...normalizedGraph,
    steps: normalizedGraph.steps.map(currentStep => {
      if (currentStep.id !== stepId) {
        return currentStep
      }

      return {
        ...currentStep,
        status: "passed",
        evidence: mergedEvidence
      }
    })
  }
}

function markStepFailed(graph, stepId, evidence) {
  const normalizedGraph = normalizeTaskGraph(graph)
  assertCondition(typeof stepId === "string" && stepId.length > 0, "stepId must be a non-empty string")

  const stepIndex = normalizedGraph.steps.findIndex(step => step.id === stepId)
  assertCondition(stepIndex !== -1, `step ${stepId} was not found`)

  const step = normalizedGraph.steps[stepIndex]
  assertCondition(step.status === "in_progress", `step ${stepId} must be in_progress before it can fail`)

  const normalizedEvidence = normalizeEvidenceList(evidence, "evidence")

  return {
    ...normalizedGraph,
    steps: normalizedGraph.steps.map(currentStep => {
      if (currentStep.id !== stepId) {
        return currentStep
      }

      return {
        ...currentStep,
        status: "failed",
        evidence: currentStep.evidence.concat(normalizedEvidence)
      }
    })
  }
}

module.exports = {
  createTaskGraph,
  validateTaskGraph,
  getCurrentStep,
  getNextExecutableStep,
  markStepStarted,
  markStepPassed,
  markStepFailed
}
