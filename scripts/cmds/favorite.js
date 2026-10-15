const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "favorite",
                aliases: ["fvt", "fav"],
                version: "1.7",
                author: "乛 SIYAM ゎ",
                countDown: 5,
                role: 0,
                description: {
                        en: "Create a favorite card by mentioning or replying"
                },
                category: "love",
                guide: {
                        en: '   {pn}: Favorite random person' +
                                '\n   {pn} @mention: Favorite tagged user' +
                                '\n   {pn} [reply]: Favorite replied user'
                }
        },

        langs: {
                en: {
                        noUser: "× Looking for a favorite alone? There's no one else!",
                        success: "U see this? %1 is my fav one!! 🎀",
                        error: "× : %1. ."
                }
        },

        onStart: async function ({ api, event, usersData, getLang, message }) {
                try {
                        const { threadID, senderID, mentions, messageReply } = event;
                        let targetID;
                        const mIDs = Object.keys(mentions || {});

                        if (mIDs.length > 0) {
                                targetID = mIDs[0];
                        } else if (messageReply) {
                                targetID = messageReply.senderID;
                        } else {
                                const tInfo = await api.getThreadInfo(threadID);
                                const my = tInfo.userInfo.find(u => u.id == senderID);
                                let list = tInfo.userInfo.filter(u => u.id != senderID && u.gender != 0 && u.gender != (my?.gender || 0));
                                if (list.length === 0) list = tInfo.userInfo.filter(u => u.id != senderID);
                                if (list.length === 0) return message.reply(getLang("noUser"));
                                targetID = list[Math.floor(Math.random() * list.length)].id;
                        }

                        const userData = await usersData.get(targetID);
                        const name = userData.name || "Unknown";
                        const baseURL = await mahmud();
                        const imgPath = path.join(__dirname, `cache_fvt_${targetID}.png`);

                        const res = await axios.get(`${baseURL}/api/fvt?uid=${targetID}&name=${encodeURIComponent(name)}`, { 
                                responseType: "arraybuffer" 
                        });

                        fs.writeFileSync(imgPath, Buffer.from(res.data));

                        return message.reply({
                                body: getLang("success", name),
                                mentions: [{ tag: name, id: targetID }],
                                attachment: fs.createReadStream(imgPath)
                        }, () => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); });

                } catch (err) {
                        console.error("FVT Error:", err);
                        return message.reply(getLang("error", err.message));
                }
        }
};
