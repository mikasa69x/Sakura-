const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");

// 🔹 লেভেল ক্যালকুলেশন লজিক
function getLevelInfo(exp) {
  const level = Math.floor(Math.sqrt(exp) / 5) + 1;
  const expForNextLevel = Math.pow((level) * 5, 2);
  const expForCurrentLevel = Math.pow((level - 1) * 5, 2);
  const expNeeded = expForNextLevel - expForCurrentLevel;
  const currentExpInLevel = exp - expForCurrentLevel;
  const percentage = Math.floor((currentExpInLevel / expNeeded) * 100);
  
  return { level, percentage, currentExpInLevel, expNeeded };
}

// 🔹 রাউন্ডেড বক্স আকার ফাংশন
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function drawRankCard(data) {
  const W = 930;
  const H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ১. ব্যাকগ্রাউন্ড
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1a1a1d");
  bg.addColorStop(1, "#4e4e50");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ২. গ্লাস ইফেক্ট
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  roundedRect(ctx, 20, 20, W - 40, H - 40, 20);
  ctx.fill();
  ctx.restore();

  // ৩. সার্কেল অবতার
  const cx = 150;
  const cy = H / 2;
  const r = 90;

  ctx.save();
  ctx.shadowColor = "#00d2ff";
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2, true);
  ctx.fillStyle = "#00d2ff"; 
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(data.avatar, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // ৪. টেক্সট এরিয়া
  const startX = 280;
  
  // নাম (Name)
  ctx.font = "bold 50px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(data.name.length > 15 ? data.name.substring(0, 15) + "..." : data.name, startX, 80);

  // র‍্যাংক ব্যাজ (Rank)
  ctx.font = "bold 35px Arial";
  ctx.fillStyle = "#fddb3a"; 
  ctx.fillText(`RANK #${data.rank}`, startX, 130);

  // ✅ লেভেল টেক্সট 
  ctx.font = "bold 30px Arial";
  ctx.fillStyle = "#00d2ff"; 
  ctx.fillText(`LEVEL ${data.level}`, W - 170, 130); 

  // ৫. প্রগ্রেস বার
  const barX = startX;
  const barY = 180;
  const barW = 580;
  const barH = 30;

  ctx.fillStyle = "#444";
  roundedRect(ctx, barX, barY, barW, barH, 15);
  ctx.fill();

  const progressW = (data.percentage / 100) * barW;
  const grad = ctx.createLinearGradient(barX, 0, barX + progressW, 0);
  grad.addColorStop(0, "#00d2ff");
  grad.addColorStop(1, "#3a7bd5");
  
  ctx.fillStyle = grad;
  roundedRect(ctx, barX, barY, Math.max(progressW, 20), barH, 15);
  ctx.fill();

  ctx.font = "bold 20px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(`${data.currentExpInLevel} / ${data.expNeeded} EXP (${data.percentage}%)`, barX + barW / 2, barY + 23);

  // ৬. সেভ
  const filePath = path.join(__dirname, "cache", `rank_${data.uid}.png`);
  if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

  return filePath;
}

module.exports = {
  config: {
    name: "rank",
    version: "7.1",
    author: "乛 SIYAM ゎ",
    role: 0,
    shortDescription: "Advanced Rank Card",
    category: "game",
    guide: "{pn}rank [@mention]"
  },

  onStart: async function ({ event, usersData, message }) {
    try {
      const { threadID, messageID, senderID } = event;
      
      const uid = Object.keys(event.mentions || {}).length > 0
        ? Object.keys(event.mentions)[0]
        : (event.messageReply ? event.messageReply.senderID : senderID);

      const userData = await usersData.get(uid);
      const allUsers = await usersData.getAll();

      const name = userData.name || "User";
      const exp = userData.exp || 0;

      const sorted = [...allUsers].sort((a, b) => (b.exp || 0) - (a.exp || 0));
      const rank = sorted.findIndex(u => u.userID == uid) + 1;

      const levelInfo = getLevelInfo(exp);

      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      
      const imgRes = await axios.get(avatarURL, { responseType: "arraybuffer" });
      const avatar = await loadImage(Buffer.from(imgRes.data, "binary"));

      const imgPath = await drawRankCard({
        uid,
        name,
        rank,
        avatar,
        ...levelInfo
      });

      message.reply({
        body: `${name}`,
        attachment: fs.createReadStream(imgPath)
      }, () => {
        fs.unlinkSync(imgPath);
      });

    } catch (e) {
      console.error("Rank Error:", e);
      message.reply("❌ কার্ড জেনারেট করতে সমস্যা হয়েছে।");
    }
  }
};
