const fs = require("fs");
const { downloadVideo } = require("sagor-video-downloader");

// ── Platform detector from URL ──────────────────────────────────────────────
function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be"))  return { name: "YouTube",   emoji: "▶️" };
  if (u.includes("tiktok.com"))                              return { name: "TikTok",    emoji: "🎵" };
  if (u.includes("facebook.com") || u.includes("fb.watch")) return { name: "Facebook",   emoji: "🌐" };
  if (u.includes("instagram.com"))                           return { name: "Instagram", emoji: "🪶" };
  if (u.includes("twitter.com") || u.includes("x.com"))     return { name: "Twitter/X",  emoji: "🐦" };
  if (u.includes("reddit.com"))                              return { name: "Reddit",    emoji: "🤖" };
  if (u.includes("pinterest.com"))                           return { name: "Pinterest", emoji: "📌" };
  if (u.includes("vimeo.com"))                               return { name: "Vimeo",     emoji: "🎬" };
  if (u.includes("dailymotion.com"))                         return { name: "Dailymotion", emoji: "📹" };
  if (u.includes("capcut.com"))                              return { name: "CapCut",    emoji: "✂️" };
  if (u.includes("likee.video"))                             return { name: "Likee",     emoji: "❤️" };
  if (u.includes("snackvideo.com"))                          return { name: "Snack",     emoji: "🍿" };
  return { name: "Unknown", emoji: "🍒" };
}

module.exports = {
  config: {
    name: "autodl",
    version: "2.0",
    author: "乛 SIYAM ゎ",
    countDown: 3,
    role: 2,
    shortDescription: { en: "Auto-download & send videos with platform info" },
    longDescription: { en: "Automatically detects links, downloads videos and replies with platform name and file size" },
    category: "media"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const threadID  = event.threadID;
    const messageID = event.messageID;
    const body      = event.body || "";

    // ── Extract all unique links ──────────────────────────────────────────────
    const linkMatches = body.match(/(https?:\/\/[^\s]+)/g);
    if (!linkMatches || linkMatches.length === 0) return;

    const uniqueLinks = [...new Set(linkMatches)];

    // ── Processing reaction ───────────────────────────────────────────────────
    api.setMessageReaction("🪶", messageID, () => {}, true);

    let successCount = 0;
    let failCount    = 0;

    for (const url of uniqueLinks) {
      const platform = detectPlatform(url);

      try {
        const { title, filePath } = await downloadVideo(url);

        if (!filePath || !fs.existsSync(filePath)) throw new Error("File not found after download");

        const stats        = fs.statSync(filePath);
        const fileSizeMB   = stats.size / (1024 * 1024);

        // ── File too large ──────────────────────────────────────────────────
        if (fileSizeMB > 30) {
          fs.unlinkSync(filePath);
          api.setMessageReaction("🤦🏻", messageID, () => {}, true);
          failCount++;
          continue;
        }

        // ── Send video as reply ─────────────────────────────────────────────
        const caption =
`${platform.emoji} 𝐇𝐄𝐑𝐄'𝐒 𝐘𝐎𝐔𝐑 𝐌𝐄𝐃𝐈𝐀 🎀
━━━━━━━━━━━━━━━
🍒 ᴘʟᴀᴛꜰᴏʀᴍ: ${platform.emoji} ${platform.name}
🧩 sɪᴢᴇ: ${fileSizeMB.toFixed(2)} MB
━━━━━━━━━━━━━━━`;

        await api.sendMessage(
          { body: caption, attachment: fs.createReadStream(filePath) },
          threadID,
          () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          },
          messageID  // reply to original message
        );

        successCount++;

      } catch (err) {
        // ── Download failed: react instead of sending a message ─────────────
        api.setMessageReaction("❎", messageID, () => {}, true);
        failCount++;
      }
    }

    // ── Final reaction based on result ────────────────────────────────────────
    const finalReaction =
      successCount > 0 && failCount === 0 ? "🌸" :
      successCount > 0                    ? "⚠️" : "😢";

    api.setMessageReaction(finalReaction, messageID, () => {}, true);
  }
};
