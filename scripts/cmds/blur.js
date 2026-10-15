const axios = require("axios");

const mahmud = async () => {
        const response = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return response.data.mahmud;
};

module.exports = {
        config: {
                name: "blur",
                version: "1.7",
                countDown: 5,
                role: 0,
                author: "乛 SIYAM ゎ",
                description: {
                        en: "Blur any image (Level 1-100)"
                },
                category: "fun",
                guide: {
                        en: '   {pn} <level>: Reply to an image\n   {pn} <url> <level>: Provide an image URL'
                }
        },

        langs: {
                en: {
                        invalidLevel: "× Baby, please enter a blur level between 1–100! ❌",
                        noImg: "× Baby, please reply to an image or provide a URL! 🖼️",
                        wait: "Baby, please wait a moment while I blur it! <😘",
                        success: "Here's your %1% blurred image baby! <",
                        error: "× API error: %1."
                }
        },

        onStart: async function ({ api, args, message, event, getLang }) {
                try {
                        let imageUrl;
                        let blurLevel = 40;

                        if (event.type === "message_reply" && event.messageReply.attachments?.length > 0) {
                                imageUrl = event.messageReply.attachments[0].url;
                                if (args[0] && !isNaN(args[0])) {
                                        const level = parseInt(args[0]);
                                        if (level >= 1 && level <= 100) blurLevel = level;
                                        else return message.reply(getLang("invalidLevel"));
                                }
                        } else if (args[0]?.startsWith("http")) {
                                imageUrl = args[0];
                                if (args[1] && !isNaN(args[1])) {
                                        const level = parseInt(args[1]);
                                        if (level >= 1 && level <= 100) blurLevel = level;
                                        else return message.reply(getLang("invalidLevel"));
                                }
                        } else {
                                return message.reply(getLang("noImg"));
                        }

                        api.setMessageReaction("😘", event.messageID, () => {}, true);
                        const waitMsg = await message.reply(getLang("wait"));

                        const apiUrl = await mahmud();
                        const imgStream = `${apiUrl}/api/blur/mahmud?url=${encodeURIComponent(imageUrl)}&blurLevel=${blurLevel}`;

                        const stream = await global.utils.getStreamFromURL(imgStream);

                        api.setMessageReaction("✅", event.messageID, () => {}, true);
                        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

                        return message.reply({
                                body: getLang("success", blurLevel),
                                attachment: stream
                        });

                } catch (err) {
                        console.error("Blur Error:", err);
                        return message.reply(getLang("error", err.message));
                }
        }
};
