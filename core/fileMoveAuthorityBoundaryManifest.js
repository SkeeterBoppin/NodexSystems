'use strict';

const SCHEMA = 'nodex.file_move_authority_boundary.manifest.v1';

const FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST = Object.freeze({
  schema: SCHEMA,
  seam: 'FileMoveAuthorityBoundaryImplementation v1',
  metadataOnly: true,
  authorityBoundary: 'file_move_authority_boundary',
  fileMoveExecutionAllowedNow: false,
  broadFilesystemCapabilityGranted: false,
  generatedCodeApprovalGranted: false,
  modelOutputApprovalGranted: false,
  authoritySelfExpansionGranted: false,
  requiredRequestFields: Object.freeze([
    'operation',
    'sourcePath',
    'destinationPath',
    'reason',
    'requestedBy',
    'authorityScope'
  ]),
  allowedOperation: 'move',
  allowedAuthorityScope: 'file_move_authority_boundary',
  blockedCapabilities: Object.freeze([
    'file_move_execution',
    'broad_filesystem_capability',
    'generated_code_approval',
    'model_output_approval',
    'authority_self_expansion'
  ])
});

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pushError(errors, code, message) {
  errors.push({ code, message });
}

function normalizeFileMovePath(rawPath, fieldName) {
  const errors = [];

  if (typeof rawPath !== 'string') {
    pushError(errors, `${fieldName}_must_be_string`, `${fieldName} must be a string`);
    return { ok: false, fieldName, normalizedPath: null, errors };
  }

  const trimmed = rawPath.trim();

  if (trimmed.length === 0) {
    pushError(errors, `${fieldName}_empty`, `${fieldName} must not be empty`);
  }

  if (trimmed.includes('\u0000')) {
    pushError(errors, `${fieldName}_contains_null_byte`, `${fieldName} must not contain null bytes`);
  }

  if (/^[A-Za-z]:[\\/]/.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('\\')) {
    pushError(errors, `${fieldName}_absolute_path_blocked`, `${fieldName} must be repo-relative, not absolute`);
  }

  const parts = trimmed.split(/[\\/]+/).filter(Boolean);

  if (parts.includes('..')) {
    pushError(errors, `${fieldName}_parent_traversal_blocked`, `${fieldName} must not contain parent traversal`);
  }

  if (parts.includes('.')) {
    pushError(errors, `${fieldName}_dot_segment_blocked`, `${fieldName} must not contain dot segments`);
  }

  const normalizedPath = parts.join('/');

  return {
    ok: errors.length === 0,
    fieldName,
    normalizedPath: errors.length === 0 ? normalizedPath : null,
    errors
  };
}

function validateFileMoveAuthorityRequest(request) {
  const errors = [];

  if (!isPlainObject(request)) {
    pushError(errors, 'request_must_be_plain_object', 'request must be a plain object');
    return {
      ok: false,
      errors,
      normalized: null,
      boundary: getFileMoveAuthorityBoundaryManifest()
    };
  }

  if (request.operation !== FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.allowedOperation) {
    pushError(errors, 'operation_must_be_move', 'operation must be move');
  }

  if (request.authorityScope !== FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.allowedAuthorityScope) {
    pushError(errors, 'authority_scope_mismatch', 'authorityScope must be file_move_authority_boundary');
  }

  if (typeof request.reason !== 'string' || request.reason.trim().length === 0) {
    pushError(errors, 'reason_required', 'reason must be a non-empty string');
  }

  if (typeof request.requestedBy !== 'string' || request.requestedBy.trim().length === 0) {
    pushError(errors, 'requested_by_required', 'requestedBy must be a non-empty string');
  }

  const source = normalizeFileMovePath(request.sourcePath, 'sourcePath');
  const destination = normalizeFileMovePath(request.destinationPath, 'destinationPath');

  for (const error of source.errors) {
    errors.push(error);
  }

  for (const error of destination.errors) {
    errors.push(error);
  }

  if (source.ok && destination.ok && source.normalizedPath === destination.normalizedPath) {
    pushError(errors, 'source_destination_must_differ', 'sourcePath and destinationPath must differ');
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: errors.length === 0
      ? {
          operation: 'move',
          sourcePath: source.normalizedPath,
          destinationPath: destination.normalizedPath,
          reason: request.reason.trim(),
          requestedBy: request.requestedBy.trim(),
          authorityScope: request.authorityScope
        }
      : null,
    boundary: getFileMoveAuthorityBoundaryManifest()
  };
}

function createFileMoveAuthorityBoundaryDecision(request) {
  const validation = validateFileMoveAuthorityRequest(request);
  const boundary = getFileMoveAuthorityBoundaryManifest();

  return {
    schema: SCHEMA,
    decision: validation.ok
      ? 'file_move_request_valid_but_execution_blocked'
      : 'file_move_request_invalid',
    requestValid: validation.ok,
    allowed: false,
    denied: true,
    fileMovePerformed: false,
    fileMoveExecutionAllowedNow: false,
    broadFilesystemCapabilityGranted: false,
    generatedCodeApprovalGranted: false,
    modelOutputApprovalGranted: false,
    authoritySelfExpansionGranted: false,
    normalized: validation.normalized,
    errors: validation.errors,
    blockedCapabilities: boundary.blockedCapabilities.slice()
  };
}

function validateFileMoveAuthorityResult(result) {
  const errors = [];

  if (!isPlainObject(result)) {
    pushError(errors, 'result_must_be_plain_object', 'result must be a plain object');
    return { ok: false, errors };
  }

  if (result.fileMovePerformed !== false) {
    pushError(errors, 'file_move_performed_must_be_false', 'fileMovePerformed must remain false');
  }

  if (result.fileMoveExecutionAllowedNow !== false) {
    pushError(errors, 'file_move_execution_allowed_now_must_be_false', 'fileMoveExecutionAllowedNow must remain false');
  }

  if (result.broadFilesystemCapabilityGranted !== false) {
    pushError(errors, 'broad_filesystem_capability_must_be_false', 'broadFilesystemCapabilityGranted must remain false');
  }

  if (result.allowed !== false) {
    pushError(errors, 'allowed_must_be_false', 'allowed must remain false');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

function assertNoFileMoveExecutionAuthority(candidate) {
  const result = validateFileMoveAuthorityResult(candidate);

  if (!result.ok) {
    const details = result.errors.map((error) => error.code).join(', ');
    throw new Error(`file move execution authority boundary violated: ${details}`);
  }

  return true;
}

function getFileMoveAuthorityBoundaryManifest() {
  return {
    schema: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.schema,
    seam: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.seam,
    metadataOnly: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.metadataOnly,
    authorityBoundary: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.authorityBoundary,
    fileMoveExecutionAllowedNow: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.fileMoveExecutionAllowedNow,
    broadFilesystemCapabilityGranted: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.broadFilesystemCapabilityGranted,
    generatedCodeApprovalGranted: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.generatedCodeApprovalGranted,
    modelOutputApprovalGranted: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.modelOutputApprovalGranted,
    authoritySelfExpansionGranted: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.authoritySelfExpansionGranted,
    requiredRequestFields: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.requiredRequestFields.slice(),
    allowedOperation: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.allowedOperation,
    allowedAuthorityScope: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.allowedAuthorityScope,
    blockedCapabilities: FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST.blockedCapabilities.slice()
  };
}

module.exports = {
  SCHEMA,
  FILE_MOVE_AUTHORITY_BOUNDARY_MANIFEST,
  getFileMoveAuthorityBoundaryManifest,
  normalizeFileMovePath,
  validateFileMoveAuthorityRequest,
  createFileMoveAuthorityBoundaryDecision,
  validateFileMoveAuthorityResult,
  assertNoFileMoveExecutionAuthority
};
