const { createCommandTool } = require("./commandTool");

module.exports = createCommandTool({
  name: "video",
  envVar: "NODEX_VIDEO_COMMAND"
});
