const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
    config: {
        name: "admin",
        version: "3.1",
        author: "乛 SIYAM ゎ",
        countDown: 5,
        role: 2,
        description: {
            en: "Clean admin system with rank + styled UI"
        },
        category: "owner"
    },

    langs: {
        en: {
            added: "✅ | Added admin role for %1 users:\n%2",
            alreadyAdmin: "\n⚠️ | %1 users already admin:\n%2",
            missingIdAdd: "⚠️ | Please provide ID or tag user",
            removed: "✅ | Removed admin role for %1 users:\n%2",
            notAdmin: "\n⚠️ | %1 users were not admin:\n%2",
            missingIdRemove: "⚠️ | Please provide ID or tag user",
            listAdmin: "💻 | Bot Admin List:\n\n%1"
        }
    },

    onStart: async function ({ api, message, args, usersData, event, getLang }) {

        const action = (args[0] || "").toLowerCase();
        const { threadID, messageID } = event;

        // 🔥 RANK SYSTEM
        config.adminRank = config.adminRank || {
            owner: ["100065590940242"]
        };

        // Remove mod array if it exists from old config
        if (config.adminRank.mod)
            delete config.adminRank.mod;

        const getUIDs = () => {
            let uids = [];

            if (Object.keys(event.mentions || {}).length)
                uids = Object.keys(event.mentions);
            else if (event.messageReply?.senderID)
                uids = [event.messageReply.senderID];
            else
                uids = args.filter(a => /^\d+$/.test(a));

            return [...new Set(uids.filter(id => id && /^\d+$/.test(id)))];
        };

        const getRank = (uid) => {
            if (config.adminRank.owner.includes(uid))
                return { name: "OWNER", icon: "🐱" };

            return { name: "ADMIN", icon: "✨" };
        };

        switch (action) {

            // ================= ADD =================
            case "add":
            case "-a": {
                if (!args[1] && !event.messageReply && !Object.keys(event.mentions || {}).length)
                    return api.sendMessage(getLang("missingIdAdd"), threadID, messageID);

                const uids = getUIDs();

                const alreadyAdmin = [];
                const newAdmins = [];

                for (const id of uids) {
                    if (config.adminBot.includes(id)) alreadyAdmin.push(id);
                    else newAdmins.push(id);
                }

                config.adminBot.push(...newAdmins);

                const names = await Promise.all(
                    uids.map(uid =>
                        usersData.getName(uid)
                            .then(name => ({ uid, name }))
                            .catch(() => ({ uid, name: "Unknown" }))
                    )
                );

                writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

                const addedText = newAdmins.length
                    ? getLang("added", newAdmins.length,
                        names.filter(u => newAdmins.includes(u.uid))
                            .map(u => `• ${u.name} (${u.uid})`).join("\n"))
                    : "";

                const alreadyText = alreadyAdmin.length
                    ? getLang("alreadyAdmin", alreadyAdmin.length,
                        names.filter(u => alreadyAdmin.includes(u.uid))
                            .map(u => `• ${u.name} (${u.uid})`).join("\n"))
                    : "";

                return api.sendMessage(addedText + alreadyText, threadID, messageID);
            }

            // ================= REMOVE =================
            case "remove":
            case "-r": {
                if (!args[1] && !event.messageReply && !Object.keys(event.mentions || {}).length)
                    return api.sendMessage(getLang("missingIdRemove"), threadID, messageID);

                const uids = getUIDs();

                const removed = [];
                const notAdmin = [];

                for (const id of uids) {
                    if (config.adminBot.includes(id)) removed.push(id);
                    else notAdmin.push(id);
                }

                config.adminBot = config.adminBot.filter(id => !removed.includes(id));

                const names = await Promise.all(
                    uids.map(uid =>
                        usersData.getName(uid)
                            .then(name => ({ uid, name }))
                            .catch(() => ({ uid, name: "Unknown" }))
                    )
                );

                writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

                const removedText = removed.length
                    ? getLang("removed", removed.length,
                        names.filter(u => removed.includes(u.uid))
                            .map(u => `• ${u.name} (${u.uid})`).join("\n"))
                    : "";

                const notAdminText = notAdmin.length
                    ? getLang("notAdmin", notAdmin.length,
                        names.filter(u => notAdmin.includes(u.uid))
                            .map(u => `• ${u.name} (${u.uid})`).join("\n"))
                    : "";

                return api.sendMessage(removedText + notAdminText, threadID, messageID);
            }

            // ================= LIST (CLEAN UI) =================
            case "list":
            case "-l": {

                const validAdmins = (config.adminBot || []).filter(id => id && /^\d+$/.test(id));

                const names = await Promise.all(
                    validAdmins.map(uid =>
                        usersData.getName(uid)
                            .then(name => ({ uid, name }))
                            .catch(() => ({ uid, name: "Unknown" }))
                    )
                );

                const owner = names.filter(u => config.adminRank.owner.includes(u.uid));
                const admins = names.filter(u => !config.adminRank.owner.includes(u.uid));

                const header =
`╔═════════════════╗
   💌 ʙᴏᴛ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ 🌸
╚══════════════════╝
✦ ᴛᴏᴛᴀʟ ᴀᴅᴍɪɴꜱ: ${names.length}
`;

                const block = (title, icon, list) =>
`\n╭─── ${icon} ${title} ───╮\n` + (list.length
    ? list.map((u, i) =>
`│ ${i + 1}. 👤 ${u.name}
│    🆔 ${u.uid}`).join("\n│\n")
    : `│  ❌ None`) +
`\n╰${"─".repeat(20)}╯`;

                const body =
                    block("ᴏᴡɴᴇʀ", "🎀", owner) +
                    block("ᴀᴅᴍɪɴ", "🌀", admins);

                const footer =
`\n✦─────────────────✦
  ᴘᴏᴡᴇʀᴇᴅ ʙʏ ─⃝‌‌𝐌𝐢𝐤𝐚𝐬𝐚 вαву
✦─────────────────✦`;

                return api.sendMessage(header + body + footer, threadID, messageID);
            }

            default:
                return message.SyntaxError();
        }
    }
};
