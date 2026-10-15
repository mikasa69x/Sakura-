const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { randomString } = global.utils;

module.exports = {
	config: {
		name: "setavt",
		aliases: ["changeavatar", "avatar"],
		version: "2.0",
		author: "乛 SIYAM ゎ",
		countDown: 5,
		role: 2,
		shortDescription: {
			en: "Change bot avatar"
		},
		longDescription: {
			en: "Change the bot's profile picture using an image URL or a replied image"
		},
		category: "admin",
		guide: {
			en: "{pn} [image URL]\nReply to an image with {pn}"
		}
	},

	onStart: async function ({ api, event, args, message }) {
		let imageUrl;

		// Get image from replied message
		if (
			event.messageReply &&
			event.messageReply.attachments &&
			event.messageReply.attachments.length > 0
		) {
			const attachment = event.messageReply.attachments[0];

			if (attachment.type !== "photo") {
				api.setMessageReaction("❌", event.messageID, () => {}, true);
				return message.reply("⚠️ Please reply to an image.");
			}

			imageUrl = attachment.url;
		}

		// Get image from URL
		else if (args.length > 0) {
			imageUrl = args[0];
		}

		else {
			return message.reply(
				"⚠️ Please reply to an image or provide an image URL.\n\n" +
				"📌 Usage: {pn} <image_url>"
			);
		}

		const cacheDir = path.join(__dirname, "cache");
		const imagePath = path.join(
			cacheDir,
			`avatar_${randomString(10)}.jpg`
		);

		api.setMessageReaction("🌸", event.messageID, () => {}, true);

		try {
			await fs.ensureDir(cacheDir);

			// Download image
			const response = await axios.get(imageUrl, {
				responseType: "stream",
				timeout: 30000
			});

			const writer = fs.createWriteStream(imagePath);

			await new Promise((resolve, reject) => {
				response.data.pipe(writer);
				writer.on("finish", resolve);
				writer.on("error", reject);
				response.data.on("error", reject);
			});

			// Upload/change avatar
			await new Promise((resolve, reject) => {
				const imageStream = fs.createReadStream(imagePath);

				api.changeAvatar(imageStream, "", null, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});

			api.setMessageReaction(
				"✅",
				event.messageID,
				() => {},
				true
			);

			return message.reply("✅ Bot avatar changed successfully!");

		} catch (error) {
			console.error("❌ setavt error:", error);

			api.setMessageReaction(
				"❌",
				event.messageID,
				() => {},
				true
			);

			return message.reply(
				"❌ Failed to change bot avatar.\n" +
				"Please make sure the image URL is valid."
			);

		} finally {
			// Always remove temporary file
			try {
				if (await fs.pathExists(imagePath)) {
					await fs.remove(imagePath);
				}
			} catch (cleanupError) {
				console.error("Cache cleanup error:", cleanupError);
			}
		}
	}
};
