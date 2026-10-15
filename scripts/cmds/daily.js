const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "daily",
    version: "4.0",
    author: "SiFu",
    countDown: 5,
    role: 0,
    description: {
      en: "Claim daily rewards up to 5 times a day"
    },
    category: "game",
    guide: {
      en: "   {pn}: Claim your daily reward (5 times daily)\n   {pn} info: View rewards schedule\n   {pn} streak: View your streak"
    },
    envConfig: {
      rewardFirstDay: { coin: 500, exp: 50 }
    }
  },

  langs: {
    en: {
      alreadyReceived: "alreadyReceived",
      received: "received"
    }
  },

  onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang, api }) {
    const { senderID } = event;
    const reward = envCommands[commandName].rewardFirstDay;
    const timeZone = "Asia/Dhaka";
    const now = moment.tz(timeZone);
    const dateTime = now.format("DD/MM/YYYY");
    const timeStr = now.format("hh:mm A");
    const currentDay = now.day();
    const dayIndex = currentDay === 0 ? 7 : currentDay;

    const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const bgList = [
      "https://i.imgur.com/4mdeCoN.jpeg",
      "https://i.imgur.com/Na7cmcF.jpeg",
      "https://i.imgur.com/gLTPWhh.jpeg",
      "https://i.imgur.com/zBNSNaU.jpeg"
    ];

    const userData = await usersData.get(senderID);
    const userName = userData.name || "User";

    
    if (args[0] === "info") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const bars = ["▱▱▱▱▱", "█▱▱▱▱", "██▱▱▱", "███▱▱", "████▱", "█████", "██████"];

      let msg = "";
      msg += "\n";
      msg += "  📅  REWARD SCHEDULE  \n";
      msg += "\n\n";

      for (let i = 1; i <= 7; i++) {
        const c = Math.floor(reward.coin * (1.2) ** (i - 1));
        const e = Math.floor(reward.exp * (1.2) ** (i - 1));
        const active = i === dayIndex ? " ◄ TODAY" : "";
        msg += `${i === dayIndex ? "▶" : "  "} ${days[i - 1]}  💰 ${c}  ⚡ ${e}${active}\n`;
      }

      msg += "\n━━━━━━━━━━━━━━━━\n";
      msg += "⏰ Resets: 12:00 AM (BD Time)\n";
      msg += "🔁 Claims per day: 5\n";
      msg += "📈 Bonus grows 20% each day!";
      return message.reply(msg);
    }

    if (args[0] === "streak") {
      const streak = userData.data.dailyStreak || 0;
      const best = userData.data.bestStreak || 0;
      const totalClaims = userData.data.totalClaims || 0;
      const bar = "🟥".repeat(Math.min(streak, 7)) + "⬛".repeat(Math.max(0, 7 - streak));

      let msg = "";
      msg += "\n";
      msg += "   🔥  YOUR STREAK  🔥 \n";
      msg += "\n\n";
      msg += `👤 User     : ${userName}\n`;
      msg += `🔥 Streak   : ${streak} day(s)\n`;
      msg += `🏆 Best     : ${best} day(s)\n`;
      msg += `📊 Total    : ${totalClaims} claims\n\n`;
      msg += `${bar}\n\n`;
      msg += "━━━━━━━━━━━━━━━━━━\n";
      msg += streak >= 7
        ? "🌟 Amazing! 7-day streak reached!"
        : `📌 ${7 - streak} more day(s) to 7-day streak!`;
      return message.reply(msg);
    }

   
    if (!userData.data.dailyClaim || userData.data.dailyClaim.date !== dateTime) {
      // Check streak continuity
      const yesterday = moment.tz(timeZone).subtract(1, "day").format("DD/MM/YYYY");
      const lastDate = userData.data.dailyClaim?.date;
      const prevStreak = userData.data.dailyStreak || 0;

      userData.data.dailyStreak = lastDate === yesterday ? prevStreak + 1 : 1;
      userData.data.bestStreak = Math.max(userData.data.dailyStreak, userData.data.bestStreak || 0);

      userData.data.dailyClaim = { date: dateTime, count: 0 };
    }

    if (userData.data.dailyClaim.count >= 5) {
      const nextReset = moment.tz(timeZone).endOf("day").fromNow();
      let msg = "";
      msg += "\n";
      msg += "   🚫  LIMIT REACHED  🚫\n";
      msg += "\n\n";
      msg += `👤 ${userName}\n`;
      msg += `📦 Claims Used  : 5 / 5\n`;
      msg += `⏳ Resets       : ${nextReset}\n\n`;
      msg += "━━━━━━━━━━━━━━━━━\n";
      msg += "💡 Tip: Use {pn} streak to check your streak!";
      return message.reply(msg);
    }

   
    const streak = userData.data.dailyStreak || 1;
    const streakBonus = Math.min(streak * 0.05, 0.5); 
    const getCoin = Math.floor(reward.coin * (1.2) ** (dayIndex - 1) * (1 + streakBonus));
    const getExp = Math.floor(reward.exp * (1.2) ** (dayIndex - 1) * (1 + streakBonus));

    userData.data.dailyClaim.count += 1;
    userData.data.totalClaims = (userData.data.totalClaims || 0) + 1;
    const currentCount = userData.data.dailyClaim.count;

    await usersData.set(senderID, {
      money: userData.money + getCoin,
      exp: userData.exp + getExp,
      data: userData.data
    });

   
    const filled = "█".repeat(currentCount);
    const empty = "░".repeat(5 - currentCount);
    const progressBar = `[${filled}${empty}] ${currentCount}/5`;

  
    const streakDisplay = streak >= 7 ? "🌟 MAX" : `🔥 ${streak} day(s)`;

    try {
      const avatarURL = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const randomBG = bgList[Math.floor(Math.random() * bgList.length)];

      const cardUrl = `https://api.popcat.xyz/welcomecard?background=${encodeURIComponent(randomBG)}&text1=${encodeURIComponent(userName)}&text2=CLAIM+${currentCount}/5+%7C+STREAK+${streak}&text3=%2B${getCoin}+COINS+%7C+%2B${getExp}+EXP&avatar=${encodeURIComponent(avatarURL)}`;
      const imageStream = (await axios.get(cardUrl, { responseType: "stream" })).data;

      let body = "";
      body += "\n";
      body += "🎀  REWARD CLAIMED  🎀\n";
      body += "\n\n";
      body += `👤 User      : ${userName}\n`;
      body += `📅 Day       : ${dayNames[dayIndex]} (Day ${dayIndex})\n`;
      body += `🕐 Time      : ${timeStr}\n`;
      body += `📆 Date      : ${dateTime}\n`;
      body += `\n━━━━━━━━━━━━━━━━\n\n`;
      body += `💰 Coins     : +${getCoin}\n`;
      body += `⚡ EXP       : +${getExp}\n`;
      body += `${streakBonus > 0 ? `🎁 Streak+   : +${Math.round(streakBonus * 100)}% bonus\n` : ""}`;
      body += `\n━━━━━━━━━━━━━━━━\n\n`;
      body += `📊 Progress  : ${progressBar}\n`;
      body += `${streakDisplay}\n\n`;
      body += currentCount === 5
        ? "🏁 All 5 claims used! Come back tomorrow."
        : `💡 ${5 - currentCount} claim(s) remaining today!`;

      return message.reply({ body, attachment: imageStream });

    } catch {
      // ── FALLBACK TEXT ONLY ──
      let body = "";
      body += "   🎀 REWARD CLAIMED 🎀 \n";
      body += "\n\n";
      body += `👤 ${userName}\n`;
      body += `💰 +${getCoin} Coins\n`;
      body += `⚡ +${getExp} EXP\n`;
      body += `📊 ${progressBar}\n`;
      body += `${streakDisplay}`;
      return message.reply(body);
    }
  }
};
