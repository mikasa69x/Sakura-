const axios = require("axios");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "cdp",
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 5,
                role: 0,
                description: {
                        en: "Get random couple profile pictures"
                },
                category: "image",
                guide: {
                        en: '   {pn}: Get a random couple DP'
                                + '\n   {pn} list: Check total available DPs'
                }
        },

        langs: {
                en: {
                        total: "🎀 Total Couple DPs: %1",
                        noData: "× No Couple DP found.",
                        success: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                try {
                        const baseURL = await mahmud();

                        if (args[0] === "list") {
                                const res = await axios.get(`${baseURL}/api/cdp/list`);
                                return message.reply(getLang("total", res.data.total));
                        }

                        const res = await axios.get(`${baseURL}/api/cdp`);
                        const { boy, girl } = res.data;

                        if (!boy || !girl) return message.reply(getLang("noData"));

                        const getStream = async (url) => {
                                const response = await axios({
                                        method: "GET",
                                        url,
                                        responseType: "stream",
                                        headers: { "User-Agent": "Mozilla/5.0" }
                                });
                                return response.data;
                        };

                        const attachments = [
                                await getStream(boy),
                                await getStream(girl)
                        ];

                        return message.reply({
                                body: getLang("success"),
                                attachment: attachments
                        });

                } catch (err) {
                        console.error("CDP Error:", err);
                        return message.reply(getLang("error", err.message));
                }
        }
};
