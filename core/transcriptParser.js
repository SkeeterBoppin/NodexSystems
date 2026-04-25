"use strict";

const SECTION_HEADER_PATTERN = /^---\s*(.*?)\s*---$/;
const SYNTAX_SECTION_PATTERN = /^SYNTAX:\s*(.+)$/;
const SYNTAX_SUCCESS_PATTERN = /^(?:PASS|OK|succeeded in\s+.+)$/;
const TEST_HARNESS_SUCCESS_LINE = "All Nodex tests passed";
const CLEAN_GIT_STATUS_SECTIONS = new Set(["POST-CODEX STATUS", "POST-COMMIT STATUS"]);
const SIMPLE_GIT_STATUS_CHARS = new Set(["M", "A", "D", "R", "C", "U"]);
const COMMIT_LINE_PATTERN = /^\[[^\]]+\s+([0-9a-f]{7,40})\]\s+(.+)$/i;
const HEAD_LINE_PATTERN = /^([0-9a-f]{7,40})\s+\(HEAD\b[^)]*\)\s+(.+)$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeRepoPath(pathValue) {
  if (typeof pathValue !== "string") {
    return null;
  }

  let normalized = pathValue.trim();

  if (normalized.length === 0) {
    return null;
  }

  normalized = normalized.replace(/\\/g, "/");
  const hadUncPrefix = normalized.startsWith("//");

  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  normalized = normalized.replace(/\/+/g, "/");

  if (normalized.length === 0 || hadUncPrefix || /^[A-Za-z]:/.test(normalized) || normalized.startsWith("/") || normalized.endsWith("/")) {
    return null;
  }

  const segments = normalized.split("/");

  for (const segment of segments) {
    if (segment.length === 0 || segment === "." || segment === "..") {
      return null;
    }
  }

  return normalized;
}

function buildCandidate(kind, result, summary, label, lineNumber, matchedText, sectionLabel, data, subject) {
  const candidate = {
    kind,
    result,
    summary,
    label,
    data: {
      source: "transcript",
      lineNumber,
      matchedText,
      ...data
    }
  };

  if (sectionLabel) {
    candidate.data.sectionLabel = sectionLabel;
  }

  if (subject !== undefined) {
    candidate.subject = subject;
  }

  return candidate;
}

function getGitStatusPath(line) {
  if (line.startsWith("?? ")) {
    const normalizedPath = normalizeRepoPath(line.slice(3));
    return normalizedPath && !line.includes(" -> ") ? normalizedPath : null;
  }

  if (line.length >= 4 && line[2] === " ") {
    const status = line.slice(0, 2);
    const hasTrackedStatus = status.split("").some(char => SIMPLE_GIT_STATUS_CHARS.has(char));

    if (hasTrackedStatus) {
      const normalizedPath = normalizeRepoPath(line.slice(3));
      return normalizedPath && !line.includes(" -> ") ? normalizedPath : null;
    }
  }

  const singleStatusMatch = line.match(/^([MADRCU])\s+(.+)$/);

  if (!singleStatusMatch || singleStatusMatch[2].includes(" -> ")) {
    return null;
  }

  return normalizeRepoPath(singleStatusMatch[2]);
}

function parseJsonStatusSuccess(line) {
  const trimmed = line.trim();

  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (isRecord(parsed) && parsed.status === "success") {
      return parsed;
    }
  } catch (error) {
    return null;
  }

  return null;
}

function parseTranscriptEvidenceCandidates(transcriptText) {
  if (typeof transcriptText !== "string") {
    throw new Error("transcriptText must be a string");
  }

  if (transcriptText.trim().length === 0) {
    return [];
  }

  const candidates = [];
  const lines = transcriptText.split(/\r\n|\n|\r/);
  let currentSectionLabel = null;
  let currentSyntaxSubject = null;
  let syntaxSuccessRecorded = false;
  let pendingCleanSection = null;

  function finalizePendingCleanSection() {
    if (!pendingCleanSection) {
      return;
    }

    if (!pendingCleanSection.hasMeaningfulContent) {
      candidates.push(
        buildCandidate(
          "git",
          "info",
          `Git status clean in ${pendingCleanSection.sectionLabel}`,
          "git status clean",
          pendingCleanSection.lineNumber,
          pendingCleanSection.matchedText,
          pendingCleanSection.sectionLabel,
          { status: "clean" }
        )
      );
    }

    pendingCleanSection = null;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();
    const lineNumber = index + 1;
    const sectionHeaderMatch = line.match(SECTION_HEADER_PATTERN);

    if (sectionHeaderMatch) {
      finalizePendingCleanSection();

      currentSectionLabel = sectionHeaderMatch[1].trim() || null;
      syntaxSuccessRecorded = false;
      currentSyntaxSubject = null;

      if (currentSectionLabel) {
        const syntaxSectionMatch = currentSectionLabel.match(SYNTAX_SECTION_PATTERN);

        if (syntaxSectionMatch) {
          currentSyntaxSubject = normalizeRepoPath(syntaxSectionMatch[1]);
        }

        if (CLEAN_GIT_STATUS_SECTIONS.has(currentSectionLabel)) {
          pendingCleanSection = {
            sectionLabel: currentSectionLabel,
            lineNumber,
            matchedText: line,
            hasMeaningfulContent: false
          };
        }
      }

      continue;
    }

    if (pendingCleanSection && trimmedLine.length > 0) {
      pendingCleanSection.hasMeaningfulContent = true;
    }

    const gitStatusPath = getGitStatusPath(line);

    if (gitStatusPath) {
      candidates.push(
        buildCandidate(
          "git",
          "info",
          `Git status dirty for ${gitStatusPath}`,
          "git status dirty",
          lineNumber,
          line,
          currentSectionLabel,
          {
            status: "dirty",
            paths: [gitStatusPath]
          }
        )
      );

      continue;
    }

    if (currentSyntaxSubject && !syntaxSuccessRecorded && SYNTAX_SUCCESS_PATTERN.test(trimmedLine)) {
      candidates.push(
        buildCandidate(
          "syntax",
          "pass",
          `Syntax check passed for ${currentSyntaxSubject}`,
          "syntax pass",
          lineNumber,
          line,
          currentSectionLabel,
          {},
          currentSyntaxSubject
        )
      );

      syntaxSuccessRecorded = true;
      continue;
    }

    if (trimmedLine === TEST_HARNESS_SUCCESS_LINE) {
      candidates.push(
        buildCandidate(
          "test",
          "pass",
          TEST_HARNESS_SUCCESS_LINE,
          "full test harness",
          lineNumber,
          line,
          currentSectionLabel,
          {},
          "tests/run.js"
        )
      );

      continue;
    }

    const parsedJson = parseJsonStatusSuccess(line);

    if (parsedJson) {
      candidates.push(
        buildCandidate(
          "targeted_command",
          "pass",
          "JSON status success",
          "json status",
          lineNumber,
          line,
          currentSectionLabel,
          {
            status: "success",
            parsed: parsedJson
          }
        )
      );

      continue;
    }

    const commitMatch = trimmedLine.match(COMMIT_LINE_PATTERN);

    if (commitMatch) {
      candidates.push(
        buildCandidate(
          "git",
          "info",
          `Git commit ${commitMatch[1]}: ${commitMatch[2]}`,
          "git commit",
          lineNumber,
          line,
          currentSectionLabel,
          {
            gitCommit: commitMatch[1],
            commitMessage: commitMatch[2]
          }
        )
      );

      continue;
    }

    const headMatch = trimmedLine.match(HEAD_LINE_PATTERN);

    if (headMatch) {
      candidates.push(
        buildCandidate(
          "git",
          "info",
          `HEAD ${headMatch[1]}: ${headMatch[2]}`,
          "git head",
          lineNumber,
          line,
          currentSectionLabel,
          {
            gitHead: headMatch[1],
            commitMessage: headMatch[2]
          }
        )
      );
    }
  }

  finalizePendingCleanSection();

  return candidates;
}

module.exports = {
  parseTranscriptEvidenceCandidates
};
