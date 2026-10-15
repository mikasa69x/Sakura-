const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "v2a",
    aliases: ["video2audio", "extractaudio", "video2mp3"],
    version: "2.0",
    author: "乛 SIYAM ゎ",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Convert video to audio"
    },
    longDescription: {
      en: "Extract audio from video files and convert to audio format"
    },
    category: "music",
    guide: {
      en: "{pn} [reply to video]"
    }
  },

  onStart: async function ({ message, event }) {
    try {
      if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
        return message.reply("📹 Please reply to a video message to convert it to audio.");
      }

      const attachment = event.messageReply.attachments[0];
      
      if (attachment.type !== "video") {
        return message.reply("❌ The replied content must be a video.");
      }

      // Create temp directory if not exists
      const tempDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tempDir);
      
      const audioPath = path.join(tempDir, `audio_${Date.now()}.m4a`);

      // Download the video
      const response = await axios({
        method: "GET",
        url: attachment.url,
        responseType: "arraybuffer",
        timeout: 60000
      });

      // Save as audio file
      await fs.writeFile(audioPath, Buffer.from(response.data));

      // Send the audio file
      await message.reply({
        body: "🎵 Audio!",
        attachment: fs.createReadStream(audioPath)
      });

      // Clean up temporary file
      setTimeout(() => {
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      }, 5000);

    } catch (error) {
      console.error("Video to audio error:", error);
      await message.reply("❌ Failed to convert video to audio. Please try again.");
    }
  }
};
