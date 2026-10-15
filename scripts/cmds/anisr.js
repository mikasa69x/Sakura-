const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "anisr",
                aliases: ["animsr", "anisrch"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 10,
                role: 0,
                description: {
                        en: "Search any anime and get its video"
                },
                category: "anime",
                guide: {
                        en: '   {pn} <anime name>: Provide the anime name to search'
                }
        },

        langs: {
                en: {
                        noQuery: "• Baby, please provide a search query! 😘",
                        success: "• 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐚𝐧𝐢𝐦𝐞 𝐯𝐢𝐝𝐞𝐨 <\n• 𝐒𝐞𝐚𝐫𝐜𝐡: %1",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const kw = args.join(" ");
                if (!kw) return message.reply(getLang("noQuery"));

                const cacheDir = path.join(__dirname, "cache");
                const videoPath = path.join(cacheDir, `anisr_${Date.now()}.mp4`);
                fs.ensureDirSync(cacheDir);

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const base = await baseApiUrl();
                        const apiUrl = `${base}/api/anisr?search=${encodeURIComponent(kw)}`;

                        const response = await axios({
                                method: "get",
                                url: apiUrl,
                                responseType: "stream",
                                timeout: 60000
                        });

                        const writer = fs.createWriteStream(videoPath);
                        response.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                                writer.on("finish", resolve);
                                writer.on("error", reject);
                        });

                        if (fs.statSync(videoPath).size < 100) throw new Error("File empty or invalid.");

                        api.setMessageReaction("✅", event.messageID, () => {}, true);

                        return message.reply({
                                body: getLang("success", kw),
                                attachment: fs.createReadStream(videoPath)
                        }, () => {
                                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        });

                } catch (err) {
                        console.error("Anisr Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
