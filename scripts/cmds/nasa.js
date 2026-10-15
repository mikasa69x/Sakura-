const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "nasa",
    aliases: ["nasa", "astronomy"],
    author: "乛 SIYAM ゎ",
    countDown: 10,
    role: 0,
    category: "education",
    shortDescription: {
      en: "Get NASA's Astronomy Picture of the Day",
    },
    guide: {
      en: "{pn} [date]\nExample: {pn} 2024-01-15\nLeave empty for today's picture",
    },
  },

  onStart: async function ({ args, api, event }) {
    try {
      const msg = await api.sendMessage(
        "🪶 Searching NASA's Astronomy Picture of the Day...",
        event.threadID
      );

      let apiUrl = "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY";
      
      if (args[0]) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(args[0])) {
          return api.editMessage(
            "✘ Invalid date format! Use YYYY-MM-DD\nExample: 2024-01-15",
            msg.messageID
          );
        }
        apiUrl += `&date=${args[0]}`;
      }

      const response = await axios.get(apiUrl);
      const data = response.data;

      let result = `⭐ NASA APOD ⭐\n\n`;
      result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `֎ Date: ${data.date}\n`;
      result += `֎ Title: ${data.title}\n\n`;
      result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `${data.explanation}\n\n`;
      result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      
      if (data.copyright) {
        result += `❍ Copyright: ${data.copyright}\n`;
      }

      await api.editMessage(result, msg.messageID);

      // Download and send image if available
      if (data.media_type === "image") {
        const imagePath = path.join(__dirname, "cache", `apod_${Date.now()}.jpg`);
        const writer = fs.createWriteStream(imagePath);
        
        const imageResponse = await axios({
          url: data.hdurl || data.url,
          method: 'GET',
          responseType: 'stream'
        });

        imageResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await api.sendMessage(
          {
            body: `⭐ ${data.title}`,
            attachment: fs.createReadStream(imagePath)
          },
          event.threadID
        );

        fs.unlinkSync(imagePath);
      }

    } catch (e) {
      console.error(e);
      return api.sendMessage(
        "✘ Failed to fetch NASA APOD! Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  },
};
