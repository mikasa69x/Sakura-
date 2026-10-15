const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'egg',
    version: '2.1',
    author: '乛 SIYAM ゎ',
    role: 0,
    countDown: 3,
    prefix: false,
    description: 'Make your picture into a shape of m&ms!',
    category: 'fun',
    usages: ['mnm @mention / reply / uid / fb link']
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    try {
      let uid;

      const findUserByName = async (query) => {
        try {
          const cleanQuery = query.replace(/@/g, "").trim().toLowerCase();
          const threadInfo = await api.getThreadInfo(event.threadID);
          const ids = threadInfo.participantIDs || [];
          const matches = [];

          for (const id of ids) {
            try {
              const name = (await usersData.getName(id)).toLowerCase();
              if (name.includes(cleanQuery)) {
                matches.push({ uid: id, name });
              }
            } catch {}
          }
          return matches;
        } catch {
          return [];
        }
      };

      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      } 
      else if (args.join(" ").includes("facebook.com")) {
        const match = args.join(" ").match(/(\d{5,})/);
        if (!match) return message.reply("❌ Invalid Facebook URL");
        uid = match[0];
      } 
      else if (args[0] && /^\d+$/.test(args[0])) {
        uid = args[0];
      } 
      else if (args[0]) {
        const query = args.join(" ");
        const matches = await findUserByName(query);

        if (matches.length === 0) {
          return message.reply(`❌ User not found: ${query.replace(/@/g, "")}`);
        }

        if (matches.length > 1) {
          const matchList = matches.map((m, i) => `${i + 1}. ${m.name}`).join('\n');
          return message.reply(`Multiple users found:\n${matchList}`);
        }

        uid = matches[0].uid;
      } 
      else {
        uid = event.senderID;
      }

   
      const avt = `https://arshi-facebook-pp.vercel.app/api/pp?uid=${uid}`;
      const url = `https://api.popcat.xyz/v2/mnm?image=${encodeURIComponent(avt)}`;

      const res = await axios.get(url, { responseType: 'arraybuffer' });

      const filePath = path.join(__dirname, 'cache', `blur_${uid}.jpg`);
      fs.writeFileSync(filePath, res.data);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });


      fs.unlinkSync(filePath);

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to send image.");
    }
  }
};
