const axios = require("axios");

module.exports = {
  config: {
    name: "slot",
    aliases: ["slots"],
    version: "3.0",
    author: "xiyam",
    countDown: 10,
    role: 0,
    category: "game",
    description: "Premium Slot Machine",
    guide: {
        en: "{pn} <amount> (Example: {pn} 5k)"
    }
  },

  onStart: async function ({ event, api, usersData, args }) {
    const { threadID, messageID, senderID } = event;

    // Stylish Font Converter
    const stylize = (text) => {
      const map = {
        "a": "𝖺", "b": "𝖻", "c": "𝖼", "d": "𝖽", "e": "𝖾", "f": "𝖿", "g": "𝗀", "h": "𝗁", "i": "𝗂", "j": "𝗃", "k": "𝗄", "l": "𝗅", "m": "𝗆", 
        "n": "𝗇", "o": "𝗈", "p": "𝗉", "q": "𝗊", "r": "𝗋", "s": "𝗌", "t": "𝗍", "u": "𝗎", "v": "𝗏", "w": "𝗐", "x": "𝗑", "y": "𝗒", "z": "𝗓",
        "A": "𝖠", "B": "𝖡", "C": "𝖢", "D": "𝖣", "E": "𝖤", "F": "𝖥", "G": "𝖦", "H": "𝖧", "I": "𝖨", "J": "𝖩", "K": "𝖪", "L": "𝖫", "M": "𝖬", 
        "N": "𝖭", "O": "𝖮", "P": "𝖯", "Q": "𝖰", "R": "𝖱", "S": "𝖲", "T": "𝖳", "U": "𝖴", "V": "𝖵", "W": "𝖶", "X": "𝖷", "Y": "𝖸", "Z": "𝖹",
        "0": "０", "1": "１", "2": "２", "3": "３", "4": "４", "5": "５", "6": "６", "7": "７", "8": "８", "9": "９", "-": "－", "+": "＋", "$": "💸"
      };
      return text.toString().split('').map(char => map[char] || char).join('');
    };

    // Amount Parser (Supports 1k, 1.5m, 2b)
    const parseAmount = (input) => {
      if (!input) return NaN;
      const match = input.toLowerCase().match(/^(\d+(\.\d+)?)([kmb]?)$/);
      if (!match) return parseFloat(input);
      let num = parseFloat(match[1]);
      const suffix = match[3];
      if (suffix === 'k') num *= 1000;
      if (suffix === 'm') num *= 1000000;
      if (suffix === 'b') num *= 1000000000;
      return num;
    };

    const bet = parseAmount(args[0]);
    const userData = await usersData.get(senderID);
    const money = userData.money;

    if (isNaN(bet) || bet < 100) {
      return api.sendMessage(`｢ 𝖤𝖱𝖱𝖮𝖱 ｣\n${stylize("Minimum bet is 100$. Usage: slot 1k")}`, threadID, messageID);
    }

    if (money < bet) {
      return api.sendMessage(`｢ 𝖫𝖮𝖶 𝖢𝖠𝖲𝖧 ｣\n${stylize("Balance: " + money.toLocaleString() + "$")}`, threadID, messageID);
    }

    // Processing
    await usersData.set(senderID, { money: money - bet });
    const symbols = ["💎", "💰", "🔥", "🎰", "⭐", "🍀"];
    
    // Logic Calculation
    const rand = Math.random();
    let slotResult;
    if (rand < 0.10) { // 10% Jackpot
        const sym = symbols[Math.floor(Math.random() * symbols.length)];
        slotResult = [sym, sym, sym];
    } else if (rand < 0.40) { // 30% Double
        const sym = symbols[Math.floor(Math.random() * symbols.length)];
        const other = symbols.filter(s => s !== sym)[Math.floor(Math.random() * 5)];
        slotResult = [sym, sym, other].sort(() => Math.random() - 0.5);
    } else { // 60% Loss
        slotResult = symbols.sort(() => Math.random() - 0.5).slice(0, 3);
    }

    const isTriple = slotResult[0] === slotResult[1] && slotResult[1] === slotResult[2];
    const isDouble = !isTriple && (slotResult[0] === slotResult[1] || slotResult[1] === slotResult[2] || slotResult[0] === slotResult[2]);

    let winAmount = 0;
    let status = stylize("LOST");
    if (isTriple) { winAmount = bet * 10; status = stylize("JACKPOT"); }
    else if (isDouble) { winAmount = bet * 2; status = stylize("WINNER"); }

    const finalMoney = (money - bet) + winAmount;
    await usersData.set(senderID, { money: finalMoney });

    // Animation Frames
    const msg = await api.sendMessage("🥏 𝖢𝖮𝖭𝖭𝖤𝖢𝖳𝖨𝖭𝖦 𝖳𝖮 𝖢𝖠𝖲𝖨𝖭𝖮...", threadID);

    const animation = [
        ["🔄", "🔄", "🔄"],
        [symbols[0], symbols[2], symbols[4]],
        [symbols[1], symbols[1], symbols[3]],
        slotResult
    ];

    for (let i = 0; i < animation.length; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const isLast = i === animation.length - 1;
        
        const ui = 
            `╔══════════════════╗\n` +
            `         ⚡  𝖲𝖫𝖮𝖳 GAME ⚡        \n` +
            `╚══════════════════╝\n\n` +
            `      | ${animation[i][0]} | ${animation[i][1]} | ${animation[i][2]} |      \n\n` +
            `  ${isLast ? `✨ 𝖱𝖤𝖲𝖴𝖫𝖳: ${status}` : "  🎰 𝖲𝖯𝖨𝖭𝖭𝖨𝖭𝖦..."}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `💸 ${stylize("𝖡𝖤𝖳")}: ${stylize(bet.toLocaleString())}$\n` +
            `🎁 ${stylize("𝖶𝖨𝖭")}: ${stylize(winAmount.toLocaleString())}$\n` +
            `💳 ${stylize("𝖡𝖠𝖫")}: ${stylize(finalMoney.toLocaleString())}$\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `         [ 𝖦𝖠𝖬𝖤  𝖤𝖭𝖣 ]    `;

        await api.editMessage(ui, msg.messageID);
    }
  }
};
