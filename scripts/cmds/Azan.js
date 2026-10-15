const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "azan",
    version: "2.0.0",
    author: "—͞Sɪʏᴀᴍ ☯",
    countDown: 0,
    role: 0,
    shortDescription: { en: "Auto Azan & Namaz Reminder" },
    category: "islam",
    guide: { en: "{pn} on | {pn} off" }
  },

  onStart: async function ({ api, event, args, threadsData, message }) {
    const { threadID, senderID } = event;
    const adminUID = "100065590940242";
    const threadData = await threadsData.get(threadID);
    const data = threadData.data || {};

    if (args[0] === "on") {
      if (senderID !== adminUID)
        return message.reply("𝐇𝐨𝐩 , 𝐊𝐧𝐨𝐰 𝐲𝐨𝐮𝐫 𝐩𝐥𝐚𝐜𝐞. 𝐎𝐧𝐥𝐲 —͞Sɪʏᴀᴍ ☯ 𝐜𝐚𝐧 𝐨𝐧 𝐭𝐡𝐢𝐬! 👑⚔️");

      data.azanStatus = true;
      await threadsData.set(threadID, { data });

      return message.reply("✅ 𝐀𝐳𝐚𝐧 & 𝐍𝐚𝐦𝐚𝐳 𝐑𝐞𝐦𝐢𝐧𝐝𝐞𝐫 𝐢𝐬 𝐧𝐨𝐰 𝐎𝐍! ✨");
    }

    if (args[0] === "off") {
      if (senderID !== adminUID)
        return message.reply("𝐇𝐨𝐩, 𝐊𝐧𝐨𝐰 𝐲𝐨𝐮𝐫 𝐩𝐥𝐚𝐜𝐞. 𝐎𝐧𝐥𝐲 —͞Sɪʏᴀᴍ ☯ 𝐜𝐚𝐧 𝐨𝐟𝐟 𝐭𝐡𝐢𝐬! 👑⚔️");

      data.azanStatus = false;
      await threadsData.set(threadID, { data });

      return message.reply("❌ 𝐀𝐳𝐚𝐧 𝐑𝐞𝐦𝐢𝐧𝐝𝐞𝐫 𝐢𝐬 𝐧𝐨𝐰 𝐎𝐅𝐅!");
    }

    // Manual Time Check
    const msg = `🪽 𝐏𝐑𝐀𝐘𝐄𝐑 𝐓𝐈𝐌𝐄𝐒 (𝐂𝐔𝐒𝐓𝐎𝐌) 🌷
──────────────────
🌅 𝐅𝐚𝐣𝐫: 04:30
☀️ 𝐃𝐡𝐮𝐡𝐫: 12:45
🌇 𝐀𝐬𝐫: 16:00
🌆 𝐌𝐚𝐠𝐡𝐫𝐢𝐛: 17:47
🌃 𝐈𝐬𝐡𝐚: 19:15
──────────────────
🕊️ 𝐒𝐞𝐧𝐭 𝐛𝐲 ─⃝‌‌愛𝐌𝐢𝐤𝐚𝐬𝐚 🧣`;

    return message.reply(msg);
  },

  onLoad: async function ({ api }) {
    if (!global.azanInterval) {
      global.azanInterval = setInterval(async () => {
        const currentTime = moment
          .tz("Asia/Dhaka")
          .format("HH:mm");

        try {
          const prayerNames = {
            Fajr: "𝐅𝐚𝐣𝐫 (ফজর)",
            Dhuhr: "𝐃𝐡𝐮𝐡𝐫 (যোহর)",
            Asr: "𝐀𝐬𝐫 (আসর)",
            Maghrib: "𝐌𝐚𝐠𝐡𝐫𝐢𝐛 (মাগরিব)",
            Isha: "𝐈𝐬𝐡𝐚 (এশা)"
          };

          // নিজের টাইম এখানে change করবা
          const customTimes = {
            Fajr: "04:30",
            Dhuhr: "12:59",
            Asr: "17:15",
            Maghrib: "17:47",
            Isha: "19:20"
          };

          for (const [key, value] of Object.entries(prayerNames)) {
            if (customTimes[key] === currentTime) {

              const allThreads = await api.getThreadList(
                100,
                null,
                ["INBOX"]
              );

              const msg = `→     🌺 𝐀𝐙𝐀𝐍 𝐀𝐋𝐄𝐑𝐓! 🌸
══════════════════════
✨ ɪᴛ'ꜱ ᴛɪᴍᴇ ꜰᴏʀ ${value}!
🌿 ʏᴏᴜʀ ꜱᴏᴜʟ ɴᴇᴇᴅꜱ ꜱᴀʟᴀʜ,
❤️‍🩹 ᴘʀᴀʏᴇʀ ɪꜱ ᴛʜᴇ ᴘᴀᴛʜ ᴛᴏ ᴘᴇᴀᴄᴇ!
════════════════════
ᴇᴠᴇʀʏ ᴘʀᴀʏᴇʀ ʙʀɪɴɢꜱ ʏᴏᴜ ᴄʟᴏꜱᴇʀ ᴛᴏ ᴀʟʟᴀʜ 🤍
════════════════════
🎀 ᴀᴅᴍɪɴ : 🩶─⃝‌‌Sɪʏᴀᴍ`;

              allThreads.forEach(async (thread) => {
                api.sendMessage(msg, thread.threadID);
              });
            }
          }
        } catch (err) {
          console.log("Azan Error:", err);
        }
      }, 60000);
    }
  }
};
