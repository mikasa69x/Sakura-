const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "blu2r",
    version: "1.0",
    author: "Saimx69x",
    countDown: 5,
    role: 0,
    category: "fun",
    description: "Blur replied image using specified level",
    guide: "{pn} [level] — Reply to an image and choose blur level (default 3)"
  },

  onStart: async function ({ api, args, message, event }) {
    try {
      let blurLevel = parseInt(args[0]) || 3;
      let imageUrl;

      if (event.type === "message_reply") {
        const attachment = event.messageReply.attachments?.[0];
        if (!attachment)
          return message.reply("❌ | Please reply to an image.");
        if (attachment.type !== "photo")
          return message.reply("❌ | Only image replies are supported. Video or files not allowed.");
        imageUrl = attachment.url;
      } else {
        return message.reply("❌ | Please reply to an image to use this command.");
      }

      api.setMessageReaction("🌫️", event.messageID, () => {}, true);
      const waitMsg = await message.reply(`Applying blur level ${blurLevel}... 🌫️`);

      const RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const { data } = await axios.get(RAW);
      const apiBase = data.apiv1;

      const apiUrl = `${apiBase}/api/blur?url=${encodeURIComponent(imageUrl)}&level=${encodeURIComponent(blurLevel)}`;
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

      const filePath = path.join(__dirname, "cache", `blur_${Date.now()}.png`);
      await fs.outputFile(filePath, response.data);

      message.unsend(waitMsg.messageID);
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      message.reply({
        body: `✅ | Here's your blurred image (Level: ${blurLevel}) 🌫️`,
        attachment: fs.createReadStream(filePath)
      });

    } catch (error) {
      console.error(error);
      message.reply("❌ | Failed to apply blur. Please try again later.");
    }
  }
};
