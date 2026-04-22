const { createCommandTool } = require("./commandTool");

module.exports = createCommandTool({
  name: "ffmpeg",
  envVar: "NODEX_FFMPEG_COMMAND"
});
