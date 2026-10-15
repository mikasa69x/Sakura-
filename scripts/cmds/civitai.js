const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const getRandomElement = array => array[Math.floor(Math.random() * array.length)];

const getFileExtension = contentType => {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/bmp': 'png',
    'image/webp': 'png',
    'video/mp4': 'mp4',
    'video/webm': 'mp4',
    'video/quicktime': 'mp4',
  };
  return extensions[contentType] || 'unknown';
};

const getRandomCombinations = () => {
  const randPage = Math.floor(Math.random() * 31) + 1;
  const randSort = getRandomElement(['Newest', 'Most Reactions', 'Most Comments']);
  const randPeriod = getRandomElement(['AllTime', 'Year', 'Week', 'Day']);
  return { randPage, randSort, randPeriod };
};

module.exports = {
  config: {
    name: '4chan',
    aliases: ['4chan', 'civit.ai', 'random-nsfw'],
    version: '5.0.0',
    author: '乛 SIYAM ゎ',
    role: 2, 
    category: "ai-image",
    shortDescription: 'Get random uploaded content from civit.ai',
    guide: {
      en: "{pn} [count] | {pn} nsfw [count]"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;

    // Parse arguments safely without global variables
    let isNsfw = false;
    let count = 4; // Default count

    if (args.length > 0) {
      if (args[0].toLowerCase() === 'nsfw') {
        isNsfw = true;
        count = parseInt(args[1]) || 4;
      } else {
        count = parseInt(args[0]) || 4;
      }
    }

    const MAX_COUNT = 10;
    if (count <= 0 || count > MAX_COUNT) {
      return message.reply(`❌ Invalid count. Please provide a number between 1 and ${MAX_COUNT}.`);
    }

    api.setMessageReaction("⏳", messageID, threadID, () => {}, true);

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const downloadedFiles = [];
    const usedCombos = new Set();
    const baseUrl = 'https://civitai.com/api/v1/images';

    try {
      // Fetch data sequentially to ensure unique random pages, but we can do it fast
      for (let i = 0; i < count; i++) {
        let uniqueComboFound = false;
        let retries = 0;

        while (!uniqueComboFound && retries < 3) {
          const { randPage, randSort, randPeriod } = getRandomCombinations();
          const comboKey = `${randPage}_${randSort}_${randPeriod}`;

          if (!usedCombos.has(comboKey)) {
            usedCombos.add(comboKey);
            uniqueComboFound = true;

            try {
              const response = await axios.get(baseUrl, {
                params: {
                  page: randPage,
                  nsfw: isNsfw, // Civitai v1 API accepts boolean/string here
                  limit: 15,
                  sort: randSort,
                  period: randPeriod,
                },
                timeout: 10000
              });

              if (response.data?.items?.length > 0) {
                const randIndex = Math.floor(Math.random() * response.data.items.length);
                const mediaUrl = response.data.items[randIndex].url;

                // Download Phase
                const mediaRes = await axios.get(mediaUrl, { responseType: 'stream', timeout: 15000 });
                const contentType = mediaRes.headers['content-type'];
                const ext = getFileExtension(contentType);

                if (ext !== 'unknown') {
                  const filePath = path.join(cacheDir, `civitai_${Date.now()}_${senderID}_${i}.${ext}`);
                  const fileStream = fs.createWriteStream(filePath);
                  
                  mediaRes.data.pipe(fileStream);
                  
                  await new Promise((resolve, reject) => {
                    fileStream.on('finish', resolve);
                    fileStream.on('error', reject);
                  });

                  downloadedFiles.push(filePath);
                }
              }
            } catch (fetchErr) {
              console.error("[Civitai Fetch Error]:", fetchErr.message);
            }
          }
          retries++;
        }
      }

      if (downloadedFiles.length === 0) {
        api.setMessageReaction("❌", messageID, threadID, () => {}, true);
        return message.reply("💔 Could not find or download any media from Civit.ai. The API might be restricting access or timed out.");
      }

      // Group streams for sending
      const streams = downloadedFiles.map(filePath => fs.createReadStream(filePath));

      api.setMessageReaction("✅", messageID, threadID, () => {}, true);

      return message.reply({
        body: `🤤 𝐑𝐀𝐏𝐒𝐀 - ${isNsfw ? "NSFW Mode" : "SFW Mode"}\n📦 Extracted: ${downloadedFiles.length} items`,
        attachment: streams
      }, () => {
        // Secure Cleanup: Only delete the files THIS specific command execution created
        for (const file of downloadedFiles) {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        }
      });

    } catch (error) {
      console.error("[Civitai General Error]:", error);
      api.setMessageReaction("❌", messageID, threadID, () => {}, true);
      
      // Cleanup on failure
      for (const file of downloadedFiles) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
      
      return message.reply('❌ Server is down or encountered an error. Try again later!');
    }
  }
};
