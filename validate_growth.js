const fs = require('fs');

const context = fs.readFileSync('CONTEXT.md', 'utf-8');

// --- count entries
const lines = context.split("\n").filter(l => l.startsWith("* "));

const MAX_ITEMS = 60;

if (lines.length > MAX_ITEMS) {
  console.log("⚠️ Growth limit exceeded:", lines.length);

  // trim oldest entries
  const trimmed = lines.slice(-MAX_ITEMS);

  const newContent =
    "## PREFERENCES (stable patterns)\n\n" +
    trimmed.join("\n");

  fs.writeFileSync("CONTEXT_TRIMMED.md", newContent);

  console.log("Created CONTEXT_TRIMMED.md");
} else {
  console.log("Growth within limits:", lines.length);
}