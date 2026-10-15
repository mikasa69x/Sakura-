const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "catbox2",
    aliases: ["catboxupload2"],
    version: "3.1",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    shortDescription: "Upload media to catbox.moe",
    longDescription: "Upload any media directly to catbox.moe",
    category: "tools",
    guide: { en: "{pn} [reply to any attachment]" }
  },

  onStart: async function ({ api, event, message }) {
    const { messageReply } = event;

    if (!messageReply?.attachments || messageReply.attachments.length === 0) {
      return message.reply("⚠️ Reply to an attachment.");
    }

    const attachment = messageReply.attachments[0];

    try {
      const { data } = await axios.get(attachment.url, { 
        responseType: "arraybuffer" 
      });

      let ext = "bin";
      if (attachment.type === "photo") ext = "jpg";
      else if (attachment.type === "video") ext = "mp4";
      else if (attachment.type === "animated_image") ext = "gif";
      else if (attachment.type === "sticker") ext = "png";
      else if (attachment.type === "audio") ext = "mp3";
      else if (attachment.fileName) {
        const parts = attachment.fileName.split(".");
        if (parts.length > 1) ext = parts.pop();
      }

      const formData = new FormData();
      formData.append("reqtype", "fileupload");
      formData.append("fileToUpload", Buffer.from(data), `upload.${ext}`);

      const uploadRes = await axios.post("https://catbox.moe/user/api.php", formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return message.reply(`🔗 ${uploadRes.data.trim()}`);
    } catch (error) {
      return message.reply(`❌ Upload Error: ${error.message}`);
    }
  }
};
