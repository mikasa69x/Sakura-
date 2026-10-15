const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pair2",
    author: "乛 SIYAM ゎ",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderData = await usersData.get(event.senderID);
      const senderName = senderData.name;
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find((user) => user.id === event.senderID);
      let selectedMatch = null;

      // ─── Mention check ──────────────────────────────────────────────────
      const mentionIDs = Object.keys(event.mentions || {});

      if (mentionIDs.length > 0) {
        const mentionedID = mentionIDs[0];

        if (mentionedID === event.senderID) {
          return api.sendMessage(
            "💔 You cannot pair with yourself!",
            event.threadID,
            (err) => {},
            event.messageID
          );
        }

        const mentionedUser = users.find((u) => u.id === mentionedID);
        if (!mentionedUser) {
          return api.sendMessage(
            "⚠️ Mentioned user is not in this group.",
            event.threadID,
            (err) => {},
            event.messageID
          );
        }

        selectedMatch = mentionedUser;

      } else {
        // ─── No mention → Gender-based random match ─────────────────────
        if (!myData || !myData.gender) {
          return api.sendMessage(
            "⚠️ Could not determine your gender.",
            event.threadID,
            (err) => {},
            event.messageID
          );
        }

        const myGender = myData.gender.toUpperCase();
        let matchCandidates = [];

        if (myGender === "MALE") {
          matchCandidates = users.filter(
            (user) => user.gender === "FEMALE" && user.id !== event.senderID
          );
        } else if (myGender === "FEMALE") {
          matchCandidates = users.filter(
            (user) => user.gender === "MALE" && user.id !== event.senderID
          );
        } else {
          return api.sendMessage(
            "⚠️ Your gender is undefined. Cannot find a match.",
            event.threadID,
            (err) => {},
            event.messageID
          );
        }

        if (matchCandidates.length === 0) {
          return api.sendMessage(
            "❌ No suitable match found in the group.",
            event.threadID,
            (err) => {},
            event.messageID
          );
        }

        selectedMatch =
          matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      }

      const matchName = selectedMatch.name;

      // ─── Build Canvas ───────────────────────────────────────────────────
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await loadImage(
        "https://i.postimg.cc/pdv5dFVX/611905695-855684437229208-8377464727643815456-n.png"
      );
      ctx.drawImage(background, 0, 0, width, height);

      const sIdImage = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );
      const pairPersonImage = await loadImage(
        `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );

      function drawCircle(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(ctx, sIdImage, 385, 40, 170);
      drawCircle(ctx, pairPersonImage, width - 213, 190, 170);

      // ─── Save & Send ────────────────────────────────────────────────────
      const outputPath = path.join(__dirname, `pair2_${event.senderID}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;

        const message =
          `🥰𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗽𝗮𝗶𝗿𝗶𝗻𝗴\n` +
          `・${senderName} 🎀\n` +
          `・${matchName} 🎀\n` +
          `💌  A beautiful couple has been created!\n` +
          `💫 May your virtual love story begin!  💙 💙\n\n` +
          `𝗟𝗼𝘃𝗲 𝗣𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}% 💙`;

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
