const ID_PATTERN = /^[a-z0-9_]+$/;

const SUPPORTED_SUBJECT_TYPES = new Set([
  "seam",
  "module",
  "file",
  "commit",
  "artifact",
  "evidence",
  "decision",
  "instruction",
  "memory",
  "test"
]);

const SUPPORTED_CLAIM_STATUSES = new Set([
  "active",
  "stale",
  "superseded",
  "contradicted",
  "blocked"
]);

const AUTHORITY_RANKS = new Map([
  ["commit", 100],
  ["post_commit_test", 90],
  ["runtime_probe", 80],
  ["targeted_test", 70],
  ["inspection", 60],
  ["diagnostic_snapshot", 30],
  ["uploaded_summary", 20]
]);

const SUPPORTED_EVIDENCE_KINDS = new Set([
  "inspection",
  "syntax",
  "targeted_command",
  "runtime",
  "test",
  "git"
]);

const SUPPORTED_EVIDENCE_RESULTS = new Set([
  "pass",
  "fail",
  "blocked"
]);

const CLAIM_KEYS = new Set([
  "version",
  "claimId",
  "subject",
  "predicate",
  "status",
  "authority",
  "evidence",
  "supersedes",
  "contradicts",
  "blocks",
  "summary"
]);

const GRAPH_KEYS = new Set([
  "version",
  "graphId",
  "claims"
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertKnownKeys(input, allowedKeys, label) {
  Object.keys(input).forEach(key => {
    assertCondition(allowedKeys.has(key), `${label}.${key} is unknown`);
  });
}

function assertNonEmptyString(value, label) {
  assertCondition(typeof value === "string", `${label} must be a string`);
  const normalized = value.trim();
  assertCondition(normalized.length > 0, `${label} must be non-empty`);
  return normalized;
}

function normalizeId(value, label) {
  const normalized = assertNonEmptyString(value, label);
  assertCondition(ID_PATTERN.test(normalized), `${label} must match /^[a-z0-9_]+$/`);
  return normalized;
}

function normalizePredicate(value) {
  return normalizeId(value, "predicate");
}

function normalizeSubject(value) {
  assertCondition(isRecord(value), "subject must be an object");

  const type = normalizeId(value.type, "subject.type");
  assertCondition(SUPPORTED_SUBJECT_TYPES.has(type), "subject.type is not supported");

  return Object.freeze({
    type,
    id: normalizeId(value.id, "subject.id")
  });
}

function normalizeStatus(value) {
  const status = normalizeId(value, "status");
  assertCondition(SUPPORTED_CLAIM_STATUSES.has(status), "status is not supported");
  return status;
}

function normalizeAuthority(value) {
  assertCondition(isRecord(value), "authority must be an object");

  const kind = normalizeId(value.kind, "authority.kind");
  assertCondition(AUTHORITY_RANKS.has(kind), "authority.kind is not supported");

  return Object.freeze({
    kind,
    rank: AUTHORITY_RANKS.get(kind)
  });
}

function normalizeEvidenceSubject(value, label) {
  const normalized = assertNonEmptyString(value, label);
  assertCondition(!normalized.includes(".."), `${label} must not contain ..`);
  assertCondition(!/^[A-Za-z]:/.test(normalized), `${label} must not be absolute`);
  assertCondition(!normalized.startsWith("\\\\"), `${label} must not be UNC`);
  return normalized.replace(/\\/g, "/");
}

function normalizeEvidenceEntry(value, index) {
  assertCondition(isRecord(value), `evidence[${index}] must be an object`);

  const kind = normalizeId(value.kind, `evidence[${index}].kind`);
  assertCondition(SUPPORTED_EVIDENCE_KINDS.has(kind), `evidence[${index}].kind is not supported`);

  const result = normalizeId(value.result, `evidence[${index}].result`);
  assertCondition(SUPPORTED_EVIDENCE_RESULTS.has(result), `evidence[${index}].result is not supported`);

  return Object.freeze({
    kind,
    subject: normalizeEvidenceSubject(value.subject, `evidence[${index}].subject`),
    result,
    summary: assertNonEmptyString(value.summary, `evidence[${index}].summary`)
  });
}

function normalizeEvidenceList(value) {
  assertCondition(Array.isArray(value), "evidence must be an array");
  assertCondition(value.length > 0, "evidence must contain at least one entry");

  return Object.freeze(value.map((entry, index) => normalizeEvidenceEntry(entry, index)));
}

function normalizeRelationList(value, label, claimId) {
  if (value === undefined) {
    return Object.freeze([]);
  }

  assertCondition(Array.isArray(value), `${label} must be an array`);

  const seen = new Set();
  const normalized = value.map((entry, index) => {
    const id = normalizeId(entry, `${label}[${index}]`);
    assertCondition(id !== claimId, `${label}[${index}] must not reference the claim itself`);
    assertCondition(!seen.has(id), `${label} must not contain duplicates`);
    seen.add(id);
    return id;
  });

  return Object.freeze(normalized);
}

function normalizeBlockList(value) {
  if (value === undefined) {
    return Object.freeze([]);
  }

  assertCondition(Array.isArray(value), "blocks must be an array");

  const seen = new Set();
  const normalized = value.map((entry, index) => {
    const id = normalizeId(entry, `blocks[${index}]`);
    assertCondition(!seen.has(id), "blocks must not contain duplicates");
    seen.add(id);
    return id;
  });

  return Object.freeze(normalized);
}

function createValidityClaim(input) {
  assertCondition(isRecord(input), "claim input must be an object");
  assertKnownKeys(input, CLAIM_KEYS, "claim");

  assertCondition(input.version === 1, "claim.version must be 1");

  const claimId = normalizeId(input.claimId, "claimId");

  return Object.freeze({
    version: 1,
    claimId,
    subject: normalizeSubject(input.subject),
    predicate: normalizePredicate(input.predicate),
    status: normalizeStatus(input.status),
    authority: normalizeAuthority(input.authority),
    evidence: normalizeEvidenceList(input.evidence),
    supersedes: normalizeRelationList(input.supersedes, "supersedes", claimId),
    contradicts: normalizeRelationList(input.contradicts, "contradicts", claimId),
    blocks: normalizeBlockList(input.blocks),
    summary: assertNonEmptyString(input.summary, "summary")
  });
}

function validateValidityClaim(input) {
  createValidityClaim(input);
  return true;
}

function validateClaimReferences(claims) {
  const claimIds = new Set(claims.map(claim => claim.claimId));

  claims.forEach(claim => {
    claim.supersedes.forEach(targetId => {
      assertCondition(claimIds.has(targetId), `supersedes target ${targetId} must exist`);
    });

    claim.contradicts.forEach(targetId => {
      assertCondition(claimIds.has(targetId), `contradicts target ${targetId} must exist`);
    });
  });
}

function createValidityGraph(input) {
  assertCondition(isRecord(input), "validity graph input must be an object");
  assertKnownKeys(input, GRAPH_KEYS, "validityGraph");

  assertCondition(input.version === 1, "validityGraph.version must be 1");

  const graphId = normalizeId(input.graphId, "graphId");

  assertCondition(Array.isArray(input.claims), "claims must be an array");

  const seenClaimIds = new Set();
  const claims = input.claims.map((claimInput, index) => {
    const claim = createValidityClaim(claimInput);
    assertCondition(!seenClaimIds.has(claim.claimId), `claims[${index}].claimId must be unique`);
    seenClaimIds.add(claim.claimId);
    return claim;
  });

  validateClaimReferences(claims);

  return Object.freeze({
    version: 1,
    graphId,
    claims: Object.freeze(claims)
  });
}

function validateValidityGraph(input) {
  createValidityGraph(input);
  return true;
}

function appendValidityClaim(graph, claimInput) {
  const normalizedGraph = createValidityGraph(graph);
  const claim = createValidityClaim(claimInput);

  assertCondition(
    !normalizedGraph.claims.some(existingClaim => existingClaim.claimId === claim.claimId),
    "claimId must be unique"
  );

  return createValidityGraph({
    version: 1,
    graphId: normalizedGraph.graphId,
    claims: normalizedGraph.claims.concat([claim])
  });
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

function resolveValidityGraph(input) {
  const graph = createValidityGraph(input);

  const supersededClaimIds = new Set();
  const contradictedClaimIds = new Set();
  const blockedActionIds = [];

  graph.claims.forEach(claim => {
    claim.supersedes.forEach(targetId => supersededClaimIds.add(targetId));
    claim.contradicts.forEach(targetId => contradictedClaimIds.add(targetId));
    claim.blocks.forEach(actionId => blockedActionIds.push(actionId));
  });

  const activeClaimIds = graph.claims
    .filter(claim => (
      claim.status === "active" &&
      !supersededClaimIds.has(claim.claimId) &&
      !contradictedClaimIds.has(claim.claimId)
    ))
    .map(claim => claim.claimId)
    .sort();

  const staleClaimIds = graph.claims
    .filter(claim => claim.status === "stale")
    .map(claim => claim.claimId)
    .sort();

  const authorityOrder = graph.claims
    .slice()
    .sort((left, right) => {
      if (right.authority.rank !== left.authority.rank) {
        return right.authority.rank - left.authority.rank;
      }

      return left.claimId.localeCompare(right.claimId);
    })
    .map(claim => claim.claimId);

  return Object.freeze({
    version: 1,
    graphId: graph.graphId,
    activeClaimIds: Object.freeze(activeClaimIds),
    staleClaimIds: Object.freeze(staleClaimIds),
    supersededClaimIds: Object.freeze(uniqueSorted(supersededClaimIds)),
    contradictedClaimIds: Object.freeze(uniqueSorted(contradictedClaimIds)),
    blockedActionIds: Object.freeze(uniqueSorted(blockedActionIds)),
    authorityOrder: Object.freeze(authorityOrder),
    claims: cloneValue(graph.claims)
  });
}

module.exports = {
  createValidityClaim,
  validateValidityClaim,
  createValidityGraph,
  validateValidityGraph,
  appendValidityClaim,
  resolveValidityGraph
};
