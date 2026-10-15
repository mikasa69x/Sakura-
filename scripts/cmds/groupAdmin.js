module.exports = {
    config: {
        name: 'gcadmin',
        aliases: ['groupadmin'],
        version: '2.0',
        author: '乛 SIYAM ゎ',
        prefix: true,
        description: 'List of Group Admin',
        usages: '!gcadmin',
        countDown: 3,
        role: 0,
        category: 'box chat'
    },

onStart: async function ({ message, event, api }) {
    try {
const gc = await api.getThreadInfo(event.threadID)  
const admin = gc.adminIDs.length 
const rasin = gc.adminIDs
let list = ''
let arshi = 1
for (let i = 0; i < rasin.length; i++) {
    const info = (await api.getUserInfo(rasin[i].id))
    const name = info[rasin[i].id].name
    list += '' + `${arshi}` + '.' + name + '\n'
    arshi++
}

message.reply(`List Of Group Admins\n\n${list}`, event.threadID, event.messageID)
    } catch (error) {
        console.error('Error:', error)
        message.reply('An error occured while sending admin list')
    }

}
}
