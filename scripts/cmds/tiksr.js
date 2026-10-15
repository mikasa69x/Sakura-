const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "tiksr",
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 5,
                role: 0,
                description: {
                        en: "Search and download TikTok edit videos"
                },
                category: "media",
                guide: {
                        en: '   {pn} <keyword>: Enter keyword to search (Ex: {pn} naruto)'
                }
        },

        langs: {
                en: {
                        noInput: "× Baby, what do you want to search? 🔍\nExample: {pn} naruto",
                        tooLarge: "× Video is too large (25MB+). Try another keyword!",
                        success: "• 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐓𝐢𝐤𝐓𝐨𝐤 𝐄𝐝𝐢𝐭 𝐕𝐢𝐝𝐞𝐨.\n• 𝐒𝐞𝐚𝐫𝐜𝐡: %1",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const keyword = args.join(" ");
                if (!keyword) return message.reply(getLang("noInput"));

                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                const videoPath = path.join(cacheDir, `tiksr_${Date.now()}.mp4`);

                try {
                        api.setMessageReaction("⌛", event.messageID, () => {}, true);

                        const apiUrl = await baseApiUrl();
                        const res = await axios({
                                method: "GET",
                                url: `${apiUrl}/api/tiksr`,
                                params: { sr: keyword },
                                responseType: "stream"
                        });

                        const writer = fs.createWriteStream(videoPath);
                        res.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                                writer.on("finish", resolve);
                                writer.on("error", reject);
                        });

                        const stat = fs.statSync(videoPath);
                        if (stat.size > 26214400) {
                                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("tooLarge"));
                        }

                        await message.reply({
                                body: getLang("success", keyword),
                                attachment: fs.createReadStream(videoPath)
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        });

                } catch (err) {
                        console.error("TikEdit Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsFile(videoPath)) fs.unlinkSync(videoPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
