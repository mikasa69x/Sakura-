const axios = require("axios")
const fs = require("fs")
const cheerio = require("cheerio")
const path = require("path")

module.exports = {
  config: {
    name: "pp",
    aliases: ["pfp"],
    version: "2.0",
    author: "乛 SIYAM ゎ",
    countDown: 3,
    prefix: false,
    role: 0,
    shortDescription: "Get fb cover & profile photo",
    longDescription: "",
    category: "info",
    guide: "{pn} - reply, mention, or uid"
  },

  onStart: async function ({ event, message, args }) {
    try {
      let uid;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }
      else if (args[0] && /^\d+$/.test(args[0])) {
        uid = args[0];
      }
      else if (event.type === "message_reply" && event.messageReply?.senderID) {
        uid = event.messageReply.senderID;
      }
      else {
        uid = event.senderID;
      }

      const profilePicUrl = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const coverUrl = await this.getImg(uid);

      const attachments = [];
      const lines = [];

      try {
        const profileStream = await global.utils.getStreamFromURL(profilePicUrl);
        if (profileStream) {
          attachments.push(profileStream);
          lines.push("🪶_ 𝑷𝒓𝒐𝒇𝒊𝒍𝒆 𝑷𝒊𝒄𝒕𝒖𝒓𝒆 _🪶");
        }
      } catch {
        lines.push("Could not fetch profile picture");
      }

      if (coverUrl) {
        try {
          const coverStream = await global.utils.getStreamFromURL(coverUrl);
          if (coverStream) {
            attachments.push(coverStream);
            lines.push("🎀_ 𝑪𝒐𝒗𝒆𝒓 𝑷𝒉𝒐𝒕𝒐 _🎀");
          }
        } catch {
          lines.push("Could not fetch cover photo");
        }
      } else {
        lines.push("Cover photo not found");
      }

      if (attachments.length === 0) {
        return message.reply("No photos could be retrieved.");
      }

      return message.reply({
        body: lines.join("\n"),
        attachment: attachments
      });

    } catch {
      return message.reply("Failed to get user info.");
    }
  },

  getCookie: function () {
    const filePath = path.join(process.cwd(), "account.txt");
    if (!fs.existsSync(filePath)) return null;
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const cookie = data.map(c => `${c.key}=${c.value}`).join("; ");
    return {
      authority: "www.facebook.com",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "max-age=0",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      cookie: cookie
    };
  },

  getImg: async function (uid) {
    try {
      const headers = this.getCookie();
      if (!headers) return null;

      const url = `https://www.facebook.com/profile.php?id=${uid}`;
      const res = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(res.data);

      const box = $("#profile_cover_photo_container");
      if (box.length) {
        const img = box.find("img");
        if (img.length) return img.attr("src");
      }

      const html = res.data;

      const r1 = /<img[^>]+data-imgperflogname="profileCoverPhoto"[^>]+src="([^"]+)"/;
      const m1 = r1.exec(html);
      if (m1) return m1[1].replace(/&amp;/g, "&");

      const r2 = /<link[^>]+href="(https:\/\/scontent[^"]+\.fbcdn\.net[^"]+)"/g;
      let m2;
      const found = [];
      while ((m2 = r2.exec(html)) !== null) {
        found.push(m2[1].replace(/&amp;/g, "&"));
      }

      const filtered = found.filter(u =>
        !u.includes("s160x160") &&
        !u.includes("s40x40") &&
        !u.includes("cp0_dst-jpg")
      );

      const bySid = filtered.find(u => u.includes("_nc_sid=cc71e4"));
      if (bySid) return bySid;

      const big = filtered.find(u => u.includes("_s720x720"));
      if (big) return big;

      return filtered[0] || found[0] || null;

    } catch {
      return null;
    }
  }
};
