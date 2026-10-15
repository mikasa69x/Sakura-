const axios = require("axios");

const mahmud = async () => {
	const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
	return base.data.mahmud;
};

module.exports = {
	config: {
		name: "prompt2",
		aliases: ["p"],
		version: "1.7",
		author: "乛 SIYAM ゎ",
		countDown: 5,
		role: 0,
		description: {
			en: "Generate a detailed prompt or description from any image"
		},
		category: "ai",
		guide: {
			en: '   {pn}: Reply to an image\n   {pn} <custom prompt>: Ask specific about the image'
		}
	},

	langs: {
		en: {
			noImg: "× Baby, please reply to an image to use this command!",
			error: "× API error: %1. Contact MahMUD for help."
		}
	},

	onStart: async function ({ api, event, args, message, getLang }) {
		if (!(event.type === "message_reply" && event.messageReply.attachments[0]?.type === "photo")) {
			return message.reply(getLang("noImg"));
		}

		const prompt = args.join(" ") || "Describe this image in detail";
		const imageUrl = event.messageReply.attachments[0].url;

		try {
			const baseUrl = await mahmud();
			const apiUrl = `${baseUrl}/api/prompt`;

			const response = await axios.post(apiUrl, {
				imageUrl,
				prompt
			}, {
				headers: { 
					"Content-Type": "application/json"
				}
			});

			const replyText = response.data.response || response.data.error || "No response";
			
			message.reply(replyText);
			return api.setMessageReaction("🪽", event.messageID, () => {}, true);

		} catch (err) {
			console.error("Prompt AI Error:", err);
			api.setMessageReaction("❌", event.messageID, () => {}, true);
			return message.reply(getLang("error", err.message));
		}
	}
};
