const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "sanda",
    version: "2.2.0",
    author: "SiFu",
    countDown: 5,
    role: 0,
    category: "fun",
    guide: { en: "{pn} @mention or reply" }
  },

  onStart: async function ({ event, message, api }) {
    let targetID;

    // 1️⃣ Check Mentions
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } 
    // 2️⃣ Check Reply
    else if (event.messageReply) {
      targetID = event.messageReply.senderID;
    }
    // 3️⃣ Default to sender (Self) - Removing the "self-ban" for better usability
    else {
      targetID = event.senderID;
    }

    const cacheDir = path.join(__dirname, "cache");
    const outPath = path.join(cacheDir, `sanda_${targetID}.png`);
    await fs.ensureDir(cacheDir);

    try {
      const canvas = createCanvas(600, 800);
      const ctx = canvas.getContext("2d");

      // 🔹 Background Template
      const bg = await loadImage("https://i.imgur.com/ZQXW9jO.png");
      ctx.drawImage(bg, 0, 0, 600, 800);

      // 🔹 Fetch avatar with Access Token (Fixed for blank profile)
      let avatarBuffer;
      const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      try {
        const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
        avatarBuffer = res.data;
      } catch (e) {
        // Fallback image if something fails
        const res = await axios.get("https://i.imgur.com/8Km9tLL.png", { responseType: "arraybuffer" });
        avatarBuffer = res.data;
      }

      const avatarImg = await loadImage(avatarBuffer);

      // 🔹 Circular avatar positioning
      const size = 150;
      const x = (600 - size) / 2;
      const y = 70;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, x, y, size, size);
      ctx.restore();

      // 🔹 Save image
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      const info = await api.getUserInfo(targetID);
      const name = info[targetID]?.name || "User";

      await message.reply(
        {
          body: `🤣 ${name} is now a real Lizard (Sanda)! 🦥`,
          attachment: fs.createReadStream(outPath)
        },
        () => {
          if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
        }
      );

    } catch (err) {
      console.error("SANDA ERROR:", err);
      message.reply("❌ Error occurred, please try again later.");
    }
  }
};
