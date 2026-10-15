const axios = require("axios");
const fs = require("fs-extra");
const canvas = require("canvas");

module.exports = {
  config: {
    name: "trump",
    author: "乛 SIYAM ゎ",
    countDown: 3,
    role: 0,
    category: "fun",
    shortDescription: "Trump sign board generator",
  },

  wrapText: async (ctx, text, maxWidth) => {
    return new Promise((resolve) => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);
      const words = text.split(" ");
      const lines = [];
      let line = "";
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth)
          line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = "";
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  },

  onStart: async function ({ api, event, args }) {
    let { threadID, messageID } = event;
    const { loadImage, createCanvas } = require("canvas");
    let pathImg = __dirname + "/cache/trump.png";

    // ✅ User text
    let text = args.join(" ");
    if (!text)
      return api.sendMessage(
        "Enter the content of the comment on the board.",
        threadID,
        messageID
      );

    // ✅ BASE IMAGE CACHE SYSTEM (429 FIX)
    const baseURL = "https://i.imgur.com/7Wlr6nT.png";

    if (!fs.existsSync(pathImg)) {
      try {
        const response = await axios.get(baseURL, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        fs.writeFileSync(pathImg, response.data);
      } catch (err) {
        return api.sendMessage(
          "❌ Failed to download base image!",
          threadID,
          messageID
        );
      }
    }

    // ✅ LOAD CACHED IMAGE
    let baseImage = await loadImage(pathImg);
    let cnv = createCanvas(baseImage.width, baseImage.height);
    let ctx = cnv.getContext("2d");

    ctx.drawImage(baseImage, 0, 0);

    // ✅ TEXT SETTINGS
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";
    ctx.font = "400 40px Arial";

    const lines = await this.wrapText(ctx, text, 800);
    ctx.fillText(lines.join("\n"), 60, 165);

    // ✅ SAVE NEW IMAGE
    let output = __dirname + "/cache/out_trump.png";
    fs.writeFileSync(output, cnv.toBuffer());

    // ✅ SEND IMAGE
    api.sendMessage(
      { attachment: fs.createReadStream(output) },
      threadID,
      () => fs.unlinkSync(output),
      messageID
    );
  },
};
