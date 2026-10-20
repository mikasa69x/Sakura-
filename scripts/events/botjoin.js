const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const ownerInfo = {
name: "—͞Sɪʏꫝᴍㅤ友",
facebook: "https://www.facebook.com/hidden.thoughts"
};

module.exports = {
config: {
name: "botjoin",
version: "2.0",
author: "—͞Sɪʏꫝᴍㅤ友",
category: "events"
},

onStart: async function ({ event, api, message }) {
if (event.logMessageType !== "log:subscribe") return;

const { threadID, logMessageData } = event;
const botID = api.getCurrentUserID();
const addedUsers = logMessageData.addedParticipants;

const isBotAdded = addedUsers.some(u => u.userFbId === botID);
if (!isBotAdded) return;

const nickNameBot = global.GoatBot.config.nickNameBot || "Sakura Bot";
const prefix = global.utils.getPrefix(threadID);
const BOT_UID = botID; 

try {
  
  await api.changeNickname(nickNameBot, threadID, botID);
} catch (err) {
  console.warn("⚠️ Nickname change failed:", err.message);
}

try {
  
  const API_ENDPOINT = "https://xsaim8x-xxx-api.onrender.com/api/botjoin"; 
  
  const apiUrl = `${API_ENDPOINT}?botuid=${BOT_UID}&prefix=${encodeURIComponent(prefix)}`;
  
  const tmpDir = path.join(__dirname, "..", "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `botjoin_image_${threadID}.png`);

  const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
  fs.writeFileSync(imagePath, response.data);

  const textMsg = [
    "🎀 𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐟𝐨𝐫 𝐢𝐧𝐯𝐢𝐭𝐢𝐧𝐠 𝐦𝐞 🎀",
    `🔹 𝐁𝐨𝐭 𝐩𝐫𝐞𝐟𝐢𝐱: ${prefix}`,
    `🔸 𝐓𝐲𝐩𝐞: ${prefix}help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `👑 𝐎𝐰𝐧𝐞𝐫: ${ownerInfo.name}`,
    `🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: ${ownerInfo.facebook}`
  ].join("\n");


  await api.sendMessage({
    body: textMsg,
    attachment: fs.createReadStream(imagePath)
  }, threadID);

  fs.unlinkSync(imagePath);

} catch (err) {
  console.error("⚠️:", err);
  
  const fallbackMsg = [
    "💌. 𝐇𝐞𝐫𝐞 𝐢𝐬 𝐭𝐡𝐞 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧:",
    "🎀 𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐟𝐨𝐫 𝐢𝐧𝐯𝐢𝐭𝐢𝐧𝐠 𝐦𝐞 🎀",
    `🔹 𝐁𝐨𝐭 𝐩𝐫𝐞𝐟𝐢𝐱: ${prefix}`,
    `🔸 𝐓𝐲𝐩𝐞: ${prefix}help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `🪶 𝐎𝐰𝐧𝐞𝐫: ${ownerInfo.name}`,
    `🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: ${ownerInfo.facebook}`
  ].join("\n");
  api.sendMessage(fallbackMsg, threadID);
}

}
};
