const { createCommandTool } = require("./commandTool");

module.exports = createCommandTool({
  name: "audio",
  envVar: "NODEX_AUDIO_COMMAND"
});
