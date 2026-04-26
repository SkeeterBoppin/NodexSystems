const fs = require('fs');

const context = fs.readFileSync('CONTEXT.md', 'utf-8');

// --- extract bullet points
function extractLines(text) {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("* "))
    .map(l => l.slice(2));
}

// --- simple contradiction rules
function detectContradictions(lines) {
  let issues = [];

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const a = lines[i].toLowerCase();
      const b = lines[j].toLowerCase();

      // contradiction patterns
      if (
        (a.includes("increase complexity") && b.includes("reduce complexity")) ||
        (a.includes("strict validation") && b.includes("flexible validation")) ||
        (a.includes("centralized") && b.includes("decentralized"))
      ) {
        issues.push({
          a: lines[i],
          b: lines[j]
        });
      }
    }
  }

  return issues;
}

// --- run
const lines = extractLines(context);
const contradictions = detectContradictions(lines);

if (contradictions.length === 0) {
  console.log("No contradictions detected");
} else {
  console.log("CONTRADICTIONS FOUND:");

  let badLines = new Set();

  contradictions.forEach(c => {
    console.log("\n---");
    console.log("A:", c.a);
    console.log("B:", c.b);

    // mark both as bad (simple first pass)
    badLines.add(c.a);
    badLines.add(c.b);
  });

  // 🔥 CLEAN CONTEXT
  const cleaned = lines.filter(l => !badLines.has(l));

  const newContent =
    "## PREFERENCES (cleaned)\n\n" +
    cleaned.map(l => "* " + l).join("\n");

  fs.writeFileSync("CONTEXT_CLEANED.md", newContent);

  console.log("\n🧹 Cleaned context written to CONTEXT_CLEANED.md");
}
