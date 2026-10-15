const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE = "https://downloader-christus.onrender.com";
const AUTO_URL = `${BASE}/api/auto`;
const SUPPORTED_URL = `${BASE}/api/supported`;

const HEADER = "📥 ALYA DOWNLOADER\n━━━━━━━━━\n\n";

let supportedDomains = [
  "facebook.com", "fb.watch",
  "youtube.com", "youtu.be",
  "tiktok.com",
  "instagram.com", "instagr.am",
  "likee.com", "likee.video",
  "capcut.com",
  "spotify.com",
  "terabox.com",
  "twitter.com", "x.com",
  "drive.google.com",
  "soundcloud.com",
  "ndown.app",
  "pinterest.com", "pin.it"
];

const refreshSupportedDomains = async () => {
  try {
    const res = await axios.get(SUPPORTED_URL, {
      timeout: 15000
    });

    const list = Array.isArray(res.data)
      ? res.data
      : res.data?.domains;

    if (Array.isArray(list) && list.length) {
      supportedDomains = list;
    }
  } catch (err) {
    console.error(
      "[AutoDL2] Supported domains refresh failed:",
      err.message
    );
  }
};

refreshSupportedDomains();

const refreshTimer = setInterval(
  refreshSupportedDomains,
  30 * 60 * 1000
);

if (typeof refreshTimer.unref === "function") {
  refreshTimer.unref();
}

function setReaction(api, emoji, messageID) {
  try {
    if (typeof api.setMessageReaction === "function") {
      api.setMessageReaction(
        emoji,
        messageID,
        () => {},
        true
      );
    }
  } catch (err) {
    console.error("[AutoDL2] Reaction error:", err.message);
  }
}

function isSupportedURL(input) {
  try {
    const parsed = new URL(input);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    return supportedDomains.some((domain) => {
      const cleanDomain = String(domain)
        .toLowerCase()
        .trim()
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        .replace(/^\*\./, "");

      return (
        hostname === cleanDomain ||
        hostname.endsWith("." + cleanDomain)
      );
    });
  } catch {
    return false;
  }
}

module.exports = {
  config: {
    name: "autodl2",
    version: "3.1",
    author: "乛 SIYAM ゎ",
    role: 0,
    shortDescription: "Auto media downloader",
    longDescription:
      "Automatically downloads supported media from Facebook, YouTube, TikTok, Instagram, Likee, CapCut, Spotify, Terabox, Twitter, Google Drive, SoundCloud, NDown and Pinterest.",
    category: "utility",
    guide: {
      en: "Send a supported media URL to download it automatically."
    }
  },

  onStart: async function ({ message }) {
    return message.reply(
      `${HEADER}Send a supported media link to download it automatically.\n\nSupported: Facebook, YouTube, TikTok, Instagram, Likee, CapCut, Spotify, Terabox, X/Twitter, Google Drive, SoundCloud and Pinterest.`
    );
  },

  onChat: async function ({ message, event, api }) {
    const content = event.body?.trim();

    if (!content || /^auto(?:dl2)?\b/i.test(content)) {
      return;
    }

    if (!/^https?:\/\//i.test(content)) {
      return;
    }

    if (!isSupportedURL(content)) {
      return;
    }

    setReaction(api, "⌛", event.messageID);

    const cacheDir = path.join(__dirname, "cache");
    let filePath;

    try {
      const res = await axios.get(AUTO_URL, {
        params: { url: content },
        timeout: 90000,
        maxRedirects: 5
      });

      if (!res.data || typeof res.data !== "object") {
        throw new Error("Invalid API response");
      }

      const data = res.data;
      const platform = data.platform || "Unknown";

      const mediaURL =
        data.high_quality ||
        data.low_quality ||
        data.audio;

      const isAudio =
        !data.high_quality &&
        !data.low_quality &&
        !!data.audio;

      if (!mediaURL) {
        throw new Error(
          data.message || data.error || "Media not found"
        );
      }

      let parsedMediaURL;

      try {
        parsedMediaURL = new URL(mediaURL);
      } catch {
        throw new Error("Invalid media URL returned by API");
      }

      if (
        !["http:", "https:"].includes(parsedMediaURL.protocol)
      ) {
        throw new Error("Unsupported media URL protocol");
      }

      await fs.ensureDir(cacheDir);

      const extension = isAudio ? "mp3" : "mp4";

      filePath = path.join(
        cacheDir,
        `auto_media_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.${extension}`
      );

      const mediaResponse = await axios.get(mediaURL, {
        responseType: "arraybuffer",
        timeout: 60000,
        maxRedirects: 5,
        maxContentLength: 50 * 1024 * 1024
      });

      const buffer = Buffer.from(mediaResponse.data);

      if (!buffer.length) {
        throw new Error("Downloaded media is empty");
      }

      await fs.writeFile(filePath, buffer);

      const infoMsg =
        `${HEADER}` +
        `Platform : ${platform}\n` +
        `Status   : Success`;

      await message.reply({
        body: infoMsg,
        attachment: fs.createReadStream(filePath)
      });

      setReaction(api, "✅", event.messageID);
    } catch (err) {
      console.error(
        "[AutoDL2] Download error:",
        err.response?.data || err.message
      );

      setReaction(api, "❌", event.messageID);

      try {
        await message.reply(
          "❌ Download failed. The link may be unsupported, the API may be unavailable, or the media may be too large."
        );
      } catch (replyError) {
        console.error(
          "[AutoDL2] Error reply failed:",
          replyError.message
        );
      }
    } finally {
      if (filePath) {
        try {
          await fs.remove(filePath);
        } catch (cleanupError) {
          console.error(
            "[AutoDL2] File cleanup error:",
            cleanupError.message
          );
        }
      }
    }
  }
};
