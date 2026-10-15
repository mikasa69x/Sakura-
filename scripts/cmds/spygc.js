module.exports = {
  config: {
    name: "spygc",
    version: "4.1",
    author: "乛 SIYAM ゎ",
    role: 2,
    shortDescription: {
      en: "Spy all group chats"
    },
    category: "box chat",
    guide: {
      en: "{pn}spygc"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      let groups = [];

      try {
        const threads = await api.getThreadList(100, null, ["INBOX"]);

        groups = threads.filter(
          t =>
            t.isGroup === true ||
            (t.threadID && (t.name || t.threadName))
        );
      } catch (e) {
        console.log("getThreadList failed:", e);
      }

      if (!groups.length) {
        return api.sendMessage(
          "❌ | No group chats found.\nBot হয়তো thread access পাচ্ছে না.",
          event.threadID,
          event.messageID
        );
      }

      const list = groups
        .map(
          (g, i) =>
            `┃ ${i + 1}. ${g.name || g.threadName || "Unnamed Group"}\n┃ 🆔 ${g.threadID}`
        )
        .join("\n━━━━━━━━━━━━━━\n");

      const msg = `┏━━━━━━━━━━━━━━━━━
┃ 🕵️‍♂️ 𝗚𝗥𝗢𝗨𝗣 𝗦𝗣𝗬 𝗟𝗜𝗦𝗧
┣━━━━━━━━━━━━━━━━━
${list}
┗━━━━━━━━━━━━━━━━━
✉️ Reply with group number`;

      api.sendMessage(msg, event.threadID, (err, info) => {
        if (err) return;

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "spygc",
          author: event.senderID,
          messageID: info.messageID,
          groupList: groups
        });
      });

    } catch (err) {
      console.error("spygc error:", err);

      api.sendMessage(
        `❌ | Error:\n${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  },

  onReply: async function ({ api, event, Reply }) {
    try {
      if (event.senderID !== Reply.author) return;

      const index = parseInt(event.body);

      if (
        isNaN(index) ||
        index < 1 ||
        index > Reply.groupList.length
      ) {
        return api.sendMessage(
          "❌ | Invalid number.",
          event.threadID,
          event.messageID
        );
      }

      const selected = Reply.groupList[index - 1];

      const info = await api.getThreadInfo(selected.threadID);

      const admins = await Promise.all(
        (info.adminIDs || []).map(async a => {
          try {
            const user = await api.getUserInfo(a.id);
            return user[a.id]?.name || "Unknown";
          } catch {
            return "Unknown";
          }
        })
      );

      // 250 Members Max
      const members = await Promise.all(
        (info.participantIDs || [])
          .slice(0, 250)
          .map(async uid => {
            try {
              const user = await api.getUserInfo(uid);
              return user[uid]?.name || "Unknown";
            } catch {
              return "Unknown";
            }
          })
      );

      const result = `┏━━━━━━━━━━━━━━━━━━
┃ 🕵️‍♂️ 𝗚𝗥𝗢𝗨𝗣 𝗗𝗘𝗧𝗔𝗜𝗟𝗦
┣━━━━━━━━━━━━━━━━━━
┃ 👥 Name: ${info.threadName || "Unknown"}
┃ 🆔 TID: ${info.threadID}
┃ 👤 Members: ${info.participantIDs?.length || 0}
┃ 👑 Admins: ${admins.join(", ") || "None"}
┃ 😄 Emoji: ${info.emoji || "None"}
┃ 🔐 Approval: ${info.approvalMode ? "ON" : "OFF"}
┣━━━━━━━━━━━━━━━━━━
┃ 📋 Members (250 Max)
┃ ${members.join(" │ ")}
┗━━━━━━━━━━━━━━━━━━`;

      api.sendMessage(
        result,
        event.threadID,
        event.messageID
      );

      global.GoatBot.onReply.delete(Reply.messageID);

    } catch (err) {
      console.error("spygc reply error:", err);

      api.sendMessage(
        `❌ | Failed to load group info.\n${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
