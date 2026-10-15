const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "bed",
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 5,
                role: 0,
                description: {
                        en: "🌚🫶🏻... bed hug image with your loved one"
                },
                category: "fun",
                guide: {
                        en: '   {pn} @mention: Mention someone to use'
                }
        },

        langs: {
                en: {
                        noMention: "× Baby, please mention someone! 💞",
                        success: "🌚🫶🏻.. <👽",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, message, getLang }) {
                const mentions = Object.keys(event.mentions);
                if (mentions.length === 0) return message.reply(getLang("noMention"));

                const senderID = event.senderID;
                const targetID = mentions[0];
                const imgPath = path.join(__dirname, "cache", `bed_${senderID}_${targetID}.png`);
                if (!fs.existsSync(path.dirname(imgPath))) fs.mkdirSync(path.dirname(imgPath), { recursive: true });

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        
                        const base = await mahmud();
                        const response = await axios.post(`${base}/api/bed`, 
                                { senderID, targetID }, 
                                { responseType: "arraybuffer" }
                        );

                        fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(imgPath)
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        });

                } catch (err) {
                        console.error("Bed Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
