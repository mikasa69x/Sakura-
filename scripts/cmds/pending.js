module.exports = {
  config: {
    name: "pending",
    aliases: ["pen"],
    version: "3.0",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 2,
    shortDescription: { en: "꒷꒦ Manage pending invites" },
    longDescription: { en: "Approve / Reject groups waiting for bot approval with stylish messages" },
    category: "owner",
    guide: { en: "{pn} → show list\nReply with numbers or c <numbers>" }
  },

  langs: {
    en: {
      invalid:  " 🍒𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐈𝐍𝐏𝐔𝐓\n━━━━━━━━━━━━━━━━━━\n» [%1] 𝐢𝐬 𝐧𝐨𝐭 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐧𝐮𝐦𝐛𝐞𝐫. 𝐏𝐥𝐞𝐚𝐬𝐞 𝐜𝐡𝐞𝐜𝐤 𝐭𝐡𝐞 𝐥𝐢𝐬𝐭 𝐚𝐠𝐚𝐢𝐧.",
      refused:  " 🍓𝐑𝐄𝐐𝐔𝐄𝐒𝐓 𝐑𝐄𝐉𝐄𝐂𝐓𝐄𝐃\n━━━━━━━━━━━━━━━━━━\n» 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐫𝐞𝐟𝐮𝐬𝐞𝐝 %1 𝐭𝐡𝐫𝐞𝐚𝐝(𝐬).",
      approved: " 🎀𝐀𝐏𝐏𝐑𝐎𝐕𝐄𝐃 𝐒𝐔𝐂𝐂𝐄𝐒𝐒\n━━━━━━━━━━━━━━━━━━\n» 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐚𝐜𝐜𝐞𝐩𝐭𝐞𝐝 %1 𝐭𝐡𝐫𝐞𝐚𝐝(𝐬)!",
      fetchFail: " ⚠️𝐄𝐑𝐑𝐎𝐑: 𝐔𝐧𝐚𝐛𝐥𝐞 𝐭𝐨 𝐟𝐞𝐭𝐜𝐡 𝐩𝐞𝐧𝐝𝐢𝐧𝐠 𝐥𝐢𝐬𝐭!",
      empty:    " ✨ 𝐏𝐄𝐍𝐃𝐈𝐍𝐆 𝐂𝐋𝐄𝐀𝐑 ✨\n━━━━━━━━━━━━━━━━━━━━\n» 𝐍𝐨 𝐩𝐞𝐧𝐝𝐢𝐧𝐠 𝐫𝐞𝐪𝐮𝐞𝐬𝐭𝐬 𝐟𝐨𝐮𝐧𝐝 𝐚𝐭 𝐭𝐡𝐞 𝐦𝐨𝐦𝐞𝐧𝐭!",
      list: ` 🍒𝐏𝐄𝐍𝐃𝐈𝐍𝐆 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 𝐑𝐄𝐐𝐔𝐄𝐒𝐓𝐒\n━━━━━━━━━━━━━━━━━━━━\n✨ 𝐓𝐨𝐭𝐚𝐥 𝐏𝐞𝐧𝐝𝐢𝐧𝐠: %1 𝐆𝐫𝐨𝐮𝐩𝐬\n\n%2\n━━━━━━━━━━━━━━━━━━━━\n💡 𝐑𝐞𝐩𝐥𝐲 [𝐧𝐮𝐦𝐛𝐞𝐫] 𝐭𝐨 𝐀𝐩𝐩𝐫𝐨𝐯𝐞\n💡 𝐑𝐞𝐩𝐥𝐲 [𝐜 + 𝐧𝐮𝐦𝐛𝐞𝐫] 𝐭𝐨 𝐑𝐞𝐣𝐞𝐜𝐭`
    }
  },

  // ────────────────────────────────────────────────

  onReply: async function ({ api, event, Reply, getLang }) {
    if (event.senderID !== Reply.author) return;

    const input = event.body.trim().toLowerCase();
    const { threadID, messageID } = event;

    const prefix   = global.GoatBot?.config?.prefix || ".";
    const botName  = "愛𝐌𝐢𝐤𝐚𝐬𝐚 вαву🎀";
    const heartLine = "✦━━━━━━━━━━━━✦";

    let actionCount = 0;
    let isCancel    = /^(c|cancel|reject|no)/i.test(input);

    const targets = input.replace(/^(c|cancel|reject|no)/i, "").trim().split(/\s+/).filter(Boolean);

    if (targets.length === 0) {
      return api.sendMessage("❛ Please enter number(s)", threadID, messageID);
    }

    for (const numStr of targets) {
      const num = parseInt(numStr);

      if (isNaN(num) || num < 1 || num > Reply.queue.length) {
        await api.sendMessage(getLang("invalid", numStr), threadID, messageID);
        continue;
      }

      const target   = Reply.queue[num - 1];
      const targetID = target.threadID;

      const msg = isCancel
        ? `𓆩♡𓆪 ACCESS DENIED 𓆩♡𓆪
${heartLine}
✘ Bot    : ${botName}
✘ Prefix : ${prefix}
✘ Action : Rejected
${heartLine}`
        : `✦ ✨ 𝐁𝐎𝐓 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 ✨
━━━━━━━━━━━━━━━━━━━━
𝐇𝐞𝐥𝐥𝐨 𝐄𝐯𝐞𝐫𝐲𝐨𝐧𝐞! 🎀
𝐘𝐨𝐮𝐫 𝐠𝐫𝐨𝐮𝐩 𝐡𝐚𝐬 𝐛𝐞𝐞𝐧 𝐚𝐩𝐩𝐫𝐨𝐯𝐞𝐝 𝐛𝐲 𝐦𝐲 𝐌𝐚𝐬𝐭𝐞𝐫 🌸
𝐘𝐨𝐮 𝐜𝐚𝐧 𝐧𝐨𝐰 𝐮𝐬𝐞 𝐚𝐥𝐥 𝐦𝐲 𝐜𝐨𝐦𝐦𝐚𝐧𝐝
━━━━━━━━━━━━━━━━━━━━
${heartLine}
🧣 Bot : ${botName}
❔ Prefix : ${prefix}
${heartLine}
𝐓𝐲𝐩𝐞 ${prefix}help 𝐭𝐨 𝐬𝐞𝐞 𝐦𝐲 𝐟𝐞𝐚𝐭𝐮𝐫𝐞𝐬`;

      try {
        await api.sendMessage(msg, targetID);

        if (!isCancel) {
          await api.changeNickname(botName, targetID, api.getCurrentUserID()).catch(() => {});
        } else {
          await api.removeUserFromGroup(api.getCurrentUserID(), targetID).catch(() => {});
        }

        actionCount++;
      } catch (e) {
        console.log(`Error on thread ${targetID}:`, e.message);
      }
    }

    const resultKey = isCancel ? "refused" : "approved";
    return api.sendMessage(
      getLang(resultKey, actionCount),
      threadID,
      messageID
    );
  },

  // ────────────────────────────────────────────────

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID, senderID } = event;

    try {
      const [other, pending] = await Promise.all([
        api.getThreadList(100, null, ["OTHER"]),
        api.getThreadList(100, null, ["PENDING"])
      ]);

      const groups = [...(other || []), ...(pending || [])]
        .filter(t => t.isGroup && t.isSubscribed && t.threadID !== threadID);

      if (!groups.length) {
        return api.sendMessage(getLang("empty"), threadID, messageID);
      }

      let text = "";
      let i = 1;

      for (const g of groups) {
        const name = g.name || "No Name";
        text += ` ${i}. ${name} 𖥻 ${g.threadID}\n`;
        i++;
      }

      const listMsg = getLang("list", groups.length, text);

      return api.sendMessage(
        listMsg,
        threadID,
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              author: senderID,
              queue: groups
            });
          }
        },
        messageID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage(getLang("fetchFail"), threadID, messageID);
    }
  }
};
