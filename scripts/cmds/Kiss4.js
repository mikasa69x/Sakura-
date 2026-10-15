const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const BG_IMAGE_URL = "https://i.imgur.com/t3YPjf7.jpeg";

const avatarConfig = {
  boy:  { x: 20,  y: 120, size: 150 },
  girl: { x: 290, y: 200, size: 150 }   // 180 + 20 = 200
};

module.exports = {
  config: {
    name: "kiss4",
    version: "4.0",
    author: "乛 SIYAM 🪶",
    countDown: 5,
    role: 0,
    description:
      "💋 Create a romantic kiss image between you and your tagged partner!",
    category: "love",
    guide: {
      en: "{pn} @tag or reply to someone's message"
    }
  },

  langs: {
    en: {
      noTag: "Please tag someone to kiss."
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid1 = event.senderID;
    let uid2 = Object.keys(event.mentions)[0];

    if (!uid2 && event.messageReply?.senderID)
      uid2 = event.messageReply.senderID;

    if (!uid2)
      return message.reply(getLang("noTag"));

    try {
      const name1 = (await usersData.getName(uid1)) || "Unknown";
      const name2 = (await usersData.getName(uid2)) ||
                    (event.mentions[uid2] ? event.mentions[uid2].replace("@", "") : "Unknown");

      const getAvatarBuffer = async (uid) => {
        const methods = [
          `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          `https://api.popcat.xyz/facebookavatar/${uid}`
        ];

        for (const url of methods) {
          try {
            const res = await axios.get(url, {
              responseType: "arraybuffer",
              headers: { "User-Agent": "Mozilla/5.0" },
              timeout: 10000
            });
            if (res.data && res.data.byteLength > 1000) {
              return Buffer.from(res.data);
            }
          } catch (err) {
            continue;
          }
        }
        throw new Error(`Avatar fetch failed for UID ${uid}`);
      };

      const [boyBuffer, girlBuffer, bgRes] = await Promise.all([
        getAvatarBuffer(uid1),
        getAvatarBuffer(uid2),
        axios.get(BG_IMAGE_URL, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 15000
        })
      ]);

      const [boy, girl, bgImg] = await Promise.all([
        loadImage(boyBuffer),
        loadImage(girlBuffer),
        loadImage(Buffer.from(bgRes.data))
      ]);

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0);

      function drawFaceAvatar(img, x, y, size) {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawFaceAvatar(boy,  avatarConfig.boy.x,  avatarConfig.boy.y,  avatarConfig.boy.size);
      drawFaceAvatar(girl, avatarConfig.girl.x, avatarConfig.girl.y, avatarConfig.girl.size);

      const savePath = path.join(__dirname, "tmp");
      await fs.ensureDir(savePath);
      const imgPath = path.join(savePath, `${uid1}_${uid2}_kiss.jpg`);

      await fs.writeFile(imgPath, canvas.toBuffer("image/jpeg"));

      const text = `ummmmah✨! 🙈 ${name1} just kissed ${name2}! 👀`;

      await message.reply({
        body: text,
        attachment: fs.createReadStream(imgPath)
      });

      setTimeout(() => fs.unlinkSync(imgPath), 5000);

    } catch (err) {
      console.error("❌ Error in kiss2.js:", err);
      return message.reply("❌ | Couldn't create the kiss image, please try again.");
    }
  }
};
