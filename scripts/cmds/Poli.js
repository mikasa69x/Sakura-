const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function getApiBase() {
  try {
    const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
    const rawRes = await axios.get(GITHUB_RAW);
    return rawRes.data.apiv1;
  } catch (e) {
    console.error("Failed to fetch API base:", e.message);
    return null;
  }
}

module.exports = {
  config: {
    name: "poli",
    aliases: [],
    version: "1.0",
    author: "—͞Sɪʏꫝᴍㅤ友",
    countDown: 5,
    role: 0,
    description: {
      en: "Generate an image",
    },
    category: "image generator",
    guide: {
      en: "{pn} <prompt>\nExample: ${prefix}poli futuristic dragon flying in space",
    },
  },

  onStart: async function ({ message, event, args, api, commandName }) {
    const prefix = global.utils?.getPrefix
      ? global.utils.getPrefix(event.threadID)
      : global.GoatBot?.config?.prefix || "/";

    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply(
        `⚠️ Please provide a prompt.\nExample: ${prefix}${commandName} futuristic dragon flying in space`
      );
    }

    api.setMessageReaction("🎨", event.messageID, () => {}, true);
    const waitingMsg = await message.reply("🎨 Generating your image... Please wait...");

    try {
      const apiBase = await getApiBase();
      if (!apiBase) throw new Error("API base not found!");

      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${apiBase}/api/poli?prompt=${encodedPrompt}`;
      const imgPath = path.join(__dirname, "cache", `poli_${event.senderID}.png`);

      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, response.data);

      await message.reply(
        {
          body: `✅ Image Generated Successfully!\n📝 Prompt: ${prompt}`,
          attachment: fs.createReadStream(imgPath),
        },
        () => {
          fs.unlinkSync(imgPath);
          if (waitingMsg?.messageID) api.unsendMessage(waitingMsg.messageID);
        }
      );
    } catch (error) {
      console.error("Poli generation error:", error);
      message.reply("⚠️ Failed to generate image. Please try again later.");
      if (waitingMsg?.messageID) api.unsendMessage(waitingMsg.messageID);
    }
  },
};
