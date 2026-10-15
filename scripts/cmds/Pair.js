const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    author: "乛 SIYAM ゎ",
    category: "love",
  },

  onStart: async function ({ api, event, usersData, args }) {
    try {
      const senderData = await usersData.get(event.senderID);
      const senderName = senderData.name;
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      // ─── Check for mention ───────────────────────────────────────────────
      const mentionIDs = Object.keys(event.mentions || {});
      let selectedMatch = null;
      let matchName = "";

      if (mentionIDs.length > 0) {
        // Use the first mentioned person
        const mentionedID = mentionIDs[0];

        if (mentionedID === event.senderID) {
          return api.sendMessage(
            "💔 You cannot pair with yourself!",
            event.threadID,
            event.messageID
          );
        }

        const mentionedUser = users.find((u) => u.id === mentionedID);
        if (!mentionedUser) {
          return api.sendMessage(
            "⚠️ Mentioned user is not in this group.",
            event.threadID,
            event.messageID
          );
        }

        selectedMatch = mentionedUser;
        matchName =
          event.mentions[mentionedID] ||
          mentionedUser.name ||
          "Unknown";

      } else {
        // ─── No mention → Gender-based random match ──────────────────────
        const myData = users.find((user) => user.id === event.senderID);

        if (!myData || !myData.gender) {
          return api.sendMessage(
            "⚠️ Could not determine your gender.\nTry mentioning someone instead.",
            event.threadID,
            event.messageID
          );
        }

        const myGender = myData.gender;
        let matchCandidates = [];

        if (myGender === "MALE") {
          matchCandidates = users.filter(
            (user) =>
              user.gender === "FEMALE" && user.id !== event.senderID
          );
        } else if (myGender === "FEMALE") {
          matchCandidates = users.filter(
            (user) =>
              user.gender === "MALE" && user.id !== event.senderID
          );
        } else {
          return api.sendMessage(
            "⚠️ Your gender is undefined. Try mentioning someone instead.",
            event.threadID,
            event.messageID
          );
        }

        if (matchCandidates.length === 0) {
          return api.sendMessage(
            "❌ No suitable match found in this group.",
            event.threadID,
            event.messageID
          );
        }

        selectedMatch =
          matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
        matchName = selectedMatch.name;
      }

      // ─── Build Canvas ─────────────────────────────────────────────────────
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const backgrounds = [
        "https://i.imgur.com/OntEBiq.png",
        "https://i.imgur.com/IYCoZgc.jpeg",
        "https://i.imgur.com/753i3RF.jpeg",
      ];
      const randomBgUrl =
        backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const background = await loadImage(randomBgUrl);
      const sIdImage = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );
      const pairPersonImage = await loadImage(
        `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );

      ctx.drawImage(background, 0, 0, width, height);
      ctx.drawImage(sIdImage, 385, 40, 170, 170);
      ctx.drawImage(pairPersonImage, width - 213, 190, 180, 170);

      // ─── Save & Send ──────────────────────────────────────────────────────
      const outputPath = path.join(__dirname, `pair_${event.senderID}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;

        const message =
          `✨𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗽𝗮𝗶𝗿𝗶𝗻𝗴\n` +
          `・${senderName} 🎀\n` +
          `・${matchName} 🎀\n` +
          `💌𝗪𝗶𝘀𝗵 𝘆𝗼𝘂 𝘁𝘄𝗼 𝗵𝘂𝗻𝗱𝗿𝗲𝗱 𝘆𝗲𝗮𝗿𝘀 𝗼𝗳 𝗵𝗮𝗽𝗽𝗶𝗻𝗲𝘀𝘀 🌸🦋\n\n` +
          `𝗟𝗼𝘃𝗲 𝗽𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}% 💙`;

        api.sendMessage(
          {
            body: message,
            attachment: fs.createReadStream(outputPath),
          },
          event.threadID,
          () => {
            fs.unlinkSync(outputPath);
          },
          event.messageID
        );
      });

      out.on("error", (err) => {
        api.sendMessage(
          "❌ Failed to save the image.\n" + err.message,
          event.threadID,
          event.messageID
        );
      });

    } catch (error) {
      api.sendMessage(
        "❌ An error occurred while trying to find a match.\n" + error.message,
        event.threadID,
        event.messageID
      );
    }
  },
};
