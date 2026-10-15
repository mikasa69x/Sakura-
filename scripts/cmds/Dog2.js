const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "dog2",
    author: "—͞Sɪʏꫝᴍㅤ友",
    category: "image",
    version: "1.0",
    role: 0,
    shortDescription: { en: "🐶 Send a random dog image" },
    longDescription: { en: "Fetches a random dog image." },
    guide: { en: "{p}{n} — Shows a random dog image" }
  },

  onStart: async function({ api, event }) {
    try {
      const apiUrl = "https://xsaim8x-xxx-api.onrender.com/api/dog"; // তোমার API

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");

      const tempPath = path.join(__dirname, "dog_temp.jpg");
      fs.writeFileSync(tempPath, buffer);

      await api.sendMessage(
        {
          body: "🐶 Here's a random dog for you!",
          attachment: fs.createReadStream(tempPath)
        },
        event.threadID,
        () => {
          
          fs.unlinkSync(tempPath);
        },
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to fetch dog image.\n" + err.message, event.threadID, event.messageID);
    }
  }
};
