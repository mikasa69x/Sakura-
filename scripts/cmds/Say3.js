const fs = require("fs");
const axios = require("axios");
const googleTTS = require("google-tts-api");

module.exports = {
  config: {
    name: "say3",
    aliases: ["speak"],
    version: "1.0",
    author: "—͞Sɪʏꫝᴍㅤ友",
    countDown: 5,
    role: 0,
    usePrefix: true,
    shortDescription: {
      en: "Convert text to Bangla voice"
    },
    longDescription: {
      en: "Bot will speak your text in Bangla using Google TTS"
    },
    category: "media",
    guide: {
      en: "{pn} <your Bangla text> → e.g. {pn} আমি ভালো আছি"
    }
  },

  onStart: async function ({ args, message }) {
    const text = args.join(" ").trim();
    if (!text) return message.reply("⚠️ Please provide some Bangla text to speak!");

    try {
  
      const url = googleTTS.getAudioUrl(text, {
        lang: 'bn',
        slow: false,
        host: 'https://translate.google.com'
      });

  
      const tempPath = `${__dirname}/voice.mp3`;
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, Buffer.from(res.data));

      await message.reply({
        body: `🔊 Voice Output: ${text}`,
        attachment: fs.createReadStream(tempPath)
      });

      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error("❌ Say command error:", err);
      message.reply("❌ Failed to generate voice!");
    }
  }
};
