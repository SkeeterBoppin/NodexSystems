const { runEvolution } = require("./evolution/evolver");
const { runContextExport } = require("./core/contextExporter");

if (require.main === module) {
  runEvolution({ maxAttempts: 1, parallelAttempts: 1 }).then(result => {
    runContextExport();

    if (result.status === "error") {
      process.exitCode = 1;
    }
  });
}

module.exports = {
  runEvolution
};
