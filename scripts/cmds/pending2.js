module.exports = {
  config: {
    name: "pending2",
    aliases: ["pen2", "pend", "pe"],
    version: "1.7.0",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 1,
    shortDescription: "handle pending requests",
    longDescription: "Approve or reject pending users or group requests",
    category: "utility",
  },

  onReply: async function ({ message, api, event, Reply }) {
    const { author, pending, messageID } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const { body, threadID } = event;

    // ✅ Cancel operation
    if (body.trim().toLowerCase() === "c") {
      try {
        await api.unsendMessage(messageID);
      } catch {}
      return api.sendMessage(`❌ Operation canceled!`, threadID);
    }

    const indexes = body.split(/\s+/).map(Number);

    if (indexes.some(isNaN)) {
      return api.sendMessage(`⚠ Invalid input! Please enter valid numbers.`, threadID);
    }

    let approved = 0;
    let failed = 0;

    for (const idx of indexes) {
      if (idx <= 0 || idx > pending.length) continue;

      const group = pending[idx - 1];

      try {
        await api.sendMessage(
          `✓ Group Approved\n\n📜 Type ${global.GoatBot.config.prefix}help to See Cmds!`,
          group.threadID
        );

        await api.changeNickname(
          `${global.GoatBot.config.nickNameBot || " ─⃝‌‌愛𝐌𝐢𝐤𝐚𝐬𝐚 вαву"}`,
          group.threadID,
          api.getCurrentUserID()
        );

        approved++;
      } catch {
        // ✅ Failed count tracked separately
        failed++;
      }
    }

    // ✅ Remove approved items from list (descending to keep indexes valid)
    for (const idx of indexes.sort((a, b) => b - a)) {
      if (idx > 0 && idx <= pending.length) {
        pending.splice(idx - 1, 1);
      }
    }

    // ✅ Unsend the reply message after done
    try {
      await api.unsendMessage(messageID);
    } catch {}

    let resultMsg = "";
    if (approved > 0) resultMsg += `✅ Successfully approved ${approved} group(s)🍓\n`;
    if (failed > 0) resultMsg += `❌ Failed to approve ${failed} group(s)\n`;
    if (approved === 0 && failed === 0) resultMsg = `⚠ No valid indexes selected.`;

    return api.sendMessage(resultMsg.trim(), threadID);
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;
    const adminBot = global.GoatBot.config.adminBot;

    if (!adminBot.includes(event.senderID)) {
      return api.sendMessage(
        `⚠ You have no permission to use this command!`,
        threadID
      );
    }

    // ✅ Default to "all" if no argument provided
    const type = args[0]?.toLowerCase() || "all";

    // ✅ Validate type
    if (!type.startsWith("u") && !type.startsWith("t") && type !== "all") {
      return api.sendMessage(
        `⚠ Invalid type!\nUsage: pending [user / thread / all]`,
        threadID
      );
    }

    try {
      const spam    = (await api.getThreadList(100, null, ["OTHER"]))   || [];
      const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
      const list    = [...spam, ...pending];

      let filteredList = [];
      if (type.startsWith("u")) filteredList = list.filter((t) => !t.isGroup);
      if (type.startsWith("t")) filteredList = list.filter((t) => t.isGroup);
      if (type === "all")       filteredList = list;

      // ✅ Handle empty list
      if (filteredList.length === 0) {
        return api.sendMessage(
          `✅ No pending ${type === "all" ? "requests" : type.startsWith("u") ? "users" : "groups"} found!`,
          threadID
        );
      }

      let msg = "";
      let index = 1;
      for (const single of filteredList) {
        const name =
          single.name || (await usersData.getName(single.threadID)) || "Unknown";
        msg += `[ ${index} ]  ${name}\n`;
        index++;
      }

      msg += `\n🦋 Reply with number(s) to approve (e.g: 1 2 3)\n`;
      msg += `✨ Reply with "c" to Cancel.`;

      const typeLabel = type === "all" ? "All" : type.startsWith("u") ? "Users" : "Threads";

      return api.sendMessage(
        `✨ [ Pending ${typeLabel} List ]\n\n${msg}`,
        threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            pending: filteredList,
          });
        },
        messageID
      );
    } catch (error) {
      console.error("[pending2] Error:", error);
      return api.sendMessage(
        `⚠ Failed to retrieve pending list. Please try again later.`,
        threadID
      );
    }
  },
};
