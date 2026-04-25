const SUPPORTED_PHASES = new Set(["stabilization", "integration", "orchestration", "productization"])
const SUPPORTED_SEAM_STATUSES = new Set(["planned", "implemented", "validated", "committed", "superseded"])
const SUPPORTED_EVIDENCE_KINDS = new Set(["inspection", "syntax", "targeted_command", "runtime", "test", "git"])
const SUPPORTED_EVIDENCE_RESULTS = new Set(["pass", "fail", "info"])
const CAPSULE_ID_PATTERN = /^[a-z0-9_]+$/
const SEAM_ID_PATTERN = /^[a-z0-9_]+$/
const COMMIT_HEAD_PATTERN = /^[0-9a-f]{7,40}$/

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

function assertNonEmptyString(value, label) {
  assertCondition(typeof value === "string", `${label} must be a string`)
  assertCondition(value.trim().length > 0, `${label} must be a non-empty string`)
}

function normalizeRepoFilePath(pathValue, label) {
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
  assertCondition(!normalized.endsWith("/"), `${label} must be a file path`)

  normalized.split("/").forEach(segment => {
    assertCondition(segment.length > 0, `${label} contains an empty path segment`)
    assertCondition(segment !== "..", `${label} must not contain ".."`)
  })

  return normalized
}

function normalizeFileList(files, label) {
  assertCondition(Array.isArray(files), `${label} must be an array`)
  assertCondition(files.length > 0, `${label} must be a non-empty array`)

  const seen = new Set()

  return files.map((pathValue, index) => {
    const normalizedPath = normalizeRepoFilePath(pathValue, `${label}[${index}]`)
    assertCondition(!seen.has(normalizedPath), `${label} contains a duplicate path: ${normalizedPath}`)
    seen.add(normalizedPath)
    return normalizedPath
  })
}

function normalizeEvidenceList(evidence, label) {
  assertCondition(Array.isArray(evidence), `${label} must be an array`)
  assertCondition(evidence.length > 0, `${label} must be a non-empty array`)

  return evidence.map((entry, index) => {
    const entryLabel = `${label}[${index}]`
    assertCondition(isRecord(entry), `${entryLabel} must be an object`)

    const normalizedEntry = cloneValue(entry)

    assertCondition(typeof normalizedEntry.kind === "string", `${entryLabel}.kind must be a string`)
    assertCondition(SUPPORTED_EVIDENCE_KINDS.has(normalizedEntry.kind), `${entryLabel}.kind is not supported`)
    normalizedEntry.subject = normalizeRepoFilePath(normalizedEntry.subject, `${entryLabel}.subject`)
    assertCondition(typeof normalizedEntry.result === "string", `${entryLabel}.result must be a string`)
    assertCondition(SUPPORTED_EVIDENCE_RESULTS.has(normalizedEntry.result), `${entryLabel}.result is not supported`)
    assertNonEmptyString(normalizedEntry.summary, `${entryLabel}.summary`)

    if (normalizedEntry.data !== undefined) {
      assertCondition(isRecord(normalizedEntry.data), `${entryLabel}.data must be an object`)
    }

    return normalizedEntry
  })
}

function normalizeSummary(summary) {
  assertCondition(isRecord(summary), "summary must be an object")

  const normalizedSummary = cloneValue(summary)

  assertNonEmptyString(normalizedSummary.problem, "summary.problem")
  assertNonEmptyString(normalizedSummary.change, "summary.change")
  assertNonEmptyString(normalizedSummary.outcome, "summary.outcome")
  assertCondition(Array.isArray(normalizedSummary.limits), "summary.limits must be an array")

  normalizedSummary.limits.forEach((limit, index) => {
    assertCondition(typeof limit === "string", `summary.limits[${index}] must be a string`)
  })

  return normalizedSummary
}

function normalizeMemoryCapsule(input) {
  assertCondition(isRecord(input), "memory capsule must be an object")
  assertCondition(input.version === 1, "version must be 1")
  assertNonEmptyString(input.capsuleId, "capsuleId")
  assertCondition(CAPSULE_ID_PATTERN.test(input.capsuleId), "capsuleId must match /^[a-z0-9_]+$/")
  assertCondition(typeof input.phase === "string", "phase must be a string")
  assertCondition(SUPPORTED_PHASES.has(input.phase), "phase is not supported")
  assertCondition(isRecord(input.seam), "seam must be an object")
  assertNonEmptyString(input.seam.id, "seam.id")
  assertCondition(SEAM_ID_PATTERN.test(input.seam.id), "seam.id must match /^[a-z0-9_]+$/")
  assertNonEmptyString(input.seam.title, "seam.title")
  assertCondition(typeof input.seam.status === "string", "seam.status must be a string")
  assertCondition(SUPPORTED_SEAM_STATUSES.has(input.seam.status), "seam.status is not supported")
  assertCondition(isRecord(input.commit), "commit must be an object")
  assertNonEmptyString(input.commit.head, "commit.head")
  assertCondition(COMMIT_HEAD_PATTERN.test(input.commit.head), "commit.head must match /^[0-9a-f]{7,40}$/")

  if (input.commit.message !== undefined) {
    assertCondition(typeof input.commit.message === "string", "commit.message must be a string")
  }

  const clonedCapsule = cloneValue(input)

  return {
    ...clonedCapsule,
    files: normalizeFileList(clonedCapsule.files, "files"),
    evidence: normalizeEvidenceList(clonedCapsule.evidence, "evidence"),
    summary: normalizeSummary(clonedCapsule.summary)
  }
}

function createMemoryCapsule(input) {
  return normalizeMemoryCapsule(input)
}

function validateMemoryCapsule(input) {
  normalizeMemoryCapsule(input)
  return true
}

module.exports = {
  createMemoryCapsule,
  validateMemoryCapsule
}
