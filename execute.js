const { runFromEvolutionFile } = require("./execution/pythonSandbox");
const { runContextExport } = require("./core/contextExporter");

if (require.main === module) {
  const result = runFromEvolutionFile();

  runContextExport();

  if (result.status === "error" && result.error) {
    process.exitCode = 1;
  }
}

module.exports = {
  runFromEvolutionFile
};
