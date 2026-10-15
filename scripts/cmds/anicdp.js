const axios = require("axios");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "anicdp",
                aliases: ["animecdp"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 10,
                role: 0,
                description: {
                        en: "Get random anime couple profile pictures"
                },
                category: "anime",
                guide: {
                        en: '   {pn}: Use to get random anime cdp'
                }
        },

        langs: {
                en: {
                        wait: "⌛ | Baby, searching for anime cdp for you...!!",
                        noResult: "× No images found!",
                        success: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐫𝐚𝐧𝐝𝐨𝐦 𝐚𝐧𝐢𝐦𝐞 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, message, getLang }) {
                try {
                        api.setMessageReaction("⌛", event.messageID, () => {}, true);

                        const apiBase = await mahmud();
                        const baseUrl = `${apiBase}/api/cdpvip2`;

                        const res = await axios.get(`${baseUrl}?category=anime`);
                        const groupImages = res.data?.group || [];

                        if (!groupImages.length) {
                                api.setMessageReaction("🥹", event.messageID, () => {}, true);
                                return message.reply(getLang("noResult"));
                        }

                        const streamAttachments = [];
                        for (const url of groupImages) {
                                try {
                                        const imgRes = await axios({
                                                url,
                                                method: "GET",
                                                responseType: "stream",
                                                headers: { "User-Agent": "Mozilla/5.0" }
                                        });
                                        streamAttachments.push(imgRes.data);
                                } catch (e) {
                                        console.warn(`Failed to load image: ${url}`);
                                }
                        }

                        if (!streamAttachments.length) throw new Error("All images failed to stream.");

                        api.setMessageReaction("✅", event.messageID, () => {}, true);
                        return message.reply({
                                body: getLang("success"),
                                attachment: streamAttachments
                        });

                } catch (err) {
                        console.error("AniCDP Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};
