const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
	config: {
		name: "married",
		aliases: ["biye", "married"],
		version: "4.2.0",
		author: "乛 SIYAM ゎ",
		countDown: 5,
		role: 0,
		description: "A married couple image",
		category: "love",
		guide: {
			en: "{pn} @mention or reply to a message"
				+ "\n{pn} <name>: search user by name"
				+ "\n{pn} <uid>: use specific user ID"
		}
	},

	langs: {
		en: {
			noMention: "Please mention 1 person, reply to their message, or enter their name 👻",
			processing: "\n\n",
			error: "An error occurred while creating the image: %1",
			notFound: "User '%1' not found in this conversation",
			multiple: "Multiple users found with name '%1':\n%2\n\nPlease use their UID or be more specific."
		}
	},

	onStart: async function({ api, message, event, args, getLang, usersData }) {
		const { threadID, messageID, senderID, messageReply } = event;
		const mention = Object.keys(event.mentions || {});

		let target_userx;

		if (messageReply) {
			target_userx = messageReply.senderID;
		}
		else if (mention[0]) {
			target_userx = mention[0];
		}
		else if (args[0] && /^\d+$/.test(args[0])) {
			target_userx = args[0];
		}
		else if (args[0]) {
			const query = args.join(" ");
			const matches = await findUserByName(api, usersData, event.threadID, query);

			if (matches.length === 0) {
				return message.reply(getLang("notFound", query.replace(/@/g, "")));
			}

			if (matches.length > 1) {
				const matchList = matches.map(m => `• ${m.name}: ${m.uid}`).join('\n');
				return message.reply(getLang("multiple", query.replace(/@/g, ""), matchList));
			}

			target_userx = matches[0].uid;
		}
		else {
			return message.reply(getLang("noMention"));
		}

		try {
			await message.reply(getLang("processing"));

			const one = senderID;
			const two = target_userx;
			const imagePath = await makeImage({ one, two });

			await message.reply({
				body: "🧸🎀 ⋆˚✿°────୨ᰔ୧────°✿˚ ✨\n\n𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫 𝐟𝐨𝐫𝐞𝐯𝐞𝐫, 𝐚 𝐥𝐨𝐯𝐞 𝐬𝐭𝐨𝐫𝐲 𝐰𝐫𝐢𝐭𝐭𝐞𝐧 𝐢𝐧 𝐭𝐡𝐞 𝐬𝐭𝐚𝐫𝐬\n\n🎀✨ ˚✿°────୨ᰔ୧────°✿˚ 🌸\n\n🎀🌷°✿˚\n𝐌𝐚𝐲 𝐲𝐨𝐮𝐫 𝐣𝐨𝐮𝐫𝐧𝐞𝐲 𝐛𝐞 𝐟𝐢𝐥𝐥𝐞𝐝 𝐰𝐢𝐭𝐡 𝐞𝐧𝐝𝐥𝐞𝐬𝐬 𝐥𝐨𝐯𝐞 𝐚𝐧𝐝 𝐡𝐚𝐩𝐩𝐢𝐧𝐞𝐬𝐬 🧸✨°",
				attachment: fs.createReadStream(imagePath)
			});

			fs.unlinkSync(imagePath);
		}
		catch (err) {
			console.error(err);
			return message.reply(getLang("error", err.message));
		}
	},

	onReply: async function({ message, event, Reply, getLang }) {
		return;
	},

	onLoad: async function() {
		const dirMaterial = path.resolve(__dirname, "cache", "canvas");
		const imagePath = path.resolve(dirMaterial, "marriedv4.png");

		if (!fs.existsSync(dirMaterial)) {
			fs.mkdirSync(dirMaterial, { recursive: true });
		}

		if (!fs.existsSync(imagePath)) {
			try {
				const response = await axios.get(
					"https://i.ibb.co/9ZZCSzR/ba6abadae46b5bdaa29cf6a64d762874.jpg",
					{ responseType: "arraybuffer" }
				);
				fs.writeFileSync(imagePath, Buffer.from(response.data));
				console.log("✅ Downloaded married template image");
			}
			catch (err) {
				console.error("❌ Failed to download married template:", err.message);
			}
		}
	}
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

async function makeImage({ one, two }) {
	const __root = path.resolve(__dirname, "cache", "canvas");
	const templatePath = path.resolve(__root, "marriedv4.png");
	const outputPath = path.resolve(__root, `married_${one}_${two}.png`);
	const avatarOnePath = path.resolve(__root, `avt_${one}.png`);
	const avatarTwoPath = path.resolve(__root, `avt_${two}.png`);

	try {
		const avatarOneResponse = await axios.get(
			`https://arshi-facebook-pp.vercel.app/api/pp?uid=${one}`,
			{ responseType: "arraybuffer" }
		);
		fs.writeFileSync(avatarOnePath, Buffer.from(avatarOneResponse.data));

		const avatarTwoResponse = await axios.get(
			`https://arshi-facebook-pp.vercel.app/api/pp?uid=${two}`,
			{ responseType: "arraybuffer" }
		);
		fs.writeFileSync(avatarTwoPath, Buffer.from(avatarTwoResponse.data));

		const background = await loadImage(templatePath);
		const avatarOne = await loadImage(avatarOnePath);
		const avatarTwo = await loadImage(avatarTwoPath);

		const canvas = createCanvas(background.width, background.height);
		const ctx = canvas.getContext("2d");

		ctx.drawImage(background, 0, 0);

		ctx.save();
		ctx.beginPath();
		ctx.arc(200 + 65, 70 + 65, 65, 0, Math.PI * 2);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(avatarOne, 200, 70, 130, 130);
		ctx.restore();

		ctx.save();
		ctx.beginPath();
		ctx.arc(350 + 65, 150 + 65, 65, 0, Math.PI * 2);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(avatarTwo, 350, 150, 130, 130);
		ctx.restore();

		const buffer = canvas.toBuffer("image/png");
		fs.writeFileSync(outputPath, buffer);

		fs.unlinkSync(avatarOnePath);
		fs.unlinkSync(avatarTwoPath);

		return outputPath;
	}
	catch (err) {
		[avatarOnePath, avatarTwoPath, outputPath].forEach(file => {
			if (fs.existsSync(file)) fs.unlinkSync(file);
		});
		throw err;
	}
}
