const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const response = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return response.data.mahmud;
};

module.exports = {
        config: {
                name: "animevideo",
                aliases: ["anivid", "animevideo"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 10,
                role: 0,
                description: {
                        en: "Get a random anime video status"
                },
                category: "anime",
                guide: {
                        en: '   {pn}: Get a random anime video'
                                + '\n   {pn} list: See available categories'
                }
        },

        langs: {
                en: {
                        noCat: "× No anime categories found.",
                        wait: "🐤 | Loading random anime video... Please wait baby! <😘",
                        noVid: "× No videos found.",
                        success: "✨ | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐚𝐧𝐢𝐦𝐞 𝐯𝐢𝐝𝐞𝐨 𝐛𝐚𝐛𝐲 <",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, message, args, getLang }) {
                const cacheDir = path.join(__dirname, "cache");
                const filePath = path.join(cacheDir, `anime_${Date.now()}.mp4`);
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

                try {
                        const apiUrl = await mahmud();

                        if (args[0] === "list") {
                                const response = await axios.get(`${apiUrl}/api/album/list`);
                                const lines = response.data.message.split("\n");
                                const animeCategories = lines.filter(line =>
                                        /anime/i.test(line) && !/hanime/i.test(line) && !/Total\s*anime/i.test(line)
                                );
                                if (!animeCategories.length) return message.reply(getLang("noCat"));
                                return message.reply(animeCategories.join("\n"));
                        }

                        const waitMsg = await message.reply(getLang("wait"));
                        
                        const res = await axios.get(`${apiUrl}/api/album/mahmud/videos/anime?userID=${event.senderID}`);
                        if (!res.data.success || !res.data.videos.length) {
                                if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
                                return message.reply(getLang("noVid"));
                        }

                        const url = res.data.videos[Math.floor(Math.random() * res.data.videos.length)];
                        
                        const videoRes = await axios({
                                url,
                                method: "GET",
                                responseType: "stream",
                                headers: { 'User-Agent': 'Mozilla/5.0' }
                        });

                        const writer = fs.createWriteStream(filePath);
                        videoRes.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                                writer.on("finish", resolve);
                                writer.on("error", reject);
                        });

                        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Anime Video Error:", err);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
