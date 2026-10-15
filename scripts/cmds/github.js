const axios = require("axios");

module.exports = {
  config: {
    name: "github",
    aliases: ["gitstalk", "ghstalk"],
    version: "3.2",
    author: "RAFI Chowdhury",
    countDown: 5,
    role: 0,
    shortDescription: { 
      en: "🌸 𝐒𝐭𝐚𝐥𝐤 𝐚 𝐆𝐢𝐭𝐇𝐮𝐛 𝐩𝐫𝐨𝐟𝐢𝐥𝐞 🎀" 
    },
    longDescription: { 
      en: "🌸 𝐅𝐞𝐭𝐜𝐡𝐞𝐬 𝐝𝐞𝐭𝐚𝐢𝐥𝐞𝐝 𝐆𝐢𝐭𝐇𝐮𝐛 𝐮𝐬𝐞𝐫 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 𝐰𝐢𝐭𝐡 𝐫𝐞𝐩𝐨𝐬𝐢𝐭𝐨𝐫𝐢𝐞𝐬 𝐮𝐬𝐢𝐧𝐠 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥 𝐀𝐏𝐈🎀" 
    },
    category: "info",
    guide: { 
      en: "🌸 𝐔𝐬𝐚𝐠𝐞:\n• {pn} <𝐠𝐢𝐭𝐡𝐮𝐛-𝐮𝐬𝐞𝐫𝐧𝐚𝐦𝐞>\n\n🎀 𝐄𝐱𝐚𝐦𝐩𝐥𝐞:\n• {pn} rafixx7 🎀" 
    }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0]) {
      return api.sendMessage(
        "❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐆𝐢𝐭𝐇𝐮𝐛 𝐮𝐬𝐞𝐫𝐧𝐚𝐦𝐞! 🌸\n\n🎀 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: {pn} rafi7xx 🎀", 
        event.threadID, 
        event.messageID
      );
    }

    const username = args[0];
    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    try {
      // 1. Fetch User Profile
      const profileUrl = `https://api.github.com/users/${encodeURIComponent(username)}`;
      const { data: user } = await axios.get(profileUrl);

      // 2. Fetch Repositories (if any exist)
      let reposInfo = "";
      if (user.public_repos > 0) {
        const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=5`;
        const { data: repos } = await axios.get(reposUrl);

        repos.forEach((repo, index) => {
          reposInfo += `\n   🌸 ${index + 1}. ${repo.name}`;
          reposInfo += `\n   📝 ${repo.description || "𝐍𝐨 𝐝𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧"}`;
          reposInfo += `\n   ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count} | 💻${repo.language || "𝐍/𝐀"}`;
          reposInfo += `\n   🔗 ${repo.html_url}`; // Repository Direct URL
          reposInfo += `\n   🔄 ${formatDate(repo.updated_at)}\n`;
        });
        
        if (user.public_repos > 5) {
          reposInfo += `\n🎀 ... 𝐚𝐧𝐝 ${user.public_repos - 5} 𝐦𝐨𝐫𝐞 𝐫𝐞𝐩𝐨𝐬𝐢𝐭𝐨𝐫𝐢𝐞𝐬🌸`;
        }
      } else {
        reposInfo = "\n📭 𝐍𝐨 𝐩𝐮𝐛𝐥𝐢𝐜 𝐫𝐞𝐩𝐨𝐬𝐢𝐭𝐨𝐫𝐢𝐞𝐬";
      }

      const caption =
`🌸 𝗚𝗶𝘁𝗛𝘂𝗯 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗦𝘁𝗮𝗹𝗸 🎀
━━━━━━━━━━━━━━━━━━

👤 𝗣𝗘𝗥𝗦𝗢𝗡𝗔𝗟 𝗜𝗡𝗙𝗢
📝 𝗡𝗮𝗺𝗲: ${user.name || "𝐍/𝐀"}
🔗 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: ${user.login}
📄 𝗕𝗶𝗼: ${user.bio || "𝐍𝐨 𝐛𝐢𝐨"}

📊 𝗦𝗧𝗔𝗧𝗜𝗦𝗧𝗜𝗖𝗦
📂 𝗣𝘂𝗯𝗹𝗶𝗰 𝗥𝗲𝗽𝗼𝘀: ${user.public_repos}
👥 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀: ${user.followers}
➡️ 𝗙𝗼𝗹𝗹𝗼𝘄𝗶𝗻𝗴: ${user.following}

📍 𝗖𝗢𝗡𝗧𝗔𝗖𝗧 𝗜𝗡𝗙𝗢
🏠 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${user.location || "𝐍/𝐀"}
🏢 𝗖𝗼𝗺𝗽𝗮𝗻𝘆: ${user.company || "𝐍/𝐀"}
🌐 𝗕𝗹𝗼𝗴: ${user.blog || "𝐍/𝐀"}
📅 𝗝𝗼𝗶𝗻𝗲𝗱: ${formatDate(user.created_at)}

📁 𝗧𝗢𝗣 𝗥𝗘𝗣𝗢𝗦𝗜𝗧𝗢𝗥𝗜𝗘𝗦${reposInfo}

🔗 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗨𝗥𝗟: ${user.html_url}`;

      // Send message with avatar
      const avatarStream = await getStreamFromURL(user.avatar_url);
      
      await api.sendMessage({
        body: caption,
        mentions: [{
          tag: `@${event.senderID}`,
          id: event.senderID
        }],
        attachment: avatarStream
      }, event.threadID, event.messageID);

      api.setMessageReaction("✅", event.messageID, event.threadID, () => {}, true);

    } catch (err) {
      console.error("❌ Gitstalk Error:", err.message);
      
      // Handle "Not Found" specifically for official API
      if (err.response && err.response.status === 404) {
        api.sendMessage(
          "❌ 𝐔𝐬𝐞𝐫 𝐧𝐨𝐭 𝐟𝐨𝐮𝐧𝐝!🌸\n\n🎀 𝐏𝐥𝐞𝐚𝐬𝐞 𝐜𝐡𝐞𝐜𝐤 𝐭𝐡𝐞 𝐮𝐬𝐞𝐫𝐧𝐚𝐦𝐞 𝐚𝐧𝐝 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 🎀", 
          event.threadID, 
          event.messageID
        );
      } else {
        api.sendMessage(
          "❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐟𝐞𝐭𝐜𝐡 𝐆𝐢𝐭𝐇𝐮𝐛 𝐩𝐫𝐨𝐟𝐢𝐥𝐞 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧! 🌸\n\n🎀 𝐏𝐥𝐞𝐚𝐬𝐞 𝐜𝐡𝐞𝐜𝐤:\n• 𝐈𝐧𝐭𝐞𝐫𝐧𝐞𝐭 𝐜𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧\n• 𝐀𝐏𝐈 𝐫𝐚𝐭𝐞 𝐥𝐢𝐦𝐢𝐭𝐬 🎀", 
          event.threadID, 
          event.messageID
        );
      }
      
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
    }
  },

  onChat: async function({ event, message }) {
    // Additional functionality can be added here
  }
};

async function getStreamFromURL(url) {
  try {
    const res = await axios({
      url,
      responseType: "stream",
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return res.data;
  } catch (error) {
    console.error("❌ Avatar download error:", error.message);
    return null;
  }
}

function formatDate(dateString) {
  if (!dateString) return "𝐍/𝐀";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
    }
