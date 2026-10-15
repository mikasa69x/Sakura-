const axios = require("axios");

module.exports = {
  config: {
    name: "slyrics",
    aliases: ["lyrics2"],
    version: "2.1",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    shortDescription: "Get song lyrics",
    category: "tools",
    guide: "{pn} [song name]"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const songName = args.join(" ");

    if (!songName) {
      return api.sendMessage(
        "╭─❍\n│ Please provide a song name!\n╰───────────⟡",
        threadID,
        messageID
      );
    }

    api.sendMessage(`🔍 | Searching lyrics for "${songName}"...`, threadID);

    try {
      const { data } = await axios.get(
        `https://xalman-apis.vercel.app/api/lyrics?song=${encodeURIComponent(songName)}`
      );

      if (!data.status || !data.data) {
        return api.sendMessage(
          `❌ | Lyrics not found for "${songName}".`,
          threadID,
          messageID
        );
      }

      const { title, artist, lyrics } = data.data;

      const msg = `╭───────❍
│ 『 𝗦𝗢𝗡𝗚 𝗟𝗬𝗥𝗜𝗖𝗦 』
╰───────────⟡

🎵 Title  : ${title}
👤 Artist : ${artist}

📜 Lyrics :
━━━━━━━━━━━━━━━━━━
${lyrics}
━━━━━━━━━━━━━━━━━━`;

      return api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      console.log(err);

      return api.sendMessage(
        `❌ | Failed to fetch lyrics.\n${err.message}`,
        threadID,
        messageID
      );
    }
  }
};
