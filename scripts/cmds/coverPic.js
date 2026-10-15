const axios = require("axios")
const fs = require("fs")
const cheerio = require("cheerio")
const path = require("path")

module.exports = {
  config: {
    name: "cover",
    aliases: ["cp", "coverpp"],
    version: "5.0",
    author: "乛 SIYAM ゎ",
    countDown: 3,
    prefix: false,
    role: 0,
    shortDescription: "Get fb cover photo",
    longDescription: "",
    category: "image",
    guide: "{pn} - reply or uid"
  },

  onStart: async function ({ event, message, args }) {
    try {
      let uid;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }
      else if (args[0]) {
        uid = args[0];
      }
      else if (event.type === "message_reply" && event.messageReply?.senderID) {
        uid = event.messageReply.senderID;
      }
      else {
        uid = event.senderID;
      }

      const link = await this.getImg(uid)

      if (!link) {
        return message.reply("Could not find cover photo")
      }

      const stream = await global.utils.getStreamFromURL(link)

      await message.reply({
        body: `Here's your cover`,
        attachment: stream
      });

    } catch {
      return message.reply("Failed to get user info")
    }
  },

  getCookie: function () {
    const filePath = path.join(process.cwd(), "account.txt")
    if (!fs.existsSync(filePath)) return null

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const cookie = data.map(c => `${c.key}=${c.value}`).join("; ")

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

      const res = await axios.get(url, {
        headers,
        timeout: 15000
      });

      const $ = cheerio.load(res.data);
      const box = $("#profile_cover_photo_container");

      if (box.length) {
        const img = box.find("img")
        if (img.length) {
          return img.attr("src")
        }
      }

      const html = res.data;

      const r1 = /<img[^>]+data-imgperflogname="profileCoverPhoto"[^>]+src="([^"]+)"/
      const m1 = r1.exec(html);
      if (m1) {
        return m1[1].replace(/&amp;/g, "&")
      }

      const r2 = /<link[^>]+href="(https:\/\/scontent[^"]+\.fbcdn\.net[^"]+)"/g
      let m2;
      const found = []

      while ((m2 = r2.exec(html)) !== null) {
        found.push(m2[1].replace(/&amp;/g, "&"))
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

      return filtered[0] || found[0] || null

    } catch {
      return null
    }
  }
};
