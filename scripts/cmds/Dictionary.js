const axios = require("axios");

module.exports = {
  config: {
    name: "dictionary",
    aliases: ["ud", "urbandict"],
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    category: "education",
    shortDescription: {
      en: "Search Urban Dictionary for slang definitions",
    },
    guide: {
      en: "{pn} <word/phrase>\nExample: {pn} GOAT",
    },
  },

  onStart: async function ({ args, api, event }) {
    try {
      if (args.length === 0) {
        return api.sendMessage(
          "Please provide a word or phrase to search!",
          event.threadID,
          event.messageID
        );
      }

      const query = args.join(" ");

      const msg = await api.sendMessage(
        `⭐ Searching Urban Dictionary for "${query}"...`,
        event.threadID
      );

      const apiUrl = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      if (!response.data.list || response.data.list.length === 0) {
        return api.editMessage(
          `❌ No definitions found for "${query}".\nTry a different word or phrase.`,
          msg.messageID
        );
      }

      const topResult = response.data.list[0];
      
      let definition = topResult.definition.replace(/\[|\]/g, "");
      let example = topResult.example.replace(/\[|\]/g, "");

      if (definition.length > 800) {
        definition = definition.substring(0, 800) + "...";
      }

      if (example.length > 300) {
        example = example.substring(0, 300) + "...";
      }

      let result = `🍒 URBAN DICTIONARY 🍒\n\n`;
      result += `֎ Word: ${topResult.word}\n\n`;
      result += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `❍ Definition:\n${definition}\n\n`;
      
      if (example.trim()) {
        result += `❍ Example:\n${example}\n\n`;
      }

      result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      result += `❍ Upvotes: ${topResult.thumbs_up} | Downvotes: ${topResult.thumbs_down}\n`;
      result += `❍ By: ${topResult.author}\n`;
      result += `❍ Date: ${new Date(topResult.written_on).toLocaleDateString()}\n\n`;
      result += `❍ Link: ${topResult.permalink}`;

      await api.editMessage(result, msg.messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage(
        "❌ Failed to fetchh Urban Dictionary data! Please try again.",
        event.threadID,
        event.messageID
      );
    }
  },
};
