const axios = require("axios");

module.exports = {
  config: {
    name: "aotqz",
    aliases: ["attackontitanquiz", "aotquiz"],
    version: "2.5",
    author: "乛 SIYAM ゎ",
    countDown: 10,
    role: 0,
    category: "aotfanonly👽",
    shortDescription: { en: "𝗀𝗎𝖾𝗌𝗌 𝗍𝗁𝖾 𝖺𝗈𝗍 𝖼𝗁𝖺𝗋𝖺𝖼𝗍𝖾𝗋" },
    guide: { en: "『 {pn} 』" }
  },

  onStart: async function ({ api, event }) {
    try {
      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const quizApiBase = rawRes.data.apiv1;

      const { data } = await axios.get(`${quizApiBase}/api/attackontitanqz`);
      const { image, options, answer } = data;

      const imageStream = await axios({ method: "GET", url: image, responseType: "stream" });

      const body = `╭──  𖹭 𝖺𝗈𝗍 𝗊𝗎𝗂𝗓 𖹭  ──╮\n\n` +
        `  ᯓ★ 𝗀𝗎𝖾𝗌𝗌 𝗍𝗁𝖾 𝖺𝗈𝗍 𝖼𝗁𝖺𝗋𝖺𝖼𝗍𝖾𝗋 .ᐟ\n\n` +
        `  𝖺. ${options.A}\n` +
        `  𝖻. ${options.B}\n` +
        `  𝖼. ${options.C}\n` +
        `  𝖽. ${options.D}\n\n` +
        `  ⋆ 𝗍𝗂𝗆𝖾: 𝟫𝟢𝗌\n` +
        `  ⋆ 𝖼𝗁𝖺𝗇𝖼𝖾𝗌: 𝟥\n` +
        `  ⋆ 𝗋𝖾𝗉𝗅𝗒 𝗐𝗂𝗍𝗁:A,B,C, 𝗈𝗋D\n\n` +
        `╰── ˙𐃷˙݁ ˖Ი𐑼.ᐟ ──╯`;

      return api.sendMessage(
        { body, attachment: imageStream.data },
        event.threadID,
        (err, info) => {
          if (err) return console.error(err);

          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            author: event.senderID,
            correctAnswer: answer,
            chances: 3,
            messageID: info.messageID
          });

          setTimeout(async () => {
            if (global.GoatBot.onReply.has(info.messageID)) {
              global.GoatBot.onReply.delete(info.messageID);
              try { api.unsendMessage(info.messageID); } catch(e) {}
            }
          }, 90000);
        },
        event.messageID
      );
    } catch (err) {
      return api.sendMessage("ᯓ★ 𝖿𝖺𝗂𝗅𝖾𝖽 𝗍𝗈 𝖿𝖾𝗍𝖼𝗁 𝖺𝗈𝗍 𝗊𝗎𝗂𝗓 𝖽𝖺𝗍𝖺 Ი𐑼", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    let { author, correctAnswer, messageID, chances } = Reply;
    const reply = event.body?.trim().toUpperCase();

    if (event.senderID !== author) {
      return api.sendMessage("ᯓ★ 𝗍𝗁𝗂𝗌 𝗂𝗌 𝗇𝗈𝗍 𝗒𝗈𝗎𝗋 𝗊𝗎𝗂𝗓 😑Ი𐑼", event.threadID, event.messageID);
    }

    if (!["A", "B", "C", "D"].includes(reply)) {
      return api.sendMessage("ᯓ★ 𝗉𝗅𝖾𝖺𝗌𝖾 𝗋𝖾𝗉𝗅𝗒 𝗐𝗂𝗍𝗁 𝖺, 𝖻, 𝖼 𝗈𝗋 𝖽 .ᐟ", event.threadID, event.messageID);
    }

    if (reply === correctAnswer) {
      const rewardCoin = 800;
      const rewardExp = 150;
      
      const userData = await usersData.get(event.senderID);
      await usersData.set(event.senderID, {
        money: (userData.money || 0) + rewardCoin,
        exp: (userData.exp || 0) + rewardExp
      });

      global.GoatBot.onReply.delete(messageID);
      try { api.unsendMessage(messageID); } catch(e) {}

      return api.sendMessage(
        `╭── Ი𐑼 𖹭 𝖼𝗈𝗋𝗋𝖾𝖼𝗍 𝖺𝗇𝗌𝗐𝖾𝗋 𖹭 Ი𐑼 ──╮\n\n` +
        `  ᯓ★ 𝗌𝗁𝗂𝗇𝗓𝗈𝗎 𝗐𝗈 𝗌𝖺𝗌𝖺𝗀𝖾𝗒𝗈 .ᐟ\n` +
        `  ⋆ 𝗋𝖾𝗐𝖺𝗋𝖽: +${rewardCoin} 𝖼𝗈𝗂𝗇𝗌\n` +
        `  ⋆ 𝖻𝗈𝗇𝗎𝗌: +${rewardExp} 𝖾𝗑𝗉\n\n` +
        `╰── ᯓ★˙𐃷˙݁ ˖Ი𐑼⋆𖹭.ᐟ ──╯`,
        event.threadID,
        event.messageID
      );
    } else {
      chances--;
      if (chances > 0) {
        global.GoatBot.onReply.set(messageID, { ...Reply, chances });
        return api.sendMessage(`ᯓ★ 𝗐𝗋𝗈𝗇𝗀 𝖺𝗇𝗌𝗐𝖾𝗋 .ᐟ\n  ⋆ 𝗒𝗈𝗎 𝗁𝖺𝗏𝖾 ${chances} 𝖼𝗁𝖺𝗇𝖼𝖾𝗌 𝗅𝖾𝖿𝗍 Ი𐑼`, event.threadID, event.messageID);
      } else {
        global.GoatBot.onReply.delete(messageID);
        try { api.unsendMessage(messageID); } catch(e) {}
        return api.sendMessage(`ᯓ★ 𝗀𝖺𝗆𝖾 𝗈𝗏𝖾𝗋 .ᐟ\n  ⋆ 𝗍𝗁𝖾 𝖼𝗈𝗋𝗋𝖾𝖼𝗍 𝖺𝗇𝗌𝗐𝖾𝗋 𝗐𝖺𝗌: ${correctAnswer} Ი𐑼`, event.threadID, event.messageID);
      }
    }
  }
};
