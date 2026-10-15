const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "kiss",
                aliases: ["ummah"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 5,
                role: 0,
                description: {
                        en: "Generate a romantic kiss image by mentioning someone"
                },
                category: "love",
                guide: {
                        en: '   {pn} <@tag>: Tag someone to kiss'
                }
        },

        langs: {
                en: {
                        noTarget: "× Baby, please mention someone to kiss! 💋",
                        wait: "Generating your kiss image. Please wait a moment baby! <😘",
                        success: "ummmmah✨! 🙈",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, message, getLang }) {
                const mentions = Object.keys(event.mentions);
                if (mentions.length === 0) return message.reply(getLang("noTarget"));

                const senderID = event.senderID;
                const targetID = mentions[0];
                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                const imgPath = path.join(cacheDir, `kiss_${senderID}_${targetID}.png`);

                try {
                        api.setMessageReaction("🧣", event.messageID, () => {}, true);
                        const waitMsg = await message.reply(getLang("wait"));

                        const base = await mahmud();
                        const response = await axios.post(`${base}/api/kiss`, 
                                { senderID, targetID }, 
                                { responseType: "arraybuffer" }
                        );

                        fs.writeFileSync(imgPath, Buffer.from(response.data));

                        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(imgPath)
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        });

                } catch (err) {
                        console.error("Kiss Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
