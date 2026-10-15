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
1 ⟶ Ĕ̈w̆̈’r̆̈ S̆̈ă̈ĭ̈m̆̈
2 ⟶ E̷w̷'̷r̷ S̷a̷i̷m̷
3 ⟶ 𝗘𝘄'𝗿 𝗦𝗮𝗶𝗺
4 ⟶ 𝘌𝘸'𝘳 𝘚𝘢𝘪𝘮
5 ⟶ [E][w]'[r] [S][a][i][m]
6 ⟶ 𝕰𝖜'𝖗 𝕾𝖆𝖎𝖒
7 ⟶ Ｅｗ'ｒ Ｓａｉｍ
8 ⟶ ᴱʷ'ʳ ˢᵃⁱᵐ
9 ⟶ ǝʍ'ɹ sɒᴉɯ
10 ⟶ 🄴🅆'🅁 🅂🄰🄸🄼
11 ⟶ 🅴🆆'🆁 🆂🅰🅸🅼
12 ⟶ 𝐸𝓌'𝓇 𝒮𝒶𝒾𝓂
13 ⟶ Ⓔⓦ'ⓡ Ⓢⓐⓘⓜ
14 ⟶ 🅔🅦'🅡 🅢🅐🅘🅜
15 ⟶ 𝙀𝙬'𝙧 𝙎𝙖𝙞𝙢
16 ⟶ 𝐄𝐰'𝐫 𝐒𝐚𝐢𝐦
17 ⟶ 𝔈𝔴'𝔯 𝔖𝔞𝔦𝔪
18 ⟶ 𝓔𝔀'𝓻 𝓢𝓪𝓲𝓶
19 ⟶ 𝙴𝚠'𝚛 𝚂𝚊𝚒𝚖
20 ⟶ ᴇᴡ'ʀ ꜱᴀɪᴍ
21 ⟶ 𝐸𝑤'𝑟 𝑆𝑎𝑖𝑚
22 ⟶ 𝑬𝒘'𝒓 𝑺𝒂𝒊𝒎
23 ⟶ 𝔼𝕨'𝕣 𝕊𝕒𝕚𝕞
24 ⟶ ꫀ᭙'᥅ ᦓꪖ꠸ꪑ
25 ⟶ єω'я ѕαιм
26 ⟶ ᏋᏇ'Ꮢ ᏕᏗᎥᎷ
27 ⟶ 乇山'尺 丂卂丨爪
28 ⟶ ᘿᘺ'ᖇ Sᗩᓰᘻ
29 ⟶ ɛա'ʀ ֆǟɨʍ
30 ⟶ 𐌄Ꮤ'𐌓 𐌔𐌀𐌉𐌌
31 ⟶ ΣЩ’Я ƧΛIM
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
