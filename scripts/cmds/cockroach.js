const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "cockroach",
                aliases: ["cock"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 10,
                role: 0,
                description: {
                        en: "Create a funny cockroach image of someone"
                },
                category: "fun",
                guide: {
                        en: '   {pn} <@tag/reply/UID>: Tag/Reply to make someone cockroach'
                }
        },

        langs: {
                en: {
                        noTarget: "× Baby, mention, reply, or provide UID of the target! 🪳",
                        success: "Here's your cockroach image baby! 🐸",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const { mentions, messageReply } = event;
                let id;

                if (Object.keys(mentions).length > 0) {
                        id = Object.keys(mentions)[0];
                } else if (messageReply) {
                        id = messageReply.senderID;
                } else if (args[0] && !isNaN(args[0])) {
                        id = args[0];
                }

                if (!id) return message.reply(getLang("noTarget"));

                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                const filePath = path.join(cacheDir, `cockroach_${id}.png`);

                try {
                        api.setMessageReaction("🪳", event.messageID, () => {}, true);
                        
                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/cockroach?user=${id}`;

                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Cockroach Error:", err);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
