const fs = require("fs-extra");
const axios = require("axios");
const { loadImage, createCanvas } = require("canvas");

const NAGIN_URL = "https://i.ibb.co.com/PGR7gHdR/Messenger-creation-80-C1-CD7-C-2159-494-E-AA1-B-D51170-C78-C12.jpg";

module.exports = {
  config: {
    name: "nagin",
    version: "1.0.0",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    description: {
      en: "Put someone's face in a cobra's mouth"
    },
    category: "fun",
    guide: { en: "{pn} @mention" }
  },

  langs: {
    en: {
      noMention: "❌ | Mention someone!",
      error: "❌ | Failed to generate. Try again."
    }
  },

  onStart: async function ({ event, message, getLang }) {
    try {
      const mentionID = Object.keys(event.mentions)[0] || (event.messageReply ? event.messageReply.senderID : null);
      if (!mentionID) return message.reply(getLang("noMention"));

      const ts = Date.now();
      const basePath = __dirname + "/cache/nagin_base_" + ts + ".jpg";
      const avatarPath = __dirname + "/cache/nagin_avt_" + ts + ".jpg";
      const outputPath = __dirname + "/cache/nagin_out_" + ts + ".jpg";

      const [baseRes, avatarRes] = await Promise.all([
        axios.get(NAGIN_URL, { responseType: "arraybuffer" }),
        axios.get("https://graph.facebook.com/" + mentionID + "/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662", { responseType: "arraybuffer" })
      ]);

      fs.writeFileSync(basePath, Buffer.from(baseRes.data));
      fs.writeFileSync(avatarPath, Buffer.from(avatarRes.data));

      const baseImg = await loadImage(basePath);
      const avatarImg = await loadImage(avatarPath);

      const canvas = createCanvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImg, 0, 0, baseImg.width, baseImg.height);

      const cx = 315, cy = 320, rw = 80, rh = 80;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, cx - rw, cy - rh, rw * 2, rh * 2);
      ctx.restore();

      fs.writeFileSync(outputPath, canvas.toBuffer("image/jpeg", { quality: 0.92 }));

      await message.reply({ body: "", attachment: fs.createReadStream(outputPath) });

      [basePath, avatarPath, outputPath].forEach(p => { try { fs.unlinkSync(p); } catch (_) {} });

    } catch (err) {
      console.error("Nagin Error:", err);
      message.reply(getLang("error"));
    }
  }
};
