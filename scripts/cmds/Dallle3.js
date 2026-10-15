const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "dalle3",
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 15,
                role: 0,
                description: {
                        en: "Generate AI images using DALL-E 3 model"
                },
                category: "image gen",
                guide: {
                        en: '   {pn} <prompt>: Provide a description to generate image'
                }
        },

        langs: {
                en: {
                        noPrompt: "× Baby, please provide a prompt to generate image",
                        wait: "🔄 | DALL-E 3 Image Generating, please wait...",
                        success: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐃𝐀𝐋𝐋-𝐄 𝟑 𝐢𝐦𝐚𝐠𝐞 𝐛𝐚𝐛𝐲 <😘",
                        error: "× API error: %1."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const prompt = args.join(" ");
                if (!prompt) return message.reply(getLang("noPrompt"));

                const cacheDir = path.join(__dirname, "cache");
                const filePath = path.join(cacheDir, `dalle3_${Date.now()}.png`);
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        const waitMsg = await message.reply(getLang("wait"));

                        const baseUrl = await baseApiUrl();
                        const response = await axios.post(`${baseUrl}/api/dalle3`, 
                                { prompt }, 
                                { responseType: "arraybuffer" }
                        );

                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
                        api.setMessageReaction("✅", event.messageID, () => {}, true);

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Dalle3 Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
