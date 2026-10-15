const axios = require("axios");

let cachedApiUrl = null; // Cache করা হলো

const baseApiUrl = async () => {
  if (cachedApiUrl) return cachedApiUrl; // Cache থাকলে আর fetch না
  const res = await axios.get(
    `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`
  );
  cachedApiUrl = res.data.api;
  return cachedApiUrl;
};

async function getAvatarUrls(userIDs) {
  const fallback = "https://i.ibb.co/qk0bnY8/363492156-824459359287620-3125820102191295474-n-png-nc-cat-1-ccb-1-7-nc-sid-5f2048-nc-eui2-Ae-HIhi-I.png";
  const results = await Promise.all(
    userIDs.map(async (userID) => {
      try {
        const url = `https://graph.facebook.com/${userID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url);
        return res.request.res.responseUrl || fallback;
      } catch {
        return fallback;
      }
    })
  );
  return results;
}

module.exports = {
  config: {
    name: "gcimage",
    aliases: ["allphoto", "grpimage"],
    version: "1.1",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    description: "𝗚𝗲𝘁 𝗚𝗿𝗼𝘂𝗽 𝗜𝗺𝗮𝗴𝗲",
    category: "tools",
    guide: "{pn} --color [color] --bgcolor [color] --admincolor [color] --membercolor [color]",
  },

  onStart: async function ({ api, args, event, message }) {
    try {
      // Args parse — splice bug fix
      let color = "white";
      let bgColor;
      let adminColor = "yellow";
      let memberColor = "cyan";
      let groupborderColor = "lime";
      let glow = false;

      const parsedArgs = [...args]; // Original copy রাখো
      for (let i = 0; i < parsedArgs.length; i++) {
        switch (parsedArgs[i]) {
          case "--color":        color = parsedArgs[i + 1]; i++; break;
          case "--bgcolor":      bgColor = parsedArgs[i + 1]; i++; break;
          case "--admincolor":   adminColor = parsedArgs[i + 1]; i++; break;
          case "--membercolor":  memberColor = parsedArgs[i + 1]; i++; break;
          case "--groupBorder":  groupborderColor = parsedArgs[i + 1]; i++; break;
          case "--glow":         glow = parsedArgs[i + 1]; i++; break;
        }
      }

      // Waiting message
      let waitingMsg = null;
      try {
        waitingMsg = await api.sendMessage(
          "⏳ |  𝒘𝒂𝒊𝒕 𝒌𝒐𝒓𝒐",
          event.threadID
        );
      } catch (_) {}

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // Thread info + avatars একসাথে fetch (faster)
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participantIDs = threadInfo.participantIDs;
      const adminIDs = threadInfo.adminIDs.map((a) => a.id);

      const [memberURLs, adminURLs] = await Promise.all([
        getAvatarUrls(participantIDs),
        getAvatarUrls(adminIDs),
      ]);

      const payload = {
        memberURLs,
        groupPhotoURL: threadInfo.imageSrc,
        adminURLs,
        groupName: threadInfo.threadName,
        bgcolor: bgColor,
        admincolor: adminColor,
        membercolor: memberColor,
        color,
        groupborderColor,
        glow,
      };

      const apiBase = await baseApiUrl();
      const { data } = await axios.post(`${apiBase}/gcimg`, payload, {
        responseType: "stream",
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // Safe unsend
      if (waitingMsg?.messageID) {
        message.unsend(waitingMsg.messageID).catch(() => {});
      }

      await message.reply({
        body: `𝑯𝒆𝒓𝒆 𝒊𝒔 𝒚𝒐𝒖𝒓 𝒈𝒓𝒐𝒖𝒑 𝒊𝒎𝒂𝒈𝒆 <😘`,
        attachment: data,
      });

    } catch (error) {
      console.error("gcimage error:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply(`❌ | Error: ${error.message}`);
    }
  },
};
