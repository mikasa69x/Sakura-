const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "leave",
    aliases: ["l"],
    version: "5.0",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 2,
    shortDescription: "Bot will leave a group chat",
    longDescription: "",
    category: "admin",
    guide: {
      en: "{p}{n}",
    },
  },

  onStart: async function ({ api, event }) {
    try {
      const groupList = await api.getThreadList(300, null, ['INBOX']);
      const filteredList = groupList.filter(group => group.isGroup === true);

      if (filteredList.length === 0) {
        return api.sendMessage('❌ No group chats found', event.threadID);
      }

      const groupsWithNames = await Promise.all(
        filteredList.map(async (group) => {
          let name = group.name || group.threadName;
          if (!name || name === "null" || name === "undefined" || name.trim() === "") {
            try {
              const info = await api.getThreadInfo(group.threadID);
              name = info.threadName
                || info.name
                || info.thread_name
                || (info.userInfo && info.userInfo.length > 0
                  ? info.userInfo.map(u => u.name).join(", ")
                  : null)
                || `Group ${group.threadID}`;
            } catch {
              name = `Group ${group.threadID}`;
            }
          }
          return { threadID: group.threadID, threadName: name };
        })
      );

      const start = 0;
      const currentList = groupsWithNames.slice(start, start + 5);
      const totalPages = Math.ceil(groupsWithNames.length / 5);
      const currentPage = 1;

      // ———— GC Name upure, TID niche ———— //
      const formattedList = currentList.map((group, index) =>
        `│${start + index + 1}. ${group.threadName}\n│   𝐓𝐈𝐃: ${group.threadID}`
      );

      const messageText =
        `╭─╮\n│𝐋𝐢𝐬𝐭 𝐨𝐟 𝐠𝐫𝐨𝐮𝐩 𝐜𝐡𝐚𝐭𝐬:\n` +
        `│📄 Page ${currentPage}/${totalPages}\n` +
        `│\n` +
        `${formattedList.join("\n│\n")}\n` +
        `╰───────────ꔪ\n\n` +
        `💬 Reply:\n` +
        `• Number → Leave group\n` +
        `• "next" → Next page\n` +
        `• "previous" → Previous page`;

      const sentMessage = await api.sendMessage(messageText, event.threadID);
      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: 'leave',
        messageID: sentMessage.messageID,
        author: event.senderID,
        start,
        allGroups: groupsWithNames
      });

    } catch (error) {
      console.error("Error listing group chats", error);
      return api.sendMessage('❌ Group list আনতে সমস্যা হয়েছে।', event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, start, allGroups } = Reply;

    if (event.senderID !== author) return;

    const userInput = args.join(" ").trim().toLowerCase();

    try {
      if (userInput === 'next') {
        const nextStart = start + 5;

        if (nextStart >= allGroups.length) {
          return api.sendMessage('⚠️ এটাই শেষ page।', event.threadID);
        }

        const currentList = allGroups.slice(nextStart, nextStart + 5);
        const totalPages = Math.ceil(allGroups.length / 5);
        const currentPage = Math.floor(nextStart / 5) + 1;

        const formattedList = currentList.map((group, index) =>
          `│${nextStart + index + 1}. ${group.threadName}\n│   𝐓𝐈𝐃: ${group.threadID}`
        );

        const messageText =
          `╭─╮\n│𝐋𝐢𝐬𝐭 𝐨𝐟 𝐠𝐫𝐨𝐮𝐩 𝐜𝐡𝐚𝐭𝐬:\n` +
          `│📄 Page ${currentPage}/${totalPages}\n` +
          `│\n` +
          `${formattedList.join("\n│\n")}\n` +
          `╰───────────ꔪ\n\n` +
          `💬 Reply:\n` +
          `• Number → Leave group\n` +
          `• "next" → Next page\n` +
          `• "previous" → Previous page`;

        const sentMessage = await api.sendMessage(messageText, event.threadID);
        global.GoatBot.onReply.set(sentMessage.messageID, {
          commandName: 'leave',
          messageID: sentMessage.messageID,
          author: event.senderID,
          start: nextStart,
          allGroups
        });

      } else if (userInput === 'previous') {
        const prevStart = Math.max(start - 5, 0);

        if (prevStart === start) {
          return api.sendMessage('⚠️ এটাই প্রথম page।', event.threadID);
        }

        const currentList = allGroups.slice(prevStart, prevStart + 5);
        const totalPages = Math.ceil(allGroups.length / 5);
        const currentPage = Math.floor(prevStart / 5) + 1;

        const formattedList = currentList.map((group, index) =>
          `│${prevStart + index + 1}. ${group.threadName}\n│   𝐓𝐈𝐃: ${group.threadID}`
        );

        const messageText =
          `╭─╮\n│𝐋𝐢𝐬𝐭 𝐨𝐟 𝐠𝐫𝐨𝐮𝐩 𝐜𝐡𝐚𝐭𝐬:\n` +
          `│📄 Page ${currentPage}/${totalPages}\n` +
          `│\n` +
          `${formattedList.join("\n│\n")}\n` +
          `╰───────────ꔪ\n\n` +
          `💬 Reply:\n` +
          `• Number → Leave group\n` +
          `• "next" → Next page\n` +
          `• "previous" → Previous page`;

        const sentMessage = await api.sendMessage(messageText, event.threadID);
        global.GoatBot.onReply.set(sentMessage.messageID, {
          commandName: 'leave',
          messageID: sentMessage.messageID,
          author: event.senderID,
          start: prevStart,
          allGroups
        });

      } else if (!isNaN(userInput) && userInput !== "") {
        const groupIndex = parseInt(userInput, 10);

        if (groupIndex <= 0 || groupIndex > allGroups.length) {
          return api.sendMessage(
            `❌ Invalid number!\n1 থেকে ${allGroups.length} এর মধ্যে দাও।`,
            event.threadID
          );
        }

        const selectedGroup = allGroups[groupIndex - 1];
        const botUserID = api.getCurrentUserID();

        await api.removeUserFromGroup(botUserID, selectedGroup.threadID);
        await api.sendMessage(
          `✅ Left group: ${selectedGroup.threadName}`,
          event.threadID
        );

      } else {
        return api.sendMessage(
          '❌ Invalid input!\nNumber, "next" অথবা "previous" reply করো।',
          event.threadID
        );
      }

    } catch (error) {
      console.error("Leave command error:", error);
      return api.sendMessage('❌ সমস্যা হয়েছে! আবার চেষ্টা করো।', event.threadID);
    }

    global.GoatBot.onReply.delete(event.messageID);
  },
};
