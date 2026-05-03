'use strict';

const PACKET_EXECUTION_CONTEXT_REQUIRED_FIELDS = Object.freeze([
  'packetFilename',
  'packetSchema',
  'seam',
  'renderedCommand',
  'actualArgvText',
  'commandInvocationForm',
  'repoRoot',
  'liveContextRoot',
  'gitStatusRaw',
  'stagedPathsRaw'
]);

const PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES = Object.freeze({
  BARE_GIT_DASH_C_WITHOUT_SUBCOMMAND_ARGS: 'bare_git_dash_C_without_subcommand_args',
  RENDERED_COMMAND_ACTUAL_ARGV_MISMATCH: 'rendered_command_actual_argv_mismatch',
  INVALID_PACKET_FILENAME: 'invalid_packet_filename',
  INVALID_PACKET_SCHEMA: 'invalid_packet_schema',
  INVALID_GIT_STATUS_FORMAT: 'invalid_git_status_format',
  MUTATION_OUTSIDE_ALLOWED_SEAM: 'mutation_outside_allowed_seam',
  STAGING_OUTSIDE_ALLOWED_SEAM: 'staging_outside_allowed_seam',
  COMMIT_OUTSIDE_ALLOWED_SEAM: 'commit_outside_allowed_seam'
});

const KNOWN_GIT_SUBCOMMANDS = Object.freeze([
  'add',
  'commit',
  'diff',
  'log',
  'push',
  'status'
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toStringValue(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
}

function normalizeArgvText(value) {
  if (Array.isArray(value)) {
    return value.map((part) => toStringValue(part).trim()).filter(Boolean);
  }
  return toStringValue(value)
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeGitStatus(raw) {
  const rawText = toStringValue(raw);
  if (rawText.trim() === '') {
    return [];
  }

  return rawText.split(/\r?\n/).filter((line) => line.trim() !== '').map((line) => {
    if (line.length < 4) {
      return {
        state: 'invalid',
        path: line,
        raw: line
      };
    }

    const code = line.slice(0, 2);
    const path = line.slice(3);
    let state = 'unknown';

    if (code === '??') {
      state = 'untracked';
    } else if (code.indexOf('M') !== -1) {
      state = 'modified';
    } else if (code.indexOf('A') !== -1) {
      state = 'added';
    } else if (code.trim() === '') {
      state = 'clean_marker';
    }

    return {
      state,
      path,
      raw: line
    };
  });
}

function hasBareGitDashC(argvParts) {
  if (!Array.isArray(argvParts) || argvParts.length === 0) {
    return false;
  }
  const gitIndex = argvParts.findIndex((part) => part === 'git' || part.endsWith('git.exe'));
  if (gitIndex === -1) {
    return false;
  }
  const dashCIndex = argvParts.indexOf('-C', gitIndex + 1);
  if (dashCIndex === -1) {
    return false;
  }
  const subcommandIndex = dashCIndex + 2;
  if (subcommandIndex >= argvParts.length) {
    return true;
  }
  return !KNOWN_GIT_SUBCOMMANDS.includes(argvParts[subcommandIndex]);
}

function createPacketExecutionContextManifest(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError('Packet execution context input must be an object.');
  }

  const actualArgvParts = normalizeArgvText(input.actualArgvText);
  const gitStatusNormalized = normalizeGitStatus(input.gitStatusRaw);
  const stagedPathsNormalized = normalizeGitStatus(input.stagedPathsRaw);

  return {
    packetFilename: toStringValue(input.packetFilename),
    packetSchema: toStringValue(input.packetSchema),
    seam: toStringValue(input.seam),
    renderedCommand: toStringValue(input.renderedCommand),
    actualArgvText: actualArgvParts.join(' | '),
    commandInvocationForm: toStringValue(input.commandInvocationForm),
    repoRoot: toStringValue(input.repoRoot),
    liveContextRoot: toStringValue(input.liveContextRoot),
    gitStatusRaw: toStringValue(input.gitStatusRaw),
    gitStatusNormalized,
    stagedPathsRaw: toStringValue(input.stagedPathsRaw),
    stagedPathsNormalized,
    mutationAllowed: input.mutationAllowed === true,
    stagingAllowed: input.stagingAllowed === true,
    commitAllowed: input.commitAllowed === true,
    liveContextWriteAllowed: input.liveContextWriteAllowed === true,
    foregroundOrBackgroundJob: toStringValue(input.foregroundOrBackgroundJob || 'foreground'),
    lineEndingPolicy: toStringValue(input.lineEndingPolicy || 'unknown'),
    autocrlf: toStringValue(input.autocrlf || 'unknown')
  };
}

function validatePacketExecutionContextManifest(manifest) {
  const errors = [];
  const blockedReasons = new Set();

  if (!isPlainObject(manifest)) {
    return {
      valid: false,
      status: 'invalid',
      errors: ['manifest must be an object'],
      blockedReasons: []
    };
  }

  for (const field of PACKET_EXECUTION_CONTEXT_REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(manifest, field)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (typeof manifest.packetFilename !== 'string' || manifest.packetFilename.trim() === '') {
    errors.push('packetFilename must be a non-empty string');
    blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.INVALID_PACKET_FILENAME);
  }

  if (typeof manifest.packetSchema !== 'string' || manifest.packetSchema.trim() === '') {
    errors.push('packetSchema must be a non-empty string');
    blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.INVALID_PACKET_SCHEMA);
  }

  if (typeof manifest.renderedCommand !== 'string' || manifest.renderedCommand.trim() === '') {
    errors.push('renderedCommand must be a non-empty string');
    blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.RENDERED_COMMAND_ACTUAL_ARGV_MISMATCH);
  }

  const actualArgvParts = normalizeArgvText(manifest.actualArgvText);
  if (actualArgvParts.length === 0) {
    errors.push('actualArgvText must describe the invoked argv');
    blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.RENDERED_COMMAND_ACTUAL_ARGV_MISMATCH);
  }

  if (hasBareGitDashC(actualArgvParts)) {
    errors.push('actualArgvText contains bare git -C without a valid subcommand');
    blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.BARE_GIT_DASH_C_WITHOUT_SUBCOMMAND_ARGS);
  }

  const normalizedGitStatus = Array.isArray(manifest.gitStatusNormalized)
    ? manifest.gitStatusNormalized
    : normalizeGitStatus(manifest.gitStatusRaw);

  for (const entry of normalizedGitStatus) {
    if (!isPlainObject(entry) || entry.state === 'invalid') {
      errors.push('gitStatusRaw contains an invalid porcelain line');
      blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.INVALID_GIT_STATUS_FORMAT);
      break;
    }
  }

  if (manifest.mutationAllowed !== true && /\b(write|mutate|implementation)\b/i.test(manifest.commandInvocationForm)) {
    errors.push('mutation-like commandInvocationForm requires mutationAllowed true');
    blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.MUTATION_OUTSIDE_ALLOWED_SEAM);
  }

  if (manifest.stagingAllowed !== true && /\bgit\s+add\b/i.test(manifest.renderedCommand)) {
    errors.push('staging command requires stagingAllowed true');
    blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.STAGING_OUTSIDE_ALLOWED_SEAM);
  }

  if (manifest.commitAllowed !== true && /\bgit\s+commit\b/i.test(manifest.renderedCommand)) {
    errors.push('commit command requires commitAllowed true');
    blockedReasons.add(PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES.COMMIT_OUTSIDE_ALLOWED_SEAM);
  }

  const valid = errors.length === 0;
  return {
    valid,
    status: valid ? 'valid' : 'blocked',
    errors,
    blockedReasons: Array.from(blockedReasons).sort()
  };
}

function classifyPacketExecutionContextManifest(manifest) {
  const validation = validatePacketExecutionContextManifest(manifest);
  return {
    status: validation.status,
    valid: validation.valid,
    blockedReasons: validation.blockedReasons,
    errors: validation.errors
  };
}

function summarizePacketExecutionContextManifest(manifest) {
  const classification = classifyPacketExecutionContextManifest(manifest);
  const gitStatusNormalized = Array.isArray(manifest && manifest.gitStatusNormalized)
    ? manifest.gitStatusNormalized
    : [];

  return {
    packetFilename: manifest && manifest.packetFilename,
    packetSchema: manifest && manifest.packetSchema,
    seam: manifest && manifest.seam,
    status: classification.status,
    valid: classification.valid,
    blockedReasons: classification.blockedReasons,
    gitStatusEntryCount: gitStatusNormalized.length,
    actualArgvText: manifest && manifest.actualArgvText
  };
}

module.exports = Object.freeze({
  PACKET_EXECUTION_CONTEXT_REQUIRED_FIELDS,
  PACKET_EXECUTION_CONTEXT_BLOCKED_FAILURE_CLASSES,
  createPacketExecutionContextManifest,
  validatePacketExecutionContextManifest,
  classifyPacketExecutionContextManifest,
  summarizePacketExecutionContextManifest
});