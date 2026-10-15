const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "cdp2",
                aliases: ["cdp2"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 10,
                role: 0,
                description: {
                        en: "Fetch a random couple DP for nibba and nibbi (v2)"
                },
                category: "image",
                guide: {
                        en: '   {pn}: Use to get a random couple DP (v2)'
                }
        },

        langs: {
                en: {
                        notFound: "× Couldn't fetch couple DP. Try again later baby!",
                        success: "Here is your cdp baby <🪶",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, message, event, getLang }) {
                try {
                        const baseUrl = await baseApiUrl();
                        const response = await axios.get(`${baseUrl}/api/cdp2`, {
                                headers: { "author": "MahMUD" }
                        });

                        if (response.data.error) {
                                return message.reply(response.data.error);
                        }

                        const { male, female } = response.data;
                        if (!male || !female) {
                                return message.reply(getLang("notFound"));
                        }

                        const attachments = [
                                await global.utils.getStreamFromURL(male),
                                await global.utils.getStreamFromURL(female)
                        ];

                        return message.reply({
                                body: getLang("success"),
                                attachment: attachments
                        });

                } catch (err) {
                        console.error("CDP2 Fetch Error:", err);
                        return message.reply(getLang("error", err.message));
                }
        }
};
