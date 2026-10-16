const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "3.6",
    author: "S1FU (Team Heartless)",
    category: "events",
    description: "Elegant & Clean Welcome Message"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData, senderID } = event;
    const newUsers = logMessageData.addedParticipants || [];
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const memberCount = threadInfo.participantIDs.length;
      const groupName = threadInfo.threadName || "This Group";

      for (const user of newUsers) {
        const userId = user.userFbId;
        const fullName = user.fullName.toUpperCase();

    
        let addedByName = "Someone";
        const possibleIDs = [logMessageData.author, senderID].filter(Boolean);

        for (const id of possibleIDs) {
          try {
            const userInfo = await api.getUserInfo(id);
            if (userInfo[id]?.name) {
              addedByName = userInfo[id].name;
              break;
            }
          } catch (e) {}
        }

        // Random Background
        const bgList = [
          "https://i.imgur.com/nLKr9FI.jpeg",
          "https://i.imgur.com/umopPUQ.jpeg",
          "https://i.imgur.com/HDEZgFR.jpeg",
          "https://i.imgur.com/KN717Yb.jpeg"
        ];
        const randomBG = bgList[Math.floor(Math.random() * bgList.length)];

        const avatarURL = `https://graph.facebook.com/${userId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        // Text for Image
        const stylishName = fullName;
        const stylishText2 = "𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐓𝐇𝐄 𝐅𝐀𝐌𝐈𝐋𝐘 💖";
        const stylishText3 = `𝐘𝐨𝐮 𝐚𝐫𝐞 𝐭𝐡𝐞 ${memberCount}𝐭𝐡 𝐬𝐡𝐢𝐧𝐢𝐧𝐠 𝐦𝐞𝐦𝐛𝐞𝐫 ✨`;

        const apiUrl = `https://maybexenos.vercel.app/welcome-card/welcomecard-v2?` +
          `background=${encodeURIComponent(randomBG)}` +
          `&avatar=${encodeURIComponent(avatarURL)}` +
          `&text1=${encodeURIComponent(stylishName)}` +
          `&text2=${encodeURIComponent(stylishText2)}` +
          `&text3=${encodeURIComponent(stylishText3)}` +
          `&groupname=${encodeURIComponent(groupName)}` +
          `&addedby=${encodeURIComponent(addedByName)}`;

        const tmpDir = path.join(__dirname, "cache");
        await fs.ensureDir(tmpDir);
        const imagePath = path.join(tmpDir, `welcome_${userId}_${Date.now()}.png`);

        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imagePath, response.data);

        // === Message UI ===
        const welcomeMsg = 
`🌸  𝐖𝐄𝐋𝐂𝐎𝐌𝐄  🌸

👋 Hello ${fullName}!

💫 You have joined our beautiful family

🎉 You are now the ${memberCount}th precious member of

『 ${groupName} 』

👤 Added by: ${addedByName}

✨ Hope you enjoy your stay here!
Let’s create lots of beautiful memories together 💖`;

        await api.sendMessage({
          body: welcomeMsg,
          mentions: [{ tag: fullName, id: userId }],
          attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        });
      }
    } catch (err) {
      console.error("❌ Welcome Error:", err.message);
    }
  }
};
