[CmdletBinding()]
param(
  [string]$Repo = "C:\Users\Zak\OneDrive\Desktop\Nodex System\Node",
  [string]$EvidenceDir = "C:\Users\Zak\OneDrive\Desktop\Nodex Evidence",
  [switch]$NoClipboard
)

$ErrorActionPreference = "Stop";

function Get-FirstMatchingLine {
  param(
    [string]$Text,
    [string[]]$Patterns
  )

  foreach ($pattern in $Patterns) {
    $match = [regex]::Match($Text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase);
    if ($match.Success) {
      return $match.Groups[1].Value.Trim();
    }
  }

  return "unclassified";
}

function New-OperatorAssistPacketId {
  return "operator_assist_packet_v1_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss");
}

if (-not (Test-Path $Repo)) {
  throw "Repo path not found: $Repo";
}

if (-not (Test-Path $EvidenceDir)) {
  throw "Evidence directory not found: $EvidenceDir";
}

$latestSummary = Get-ChildItem $EvidenceDir -Filter "*_summary_*.txt" |
  Where-Object {
    $_.Name -notlike "operator_assist_generated_packet_v1_*" -and
    $_.Name -notlike "operator_assist_command_packet_implementation_v1_summary_*"
  } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1;

if (-not $latestSummary) {
  throw "No evidence summary files found in: $EvidenceDir";
}

$summaryText = Get-Content -Raw -Path $latestSummary.FullName;

$nextSeam = Get-FirstMatchingLine -Text $summaryText -Patterns @(
  "nextAllowedSeam:\s*([^\r\n]+)",
  "nextAllowedSeam:\s*([^\r\n]+)",
  "Next allowed seam:\s*[-:]?\s*([^\r\n]+)",
  "Next recommended seam:\s*[-:]?\s*([^\r\n]+)"
);

$packetId = New-OperatorAssistPacketId;
$packetStamp = Get-Date -Format "yyyyMMdd_HHmmss";
$packetJsonPath = Join-Path $EvidenceDir ("operator_assist_generated_packet_v1_{0}.json" -f $packetStamp);
$packetTextPath = Join-Path $EvidenceDir ("operator_assist_generated_packet_v1_{0}.txt" -f $packetStamp);

$blockedActions = @(
  "auto-execution",
  "repo mutation by helper",
  "git staging",
  "git commit",
  "file deletion",
  "Codex invocation",
  "tool execution",
  "permission grants",
  "runtime integration"
);

$packet = [ordered]@{
  packetId = $packetId
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  repo = $Repo
  runLocation = "Nodex Workbench — existing PowerShell 7 tab"
  sourceEvidence = $latestSummary.FullName
  seam = $nextSeam
  mode = "operator_assist_request"
  mutationClass = "external_evidence_only"
  allowedAction = "Generate the next validated Nodex command packet from the attached/latest evidence summary."
  blockedActions = $blockedActions
  expectedDirtyState = "unknown_until_next_packet_generated"
  requiresUserPasteAndEnter = $true
  autoExecute = $false
  commandText = "Do not run this packet as PowerShell. Paste this packet into ChatGPT/Nodex context and request the next allowed command packet."
};

$packetJson = $packet | ConvertTo-Json -Depth 20;

$packetText = @"
=== NODEX OPERATOR ASSIST COMMAND PACKET V1 ===

MasterSourceCheck:
- pass: true
- conflict: false
- scope_limited: true
- allowed_now: generate_next_validated_packet
- blocked_now: auto-execution, repo mutation by helper, git staging, git commit, file deletion, Codex invocation, permission grants, runtime integration
- reason: this packet transfers latest evidence context only; user remains execution gate

Packet:
- packetId: $packetId
- generatedAt: $($packet.generatedAt)
- repo: $Repo
- runLocation: Nodex Workbench — existing PowerShell 7 tab
- sourceEvidence: $($latestSummary.FullName)
- seam: $nextSeam
- mode: operator_assist_request
- mutationClass: external_evidence_only
- requiresUserPasteAndEnter: true
- autoExecute: false

Request:
Generate the next allowed Nodex command packet using this source evidence.
Preserve deterministic terms.
Preserve MasterSourceCheck.
Do not auto-run anything.
Do not grant runtime/file/git/tool authority unless the source evidence explicitly allows that seam.

--- SOURCE EVIDENCE SUMMARY ---
$summaryText
"@;

$packetJson | Set-Content -Path $packetJsonPath -Encoding UTF8;
$packetText | Set-Content -Path $packetTextPath -Encoding UTF8;

if (-not $NoClipboard) {
  $packetText | Set-Clipboard;
}

Write-Host "=== NODEX NEXT PACKET GENERATED ===";
Write-Host "";
Write-Host "Packet:";
Write-Host "- JSON: $packetJsonPath";
Write-Host "- Text: $packetTextPath";
Write-Host "";
Write-Host "Source evidence:";
Write-Host "- $($latestSummary.FullName)";
Write-Host "";
Write-Host "Next seam:";
Write-Host "- $nextSeam";
Write-Host "";
Write-Host "Clipboard:";
if ($NoClipboard) {
  Write-Host "- skipped";
} else {
  Write-Host "- copied";
}
Write-Host "";
Write-Host "Execution:";
Write-Host "- autoExecute: false";
Write-Host "- requiresUserPasteAndEnter: true";
