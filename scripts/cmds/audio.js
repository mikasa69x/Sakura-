const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');

const baseApiUrl = async () => {
	const base = await axios.get(`https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json`);
	return base.data.mahmud;
};

module.exports = {
	config: {
		name: "audio",
		version: "1.7",
		author: "乛 SIYAM ゎ",
		countDown: 5,
		role: 0,
		description: {
			en: "Download any song directly from YouTube"
		},
		category: "music",
		guide: {
			en: '   {pn} <song name>\n   Example: {pn} stay justin bieber'
		}
	},

	langs: {
		en: {
			error: "❌ An error occurred:  %1\n•",
			noResult: "⭕ | Sorry baby, I couldn't find anything for \"%1\"",
			success: "✅ | Here is your song: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		const { threadID, messageID } = event;
		const input = args.join(" ");

		if (!input) return api.sendMessage("• Baby, please provide a song name.", threadID, messageID);

		try {
			const apiUrl = await baseApiUrl();
			api.setMessageReaction("⏳", messageID, () => { }, true);

			const res = await axios.get(`${apiUrl}/api/ytb/search?q=${encodeURIComponent(input)}`);
			const results = res.data.results;

			if (!results || results.length === 0) {
				api.setMessageReaction("❌", messageID, () => { }, true);
				return api.sendMessage(getLang("noResult", input), threadID, messageID);
			}

			const videoID = results[0].id;
			const title = results[0].title;

			api.setMessageReaction("⌛", messageID, () => { }, true);
			await handleDownload(api, threadID, messageID, videoID, apiUrl, title, getLang);

		} catch (e) {
			api.setMessageReaction("❌", messageID, () => { }, true);
			return api.sendMessage(getLang("error", e.message), threadID, messageID);
		}
	}
};

async function handleDownload(api, threadID, messageID, videoID, apiUrl, title, getLang) {
	const cacheDir = path.join(__dirname, 'cache');
	if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
	const filePath = path.join(cacheDir, `music_${Date.now()}.mp3`);

	try {
		const res = await axios.get(`${apiUrl}/api/ytb/get?id=${videoID}&type=audio`);
		const { downloadLink } = res.data.data;

		const response = await axios({ 
			url: downloadLink, 
			method: 'GET', 
			responseType: 'stream',
			headers: { 'User-Agent': 'Mozilla/5.0' }
		});

		const writer = fs.createWriteStream(filePath);
		response.data.pipe(writer);

		writer.on('finish', () => {
			api.sendMessage({
				body: getLang("success", title),
				attachment: fs.createReadStream(filePath)
			}, threadID, (err) => {
				if (err) api.sendMessage(getLang("error", "File too large!"), threadID, messageID);
				api.setMessageReaction("🪽", messageID, () => { }, true);
				if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			}, messageID);
		});

		writer.on('error', (e) => {
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			api.sendMessage(getLang("error", e.message), threadID, messageID);
		});

	} catch (e) {
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
		api.sendMessage(getLang("error", "Download failed!"), threadID, messageID);
	}
  }
