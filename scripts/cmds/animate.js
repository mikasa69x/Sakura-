const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

function generateRandomId(length = 16) {
  const chars = "abcdef0123456789";
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

async function getBalance() {
  try {
    const pack = generateRandomId();
    await axios.post("https://api.getglam.app/rewards/claim/hdnu30r7auc4kve", null, {
      headers: {
        "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)",
        "Accept-Encoding": "gzip",
        "glam-user-id": pack,
        user_id: pack,
        "glam-local-date": new Date().toISOString(),
      },
    });
    return pack;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

async function uploadFile(pack, stream, prompt, duration) {
  try {
    const form = new FormData();
    form.append("package_id", pack);
    form.append("media_file", stream);
    form.append("media_type", "image");
    form.append("template_id", "community_img2vid");
    form.append("template_category", "20_coins_dur");
    form.append(
      "frames",
      JSON.stringify([
        {
          prompt,
          custom_prompt: prompt,
          community_api_id: "34d2me5m9s7p8xw",
          additional_data: {
            prompt,
            custom_prompt: prompt,
            community_api_id: "34d2me5m9s7p8xw",
          },
          start: 0,
          end: 0,
          timings_units: "frames",
          media_type: "image",
          style_id: "chained_falai_img2video",
          rate_modifiers: { duration: duration.toString() + "s" },
          additional_styles: [],
          person_info: {},
        },
      ])
    );
    const response = await axios.post(
      "https://android.getglam.app/v2/magic_video",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)",
          "Accept-Encoding": "gzip",
          "glam-user-id": pack,
          user_id: pack,
          "glam-local-date": new Date().toISOString(),
          "glam-experiment-id": "android_is_free",
        },
      }
    );
    return response.data.event_id;
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

async function getStatus(taskID, pack) {
  try {
    while (true) {
      const response = await axios.get(
        "https://android.getglam.app/v2/magic_video",
        {
          params: {
            package_id: pack,
            event_id: taskID,
          },
          headers: {
            "User-Agent": "Glam/1.58.4 Android/32 (Samsung SM-A156E)",
            "Accept-Encoding": "gzip",
            "glam-user-id": pack,
            user_id: pack,
            "glam-local-date": new Date().toISOString(),
            "glam-experiment-id": "no_android_is_free",
          },
        }
      );
      if (response.data.status == "READY") return [response.data];
      await new Promise((res) => setTimeout(res, 2000));
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

async function imgToVideo(prompt, url, duration = 5) {
  const pack = await getBalance();
  const task = await uploadFile(
    pack,
    (await axios.get(url, { responseType: "stream" })).data,
    prompt,
    duration
  );
  return await getStatus(task, pack);
}

module.exports = {
  config: {
    name: "animate",
    aliases: ["i2v"],
    version: "3.1",
    author: "乛 SIYAM ゎ",
    countDown: 60,
    role: 0,
    shortDescription: "Animate a photo",
    longDescription: "Reply to an image with",
    category: "ai-image",
    guide: { en: "{pn} <prompt> (reply to an image or add | <url> at the end)" },
  },

  onStart: async function ({ api, event, args }) {
    try {
      let prompt = args.join(" ").trim();
      if (!prompt) {
        return api.setMessageReaction("❌", event.messageID, () => {}, true);
      }

      let imageUrl;
      let duration = 5;

      if (event.type === "message_reply" && event.messageReply.attachments.length > 0) {
        const attachment = event.messageReply.attachments[0];
        if (attachment.type === "photo") {
          imageUrl = attachment.url;
        }
      }

      if (prompt.includes("|")) {
        const split = prompt.split("|").map((s) => s.trim());
        prompt = split[0];
        if (split[1].match(/^https?:\/\//)) {
          imageUrl = split[1];
          if (split[2]) duration = parseInt(split[2]) || 5;
        } else {
          duration = parseInt(split[1]) || 5;
        }
      }

      if (!imageUrl) {
        return api.setMessageReaction("❌", event.messageID, () => {}, true);
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const res = await imgToVideo(prompt, imageUrl, duration);

      if (res && res[0] && res[0].video_url) {
        const videoUrl = res[0].video_url;
        const tempPath = path.join(__dirname, "animated.mp4");
        const writer = fs.createWriteStream(tempPath);
        const response = await axios.get(videoUrl, { responseType: "stream" });
        response.data.pipe(writer);
        writer.on("finish", () => {
          api.sendMessage(
            { attachment: fs.createReadStream(tempPath) },
            event.threadID,
            () => {
              fs.unlinkSync(tempPath);
              api.setMessageReaction("🌸", event.messageID, () => {}, true);
            },
            event.messageID
          );
        });
        writer.on("error", () => {
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        });
      } else {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      }
    } catch (e) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },
};
