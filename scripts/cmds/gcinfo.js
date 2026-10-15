const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "gcinfo",
    aliases: ["boxinfo"],
    version: "2.0",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    description: {
      en: "📊 Get detailed group information with Group Photo"
    },
    category: "info",
    guide: {
      en: "{pn}\n{pn} [threadID]"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const { threadID } = event;
    let targetThreadID = threadID;

    if (args[0] && args[0].length > 15) {
      targetThreadID = args[0];
    }

    try {
      let threadInfo;
      try {
        threadInfo = await api.getThreadInfo(targetThreadID);
      } catch (err) {
        return message.reply("❌ Could not fetch group information. Invalid thread ID or bot not in that group.");
      }

      if (!threadInfo) {
        return message.reply("❌ Group not found!");
      }

      const groupName = threadInfo.name || "Unnamed Group";
      const approvalStatus = threadInfo.approvalMode ? "Turned on" : "Turned off";
      const groupEmoji = threadInfo.emoji || "⏺️";
      const participantIDs = threadInfo.participantIDs || [];
      const memberCount = participantIDs.length;

      let maleCount = 0;
      let femaleCount = 0;

      if (threadInfo.userInfo && threadInfo.userInfo.length > 0) {
        for (const user of threadInfo.userInfo) {
          if (user.gender === "MALE") maleCount++;
          else if (user.gender === "FEMALE") femaleCount++;
        }
      } else {
        const chunkSize = 50;
        for (let i = 0; i < participantIDs.length; i += chunkSize) {
          const chunk = participantIDs.slice(i, i + chunkSize);
          try {
            const userInfos = await api.getUserInfo(chunk);
            for (const uid in userInfos) {
              if (userInfos[uid].gender === 2) maleCount++; 
              else if (userInfos[uid].gender === 1) femaleCount++; 
            }
          } catch (e) {
            console.error("Gender fetch error:", e);
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const adminIDs = threadInfo.adminIDs || [];
      const adminNames = [];

      for (const admin of adminIDs) {
        const adminId = admin.id;
        try {
          const adminInfo = await api.getUserInfo(adminId);
          const adminName = adminInfo[adminId]?.name || "Unknown";
          adminNames.push(`  • ${adminName}`);
        } catch (e) {
          adminNames.push(`  • Admin (${adminId})`);
        }
      }

      let messageCount = "N/A";
      if (threadInfo.messageCount) {
        messageCount = threadInfo.messageCount.toLocaleString();
      } else if (threadInfo.messagesCount) {
        messageCount = threadInfo.messagesCount.toLocaleString();
      }

      let msg = `╔══════════════╗\n`;
      msg += `      🖤 𝐆𝐑𝐎𝐔𝐏 𝐈𝐍𝐅𝐎 🖤\n`;
      msg += `╚══════════════╝\n\n`;
      msg += `┏━━━━━━━━━━━━━━━━━┓\n`;
      msg += `┃ 🎀 [ 𝐆𝐂 𝐍𝐚𝐦𝐞 ]: ${groupName}\n`;
      msg += `┃ 🆔 [ 𝐆𝐫𝐨𝐮𝐩 𝐈𝐃 ]: ${targetThreadID}\n`;
      msg += `┃ ✅ [ 𝐀𝐩𝐩𝐫𝐨𝐯𝐚𝐥 ]: ${approvalStatus}\n`;
      msg += `┃ ❓ [ 𝐄𝐦𝐨𝐣𝐢 ]: ${groupEmoji}\n`;
      msg += `┃ 👥 [ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 ]: Including ${memberCount} Members\n`;
      msg += `┃ ♂️ [ 𝐍𝐮𝐦𝐛𝐞𝐫 𝐎𝐟 𝐌𝐚𝐥𝐞𝐬 ]: ${maleCount}\n`;
      msg += `┃ ♀️ [ 𝐍𝐮𝐦𝐛𝐞𝐫 𝐎𝐟 𝐅𝐞𝐦𝐚𝐥𝐞𝐬 ]: ${femaleCount}\n`;
      msg += `┃ 👑 [ 𝐓𝐨𝐭𝐚𝐥 𝐀𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐭𝐨𝐫𝐬 ]: ${adminIDs.length}\n`;
      msg += `┃ ━━━━━━━━━━━━━━━━━\n`;

      if (adminNames.length > 0) {
        msg += `┃ [ 𝐈𝐧𝐜𝐥𝐮𝐝𝐞 ]:\n`;
        msg += adminNames.join("\n") + "\n";
      } else {
        msg += `┃ [ 𝐈𝐧𝐜𝐥𝐮𝐝𝐞 ]: No admins found\n`;
      }

      msg += `┃ 💬 [ 𝐓𝐨𝐭𝐚𝐥 𝐍𝐮𝐦𝐛𝐞𝐫 𝐎𝐟 𝐌𝐞𝐬𝐬𝐚𝐠𝐞𝐬 ]: ${messageCount} msgs.\n`;
      msg += `┃ ━━━━━━━━━━━━━━━━━\n`;
      msg += `┃ 🖤 𝐌𝐚𝐝𝐞 𝐖𝐢𝐭𝐡 ✨ 𝐁𝐲: 乛 SIYAM ゎ i!\n`;
      msg += `┗━━━━━━━━━━━━━━━━━┛`;

      // Fetch Group Photo
      const path = __dirname + `/cache/${targetThreadID}_gc.jpg`;
      const imgUrl = threadInfo.imageSrc || `https://graph.facebook.com/${targetThreadID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

      try {
        const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
        await fs.outputFile(path, Buffer.from(response.data));

        return message.reply({
          body: msg,
          attachment: fs.createReadStream(path)
        });
      } catch (imgError) {
        // If image fails, send only the text info
        return message.reply(msg);
      }

    } catch (error) {
      console.error("GroupInfo Error:", error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
