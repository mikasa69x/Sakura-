const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "sutro",
        aliases: ["formula", "kichu nai"],
        version: "2.0.0",
        author: "xiyam",
        countDown: 5,
        role: 0,
        category: "education"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;
        const input = args.join(" ");
        let responseText = "";

        if (input.includes("৩") || input.toLowerCase().includes("3")) {
            responseText = `
📐 ( 𝐁𝐢𝐣𝐠𝐨𝐧𝐢𝐭 - 𝐂𝐡𝐚𝐩𝐭𝐞𝐫 𝟑 )
━━━━━━━━━━━━━━━━━━
𝟏. (𝐚+𝐛)² = 𝐚²+𝟐𝐚𝐛+𝐛²
𝟐. (𝐚-𝐛)² = 𝐚²-𝟐𝐚𝐛+𝐛²
𝟑. 𝐚²-𝐛² = (𝐚+𝐛)(𝐚-𝐛)
𝟒. 𝐚²+𝐛² = (𝐚+𝐛)²-𝟐𝐚𝐛 = (𝐚-𝐛)²+𝟐𝐚𝐛
𝟓. (𝐚+𝐛)³ = 𝐚³+𝟑𝐚²𝐛+𝟑𝐚𝐛²+𝐛³
𝟔. (𝐚-𝐛)³ = 𝐚³-𝟑𝐚²𝐛+𝟑𝐚𝐛²-𝐛³
𝟕. 𝐚³+𝐛³ = (𝐚+𝐛)(𝐚²-𝐚𝐛+𝐛²)
𝟖. 𝐚³-𝐛³ = (𝐚-𝐛)(𝐚²+𝐚𝐛+𝐛²)
𝟗. 𝟒𝐚𝐛 = (𝐚+𝐛)²-(𝐚-𝐛)²
━━━━━━━━━━━━━━━━━━`;
        } else if (input.includes("৯") || input.toLowerCase().includes("9")) {
            responseText = `
📐 ( 𝐓𝐫𝐢𝐠𝐨𝐧𝐨𝐦𝐞𝐭𝐫𝐲 - 𝐂𝐡𝐚𝐩𝐭𝐞𝐫 𝟗 )
━━━━━━━━━━━━━━━━━━
𝟏. 𝐬𝐢𝐧²θ + 𝐜𝐨𝐬²θ = 𝟏
𝟐. 𝐬𝐞𝐜²θ - 𝐭𝐚𝐧²θ = 𝟏
𝟑. 𝐜𝐨𝐬𝐞𝐜²θ - 𝐜𝐨𝐭²θ = 𝟏
𝟒. 𝐭𝐚𝐧θ = 𝐬𝐢𝐧θ/𝐜𝐨𝐬θ
𝟓. 𝐜𝐨𝐭θ = 𝐜𝐨𝐬θ/𝐬𝐢𝐧θ
𝟔. 𝐬𝐢𝐧θ = 𝟏/𝐜𝐨𝐬𝐞𝐜θ
━━━━━━━━━━━━━━━━━━`;
        } else if (input.includes("১৬") || input.toLowerCase().includes("16")) {
            responseText = `
📐 ( 𝐌𝐞𝐧𝐬𝐮𝐫𝐚𝐭𝐢𝐨𝐧 - 𝐂𝐡𝐚𝐩𝐭𝐞𝐫 𝟏𝟔 )
━━━━━━━━━━━━━━━━━━
𝟏. 𝐓𝐫𝐢𝐚𝐧𝐠𝐥𝐞 𝐀𝐫𝐞𝐚 = ½ × 𝐛 × 𝐡
𝟐. 𝐄𝐪𝐮𝐢𝐥𝐚𝐭𝐞𝐫𝐚𝐥 𝐀𝐫𝐞𝐚 = (√𝟑/𝟒)𝐚²
𝟑. 𝐑𝐞𝐜𝐭𝐚𝐧𝐠𝐥𝐞 𝐀𝐫𝐞𝐚 = 𝐥 × 𝐰
𝟒. 𝐂𝐢𝐫𝐜𝐥𝐞 𝐀𝐫𝐞𝐚 = π𝐫²
𝟓. 𝐂𝐢𝐫𝐜𝐮𝐦𝐟𝐞𝐫𝐞𝐧𝐜𝐞 = 𝟐π𝐫
𝟔. 𝐂𝐲𝐥𝐢𝐧𝐝𝐞𝐫 𝐕𝐨𝐥𝐮𝐦𝐞 = π𝐫²𝐡
━━━━━━━━━━━━━━━━━━`;
        } else if (input.includes("১৩") || input.toLowerCase().includes("13")) {
            responseText = `
📐 ( 𝐅𝐢𝐧𝐢𝐭𝐞 𝐒𝐞𝐫𝐢𝐞𝐬 - 𝐂𝐡𝐚𝐩𝐭𝐞𝐫 𝟏𝟑 )
━━━━━━━━━━━━━━━━━━
𝟏. 𝐧-𝐭𝐡 𝐭𝐞𝐫𝐦 = 𝐚 + (𝐧-𝟏)𝐝
𝟐. 𝐒𝐮𝐦 (𝐒𝐧) = 𝐧/𝟐 {𝟐𝐚 + (𝐧-𝟏)𝐝}
𝟑. 𝟏+𝟐+𝟑...+𝐧 = {𝐧(𝐧+𝟏)}/𝟐
𝟒. 𝟏²+𝟐²+𝟑²...+𝐧² = {𝐧(𝐧+𝟏)(𝟐𝐧+𝟏)}/𝟔
━━━━━━━━━━━━━━━━━━`;
        } else {
            responseText = `
📖 ( 𝐌𝐚𝐭𝐡 𝐅𝐨𝐫𝐦𝐮𝐥𝐚 𝐋𝐢𝐬𝐭 )
━━━━━━━━━━━━━━━━━━
🥀 𝐎𝐝𝐝𝐡𝐚𝐲 𝐒𝐞𝐥𝐞𝐜𝐭 𝐊𝐨𝐫𝐮𝐧:
🕊️ /𝐬𝐮𝐭𝐫𝐨 𝟑 (𝐁𝐢𝐣𝐠𝐨𝐧𝐢𝐭)
🪶 /𝐬𝐮𝐭𝐫𝐨 𝟗 (𝐓𝐫𝐢𝐤𝐨𝐧𝐦𝐢𝐭𝐢)
🦥 /𝐬𝐮𝐭𝐫𝐨 𝟏𝟑 (𝐃𝐡𝐚𝐫𝐚)
🥀 /𝐬𝐮𝐭𝐫𝐨 𝟏𝟔 (𝐏𝐨𝐫𝐢𝐦𝐢𝐭𝐢)
━━━━━━━━━━━━━━━━━━
• ─꯭─⃝‌‌愛|ᴍɪᴋᴀsᴀ🎀 ̶꯭𝅥ͦ𝆬影`;
        }

        try {
            const res = await axios.get("https://api.waifu.pics/sfw/happy");
            const cachePath = path.join(__dirname, `/cache/sutro_${Date.now()}.gif`);
            const imageRes = await axios.get(res.data.url, { responseType: "arraybuffer" });
            fs.writeFileSync(cachePath, Buffer.from(imageRes.data, "utf-8"));

            return api.sendMessage({
                body: responseText.trim(),
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            }, messageID);
        } catch (err) {
            return api.sendMessage(responseText.trim(), threadID, messageID);
        }
    }
};
