const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
    try {
        const res = await axios.get(
            "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
        );
        return res.data?.mahmud;
    } catch (e) {
        return null;
    }
};

module.exports = {
    config: {
        name: "tuntun",
        version: "1.8",
        author: "乛 SIYAM ゎ",
        role: 0,
        category: "fun",
        cooldown: 10,
        guide: {
            en: "{pn} [mention/reply/UID]",
            bn: "{pn} [মেনশন/রিপ্লাই/UID]",
            vi: "{pn} [mention/reply/UID]"
        }
    },

    langs: {
        bn: {
            noTarget: "• কাকে tuntun বানাবে? মেনশন, রিপ্লাই বা UID দাও",
            error: "❌ সমস্যা হয়েছে: %1",
            success: "✨ Tuntun effect সফল হয়েছে!"
        },
        en: {
            noTarget: "• Mention, reply, or provide UID",
            error: "❌ Error occurred: %1",
            success: "✨ Tuntun effect successful!"
        },
        vi: {
            noTarget: "• Hãy mention, reply hoặc nhập UID",
            error: "❌ Lỗi: %1",
            success: "✨ Hiệu ứng tuntun thành công!"
        }
    },

    onStart: async function ({ api, event, args, getLang }) {
        const { threadID, messageID, messageReply, mentions } = event;

        let id2 =
            messageReply?.senderID ||
            Object.keys(mentions || {})[0] ||
            args[0];

        if (!id2)
            return api.sendMessage(getLang("noTarget"), threadID, messageID);

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        const filePath = path.join(
            cacheDir,
            `tuntun_${id2}_${Date.now()}.png`
        );

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const apiUrl = await baseApiUrl();
            if (!apiUrl) throw new Error("API not found");

            const url = `${apiUrl}/api/dig?type=tuntun&user=${id2}`;

            const res = await axios.get(url, {
                responseType: "arraybuffer"
            });

            fs.writeFileSync(filePath, Buffer.from(res.data));

            return api.sendMessage(
                {
                    body: getLang("success"),
                    attachment: fs.createReadStream(filePath)
                },
                threadID,
                (err) => {
                    api.setMessageReaction(
                        err ? "❌" : "🪽",
                        messageID,
                        () => {},
                        true
                    );

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                },
                messageID
            );
        } catch (err) {
            api.setMessageReaction("❌", messageID, () => {}, true);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            return api.sendMessage(
                getLang("error", err.message || "Unknown error"),
                threadID,
                messageID
            );
        }
    }
};
