const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "set",
        aliases: ["ap"],
        version: "4.5",
        author: "xiyam",
        role: 2, 
        shortDescription: { en: "Master controller for Money, Exp, and Messages" },
        category: "admin",
        guide: { en: "{pn} [money|exp|msg] [amount]\n{pn} [money|exp|msg] all [amount]" }
    },

    onStart: async function ({ args, event, api, usersData, threadsData }) {
        const OWNER_IDS = ["100065590940242"];
        const { threadID, messageID, senderID, mentions, type: evType, messageReply } = event;

        if (!OWNER_IDS.includes(senderID)) {
            return api.sendMessage("『 ⛔ 』— 𝖠𝖢𝖢𝖤𝖲𝖲 𝖣𝖤𝖭𝖨𝖤𝖣", threadID, messageID);
        }

        const stylize = (text) => {
            return text
                .split("")
                .map(char => {
                    const code = char.charCodeAt(0);
                    if (code >= 65 && code <= 90) return String.fromCodePoint(code + 120172); // Caps
                    if (code >= 97 && code <= 122) return String.fromCodePoint(code + 120166); // Small
                    return char;
                })
                .join("");
        };

        const dataType = args[0]?.toLowerCase();
        if (!dataType || !["money", "exp", "msg"].includes(dataType)) {
            return api.sendMessage(
                `╭─『  SYS CONTROL   』\n` +
                `┃\n` +
                `┃  Usage Guides: \n` +
                `┃  • set money [amount]\n` +
                `┃  • set exp [amount]\n` +
                `┃  • set msg [amount]\n` +
                `┃\n` +
                `╰────────────⦿`, 
                threadID, messageID
            );
        }

        let amount = Number(args[args.length - 1]);
        if (isNaN(amount) || amount < 0) return api.sendMessage("『 ⚠️ 』— Invalid amount provided!", threadID, messageID);

        // --- Global Update Logic ---
        if (args[1]?.toLowerCase() === "all") {
            const allUsers = await usersData.getAll();
            for (const user of allUsers) {
                if (dataType === "msg") {
                    const dataPath = path.resolve(__dirname, "..", "activities", "cache", "count_activity.json");
                    if (fs.existsSync(dataPath)) {
                        let activityData = fs.readJsonSync(dataPath);
                        if (!activityData[threadID]) activityData[threadID] = {};
                        activityData[threadID][user.userID] = { total: amount, types: { text: amount, sticker: 0, media: 0 }, daily: {} };
                        fs.writeJsonSync(dataPath, activityData, { spaces: 2 });
                    }
                } else {
                    await usersData.set(user.userID, { [dataType]: amount });
                }
            }
            return api.sendMessage(`✨ GLOBAL SUCCESS \n━━━━━━━━━━━━━\n "Updated  ${allUsers.length} users data to  ${amount.toLocaleString()}`, threadID, messageID);
        }

        // --- Single User Logic ---
        let targetID = evType === "message_reply" ? messageReply.senderID : 
                       (Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : senderID);

        try {
            if (dataType === "msg") {
                const threadData = await threadsData.get(threadID);
                if (threadData?.members) {
                    const idx = threadData.members.findIndex(m => m.userID == targetID);
                    if (idx !== -1) {
                        threadData.members[idx].count = amount;
                        await threadsData.set(threadID, threadData.members, "members");
                    }
                }
                const dataPath = path.resolve(__dirname, "..", "activities", "cache", "count_activity.json");
                fs.ensureFileSync(dataPath);
                let activityData = {};
                try { activityData = fs.readJsonSync(dataPath); } catch (e) {}
                if (!activityData[threadID]) activityData[threadID] = {};
                activityData[threadID][targetID] = { total: amount, types: { text: amount, sticker: 0, media: 0 }, daily: {} };
                fs.writeJsonSync(dataPath, activityData, { spaces: 2 });
            } else {
                await usersData.set(targetID, { [dataType]: amount });
            }

            const name = await usersData.getName(targetID);
            return api.sendMessage(
                `╭──『  MODIFIED  』\n` +
                `┃\n` +
                `┃  User:  ${name}\n` +
                `┃  Type:  ${dataType.toUpperCase()}\n` +
                `┃  Value:  ${amount.toLocaleString()}\n` +
                `┃\n` +
                `╰──────────────⦿`, 
                threadID, messageID
            );

        } catch (e) {
            return api.sendMessage("『 ❌ 』— Error updating data!", threadID, messageID);
        }
    }
};
