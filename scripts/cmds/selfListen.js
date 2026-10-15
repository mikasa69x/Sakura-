const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sl",
    aliases: ["selfListen"],
    version: "2.0",
    author: "xiyam",
    role: 2,
    shortDescription: "Toggle selfListen",
    longDescription: "Toggle bot self-listen without restarting",
    category: "owner",
    guide: "/sl on | /sl off"
  },

  onStart: async function ({ args, message, event, api }) {
    const input = args[0]?.toLowerCase();

    const configPath = path.join(__dirname, "..", "..", "config.json");
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (err) {
      return message.reply("❌ Can't load config file.");
    }

    if (!input) {
      const status = config.optionsFca.selfListen ? "ON" : "OFF";
      return message.reply(`🤖 selfListen is currently ${status}.\nUse /sl on or /sl off`);
    }

    if (!["on", "off"].includes(input)) {
      return message.reply("❌ Invalid option. Use /sl on or /sl off");
    }

    const newValue = input === "on";

    try {
      config.optionsFca.selfListen = newValue;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      api.setOptions({ selfListen: newValue });

      const replyMsg = `✅ selfListen turned ${newValue ? "ON" : "OFF"}.`;
      message.reply(replyMsg);
      console.log(`[SL COMMAND] selfListen changed to ${newValue} by ${event.senderID} at ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error("[SL COMMAND ERROR]", err);
      message.reply("❌ Failed to update config.");
    }
  }
};
