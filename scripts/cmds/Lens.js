const encode = require("encodeurl");

module.exports.config = {
    name: "lens",
    version: "1.0",
    author: "RAFI",
    countDown: 5,
    role: 0,
    shortDescription: "Google Lens Search",
    longDescription: "Reply to an image to search on Google Lens.",
    category: "utility",
    guide: "{pn} (reply to an image)"
};

module.exports.onStart = async function ({ api, event, message }) {
    const { type, messageReply } = event;

    // Check if the user replied to a message
    if (type !== "message_reply") {
        return message.reply("❌ You must reply to an image.");
    }

    // Check if the replied message has an attachment
    if (!messageReply.attachments || messageReply.attachments.length === 0) {
        return message.reply("❌ The message has no image.");
    }

    // Check if the attachment is a photo
    if (messageReply.attachments[0].type !== "photo") {
        return message.reply("❌ Please reply to a valid image.");
    }

    try {
        const imageUrl = messageReply.attachments[0].url;
        const encodedUrl = encodeURIComponent(imageUrl);
        const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodedUrl}`;

        return message.reply({
            body: `🔍 **Google Lens Search**\n\n🔗 Link: ${lensUrl}\n\n(Click the link to view results)`
        });

    } catch (error) {
        console.error(error);
        return message.reply("❌ Error generating Google Lens link.");
    }
};
