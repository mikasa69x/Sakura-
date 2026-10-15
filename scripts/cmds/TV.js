const fs = require("fs-extra");
const axios = require("axios");
const { loadImage, createCanvas } = require("canvas");

const TV_URL = "https://i.ibb.co.com/PGLWQvv4/realistic-vintage-tv-cut-out-front-view-of-antique-crt-television-png-1.png";

module.exports = {
  config: {
    name: "tv",
    version: "1.0.0",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    description: {
      en: "Put someone on a vintage TV screen"
    },
    category: "fun",
    guide: { en: "{pn} @mention or reply to a message" }
  },

  langs: {
    en: { noMention: "❌ | Mention someone or reply to a message!", error: "❌ | Failed to generate. Try again." },
  },

  onStart: async function ({ event, message, getLang }) {
    try {
      const mentionID = Object.keys(event.mentions)[0] || (event.messageReply ? event.messageReply.senderID : null);
      if (!mentionID) return message.reply(getLang("noMention"));

      const ts = Date.now();
      const tvPath = __dirname + "/cache/tv_base_" + ts + ".png";
      const avatarPath = __dirname + "/cache/tv_avt_" + ts + ".jpg";
      const outputPath = __dirname + "/cache/tv_out_" + ts + ".jpg";

      const [tvRes, avatarRes] = await Promise.all([
        axios.get(TV_URL, { responseType: "arraybuffer" }),
        axios.get("https://graph.facebook.com/" + mentionID + "/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662", { responseType: "arraybuffer" })
      ]);

      fs.writeFileSync(tvPath, Buffer.from(tvRes.data));
      fs.writeFileSync(avatarPath, Buffer.from(avatarRes.data));

      const tvImg = await loadImage(tvPath);
      const avatarImg = await loadImage(avatarPath);

      const W = tvImg.width;
      const H = tvImg.height;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      const sx = 140, sy = 110, sw = 480, sh = 450;

      ctx.drawImage(avatarImg, sx, sy, sw, sh);

      ctx.drawImage(tvImg, 0, 0, W, H);

      fs.writeFileSync(outputPath, canvas.toBuffer("image/jpeg", { quality: 0.92 }));

      await message.reply({ body: "", attachment: fs.createReadStream(outputPath) });

      [tvPath, avatarPath, outputPath].forEach(p => { try { fs.unlinkSync(p); } catch (_) {} });

    } catch (err) {
      console.error("TV Error:", err);
      message.reply(getLang("error"));
    }
  }
};
