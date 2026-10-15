const axios = require("axios");

module.exports = {
  config: {
    name: "pnx",
    aliases: ["anihot2", "waifuadult", "noughti"],
    version: "2.0",
    author: "乛 SIYAM ゎ",
    countDown: 3,
    role: 2,
    shortDescription: "Get anime nsfw image",
    longDescription: "Fetch direct image from API",
    category: "18+",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      const response = await axios.get("https://xalman-apis.vercel.app/api/waifuadult", {
        responseType: "stream"
      });

      return api.sendMessage({
        body: "😋𝗛𝗲𝗿𝗲 𝗶𝘀 𝘆𝗼𝘂𝗿 𝗮𝗱𝘂𝗹𝘁 𝗮𝗻𝗶𝗺𝗲 𝗶𝗺𝗮𝗴𝗲🫦",
        attachment: response.data
      }, event.threadID, event.messageID);

    } catch (error) {
      return api.sendMessage("Error fetching image.", event.threadID);
    }
  }
};
