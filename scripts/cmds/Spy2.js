module.exports = {
  config: {
    name: "spy2",
    version: "1.6",
    author: "乛 SIYAM ゎ",
    role: 0,
    countDown: 5,
    shortDescription: "Deep dive into user stats",
    longDescription: "Fetch complete profile details including UID, balance, level, rank, with reactions.",
    category: "box chat"
  },

  onStart: async function ({ event, message, api, usersData, args }) {
    const requesterID = event.senderID;
    const mentionIDs = Object.keys(event.mentions || {});
    let targetID = mentionIDs[0];

    api.setMessageReaction(event.messageID, "🕜", () => {}, true);

    if (args[0]) {
      const numeric = /^\d+$/.test(args[0]) ? args[0] : null;
      const linkMatch = args[0].match(/profile\.php\?id=(\d+)/);
      targetID = numeric || (linkMatch ? linkMatch[1] : targetID);
    }

    if (!targetID) {
      targetID = event.type === "message_reply"
        ? event.messageReply.senderID
        : requesterID;
    }

    try {
      const fbData = await new Promise((resolve, reject) => {
        api.getUserInfo(targetID, (err, result) =>
          err ? reject(err) : resolve(result)
        );
      });

      const userData = fbData[targetID];
      const avatarLink = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

      const userRecord = await usersData.get(targetID);
      const requesterRecord = await usersData.get(requesterID);
      const requesterName = requesterRecord.name || "Friend";

      const fullName = userData.name || "N/A";
      const username = userData.vanity || "None";

      const genderStr =
        userData.gender === 1
          ? "👧 Female"
          : userData.gender === 2
          ? "👦 Male"
          : "🌈 Unknown";

      const isFriend = userData.isFriend ? "✅ Yes" : "❌ No";

      const balance = userRecord.money || 0;
      const xp = userRecord.exp || 0;

      let nickname = "—";
      try {
        const threadInfo = event.threadID
          ? await api.getThreadInfo(event.threadID)
          : {};
        nickname = threadInfo.nicknames?.[targetID] || "—";
      } catch {
        nickname = "—";
      }

      const allUsers = await usersData.getAll();
      const rankIdx = allUsers
        .filter(u => typeof u.money === "number")
        .sort((a, b) => b.money - a.money)
        .findIndex(u => u.userID === targetID);

      const rank = rankIdx !== -1 ? `#${rankIdx + 1}` : "—";

      const cardMessage = `────────────────────────
   ✦ PROFILE INSIGHT ✦ 
────────────────────────

🪪 Name        : ${fullName}
🌐 Username    : ${username}
💬 Nickname    : ${nickname}
🆔 UID         : ${targetID}

💰 Balance     : $${balance}
⭐  XP          : ${xp}
👑 Rank        : ${rank}

🚻 Gender      : ${genderStr}
🤝 Friend      : ${isFriend}
💞 Relation    : Single

🔗 Profile     : https://www.facebook.com/${targetID}

✨ Requested by: ${requesterName}
────────────────────────────`;

      await message.reply({
        body: cardMessage,
        attachment: await global.utils.getStreamFromURL(avatarLink)
      });

      api.setMessageReaction(event.messageID, "✅", () => {}, true);

    } catch (err) {
      console.error("[spy2] Error:", err);
      return message.reply("⚠️ Could not retrieve profile info. Try again later!");
    }
  }
};
