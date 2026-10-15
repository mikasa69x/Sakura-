const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "latti",
    aliases: ["lathiuuuu"],
    version: "1.2",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    shortDescription: "Football kick edit",
    longDescription: "Adds your profile pic and target's profile pic into a football kick meme",
    category: "fun",
    guide: {
      en: "{p}{n} @mention / reply"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      let targetID;
      if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else {
        return api.sendMessage("- mention / reply..!", event.threadID, event.messageID);
      }

      const senderID = event.senderID;

      const senderAvatar = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const targetAvatar = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const templatePath = path.join(__dirname, "cache", "dkick_base.png");
      if (!fs.existsSync(templatePath)) {
        const imgUrl = "https://files.catbox.moe/qm9ngr.jpg"; // ✅ নতুন link
        const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
        fs.outputFileSync(templatePath, res.data);
      }

      const baseImg = await loadImage(templatePath);
      const kickerImg = await loadImage(senderAvatar);
      const victimImg = await loadImage(targetAvatar);

      const canvas = createCanvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // Victim face - বাম দিকে
      const victimX = 60;
      const victimY = 40;
      const victimSize = 80;

      ctx.save();
      ctx.beginPath();
      ctx.arc(victimX + victimSize / 2, victimY + victimSize / 2, victimSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(victimImg, victimX, victimY, victimSize, victimSize);
      ctx.restore();

      // Kicker face - ডান দিকে
      const kickerX = baseImg.width - 160;
      const kickerY = 5;
      const kickerSize = 90;

      ctx.save();
      ctx.beginPath();
      ctx.arc(kickerX + kickerSize / 2, kickerY + kickerSize / 2, kickerSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(kickerImg, kickerX, kickerY, kickerSize, kickerSize);
      ctx.restore();

      const outPath = path.join(__dirname, "cache", `dkick_${event.senderID}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer());

      api.sendMessage(
        { body: "- Bombolaaa ⚽🦵", attachment: fs.createReadStream(outPath) },
        event.threadID,
        () => fs.unlinkSync(outPath),
        event.messageID
      );
    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ Error .", event.threadID, event.messageID);
    }
  }
};
