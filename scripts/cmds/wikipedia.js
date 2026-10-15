const axios = require("axios");

module.exports = {
  config: {
    name: "wikipedia",
    aliases: ["wiki"],
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    category: "education",
    shortDescription: {
      en: "Search Wikipedia for information",
    },
    guide: {
      en: "{pn} <search query>\nExample: /wiki Albert Einstein",
    },
  },

  onStart: async function ({ args, api, event }) {
    try {
      if (args.length === 0) {
        return api.sendMessage(
          "Please provide a search query!",
          event.threadID,
          event.messageID
        );
      }

      const query = args.join(" ");

      const msg = await api.sendMessage(
        `🔍 Searching Wikipedia for "${query}"....`,
        event.threadID
      );

      const headers = {
        'User-Agent': 'GoatBot v3 (Rasin)',
        'Accept': 'application/json'
      };

      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&utf8=1`;
      const searchResponse = await axios.get(searchUrl, { headers });

      if (searchResponse.data.query.search.length === 0) {
        return api.editMessage(
          `❌ No results found for "${query}".\nTry a different search term.`,
          msg.messageID
        );
      }

      const pageId = searchResponse.data.query.search[0].pageid;
      const title = searchResponse.data.query.search[0].title;

      const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&pageids=${pageId}`;
      const extractResponse = await axios.get(extractUrl, { headers });

      let extract = extractResponse.data.query.pages[pageId].extract;

      if (extract.length > 1000) {
        extract = extract.substring(0, 1000) + "...";
      }

      const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

      const result = `
      📚 WIKIPEDIA 📚


📖 Title: ${title}

━━━━━━━━━━━━━━━━━━━━━━

${extract}

━━━━━━━━━━━━━━━━━━━━━━
🔗 Read more: ${pageUrl}
      `.trim();

      await api.editMessage(result, msg.messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage(
        "❌ Failed to fetch Wikipedia data! Please try again.",
        event.threadID,
        event.messageID
      );
    }
  },
};
