const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "art2",
    version: "1.1",
    author: "—͞Sɪʏᴀᴍ ☯",
    countDown: 0,
    role: 0,
    shortDescription: "Generate AI art in multiple styles",
    longDescription:
      "Create up to 15 AI-generated artworks in various styles like fantasy, anime, or pixel art. Use '-N' at the end to define how many images to generate.\nExample: art A dragon on a cliff -3",
    category: "ai",
    guide: `{pn} <prompt> [-N]

Examples:
{pn} A cat with a girl
{pn} A cyberpunk dragon -5

Use -N to generate multiple images (max 5).`
  },

  onStart: async function ({ message, args, event, commandName }) {
    let input = args.join(" ");
    let count = 1;

    const countMatch = input.match(/-([1-9]|1[0-5])$/);
    if (countMatch) {
      count = parseInt(countMatch[1]);
      input = input.slice(0, input.length - countMatch[0].length).trim();
    }

    if (!input)
      return message.reply(
        `⚠️ Missing prompt!\nTry: ${commandName} A cat in the rain -3`
      );

    const styles = [
      "realistic",
      "fantasy",
      "cyberpunk",
      "anime",
      "pixel art",
      "real art"
    ];

    count = Math.min(count, 5);
    const basePrompt = input.trim();
    const outputPaths = [];

    await message.reply(
      `🎨 Brewing ${count} magical artwork${count > 1 ? "s" : ""} for:\n“${basePrompt}”\n🧠 Please wait while the AI brings your vision to life...`
    );

    for (let i = 0; i < count; i++) {
      let style = styles[i] || "default";
      let styledPrompt = count === 1 ? basePrompt : `${basePrompt}, style: ${style}`;

      const filePath = path.join(
        __dirname,
        "tmp",
        `art_${style.replace(/ /g, "_")}_${event.senderID}_${Date.now()}.png`
      );

      const formData = new URLSearchParams({
        prompt: styledPrompt,
        output_format: "bytes",
        user_profile_id: "null",
        anonymous_user_id: "a584e30d-1996-4598-909f-70c7ac715dc1",
        request_timestamp: Date.now(),
        user_is_subscribed: "false",
        client_id: "pSgX7WgjukXCBoYwDM8GGLnRRkvAoJlqa5eAVvj95o"
      });

      try {
        const res = await axios.post(
          "https://ai-api.magicstudio.com/api/ai-art-generator",
          formData.toString(),
          {
            headers: {
              "User-Agent": "Mozilla/5.0",
              Accept: "*/*",
              "Content-Type": "application/x-www-form-urlencoded",
              Referer: "https://magicstudio.com/ai-art-generator/",
              Origin: "https://magicstudio.com"
            },
            responseType: "arraybuffer"
          }
        );
        fs.writeFileSync(filePath, res.data);
        outputPaths.push({ path: filePath, style });
      } catch (err) {
        console.error(`❌ Error generating "${style}" style:`, err.message);
        return message.reply("❌ Oops! Failed to generate image. Please try again later.");
      }
    }

    if (outputPaths.length === 1) {
      return message.reply(
        {
          body: `🖼️ Your unique AI artwork for:\n“${basePrompt}” is ready!\n✨ Crafted with creativity by CatX\n👨‍🎨 Author: Mueid Mursalin Rifat`,
          attachment: fs.createReadStream(outputPaths[0].path)
        },
        () => fs.unlinkSync(outputPaths[0].path)
      );
    }

    const attachments = outputPaths.map((img) => fs.createReadStream(img.path));
    const styleList = outputPaths
      .map((img, i) => `${i + 1} = ${img.style.charAt(0).toUpperCase() + img.style.slice(1)}`)
      .join("\n");

    const body = `✅ Here are ${outputPaths.length} AI artworks based on:\n“${basePrompt}”\n\n🎨 Reply with a number (1-${outputPaths.length}) to choose your favorite style:\n${styleList}\n\n✨ Created with CatX magic\n👨‍🎨 Author: Mueid Mursalin Rifat`;

    message.reply(
      { body, attachment: attachments },
      (_, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          type: "chooseArt",
          author: event.senderID,
          images: outputPaths
        });
      }
    );
  },

  onReply: async function ({ message, event, Reply }) {
    const { author, type, commandName, images } = Reply;
    if (event.senderID !== author || type !== "chooseArt") return;

    const choice = parseInt(event.body.trim());
    if (isNaN(choice) || choice < 1 || choice > images.length)
      return message.reply(`❌ Invalid selection. Reply with a number between 1 and ${images.length}.`);

    const selected = images[choice - 1];
    message.reply(
      {
        body: `🖼️ You selected: ${selected.style.toUpperCase()} style\n✨ AI creation complete!\n👨‍🎨 Author: Mueid Mursalin Rifat`,
        attachment: fs.createReadStream(selected.path)
      },
      () => {
        for (const img of images) fs.unlinkSync(img.path);
      }
    );
  }
};
