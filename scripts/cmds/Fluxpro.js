const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "fluxpro",
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 15,
                role: 0,
                description: {
                        en: "Generate high-quality AI images using Flux Pro model"
                },
                category: "image gen",
                guide: {
                        en: '   {pn} <prompt> --ratio <value>: Provide description and ratio'
                }
        },

        langs: {
                en: {
                        noPrompt: "× Baby, please provide a prompt to generate image!",
                        wait: "🔄 | Generating your image, please wait...",
                        success: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐟𝐥𝐮𝐱 𝐩𝐫𝐨 𝐢𝐦𝐚𝐠𝐞 𝐛𝐚𝐛𝐲 <😘",
                        error: "× API error: %1"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const fullArgs = args.join(" ");
                if (!fullArgs) return message.reply(getLang("noPrompt"));

                const [prompt, ratio = "1:1"] = fullArgs.includes("--ratio") 
                        ? fullArgs.split("--ratio").map(s => s.trim()) 
                        : [fullArgs, "1:1"];

                const cacheDir = path.join(__dirname, "cache");
                const filePath = path.join(cacheDir, `fluxpro_${Date.now()}.png`);
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        const waitMsg = await message.reply(getLang("wait"));

                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/fluxpro?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`;

                        const response = await axios.get(url, { responseType: "arraybuffer", timeout: 120000 });
                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
                        api.setMessageReaction("✅", event.messageID, () => {}, true);

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Flux Pro Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
