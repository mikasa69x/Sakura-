const axios = require('axios');

module.exports = {
    config: {
        name: 'owner',
        version: '2.0',
        author: '乛 SIYAM ゎ',
        role: 0,
        countDown: 3,
        prefix: false,
        category: 'owner',
        description: 'Show bot Owner Information'
    },

    onStart: async function ({ api, message, args, event }) {

        const ownerInfo = `🎀 𝐎ᴡɴᴇʀ 𝐈ɴꜰᴏ ✨
❍ ɴᴀᴍᴇ : Sɪʏꫝᴍㅤ友
❍ ᴀɢᴇ : ᴘʀɪᴠᴀᴛᴇ 
❍ ꜰʀᴏᴍ : ʙᴀɴɢʟᴀᴅᴇꜱʜ  🇧🇩
❍ ᴄɪᴛʏ: ᴅʜᴀᴋᴀ 
❍ ᴀᴅᴅʀᴇꜱꜱ: ᴘʀɪᴠᴀᴛᴇ,
❍ ᴡᴏʀᴋ : ᴘʀɪᴠᴀᴛᴇ
❍ ᴄʟᴀꜱꜱ : ᴘʀɪᴠᴀᴛᴇ
❍ ʀᴇʟᴀᴛɪᴏɴꜱʜɪᴘ : ꜱɪɴɢʟᴇ
❍ ʀᴇʟɪɢɪᴏɴ : ɪꜱʟᴀᴍ
❍ ᴋᴀʟᴇᴍᴀ: لَا إِلٰهَ إِلَّا اللهُ مُحَمَّدٌ رَسُوْلُ اللهِ
❍ ʀᴏʟᴇ: ahem ahem 🌚🙏🏻

🎯 ᴅʀᴇᴀᴍ : ......👊🏻 
😺 ғᴀᴠ ᴘᴇʀꜱᴏɴ : ᴍʏ ᴍᴏᴛʜᴇʀ ✨
🌝 ᴄʀᴜꜱʜ : ɴᴇᴇᴅ 😗
🚫 ᴇx : 0 — ʙᴇᴄᴀᴜꜱᴇ ɴᴏ ᴏɴᴇ ᴅᴀʀᴇᴅ😴
😺 ᴛɪᴍᴇ ᴘᴀꜱꜱ : ᴡᴀᴛᴄʜɪɴɢ ᴀɴɪᴍᴇ→ʟɪꜱᴛᴇɴɪɴɢ ᴛᴏ ᴍᴜꜱɪᴄ→ɢᴀᴍɪɴɢ`;

        // Catbox Image Link (Ekhane tomar owner.jpg er link boshao)
        const catboxImage = "https://files.catbox.moe/r4idzp.jpg";

        try {
            await message.reply({
                body: ownerInfo,
                attachment: await global.utils.getStreamFromURL(catboxImage)
            });
        } catch (e) {
            // Image na pawa gele text only
            await message.reply(ownerInfo);
        }
    }
};
