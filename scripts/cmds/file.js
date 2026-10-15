const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "file",
    aliases: ["filecmd", "cmdfile"],
    version: "2.5.0",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 2,
    category: "system",
    shortDescription: { en: "view code (auto-delete in 10s)" }
  },

  onStart: async function ({ api, args, message, event }) {
    const stylize = (text) => {
      const fonts = {
        "a":"𝖺","b":"𝖻","c":"𝖼","d":"𝖽","e":"𝖾","f":"𝖿","g":"𝗀","h":"𝗁","i":"𝗂","j":"𝗃","k":"𝗄","l":"𝗅","m":"𝗆",
        "n":"𝗇","o":"𝗈","p":"𝗉","q":"𝗊","r":"𝗋","s":"𝗌","t":"𝗍","u":"𝗎","v":"𝗏","w":"𝗐","x":"𝗑","y":"𝗒","z":"𝗓",
        "0":"𝟎","1":"𝟏","2":"𝟐","3":"𝟑","4":"𝟒","5":"𝟓","6":"𝟔","7":"𝟕","8":"𝟖","9":"𝟗"
      };
      return text.toString().toLowerCase().split('').map(char => fonts[char] || char).join('');
    };

    const cmdName = args[0];
    if (!cmdName) {
      return message.reply(` 𐃷 ${stylize("please provide a command name")} `);
    }

    const cmdPath = path.join(__dirname, `${cmdName}.js`);
    if (!fs.existsSync(cmdPath)) {
      return message.reply(`🤦🏻 ${stylize("sorry, command")} ${stylize(cmdName)} ${stylize("not found")} 🌀`);
    }

    try {
      const code = fs.readFileSync(cmdPath, "utf8");

      if (code.length > 19000) {
        return message.reply(` ${stylize("this file is too large")}`);
      }

      const infoMsg = await message.reply(`🌷 ✨ ${stylize("fetching code for")}: ${stylize(cmdName)}.js\n⋆ ${stylize("status")}: ${stylize("will delete in 10s")}... ᯓ★`);

      const mainMsg = await message.reply(`✨ ${stylize("source code of")} ${stylize(cmdName)} 𐃷 Ი𐑼\n\n${code}`);

      // Auto-delete after 10 seconds
      setTimeout(async () => {
        try {
          await api.unsendMessage(infoMsg.messageID);
          await api.unsendMessage(mainMsg.messageID);
        } catch (e) {
          console.error("Auto-delete failed", e);
        }
      }, 10000);

    } catch (err) {
      console.error(err);
      return message.reply(`✧ ${stylize("failed to read the file")}  `);
    }
  }
};
