const axios = require('axios');

module.exports = {
    config: {
        name: 'tempmail',
        aliases: ['temp', 'fakemail'],
        version: '3.0',
        author: '乛 SIYAM ゎ',
        prefix: true,
        description: 'Generate temporary email addresses',
        usages: '!tempmail <gen|inbox|new>',
        countDown: 5,
        role: 0,
        category: 'tools'
    },

    onStart: async function ({ message, event, args, api }) {
        try {
            const action = args[0]?.toLowerCase();

            if (!action || action === 'gen' || action === 'generate') {
                try {
                    const domainResponse = await axios.get('https://api.mail.tm/domains');
                    const domains = domainResponse.data['hydra:member'];
                    
                    if (domains.length === 0) {
                        throw new Error('No domains available');
                    }

                    const domain = domains[0].domain;
                    const randomString = Math.random().toString(36).substring(2, 10);
                    const email = `${randomString}@${domain}`;
                    const password = Math.random().toString(36).substring(2, 15);

                    await axios.post('https://api.mail.tm/accounts', {
                        address: email,
                        password: password
                    });

                    global.tempMailTokens = global.tempMailTokens || {};
                    global.tempMailTokens[event.senderID] = { email, password };

                    return message.reply(
                        `📧 Temporary Email Generated!\n\n` +
                        `Email: ${email}\n\n` +
                        `Commands:\n` +
                        `!tempmail inbox - Check inbox\n` +
                        `!tempmail new - Generate new email\n\n` +
                        `This email will expire after some time.`
                    );

                } catch (error) {
                    console.error('Mail.tm generation error:', error);
                    return message.reply('❌ Failed to generate temporary email. Please try again later.');
                }
            }

            if (action === 'new') {
                try {
                    const domainResponse = await axios.get('https://api.mail.tm/domains');
                    const domains = domainResponse.data['hydra:member'];
                    
                    if (domains.length === 0) {
                        throw new Error('No domains available');
                    }

                    const domain = domains[0].domain;
                    const randomString = Math.random().toString(36).substring(2, 10);
                    const email = `${randomString}@${domain}`;
                    const password = Math.random().toString(36).substring(2, 15);

                    await axios.post('https://api.mail.tm/accounts', {
                        address: email,
                        password: password
                    });

                    global.tempMailTokens = global.tempMailTokens || {};
                    global.tempMailTokens[event.senderID] = { email, password };

                    return message.reply(
                        `📧 New Temporary Email Generated!\n\n` +
                        `Email: ${email}\n\n` +
                        `Your previous email has been replaced.\n\n` +
                        `Commands:\n` +
                        `!tempmail inbox - Check inbox\n` +
                        `!tempmail new - Generate another new email\n\n` +
                        `This email will expire after some time.`
                    );

                } catch (error) {
                    console.error('Mail.tm new email error:', error);
                    return message.reply('❌ Failed to generate new email. Please try again later.');
                }
            }

            if (action === 'inbox' || action === 'check') {
                if (!global.tempMailTokens || !global.tempMailTokens[event.senderID]) {
                    return message.reply('Please generate a temp email first');
                }

                const mailData = global.tempMailTokens[event.senderID];
                const email = mailData.email;
                const password = mailData.password;

                message.reply(`Checking inbox for ${email}...`);

                try {
                    const authResponse = await axios.post('https://api.mail.tm/token', {
                        address: email,
                        password: password
                    });

                    const token = authResponse.data.token;

                    const inboxResponse = await axios.get('https://api.mail.tm/messages', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const messages = inboxResponse.data['hydra:member'];

                    if (messages.length === 0) {
                        return message.reply('📭 Inbox is empty. No messages found.');
                    }

                    let messageList = `📬 Inbox for ${email}\n\n`;
                    messageList += `Total Messages: ${messages.length}\n\n`;
                    
                    for (let i = 0; i < Math.min(5, messages.length); i++) {
                        const msg = messages[i];
                        messageList += `${i + 1}. From: ${msg.from.address}\n`;
                        messageList += `   Subject: ${msg.subject}\n`;
                        messageList += `   Date: ${new Date(msg.createdAt).toLocaleString()}\n\n`;
                    }

                    if (messages.length > 5) {
                        messageList += `... and ${messages.length - 5} more messages`;
                    }

                    return message.reply(messageList);

                } catch (inboxError) {
                    console.error('Inbox check error:', inboxError);
                    
                    if (inboxError.response && inboxError.response.status === 401) {
                        return message.reply('❌ Email has expired or credentials are invalid. Please generate a new email using: !tempmail new');
                    }
                    
                    return message.reply('❌ Failed to check inbox. Please try again later.');
                }
            }

            return message.reply(
                '!tempmail gen - Generate temp email\n' +
                '!tempmail inbox - Check inbox\n' +
                '!tempmail new - Create new email'
            );

        } catch (error) {
            console.error('TempMail error:', error);
            return message.reply('❌ Failed to process tempmail request. Please try again.');
        }
    }
};
