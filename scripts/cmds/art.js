const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "art",
                aliases: ["artify", "photoart"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 10,
                role: 0,
                description: "Transform your photo into art styles",
                category: "ai-image",
                guide: "{pn} [1-100] reply to a photo OR {pn} list"
        },

        langs: {
                en: {
                        list_header: "✅ Available Art Styles:\n\n",
                        no_image: "Please reply to a photo.",
                        invalid_style: "❌ Style must be between 1-100.",
                        generating: "🎨 Processing...\n• Style: %1\n• Name: %2",
                        error: "❌ Error: %1",
                        success: "✅ Done!\n• Style: %1\n• Name: %2"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {

                const { threadID, messageID } = event;

                const cacheDir = path.join(__dirname, "cache");
                const cachePath = path.join(cacheDir, `art_${threadID}_${Date.now()}.png`);

                let waitMsg;

                try {
                        const baseUrl = await baseApiUrl();
                        const apiEndpoint = `${baseUrl}/api/art`;

                        if (args[0] === "list") {
                                const res = await axios.get(`${apiEndpoint}/list`);
                                const styles = res.data.styles;

                                let text = getLang("list_header");
                                for (const key in styles) {
                                        text += `${key}: ${styles[key]}\n`;
                                }
                                return message.reply(text);
                        }

                        const replied = event.messageReply?.attachments?.[0];
                        if (!replied || replied.type !== "photo") {
                                return message.reply(getLang("no_image"));
                        }

                        const styleNum = parseInt(args[0] || "1");
                        if (isNaN(styleNum) || styleNum < 1 || styleNum > 100) {
                                return message.reply(getLang("invalid_style"));
                        }

                        const imageUrl = encodeURIComponent(replied.url);

                        let styleName = "Art";
                        try {
                                const listRes = await axios.get(`${apiEndpoint}/list`);
                                styleName = listRes.data.styles[styleNum] || "Custom Art";
                        } catch (e) {}

                        api.setMessageReaction("⏳", messageID, () => {}, true);

                        waitMsg = await message.reply(getLang("generating", styleNum, styleName));

                        const res = await axios({
                                url: `${apiEndpoint}?imageUrl=${imageUrl}&style=${styleNum}`,
                                method: "GET",
                                responseType: "arraybuffer",
                                timeout: 180000
                        });

                        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                        fs.writeFileSync(cachePath, Buffer.from(res.data, "binary"));

                        if (waitMsg) message.unsend(waitMsg.messageID);

                        return message.reply({
                                body: getLang("success", styleNum, styleName),
                                attachment: fs.createReadStream(cachePath)
                        }, () => {
                                api.setMessageReaction("🪽", messageID, () => {}, true);
                                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                        });

                } catch (err) {
                        if (waitMsg) message.unsend(waitMsg.messageID);
                        api.setMessageReaction("❌", messageID, () => {}, true);
                        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                        return message.reply(getLang("error", err.message || "API Error"));
                }
        }
};
