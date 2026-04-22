const { createCommandTool } = require("./commandTool");

module.exports = createCommandTool({
  name: "image",
  envVar: "NODEX_IMAGE_COMMAND"
});
