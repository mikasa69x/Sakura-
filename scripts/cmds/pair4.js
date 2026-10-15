const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
	const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
	return base.data.mahmud;
};

module.exports = {
	config: {
		name: "pair4",
		version: "1.7",
		author: "乛 SIYAM ゎ",
		countDown: 10,
		role: 0,
		description: {
			en: "Find your perfect match among group members"
		},
		category: "love",
		guide: {
			en: '   {pn}: Use to find your match'
		}
	},

	langs: {
		en: {
			noGender: "× Baby, your gender is not defined in your profile",
			noMatch: "× Sorry, no match found for you in this group",
			success: "💞 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐏𝐚𝐢𝐫𝐢𝐧𝐠\n• %1\n• %2\n\n𝐋𝐨𝐯𝐞 𝐏𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞: %3%",
			error: "× API error: %1. ."
		}
	},

	onStart: async function ({ api, event, message, getLang }) {
		const outputPath = path.join(__dirname, "cache", `pair_${event.senderID}_${Date.now()}.png`);
		if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });

		try {
			api.setMessageReaction("😘", event.messageID, () => {}, true);

			const threadData = await api.getThreadInfo(event.threadID);
			const users = threadData.userInfo;
			const myData = users.find((u) => u.id === event.senderID);

			if (!myData || !myData.gender) return message.reply(getLang("noGender"));

			const myGender = myData.gender.toUpperCase();
			let matchCandidates = [];

			if (myGender === "MALE") {
				matchCandidates = users.filter((u) => u.gender === "FEMALE" && u.id !== event.senderID);
			} else if (myGender === "FEMALE") {
				matchCandidates = users.filter((u) => u.gender === "MALE" && u.id !== event.senderID);
			} else {
				matchCandidates = users.filter((u) => u.id !== event.senderID);
			}
			
			if (matchCandidates.length === 0) {
				api.setMessageReaction("🥺", event.messageID, () => {}, true);
				return message.reply(getLang("noMatch"));
			}

			const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
			const apiUrl = await baseApiUrl();
			
			const { data } = await axios.get(`${apiUrl}/api/pair/mahmud?user1=${event.senderID}&user2=${selectedMatch.id}&style=3`, { 
				responseType: "arraybuffer" 
			});

			fs.writeFileSync(outputPath, Buffer.from(data));

			const name1 = myData.name || "User";
			const name2 = selectedMatch.name || "Partner";
			const percentage = Math.floor(Math.random() * 100) + 1;

			return message.reply({
				body: getLang("success", name1, name2, percentage),
				attachment: fs.createReadStream(outputPath)
			}, () => {
				api.setMessageReaction("✅", event.messageID, () => {}, true);
				if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
			});

		} catch (err) {
			console.error("Pair Error:", err);
			api.setMessageReaction("❌", event.messageID, () => {}, true);
			if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
			return message.reply(getLang("error", err.message));
		}
	}
};
