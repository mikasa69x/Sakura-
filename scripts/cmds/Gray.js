const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
    config: {
        name: "gray",
        version: "1.0",
        author: "—͞Sɪʏꫝᴍㅤ友",
        countDown: 5,
        role: 0,
        category: "image",
        description: "Convert replied image or URL to grayscale",
        guide: "{pn} [ImgReply/imgLink]"
    },

    onStart: async function ({ api, args, message, event }) {
        try {
            let imageUrl;

            if (event.type === "message_reply") {
                const attachment = event.messageReply.attachments?.[0];
                if (!attachment) return message.reply("❌ | Please reply to an image.");
                if (!attachment.url || attachment.type !== "photo") {
                    return message.reply("❌ | Only image replies are allowed. Videos or other files are not supported.");
                }
                imageUrl = attachment.url;
            } else if (args[0]?.startsWith("http")) {
                imageUrl = args[0];
            } else {
                return message.reply("❌ | Please reply to an image or provide an image URL.");
            }

            api.setMessageReaction("🖤", event.messageID, () => {}, true);
            const waitMsg = await message.reply("Converting to grayscale... <🖤");

            const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
            const rawRes = await axios.get(GITHUB_RAW);
            const apiBase = rawRes.data.apiv1;

            const apiUrl = `${apiBase}/api/gray?url=${encodeURIComponent(imageUrl)}`;
            const response = await axios({
                url: apiUrl,
                method: "GET",
                responseType: "arraybuffer"
            });

            const filePath = path.join(__dirname, "cache", `gray_${Date.now()}.png`);
            await fs.outputFile(filePath, response.data);

            message.unsend(waitMsg.messageID);
            api.setMessageReaction("✅", event.messageID, () => {}, true);
            message.reply({
                body: "Here's your grayscale image 🖤",
                attachment: fs.createReadStream(filePath)
            });

        } catch (error) {
            console.error(error);
            message.reply("❌ | Failed to convert image to grayscale. Please try again later.");
        }
    }
};
