const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "clown",
    version: "1.7",
    author: "乛 SIYAM ゎ",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "clown [mention/reply/UID]",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions } = event;
    let id2 = messageReply?.senderID || Object.keys(mentions)[0] || args[0];
    if (!id2) return api.sendMessage("Mention, reply, or provide UID of the target.", threadID, messageID);

    try {
      const url = `${await baseApiUrl()}/api/dig?type=clown&user=${id2}`;
      const img = await axios.get(url, { responseType: "arraybuffer" });
      const file = path.join(__dirname, `clown_${id2}.png`);
      fs.writeFileSync(file, img.data);

      api.sendMessage({
        body: "Effect clown successful 🤡",
        attachment: fs.createReadStream(file)
      }, threadID, () => fs.unlinkSync(file), messageID);

    } catch {
      api.sendMessage(" An error occurred.", threadID, messageID);
    }
  }
};
