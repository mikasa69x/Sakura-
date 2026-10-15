const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

// ── Small-caps output ────────────────────────────
const SC_MAP = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ";

function sc(str = "") {
  if (!str) return "";
  return String(str).toLowerCase().split("").map(c => {
    const i = c.charCodeAt(0) - 97;
    return i >= 0 && i < 26 ? SC_MAP[i] : c;
  }).join("");
}

const LINE = "― ― ― ― ― ― ― ― ― ― ― ―";
const DIV = "· · · · · · · · · · · · ·";

// ══════════════════════════════════════════════════
// FONT NORMALIZER
// ══════════════════════════════════════════════════

const FONT_RANGES = [
  [0x1D400, 65, 26], [0x1D41A, 97, 26],
  [0x1D434, 65, 26], [0x1D44E, 97, 26],
  [0x1D468, 65, 26], [0x1D482, 97, 26],
  [0x1D49C, 65, 26], [0x1D4B6, 97, 26],
  [0x1D4D0, 65, 26], [0x1D4EA, 97, 26],
  [0x1D504, 65, 26], [0x1D51E, 97, 26],
  [0x1D538, 65, 26], [0x1D552, 97, 26],
  [0x1D56C, 65, 26], [0x1D586, 97, 26],
  [0x1D5A0, 65, 26], [0x1D5BA, 97, 26],
  [0x1D5D4, 65, 26], [0x1D5EE, 97, 26],
  [0x1D608, 65, 26], [0x1D622, 97, 26],
  [0x1D63C, 65, 26], [0x1D656, 97, 26],
  [0x1D670, 65, 26], [0x1D68A, 97, 26],
  [0xFF21, 65, 26], [0xFF41, 97, 26],
];

const SMALLCAPS = {
  'ᴀ':'a','ʙ':'b','ᴄ':'c','ᴅ':'d','ᴇ':'e','ꜰ':'f',
  'ɢ':'g','ʜ':'h','ɪ':'i','ᴊ':'j','ᴋ':'k','ʟ':'l',
  'ᴍ':'m','ɴ':'n','ᴏ':'o','ᴘ':'p','ǫ':'q','ʀ':'r',
  'ꜱ':'s','ᴛ':'t','ᴜ':'u','ᴠ':'v','ᴡ':'w','x':'x',
  'ʏ':'y','ᴢ':'z',
};

function normalizeFont(str = "") {
  let out = "";

  for (const ch of str) {
    const cp = ch.codePointAt(0);

    if (SMALLCAPS[ch]) {
      out += SMALLCAPS[ch];
      continue;
    }

    if (cp >= 0x24B6 && cp < 0x24B6 + 26) {
      out += String.fromCharCode(cp - 0x24B6 + 65);
      continue;
    }

    if (cp >= 0x24D0 && cp < 0x24D0 + 26) {
      out += String.fromCharCode(cp - 0x24D0 + 97);
      continue;
    }

    let found = false;

    for (const [start, base, len] of FONT_RANGES) {
      if (cp >= start && cp < start + len) {
        out += String.fromCharCode(base + (cp - start));
        found = true;
        break;
      }
    }

    if (!found) out += ch;
  }

  return out;
}

// ── Category → Emoji map ─────────────────────────
const CATEGORY_MAP = {
  "fun": ["😂","🤣","😁","😆","😹"],
  "game": ["🎮","🧩","🎰","⚽","🎲","🕹️"],
  "ai": ["🍓","🤖","🧠"],
  "group": ["⚙️","👥"],
  "music": ["🎵","🎶","🎼"],
  "owner": ["👑","🛡️"],
  "special": ["🌟","✨"],
  "image": ["🖼️","📷","🖌️"],
  "image generator": ["💻","🖥️","🎨"],
  "image generator 2": ["💡","🔮"],
  "info": ["ℹ️","📄"],
  "information": ["📚","📖"],
  "love": ["💌","❤️","💖","💞"],
  "media": ["📺","🎥","📹","🎬"],
  "economy": ["💰","🏦","💳"],
  "tools": ["🛠️","🔧","⚒️"],
  "utility": ["⚡","🧰"],
  "wiki": ["🌐","📡"],
  "market": ["🛒","🏪","💹"],
  "rank": ["📊","🏆"],
  "18+": ["🌚","🌝"],
  "system": ["💾","🖥️","🛡️"],
};

// ── Resolve category ─────────────────────────────
function resolveCategory(raw = "") {
  const rawTrimmed = raw.trim();

  const emojiMatch = Object.keys(CATEGORY_MAP).find(cat =>
    CATEGORY_MAP[cat].includes(rawTrimmed)
  );

  if (emojiMatch) return emojiMatch;

  const normalized = normalizeFont(rawTrimmed).toLowerCase().trim();

  if (CATEGORY_MAP[normalized]) return normalized;

  const noSpace = normalized.replace(/\s+/g, "");

  const spaceMatch = Object.keys(CATEGORY_MAP).find(cat =>
    cat.replace(/\s+/g, "") === noSpace
  );

  if (spaceMatch) return spaceMatch;

  return null;
}

// ── Commands grouped by category ─────────────────
function getCommandsByCategory() {
  const map = {};

  for (const cmd of commands.values()) {
    if (cmd.config.role > 1) continue;

    const cat = (cmd.config.category || "other").toLowerCase();

    if (!map[cat]) map[cat] = [];

    map[cat].push(cmd.config.name);
  }

  return map;
}

// ══════════════════════════════════════════════════
module.exports = {
  config: {
    name: "help2",
    aliases: ["h2"],
    version: "2.1.1",
    author: "乛 SIYAM ゎ 🎀",
    role: 0,
    shortDescription: "Show commands by category or emoji",
    longDescription: "Supports any font style input — 𝗴𝗮𝗺𝗲 / ɢᴀᴍᴇ / ＧＡＭＥ all work!",
    category: "info",
    guide: "{pn} | {pn} <emoji/category>",
  },

  // Only onStart is used.
  // Removed onChat to prevent duplicate replies.
  onStart: async function ({ message, event, args }) {
    const prefix = await getPrefix(event.threadID);
    return handleHelp2({
      message,
      args,
      prefix
    });
  },
};

// ── Core handler ─────────────────────────────────
async function handleHelp2({ message, args, prefix }) {
  if (!args[0]) {
    return showCategoryList(message, prefix);
  }

  const catName = resolveCategory(args[0]);

  if (!catName) {
    const normalized = normalizeFont(args[0].trim()).toLowerCase();

    return message.reply([
      `❌  ${sc("category not found!")}`,
      DIV,
      `${sc("you typed:")}  ${args[0]}`,
      `${sc("detected as:")}  ${normalized}`,
      DIV,
      `${sc("try:")}  ${prefix}h2 🎮  ${sc("or")}  ${prefix}h2 game`,
      `${sc("type")}  ${prefix}h2  ${sc("to see all categories")}`,
    ].join("\n"));
  }

  const allCats = getCommandsByCategory();
  const cmds = allCats[catName];

  if (!cmds || cmds.length === 0) {
    return message.reply(
      `❌  ${sc(`no commands found in "${catName}"`)}`
    );
  }

  const emoji = CATEGORY_MAP[catName][0] || "📁";
  const sorted = [...cmds].sort();

  const half = Math.ceil(sorted.length / 2);
  const col1 = sorted.slice(0, half);
  const col2 = sorted.slice(half);

  const rows = col1.map((name, i) =>
    `› ${sc(name)}${col2[i] ? `   ·   › ${sc(col2[i])}` : ""}`
  );

  return message.reply([
    `${emoji}  ${sc(catName).toUpperCase()}`,
    LINE,
    `${sc("total:")}  ${cmds.length}  ${sc("commands")}`,
    DIV,
    ...rows,
    DIV,
    `💡  ${prefix}h2 <ᴇᴍᴏᴊɪ/ᴄᴀᴛ>`,
  ].join("\n"));
}

// ── Category list ─────────────────────────────────
function showCategoryList(message, prefix) {
  const allCats = getCommandsByCategory();

  const rows = Object.keys(CATEGORY_MAP).map(cat => {
    const emoji = CATEGORY_MAP[cat][0] || "📁";
    const count = allCats[cat]?.length || 0;

    return `${emoji}  ${sc(cat).padEnd(18)}  [${count}]`;
  });

  const total = Object.values(allCats)
    .reduce((s, v) => s + v.length, 0);

  return message.reply([
    `✦  ${sc("help2")}  ·  ${sc("category browser")}`,
    LINE,
    `${sc("total commands:")}  ${total}`,
    DIV,
    ...rows,
    DIV,
    `💡  ${sc("supports any font style!")}`,
    `  ${prefix}h2 🎮   ${sc("emoji")}`,
    `  ${prefix}h2 game  ${sc("plain text")}`,
    `  ${prefix}h2 𝗴𝗮𝗺𝗲  ${sc("bold font")}`,
    `  ${prefix}h2 ɢᴀᴍᴇ  ${sc("small caps")}`,
    `  ${prefix}h2 ＧＡＭＥ  ${sc("fullwidth")}`,
  ].join("\n"));
}
