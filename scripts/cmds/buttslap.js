const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "buttslap",
                aliases: ["butslap"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 8,
                role: 0,
                description: {
                        en: "Give someone a butt-slap effect"
                },
                category: "fun",
                guide: {
                        en: '   {pn} <@tag>: Slap someone by tagging'
                                + '\n   {pn} <uid>: Create effect using UID'
                                + '\n   (Or use by replying to a message)'
                }
        },

        langs: {
                en: {
                        noTarget: "× Baby, mention, reply, or provide UID of the target! 💥",
                        success: "Effect: betha paicho🥹? 🌚💥",
                        error: "× Failed to create effect: %1"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const { mentions, messageReply, senderID } = event;
                let id2;

                if (messageReply) {
                        id2 = messageReply.senderID;
                } else if (Object.keys(mentions).length > 0) {
                        id2 = Object.keys(mentions)[0];
                } else if (args[0] && !isNaN(args[0])) {
                        id2 = args[0];
                }

                if (!id2) return message.reply(getLang("noTarget"));

                const cacheDir = path.join(__dirname, "cache");
                const filePath = path.join(cacheDir, `slap_${id2}.png`);

                try {
                        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/dig?type=buttslap&user=${senderID}&user2=${id2}`;

                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Buttslap Error:", err);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
