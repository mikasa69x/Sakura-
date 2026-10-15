const axios = require("axios");

const IMAGE_ACTIONS = [
  "ngif","hug","gecg","pat","cuddle","meow","tickle","gasm","goose",
  "lewd","v3","spank","feed","slap","wallpaper","neko","lizard",
  "woof","fox_girl","kiss","avatar","waifu","smug"
];

const TEXT_ACTIONS = [
  "fact","why","name","owoify","spoiler","8ball"
];

function buildMenu() {
  let i = 1;
  let text = `✨ 𝗡𝗘𝗞𝗢𝗦 𝗠𝗘𝗡𝗨 ✨\n\n`;
  text += `🖼 𝗜𝗠𝗔𝗚𝗘 / 𝗚𝗜𝗙\n`;

  for (const a of IMAGE_ACTIONS) {
    text += `  ${i}. ${a}\n`;
    i++;
  }

  text += `\n👽 𝗧𝗘𝗫𝗧 / 𝗙𝗨𝗡\n`;
  for (const a of TEXT_ACTIONS) {
    text += `  ${i}. ${a}\n`;
    i++;
  }

  text += `\n📌 Reply with number (1-${i - 1})`;
  return text;
}

module.exports = {
  config: {
    name: "nekos",
    aliases: [],
    version: "2.0.0",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 2,
    shortDescription: { en: "Advanced Nekos.life menu system" },
    category: "anime",
    guide: { en: "{p}nekos" }
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage(
      buildMenu(),
      event.threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "nekos",
          author: event.senderID
        });
      }
    );
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const choice = parseInt(event.body);
    if (isNaN(choice)) return;

    const allActions = [...IMAGE_ACTIONS, ...TEXT_ACTIONS];
    const action = allActions[choice - 1];
    if (!action) return;

    try {
      /* IMAGE / GIF */
      if (IMAGE_ACTIONS.includes(action)) {
        const res = await axios.get(
          `https://nekos.life/api/v2/img/${action}`
        );

        return api.sendMessage(
          {
            body: `✨ ${action.toUpperCase()} ✨`,
            attachment: await global.utils.getStreamFromURL(res.data.url)
          },
          event.threadID
        );
      }

      /* TEXT */
      const res = await axios.get(
        `https://nekos.life/api/v2/${action}`
      );

      const key = Object.keys(res.data)[0];
      return api.sendMessage(
        `✨ ${action.toUpperCase()} ✨\n${res.data[key]}`,
        event.threadID
      );

    } catch (e) {
      console.error("nekos error:", e);
      api.sendMessage(
        "❌ Something went wrong, try again later.",
        event.threadID
      );
    }
  }
};
