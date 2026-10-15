const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const res = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return res.data.mahmud;
};

module.exports = {
  config: {
    name: "tokai",
    aliases: ["toqai"],
    version: "1.7",
    author: "乛 SIYAM ゎ",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "[mention/reply/UID]",
  },

  onStart: async function ({ api, event, args }) {
    const { mentions, threadID, messageID, messageReply } = event;

    let id;

    if (Object.keys(mentions).length > 0) {
      id = Object.keys(mentions)[0];
    } else if (messageReply) {
      id = messageReply.senderID;
    } else if (args[0]) {
      id = args[0];
    } else {
      return api.sendMessage(
        "❌ Mention, reply, or give UID",
        threadID,
        messageID
      );
    }

    try {
      const apiUrl = await baseApiUrl();
      const url = `${apiUrl}/api/tokai?user=${id}`;

      const res = await axios.get(url, { responseType: "arraybuffer" });

      const filePath = path.join(__dirname, "tokai.png");
      fs.writeFileSync(filePath, res.data);

      api.sendMessage(
        {
          body: "gwk gwk gwk🐸🫰🏻",
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );
    } catch (err) {
      api.sendMessage(" error, contact admin", threadID, messageID);
    }
  },
};
