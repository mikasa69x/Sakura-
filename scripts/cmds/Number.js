const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "numinfo",
                aliases: ["numberinfo", "numlookup"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                role: 0,
                category: "info",
                cooldown: 10,
                guide: {
                        en: "{pn} [number]"
                }
        },

        langs: {
                en: {
                        noNumber: "• Baby, provide a number. Example: {pn} 018*******",
                        invalid: "❌ Invalid number format!",
                        error: "❌ An error occurred: %1",
                        success: "📱 Number Info:\n\n• Name: %1\n• Number: %2\n• FB ID: %3"
                }
        },

        onStart: async function ({ api, event, args, getLang }) {
                const { threadID, messageID } = event;
                if (!args[0]) return api.sendMessage(getLang("noNumber").replace("{pn}", this.config.name), threadID, messageID);

                let number = args.join("").replace(/\D/g, "");
                if (number.startsWith("0")) {
                        number = "88" + number;
                } else if (!number.startsWith("88")) {
                        return api.sendMessage(getLang("invalid"), threadID, messageID);
                }

                try {
                        api.setMessageReaction("⏳", messageID, () => {}, true);

                        const apiUrl = await baseApiUrl();
                        const response = await axios.get(`${apiUrl}/api/numinfo?number=${number}`);
                        const data = response.data;

                        if (!data.success) throw new Error("API failed to fetch data");

                        const msg = getLang("success", data.name, number, data.facebook_id);

                        api.sendMessage(msg, threadID, () => {
                                api.setMessageReaction("✅", messageID, () => {}, true);
                        }, messageID);

                } catch (err) {
                        api.setMessageReaction("❌", messageID, () => {}, true);
                        api.sendMessage(getLang("error", err.message || "API Error"), threadID, messageID);
                }
        }
};
