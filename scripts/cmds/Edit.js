const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "edit",
                aliases: ["imgedit"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 10,
                role: 0,
                description: {
                        en: "Edit your image using AI prompt"
                },
                category: "ai-image",
                guide: {
                        en: '   {pn} <prompt>: Reply to an image with edit instructions'
                                + '\n   Example: {pn} add sunglasses to face'
                }
        },

        langs: {
                en: {
                        noInput: "× Baby, please reply to a photo with your prompt to edit it! 🪄",
                        wait: "🎨 | Editing your image, please wait...🪄",
                        success: "✅ Here's your Edited image\nPrompt: %1",
                        error: "× Failed to edit: %1."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const prompt = args.join(" ");
                const repliedImage = event.messageReply?.attachments?.[0];

                if (!prompt || !repliedImage || repliedImage.type !== "photo") {
                        return message.reply(getLang("noInput"));
                }

                const cacheDir = path.join(__dirname, "cache");
                const imgPath = path.join(cacheDir, `${Date.now()}_edit.jpg`);
                await fs.ensureDir(cacheDir);

                const waitMsg = await message.reply(getLang("wait"));

                try {
                        const baseURL = await mahmud();
                        const res = await axios.post(
                                `${baseURL}/api/edit`,
                                { prompt, imageUrl: repliedImage.url },
                                { responseType: "arraybuffer" }
                        );

                        await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));

                        await message.reply({
                                body: getLang("success", prompt),
                                attachment: fs.createReadStream(imgPath)
                        });

                } catch (err) {
                        console.error("Edit Command Error:", err);
                        return message.reply(getLang("error", err.message));
                } finally {
                        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
                        setTimeout(() => {
                                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        }, 10000);
                }
        }
};
