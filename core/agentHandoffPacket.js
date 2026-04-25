const SUPPORTED_MODES = new Set(["inspect_only", "apply", "validate_only"]);
const SUPPORTED_TYPES = new Set(["inspect", "edit", "validate"]);
const SUPPORTED_VALIDATION_GATES = new Set(["inspection", "syntax", "targeted_command", "runtime", "test"]);
const MODE_TYPE_PAIRS = {
  inspect_only: "inspect",
  apply: "edit",
  validate_only: "validate"
};
const PACKET_ID_PATTERN = /^[a-z0-9_]+$/;
const TASK_GRAPH_ID_PATTERN = /^[a-z0-9_]+$/;
const TASK_GRAPH_STEP_ID_PATTERN = /^[a-z0-9_]+$/;
const TOP_LEVEL_FIELDS = new Set([
  "version",
  "packetId",
  "mode",
  "type",
  "title",
  "instructions",
  "allowedFiles",
  "forbiddenFiles",
  "files",
  "validation",
  "expectedDirtyState",
  "taskGraph"
]);
const VALIDATION_FIELDS = new Set(["required", "gates"]);
const EXPECTED_DIRTY_STATE_FIELDS = new Set(["files"]);
const TASK_GRAPH_FIELDS = new Set(["graphId", "stepId"]);

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoUnknownFields(value, allowedFields, label) {
  Object.keys(value).forEach(key => {
    assertCondition(allowedFields.has(key), `${label} contains an unknown field: ${key}`);
  });
}

function normalizeTrimmedString(value, label) {
  assertCondition(typeof value === "string", `${label} must be a string`);

  const normalized = value.trim();
  assertCondition(normalized.length > 0, `${label} must be a non-empty string`);

  return normalized;
}

function normalizeIdentifier(value, label, pattern) {
  const normalized = normalizeTrimmedString(value, label);
  assertCondition(pattern.test(normalized), `${label} must match ${pattern}`);
  return normalized;
}

function normalizeSupportedString(value, label, supportedValues) {
  const normalized = normalizeTrimmedString(value, label);
  assertCondition(supportedValues.has(normalized), `${label} is not supported`);
  return normalized;
}

function normalizeStringArray(value, label, { requireNonEmpty = false } = {}) {
  assertCondition(Array.isArray(value), `${label} must be an array`);
  assertCondition(!requireNonEmpty || value.length > 0, `${label} must be a non-empty array`);

  return value.map((entry, index) => {
    return normalizeTrimmedString(entry, `${label}[${index}]`);
  });
}

function normalizeRepoPath(pathValue, label, { allowDirectoryPattern } = {}) {
  assertCondition(typeof pathValue === "string", `${label} must be a string`);

  const normalized = pathValue.trim().replace(/\\/g, "/");
  assertCondition(normalized.length > 0, `${label} must not be empty`);
  assertCondition(!normalized.startsWith("//"), `${label} must be repo-relative`);
  assertCondition(!/^[A-Za-z]:/.test(normalized), `${label} must be repo-relative`);
  assertCondition(!normalized.startsWith("/"), `${label} must be repo-relative`);

  const isDirectoryPattern = normalized.endsWith("/");
  const withoutTrailingSlash = isDirectoryPattern ? normalized.slice(0, -1) : normalized;

  assertCondition(withoutTrailingSlash.length > 0, `${label} must not be empty`);
  assertCondition(allowDirectoryPattern || !isDirectoryPattern, `${label} must be a file path`);

  withoutTrailingSlash.split("/").forEach(segment => {
    assertCondition(segment.length > 0, `${label} contains an empty path segment`);
    assertCondition(segment !== ".", `${label} must not contain "."`);
    assertCondition(segment !== "..", `${label} must not contain ".."`);
  });

  return isDirectoryPattern ? `${withoutTrailingSlash}/` : withoutTrailingSlash;
}

function normalizePathArray(value, label, { allowDirectoryPattern, requireNonEmpty = false } = {}) {
  assertCondition(Array.isArray(value), `${label} must be an array`);
  assertCondition(!requireNonEmpty || value.length > 0, `${label} must be a non-empty array`);

  const seen = new Set();

  return value.map((entry, index) => {
    const normalized = normalizeRepoPath(entry, `${label}[${index}]`, { allowDirectoryPattern });
    assertCondition(!seen.has(normalized), `${label} contains a duplicate path: ${normalized}`);
    seen.add(normalized);
    return normalized;
  });
}

function normalizeValidationGates(value) {
  assertCondition(Array.isArray(value), "validation.gates must be an array");

  return value.map((gate, index) => {
    const normalized = normalizeTrimmedString(gate, `validation.gates[${index}]`);

    if (normalized === "git") {
      throw new Error(`validation.gates[${index}] must not include git`);
    }

    assertCondition(SUPPORTED_VALIDATION_GATES.has(normalized), `validation.gates[${index}] is not supported`);
    return normalized;
  });
}

function normalizeValidation(value) {
  assertCondition(isPlainObject(value), "validation must be an object");
  assertNoUnknownFields(value, VALIDATION_FIELDS, "validation");
  assertCondition(typeof value.required === "boolean", "validation.required must be a boolean");

  return {
    required: value.required,
    gates: normalizeValidationGates(value.gates)
  };
}

function normalizeExpectedDirtyState(value) {
  assertCondition(isPlainObject(value), "expectedDirtyState must be an object");
  assertNoUnknownFields(value, EXPECTED_DIRTY_STATE_FIELDS, "expectedDirtyState");

  return {
    files: normalizePathArray(value.files, "expectedDirtyState.files", {
      allowDirectoryPattern: false,
      requireNonEmpty: false
    })
  };
}

function normalizeTaskGraph(value) {
  assertCondition(isPlainObject(value), "taskGraph must be an object");
  assertNoUnknownFields(value, TASK_GRAPH_FIELDS, "taskGraph");

  return {
    graphId: normalizeIdentifier(value.graphId, "taskGraph.graphId", TASK_GRAPH_ID_PATTERN),
    stepId: normalizeIdentifier(value.stepId, "taskGraph.stepId", TASK_GRAPH_STEP_ID_PATTERN)
  };
}

function pathMatchesPattern(pattern, filePath) {
  if (pattern.endsWith("/")) {
    return filePath.startsWith(pattern);
  }

  return pattern === filePath;
}

function pathPatternsOverlap(left, right) {
  const leftIsDirectory = left.endsWith("/");
  const rightIsDirectory = right.endsWith("/");

  if (leftIsDirectory && rightIsDirectory) {
    return left.startsWith(right) || right.startsWith(left);
  }

  if (leftIsDirectory) {
    return right.startsWith(left);
  }

  if (rightIsDirectory) {
    return left.startsWith(right);
  }

  return left === right;
}

function createAgentHandoffPacket(input) {
  assertCondition(isPlainObject(input), "agent handoff packet must be a plain object");
  assertNoUnknownFields(input, TOP_LEVEL_FIELDS, "packet");
  assertCondition(input.version === 1, "version must be 1");

  const packetId = normalizeIdentifier(input.packetId, "packetId", PACKET_ID_PATTERN);
  const mode = normalizeSupportedString(input.mode, "mode", SUPPORTED_MODES);
  const type = normalizeSupportedString(input.type, "type", SUPPORTED_TYPES);

  assertCondition(MODE_TYPE_PAIRS[mode] === type, `mode ${mode} requires type ${MODE_TYPE_PAIRS[mode]}`);

  const title = normalizeTrimmedString(input.title, "title");
  const instructions = normalizeStringArray(input.instructions, "instructions", { requireNonEmpty: true });
  const allowedFiles = normalizePathArray(input.allowedFiles, "allowedFiles", {
    allowDirectoryPattern: true,
    requireNonEmpty: true
  });
  const forbiddenFiles = normalizePathArray(input.forbiddenFiles, "forbiddenFiles", {
    allowDirectoryPattern: true,
    requireNonEmpty: false
  });

  allowedFiles.forEach((allowedPath, allowedIndex) => {
    forbiddenFiles.forEach((forbiddenPath, forbiddenIndex) => {
      assertCondition(
        !pathPatternsOverlap(allowedPath, forbiddenPath),
        `allowedFiles[${allowedIndex}] overlaps forbiddenFiles[${forbiddenIndex}]`
      );
    });
  });

  const validation = normalizeValidation(input.validation);
  const files = normalizePathArray(input.files, "files", {
    allowDirectoryPattern: false,
    requireNonEmpty: true
  });

  files.forEach((filePath, index) => {
    assertCondition(
      allowedFiles.some(pattern => pathMatchesPattern(pattern, filePath)),
      `files[${index}] must be inside allowedFiles`
    );
    assertCondition(
      !forbiddenFiles.some(pattern => pathMatchesPattern(pattern, filePath)),
      `files[${index}] must be outside forbiddenFiles`
    );
  });

  const expectedDirtyState = normalizeExpectedDirtyState(input.expectedDirtyState);

  expectedDirtyState.files.forEach((filePath, index) => {
    assertCondition(files.includes(filePath), `expectedDirtyState.files[${index}] must be a subset of files`);
  });

  if (mode === "apply") {
    assertCondition(expectedDirtyState.files.length > 0, "expectedDirtyState.files must be non-empty for apply");
  } else {
    assertCondition(expectedDirtyState.files.length === 0, `expectedDirtyState.files must be empty for ${mode}`);
  }

  const packet = {
    version: 1,
    packetId,
    mode,
    type,
    title,
    instructions,
    allowedFiles,
    forbiddenFiles,
    files,
    validation,
    expectedDirtyState
  };

  if (input.taskGraph !== undefined) {
    packet.taskGraph = normalizeTaskGraph(input.taskGraph);
  }

  return packet;
}

function validateAgentHandoffPacket(input) {
  createAgentHandoffPacket(input);
  return true;
}

module.exports = {
  createAgentHandoffPacket,
  validateAgentHandoffPacket
};
