module.exports = {
  config: {
    name: "howgay",
    author: "乛 SIYAM ゎ",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      en: "Check how gay someone is (just for fun)",
    },
    guide: {
      en: "{pn} - Check yourself"
        + "\n{pn} @mention - Check mentioned user"
        + "\n{pn} <name> - Search and check user by name"
        + "\n{pn} <uid> - Check user by ID"
        + "\n{pn} [reply] - Check replied user",
    },
  },

  langs: {
    en: {
      notFound: "User '%1' not found in this conversation",
      multiple: "Multiple users found with name '%1':\n%2\n\nPlease use their UID or be more specific.",
      error: "❌ Gay meter broke! Too much rainbow power 🌈",
      scanning: "🌈 Scanning %1's gay levels...",
      straightArrow: "Straight as an arrow",
      curiousPhase: "Curious phase",
      biEnergy: "Bi-sexual energy",
      prettyGay: "Pretty gay ngl",
      fullRainbow: "FULL RAINBOW MODE",
      errorNotFound: "❌ Error: 404 Gay Not Found",
      maxGay: "🎉 MAXIMUM GAY ACHIEVED! 🎊",
      niceLevel: "😏 Nice level of gay bro",
      balanced: "⚖️ Perfectly balanced",
      resultsIn: "Results are in!",
      disclaimer: "⚠️ Disclaimer: This is just for fun!"
    }
  },

  onStart: async function ({ api, event, args, usersData, getLang }) {
    try {
      let id, name;
      
      if (event.messageReply) {
        id = event.messageReply.senderID;
      }
      else if (Object.keys(event.mentions || {}).length > 0) {
        id = Object.keys(event.mentions)[0];
      }
      else if (args[0] && /^\d+$/.test(args[0])) {
        id = args[0];
      }
      else if (args[0]) {
        const query = args.join(" ");
        const matches = await findUserByName(api, usersData, event.threadID, query);

        if (matches.length === 0) {
          return api.sendMessage(
            getLang("notFound", query.replace(/@/g, "")),
            event.threadID,
            event.messageID
          );
        }

        if (matches.length > 1) {
          const matchList = matches.map(m => `• ${m.name}: ${m.uid}`).join('\n');
          return api.sendMessage(
            getLang("multiple", query.replace(/@/g, ""), matchList),
            event.threadID,
            event.messageID
          );
        }

        id = matches[0].uid;
      }
      else {
        id = event.senderID;
      }

      const info = await api.getUserInfo(id);
      name = info[id]?.name || "Unknown User";

      const hash = (str) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
          h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        }
        return Math.abs(h);
      };

      const gayPercent = (hash(id) % 101);

      const rainbowChars = ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"];
      const meterLength = 15;
      const filled = Math.floor((gayPercent / 100) * meterLength);
      let meter = "";
      
      for (let i = 0; i < meterLength; i++) {
        if (i < filled) {
          meter += rainbowChars[i % rainbowChars.length];
        } else {
          meter += "⬜";
        }
      }

      let status, emoji;
      if (gayPercent < 20) {
        status = getLang("straightArrow");
        emoji = "➡️";
      } else if (gayPercent < 40) {
        status = getLang("curiousPhase");
        emoji = "🤔";
      } else if (gayPercent < 60) {
        status = getLang("biEnergy");
        emoji = "💜";
      } else if (gayPercent < 80) {
        status = getLang("prettyGay");
        emoji = "🌈";
      } else {
        status = getLang("fullRainbow");
        emoji = "🏳️‍🌈";
      }

      const msg = await api.sendMessage(
        getLang("scanning", name),
        event.threadID
      );

      await new Promise(r => setTimeout(r, 2000));

      const result = `
     🏳️‍🌈 GAY METER 🏳️‍🌈

👤 ${name}

${meter}
${gayPercent}% Gay

${emoji} Status: ${status}

━━━━━━━━━━━━━━━━━━━━━━

${gayPercent === 0 ? getLang("errorNotFound") : 
  gayPercent === 100 ? getLang("maxGay") :
  gayPercent > 69 ? getLang("niceLevel") :
  gayPercent === 50 ? getLang("balanced") :
  getLang("resultsIn")}

${getLang("disclaimer")}
      `.trim();

      await api.editMessage(result, msg.messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage(
        getLang("error"),
        event.threadID,
        event.messageID
      );
    }
  },
};

async function findUserByName(api, usersData, threadID, query) {
  try {
    const cleanQuery = query.replace(/@/g, "").trim().toLowerCase();
    const threadInfo = await api.getThreadInfo(threadID);
    const ids = threadInfo.participantIDs || [];
    const matches = [];

    for (const uid of ids) {
      try {
        const name = (await usersData.getName(uid)).toLowerCase();
        if (name.includes(cleanQuery)) {
          matches.push({ uid, name: await usersData.getName(uid) });
        }
      } catch {}
    }

    return matches;
  } catch {
    return [];
  }
}
