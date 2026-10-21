const axios = require("axios");

module.exports = {
  config: {
    name: "font2",
    aliases: ["fonts2", "style2"],
    version: "1.0",
    author: "—͞Sɪʏꫝᴍㅤ友",
    countDown: 5,
    role: 0,
    category: "tools",
    shortDescription: "Convert text to fancy fonts via API",
    longDescription: "Use /font <id> <text> or /font list",
    guide: "{pn} list | {pn} 16 Saim"
  },

  onStart: async function ({ message, event, api, threadPrefix }) {
    try {
      const prefix = threadPrefix || "/font";
      const body = event.body || "";
      const args = body.split(" ").slice(1);

      if (!args.length) {
        return api.sendMessage(
          `❌ Invalid usage!\nUse ${prefix} list to see available fonts\nor ${prefix} [number] [text] to convert`,
          event.threadID,
          event.messageID
        );
      }

      if (args[0].toLowerCase() === "list") {
        const preview = `✨ 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐅𝐨𝐧𝐭 𝐒𝐭𝐲𝐥𝐞𝐬 ✨
━━━━━━━━━━━━━━━━━━━━☆
1 ⟶ S̆̈ă̈ĭ̈m̆̈
2 ⟶  S̷a̷i̷m̷
3 ⟶  𝗦𝗮𝗶𝗺
4 ⟶  𝘚𝘢𝘪𝘮
5 ⟶  [S][a][i][m]
6 ⟶  𝕾𝖆𝖎𝖒
7 ⟶  Ｓａｉｍ
8 ⟶  ˢᵃⁱᵐ
9 ⟶  sɒᴉɯ
10 ⟶  🅂🄰🄸🄼
11 ⟶  🆂🅰🅸🅼
12 ⟶  𝒮𝒶𝒾𝓂
13 ⟶  Ⓢⓐⓘⓜ
14 ⟶  🅢🅐🅘🅜
15 ⟶  𝙎𝙖𝙞𝙢
16 ⟶  𝐒𝐚𝐢𝐦
17 ⟶  𝔖𝔞𝔦𝔪
18 ⟶  𝓢𝓪𝓲𝓶
19 ⟶  𝚂𝚊𝚒𝚖
20 ⟶  ꜱᴀɪᴍ
21 ⟶  𝑆𝑎𝑖𝑚
22 ⟶  𝑺𝒂𝒊𝒎
23 ⟶  𝕊𝕒𝕚𝕞
24 ⟶  ᦓꪖ꠸ꪑ
25 ⟶  ѕαιм
26 ⟶  ᏕᏗᎥᎷ
27 ⟶  丂卂丨爪
28 ⟶  Sᗩᓰᘻ
29 ⟶  ֆǟɨʍ
30 ⟶  𐌔𐌀𐌉𐌌
31 ⟶  ƧΛIM
━━━━━━━━━━━━━━━━━━━━━☆`;
        return api.sendMessage(preview, event.threadID, event.messageID);
      }

      const id = args[0];
      const text = args.slice(1).join(" ");
      if (!text) return api.sendMessage(`❌ Invalid usage! Provide text to convert.`, event.threadID, event.messageID);

      const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/font?id=${id}&text=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl);

      if (response.data.output) {
        return api.sendMessage(response.data.output, event.threadID, event.messageID);
      } else {
        return api.sendMessage(`❌ Font ${id} not found!`, event.threadID, event.messageID);
      }

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ An error occurred! Please try again later.", event.threadID, event.messageID);
    }
  }
};
