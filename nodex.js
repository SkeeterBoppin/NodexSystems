const { runNodex } = require("./core/nodexController");

async function main() {
  const userInput = process.argv.slice(2).join(" ").trim();

  if (!userInput) {
    console.log(JSON.stringify({
      status: "error",
      tool: "none",
      output: "",
      error: "Usage: node nodex.js \"your task\""
    }));
    process.exitCode = 1;
    return;
  }

  const result = await runNodex(userInput);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch(err => {
    console.error(JSON.stringify({
      status: "error",
      tool: "none",
      output: "",
      error: err.message
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  main
};
