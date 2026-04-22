const { runAuditFile } = require("./evolution/auditor");

if (require.main === module) {
  runAuditFile();
}

module.exports = {
  runAuditFile
};
