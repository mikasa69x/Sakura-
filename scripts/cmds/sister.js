const fs = require("fs");
const axios = require("axios");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "sister",
                aliases: ["sis", "bro"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 5,
                role: 0,
                description: {
                        en: "Create a sweet sister-brother relationship image"
                },
                category: "love",
                guide: {
                        en: '   {pn} <@tag/reply>: Tag or reply to someone'
                }
        },

        langs: {
                en: {
                        noTarget: "× Baby, please tag or reply to someone! 🎀",
                        wait: "⌛ Generating your image... Please wait a moment baby! <😘",
                        success: "𝐋𝐢𝐟𝐞'𝐬 𝐛𝐞𝐭𝐭𝐞𝐫 𝐰𝐢𝐭𝐡 𝐚 𝐒𝐢𝐬𝐭𝐞𝐫 𝐛𝐲 𝐲𝐨𝐮𝐫 𝐬𝐢𝐝𝐞 🎀",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const mention = Object.keys(event.mentions)[0] || (event.messageReply && event.messageReply.senderID);
                if (!mention) return message.reply(getLang("noTarget"));

                const user1 = event.senderID;
                const user2 = mention;
                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                const imgPath = path.join(cacheDir, `sister_${user1}_${user2}.png`);

                try {
                        api.setMessageReaction("🎀", event.messageID, () => {}, true);
                        const waitMsg = await message.reply(getLang("wait"));

                        const baseUrl = await baseApiUrl();
                        const apiUrl = `${baseUrl}/api/bro&sis?user1=${user1}&user2=${user2}&style=1`;

                        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
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
                        console.error("Sister Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
