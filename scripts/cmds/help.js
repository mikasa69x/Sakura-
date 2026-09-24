const axios = require("axios");

const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

let xfont = null;
let yfont = null;
let categoryEmoji = null;

async function loadResources() {
	try {
		const [xRes, yRes, emojiRes] = await Promise.all([
			axios.get(
				"https://raw.githubusercontent.com/Saim-x69x/sakura/main/xfont.json",
				{ timeout: 10000 }
			),
			axios.get(
				"https://raw.githubusercontent.com/Saim-x69x/sakura/main/yfont.json",
				{ timeout: 10000 }
			),
			axios.get(
				"https://raw.githubusercontent.com/Saim-x69x/sakura/main/category.json",
				{ timeout: 10000 }
			)
		]);

		xfont = xRes.data || {};
		yfont = yRes.data || {};
		categoryEmoji = emojiRes.data || {};
	} catch (err) {
		console.error("[HELP] Failed to load remote resources:", err.message);

		// Safe fallback
		xfont = xfont || {};
		yfont = yfont || {};
		categoryEmoji = categoryEmoji || {};
	}
}

function fontConvert(text, type = "command") {
	const fontMap = type === "category" ? xfont : yfont;

	if (!fontMap || typeof fontMap !== "object")
		return text;

	return String(text)
		.split("")
		.map(ch => fontMap[ch] || ch)
		.join("");
}

function getCategoryEmoji(category) {
	if (!categoryEmoji || typeof categoryEmoji !== "object")
		return "🗂️";

	return (
		categoryEmoji[String(category).toLowerCase()] ||
		categoryEmoji[String(category).toUpperCase()] ||
		"🗂️"
	);
}

function levenshteinDistance(a, b) {
	a = String(a).toLowerCase();
	b = String(b).toLowerCase();

	const matrix = Array.from(
		{ length: b.length + 1 },
		() => Array(a.length + 1).fill(0)
	);

	for (let i = 0; i <= a.length; i++)
		matrix[0][i] = i;

	for (let j = 0; j <= b.length; j++)
		matrix[j][0] = j;

	for (let j = 1; j <= b.length; j++) {
		for (let i = 1; i <= a.length; i++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;

			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1,
				matrix[j - 1][i] + 1,
				matrix[j - 1][i - 1] + cost
			);
		}
	}

	return matrix[b.length][a.length];
}

function getClosestCommand(name) {
	const target = String(name).toLowerCase();

	let best = null;
	let bestDistance = Infinity;

	// Commands
	if (commands && typeof commands.keys === "function") {
		for (const commandName of commands.keys()) {
			const distance = levenshteinDistance(
				target,
				commandName
			);

			if (distance < bestDistance) {
				bestDistance = distance;
				best = commandName;
			}
		}
	}

	// Aliases
	if (aliases) {
		if (typeof aliases.keys === "function") {
			for (const alias of aliases.keys()) {
				const distance = levenshteinDistance(
					target,
					alias
				);

				if (distance < bestDistance) {
					bestDistance = distance;
					best = alias;
				}
			}
		} else if (typeof aliases === "object") {
			for (const alias of Object.keys(aliases)) {
				const distance = levenshteinDistance(
					target,
					alias
				);

				if (distance < bestDistance) {
					bestDistance = distance;
					best = alias;
				}
			}
		}
	}

	return bestDistance <= 3 ? best : null;
}

function getCommandByName(name) {
	if (!name)
		return null;

	const target = String(name).toLowerCase();

	// Direct command lookup
	if (commands) {
		const direct = commands.get(target);
		if (direct)
			return direct;
	}

	// Alias lookup
	if (aliases) {
		if (typeof aliases.get === "function") {
			const aliasCommand = aliases.get(target);

			if (aliasCommand) {
				if (typeof aliasCommand === "string")
					return commands.get(aliasCommand);

				return aliasCommand;
			}
		} else if (typeof aliases === "object") {
			const aliasCommand = aliases[target];

			if (aliasCommand) {
				if (typeof aliasCommand === "string")
					return commands.get(aliasCommand);

				return aliasCommand;
			}
		}
	}

	return null;
}

function roleTextToString(role) {
	switch (Number(role)) {
		case 0:
			return "All Users";
		case 1:
			return "Group Admins";
		case 2:
			return "VIP Users";
		case 3:
			return "Bot Admin";
		case 4:
			return "Bot Creator";
		default:
			return "Unknown";
	}
}

function getCommandRole(command) {
	const role = Number(command?.config?.role);

	return Number.isFinite(role) ? role : 0;
}

module.exports = {
	config: {
		name: "help",
		aliases: ["menu"],
		version: "2.1",
		author: "Saimx69x",
		countDown: 5,
		role: 0,

		shortDescription: {
			en: "Shows all commands or details."
		},

		longDescription: {
			en: "Display categories, command lists or specific command info."
		},

		category: "info",

		guide: {
			en: "{pn}, {pn} [command], {pn} -c [category]"
		}
	},

	onStart: async function ({
		message,
		args,
		event,
		role
	}) {
		try {
			// Safe role
			role = Number.isFinite(Number(role))
				? Number(role)
				: 0;

			// Safe prefix
			let prefix = "/";

			try {
				const result = getPrefix(event?.threadID);

				if (result)
					prefix = result;
			} catch (err) {
				console.error("[HELP] Prefix error:", err.message);
			}

			// Load fonts/resources
			if (!xfont || !yfont || !categoryEmoji)
				await loadResources();

			const categories = {};

			// Build visible command list
			for (const [name, command] of commands) {
				if (!command?.config)
					continue;

				if (typeof command.onStart !== "function")
					continue;

				const commandRole = getCommandRole(command);

				if (commandRole > role)
					continue;

				const category = String(
					command.config.category || "UNCATEGORIZED"
				).toUpperCase();

				if (!categories[category])
					categories[category] = [];

				categories[category].push(name);
			}

			const helpImage =
				"https://files.catbox.moe/4h41x5.jpg";

			const input = Array.isArray(args)
				? args.join(" ").trim()
				: "";

			/*
			 * =========================
			 * CATEGORY HELP
			 * =========================
			 */

			if (
				args?.[0]?.toLowerCase() === "-c" &&
				args?.[1]
			) {
				const categoryName =
					String(args[1]).toUpperCase();

				if (!categories[categoryName]) {
					return message.reply(
						`❌ Category "${categoryName}" not found.`
					);
				}

				const emoji =
					getCategoryEmoji(categoryName);

				const list = [
					...categories[categoryName]
				].sort((a, b) =>
					String(a).localeCompare(
						String(b)
					)
				);

				let msg = "";

				msg += "━━━━━━━━━━━━━━\n";
				msg += `𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐘: ${emoji} | ${fontConvert(
					categoryName,
					"category"
				)}\n`;

				msg += "╭──────୨ৎ──────╮\n";

				for (const cmd of list) {
					msg += `╎ ᯓ✧. ${fontConvert(
						cmd,
						"command"
					)}\n`;
				}

				msg += "┕━─────୨ৎ─────━ᥫ᭡\n";

				msg +=
					"• 𝙽𝚎𝚎𝚍 𝚑𝚎𝚕𝚙 𝚠𝚒𝚝𝚑 𝚊 𝚌𝚘𝚖𝚖𝚊𝚗𝚍? 𝚄𝚜𝚎 " +
					`${prefix}help <commandname>.\n`;

				msg += "╭──────୨ৎ──────╮\n";

				msg += `╎ 🔢 𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: ${list.length}\n`;
				msg += `╎ ⚡️ 𝐏𝐫𝐞𝐟𝐢𝐱: ${prefix}\n`;
				msg += "╎ 👤 𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐒𝐚𝐢𝐦𝐱𝟔𝟗𝐱\n";

				msg += "╰──────୨ৎ──────╯";

				try {
					return message.reply({
						body: msg,
						attachment:
							await global.utils.getStreamFromURL(
								helpImage
							)
					});
				} catch (err) {
					return message.reply(msg);
				}
			}

			/*
			 * =========================
			 * ALL COMMANDS
			 * =========================
			 */

			if (!input) {
				let msg = "";

				msg +=
					"━━━━━━━━━━━━━━\n";
				msg +=
					"𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜:\n";
				msg +=
					"━━━━━━━━━━━━━━\n";

				let totalCommands = 0;

				for (const cat of Object.keys(categories).sort()) {
					const list = [
						...categories[cat]
					].sort((a, b) =>
						String(a).localeCompare(
							String(b)
						)
					);

					totalCommands += list.length;

					msg += `┍─━〔 ${getCategoryEmoji(
						cat
					)} | ${fontConvert(
						cat,
						"category"
					)} 〕\n`;

					for (const cmd of list) {
						msg += `╎ᯓ✧. ${fontConvert(
							cmd,
							"command"
						)}\n`;
					}

					msg +=
						"┕━─────୨ৎ─────━ᥫ᭡\n";
				}

				msg +=
					"• 𝙽𝚎𝚎𝚍 𝚑𝚎𝚕𝚙 𝚠𝚒𝚝𝚑 𝚊 𝚌𝚘𝚖𝚖𝚊𝚗𝚍? 𝚄𝚜𝚎 " +
					`${prefix}help <commandname>.\n`;

				msg += "╭──────୨ৎ──────╮\n";
				msg += `╎ 🔢 𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: ${totalCommands}\n`;
				msg += `╎ ⚡️ 𝐏𝐫𝐞𝐟𝐢𝐱: ${prefix}\n`;
				msg += "╎ 👤 𝐂𝐫𝐞𝐚𝐭𝐨𝐫: 𝐒𝐚𝐢𝐦𝐱𝟔𝟗𝐱\n";
				msg += "╰──────୨ৎ──────╯";

				try {
					return message.reply({
						body: msg,
						attachment:
							await global.utils.getStreamFromURL(
								helpImage
							)
					});
				} catch (err) {
					return message.reply(msg);
				}
			}

			/*
			 * =========================
			 * COMMAND INFO
			 * =========================
			 */

			const cmdName = input.toLowerCase();
			const cmd = getCommandByName(cmdName);

			if (!cmd || !cmd.config) {
				const suggestion =
					getClosestCommand(cmdName);

				return message.reply(
					suggestion
						? `❌ Command "${cmdName}" not found.\n👉 Maybe you meant: ${suggestion}`
						: `❌ Command "${cmdName}" not found.`
				);
			}

			// Prevent viewing commands above user's role
			const commandRole =
				getCommandRole(cmd);

			if (commandRole > role) {
				return message.reply(
					"❌ You don't have permission to view this command."
				);
			}

			const c = cmd.config;

			let guide = "No usage.";

			if (c.guide?.en) {
				if (typeof c.guide.en === "string") {
					guide = c.guide.en.replace(
						/{pn}/g,
						`${prefix}${c.name}`
					);
				}
			}

			let aliasesText = "None";

			if (Array.isArray(c.aliases)) {
				aliasesText =
					c.aliases.join(", ") || "None";
			} else if (typeof c.aliases === "string") {
				aliasesText = c.aliases;
			}

			const msg =
`╭═══ [ 𝘊𝘖𝘔𝘔𝘈𝘕𝘋 𝘐𝘕𝘍𝘖 ] ═══╮
╎🧩 Name : ${c.name || cmdName}
╎📦 Category : ${String(
					c.category || "UNCATEGORIZED"
				).toUpperCase()}
╎📜 Description : ${
					c.longDescription?.en ||
					c.shortDescription?.en ||
					"No description."
				}
╎🔁 Aliases : ${aliasesText}
╎⚙️ Version : ${c.version || "1.0"}
╎🔐 Permission : ${commandRole} (${roleTextToString(
					commandRole
				)})
╎⏱️ Cooldown : ${c.countDown || 5}s
╎👑 Author : ${c.author || "Unknown"}
╎📖 Usage : ${guide}
╰═════════୨ৎ═════════╯`;

			return message.reply(msg);
		} catch (err) {
			console.error("[HELP COMMAND ERROR]", err);

			return message.reply(
				"❌ An error occurred while loading the help menu."
			);
		}
	}
};

এই version-এ বিশেষ করে "aliases.get()", "aliases.join()", undefined "role", remote resource failure, image-download failure এবং invalid command config-এর জন্য fallback দেওয়া হয়েছে।
