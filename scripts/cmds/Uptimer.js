const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "uptimer-data.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}), "utf-8");
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m}m`;
}

function getDhakaTime() {
  return new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka" });
}

module.exports = {
  config: {
    name: "uptimer",
    version: "2.0",
    author: "—͞Sɪʏᴀᴍ ☯",
    role: 0,
    shortDescription: "Monitor website uptime",
    longDescription: "Track website uptime per user with alerts and summary.",
    category: "utility",
    guide: {
      en: `
        {pn} add <url> - Add a URL to monitor.
        {pn} notify on/off - Enable/disable notifications.
        {pn} status - View your monitored URLs.
        {pn} all - (Admin only) View all monitored URLs.`
    }
  },

  onStart: async function ({ args, message, event }) {
    const uid = event.senderID;
    const adminUID = "100051869042398";
    const db = loadDB();

    const subcmd = args[0];
    if (!subcmd) return message.reply("❌ | Please provide a subcommand: add, notify, status, all");

    if (subcmd === "add") {
      const url = args[1];
      if (!url) return message.reply("❌ | Please provide a URL to monitor.");

      if (!db[uid]) db[uid] = { notify: true, monitors: {} };

      if (!db[uid].monitors[url]) {
        db[uid].monitors[url] = {
          addedAt: Date.now(),
          checks: 0,
          uptime: 0,
          downtime: 0,
          lastStatus: "Unknown",
          lastCheck: null,
          failures: 0
        };
        saveDB(db);
        checkNow(url, uid);
        return message.reply(`✅ Now monitoring: ${url}\n🔰 wait 1 min for monitoring`);
      } else {
        return message.reply("⚠️ | This URL is already being monitored.");
      }
    }

    if (subcmd === "notify") {
      if (!db[uid]) db[uid] = { notify: true, monitors: {} };
      if (!args[1] || !["on", "off"].includes(args[1]))
        return message.reply("⚠️ | Use: notify on OR notify off");

      db[uid].notify = args[1] === "on";
      saveDB(db);
      return message.reply(`🔔 | Notifications ${args[1].toUpperCase()}!`);
    }

    if (subcmd === "status") {
      if (!db[uid] || !Object.keys(db[uid].monitors).length)
        return message.reply("❌ | No URL is being monitored.");

      const res = Object.entries(db[uid].monitors).map(([url, data]) => {
        const status = data.lastStatus === "up" ? "🟢 Monitor Up" : data.lastStatus === "down" ? "🔴 Monitor Down" : "⚪ Unknown";
        return `🔎 Uptime Monitor Status:\n\n🌐 • URL: ${url}\n⚡ • Status: ${status}\n📊 • Daily Summary:\n✅ • Total Checks: ${data.checks}\n📈 • Uptime: ${((data.uptime / (data.checks || 1)) * 100).toFixed(1)}%\n❌ • Downtime: ${data.downtime} checks\n⏰ • Last check: ${data.lastCheck || "Never"} (Asia/Dhaka)\n⏱️ • Monitored for: ${formatTime(Date.now() - data.addedAt)}\n🔔 • Notifications: ${db[uid].notify ? "ON" : "OFF"}\n⚠️ • Failures: ${data.failures}/5\n⛔ • Auto-stop at: 5 failures`;
      });

      return message.reply(res.join("\n\n"));
    }

    if (subcmd === "all") {
      if (uid !== adminUID) return message.reply("❌ | You are not allowed.");

      const allUsers = Object.entries(db)
        .map(([uid, data]) => `👤 User: ${uid}\n` + Object.entries(data.monitors || {}).map(([url, info]) => `- ${url} (${info.lastStatus})`).join("\n"))
        .join("\n\n");

      return message.reply("📋 All Monitored URLs:\n\n" + allUsers);
    }
  }
};

// Background check
setInterval(async () => {
  const db = loadDB();
  for (const [uid, userData] of Object.entries(db)) {
    for (const [url, data] of Object.entries(userData.monitors)) {
      const isUp = await checkURL(url);
      data.checks++;
      data.lastCheck = getDhakaTime();
      if (isUp) {
        data.uptime++;
        data.failures = 0;
        data.lastStatus = "up";
      } else {
        data.downtime++;
        data.failures++;
        data.lastStatus = "down";
        if (userData.notify) {
          global.api.sendMessage(`❗ Alert:\n🔴 ${url} is DOWN`, uid);
        }
        if (data.failures >= 5) delete userData.monitors[url];
      }
    }
  }
  saveDB(db);
}, 60 * 1000); // every 1 minute

async function checkURL(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

async function checkNow(url, uid) {
  const isUp = await checkURL(url);
  const status = isUp ? "🟢 Monitor Up" : "🔴 Monitor Down";
  global.api.sendMessage(`✅ Added & Checked:\n🌐 ${url}\n⚡ Status: ${status}`, uid);
  }
