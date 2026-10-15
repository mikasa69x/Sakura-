const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
const { shortenURL, randomString } = global.utils;

async function cosplayVideo(api, event, args, message) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);
    
    try {
        const owner = 'ajirodesu';
        const repo = 'cosplay';
        const branch = 'main';

        const repoUrl = `https://github.com/${owner}/${repo}/tree/${branch}/`;
        const response = await axios.get(repoUrl);
        const html = response.data;

        const videoFileRegex = /href="\/ajirodesu\/cosplay\/blob\/main\/([^"]+\.mp4)"/g;
        const videoFiles = [];
        let match;

        while ((match = videoFileRegex.exec(html)) !== null) {
            videoFiles.push(match[1]);
        }

        if (videoFiles.length === 0) {
            message.reply("No videos found in the repository.");
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return;
        }

        const randomVideo = videoFiles[Math.floor(Math.random() * videoFiles.length)];
        const videoUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${randomVideo}`;

        const videoId = randomString(10);
        const videoPath = path.join(__dirname, "cache", `${videoId}.mp4`);

        const writer = fs.createWriteStream(videoPath);
        const videoResponse = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        videoResponse.data.pipe(writer);

        writer.on('finish', () => {
            const videoStream = fs.createReadStream(videoPath);
            message.reply({ 
                body: `🎭 Random Cosplay Video\n📹 ${randomVideo}`, 
                attachment: videoStream 
            });
            api.setMessageReaction("✅", event.messageID, () => {}, true);
            
            setTimeout(() => {
                fs.unlink(videoPath, (err) => {
                    if (err) console.error("Error deleting cache file:", err);
                });
            }, 5000);
        });

        writer.on('error', (error) => {
            console.error("Download error:", error);
            message.reply("Error downloading the video. Please try again.");
            api.setMessageReaction("❌", event.messageID, () => {}, true);
        });

    } catch (error) {
        console.error("Error fetching cosplay video:", error);
        message.reply("Failed to fetch video. Please try again later.");
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

module.exports = {
    config: {
        name: "cosplay",
        version: "1.0",
        author: "乛 SIYAM ゎ",
        countDown: 5,
        role: 0,
        shortDescription: "Get random cosplay video",
        longDescription: "Get a random cosplay video from the repository",
        category: "fun",
        guide: "{p}cosplay"
    },
    onStart: function ({ api, event, args, message }) {
        return cosplayVideo(api, event, args, message);
    }
};
