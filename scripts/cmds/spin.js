module.exports = {
 config: {
 name: "spin",
 version: "4.0",
 author: "xiyam",
 countDown: 5,
 role: 0,
 description: "Spin and win/loss money. Use '/spin <amount>' or '/spin top'.",
 category: "game",
 guide: {
 en: "{p}spin <amount>\n{p}spin top"
 }
 },

 onStart: async function ({ message, event, args, usersData }) {
 const senderID = event.senderID;
 const subCommand = args[0];

 // ✅ /spin top leaderboard
 if (subCommand === "top") {
 const allUsers = await usersData.getAll();

 const top = allUsers
 .filter(u => typeof u.data?.totalSpinWin === "number" && u.data.totalSpinWin > 0)
 .sort((a, b) => b.data.totalSpinWin - a.data.totalSpinWin)
 .slice(0, 10);

 if (top.length === 0) {
 return message.reply("❌ No spin winners yet.");
 }

 const result = top.map((user, i) => {
 const name = user.name || `User ${user.userID?.slice(-4) || "??"}`;
 return `${i + 1}. ${name} – 💸 ${user.data.totalSpinWin} coins`;
 }).join("\n");

 return message.reply(`🏆 Top Spin Winners:\n\n${result}`);
 }

 // ✅ /spin <amount>
 const betAmount = parseInt(subCommand);
 if (isNaN(betAmount) || betAmount <= 0) {
 return message.reply("❌ Usage:\n/spin <amount>\n/spin top");
 }

 const userData = await usersData.get(senderID) || {};
 userData.money = userData.money || 0;
 userData.data = userData.data || {};
 userData.data.totalSpinWin = userData.data.totalSpinWin || 0;

 if (userData.money < betAmount) {
 return message.reply(`❌ Not enough money.\n💰 Your balance: ${userData.money}`);
 }

 // Bet deduct
 userData.money -= betAmount;

 const outcomes = [
 { text: "💥 You lost everything!", multiplier: 0 },
 { text: "😞 You got back half.", multiplier: 0.5 },
 { text: "🟡 You broke even.", multiplier: 1 },
 { text: "🟢 You doubled your money!", multiplier: 2 },
 { text: "🔥 You tripled your bet!", multiplier: 3 },
 { text: "🎉 JACKPOT! 10x reward!", multiplier: 10 }
 ];

 const result = outcomes[Math.floor(Math.random() * outcomes.length)];
 const reward = Math.floor(betAmount * result.multiplier);
 userData.money += reward;

 if (reward > betAmount) {
 const profit = reward - betAmount;
 userData.data.totalSpinWin += profit;
 }

 await usersData.set(senderID, userData);

 return message.reply(
 `${result.text}\n🎰 You bet: ${betAmount}$\n💸 You won: ${reward}$\n💰 New balance: ${userData.money}$`
 );
 }
};
