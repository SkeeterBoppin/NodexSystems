const { runContextProcessor } = require("./memory/contextManager");

if (require.main === module) {
  runContextProcessor();
}

module.exports = {
  runContextProcessor
};
