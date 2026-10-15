const fs = require("fs-extra");
const path = require("path");

// নবীদের তালিকা (৫০ জন) - Roy Jackson-এর "Fifty Key Figures in Islam" বই অনুসারে [citation:1][citation:3][citation:10]
const nabiList = [
  { id: 1, name: "🌸 Prophet Muhammad (c. 570-632)", ar: "محمد", desc: "ইসলামের শেষ নবী, সমগ্র মানবজাতির জন্য রহমত হিসেবে প্রেরিত। কুরআন নাযিল হয় তাঁর উপর।" },
  { id: 2, name: "🤍 Abu Bakr (c.570-634)", ar: "أبو بكر", desc: "প্রথম খলিফা, রাসূলের ঘনিষ্ঠ বন্ধু ও শ্বশুর। ইসলামের প্রথম পুরুষ বিশ্বাসী।" },
  { id: 3, name: "💚 Umar ibn al-Khattab (c.581-644)", ar: "عمر بن الخطاب", desc: "দ্বিতীয় খলিফা, ন্যায়পরায়ণতার জন্য বিখ্যাত। তাঁর শাসনামলে ইসলাম ব্যাপকভাবে বিস্তার লাভ করে।" },
  { id: 4, name: "❤️ Ali ibn Abi Talib (c.596-661)", ar: "علي بن أبي طالب", desc: "চতুর্থ খলিফা, রাসূলের চাচাতো ভাই ও জামাতা। সুফিবাদের কেন্দ্রীয় ব্যক্তিত্ব।" },
  { id: 5, name: "👑 Mu'awiya (c.602-680)", ar: "معاوية", desc: "উমাইয়া খিলাফতের প্রতিষ্ঠাতা, প্রথম মুসলিম শাসক যিনি বংশানুক্রমিক শাসন চালু করেন।" },
  { id: 6, name: "📚 Abu Hanifa (c.699-767)", ar: "أبو حنيفة", desc: "হানাফি মাযহাবের প্রতিষ্ঠাতা, ফিকহশাস্ত্রের অন্যতম পথিকৃৎ।" },
  { id: 7, name: "🕊️ Malik ibn Anas (c.709-795)", ar: "مالك بن أنس", desc: "মালিকি মাযহাবের প্রতিষ্ঠাতা, 'মুয়াত্তা' নামক হাদিস গ্রন্থের সংকলক।" },
  { id: 8, name: "🌸 Rabi'a of Basra (c.717-801)", ar: "رابعة البصري", desc: "প্রখ্যাত মহিলা সুফি, ঈশ্বরের প্রতি বিশুদ্ধ ভালোবাসার জন্য বিখ্যাত।" },
  { id: 9, name: "📖 Muhammad al-Shafi'i (768-820)", ar: "محمد بن إدريس الشافعي", desc: "শাফেয়ি মাযহাবের প্রতিষ্ঠাতা, উসুলুল ফিকহ-এর জনক।" },
  { id: 10, name: "⚖️ Ahmad ibn Hanbal (780-855)", ar: "أحمد بن حنبل", desc: "হাম্বলি মাযহাবের প্রতিষ্ঠাতা, হাদিস সংকলনে অসামান্য অবদান।" },
  { id: 11, name: "🔬 Al-Ma'mun (786-833)", ar: "المأمون", desc: "আব্বাসীয় খলিফা, বাইতুল হিকমা প্রতিষ্ঠা করেন, বিজ্ঞান ও দর্শনের পৃষ্ঠপোষক।" },
  { id: 12, name: "🧠 Yaqub ibn Ishaq al-Kindi (c.801-873)", ar: "يعقوب بن إسحاق الكندي", desc: "আরব দর্শনের জনক, গ্রিক দর্শনকে ইসলামী চিন্তাধারায় সংযোজিত করেন।" },
  { id: 13, name: "🤔 Abu al-Hasan al-Ashari (837-935)", ar: "أبو الحسن الأشعري", desc: "আশআরি মতবাদের প্রতিষ্ঠাতা, কালামশাস্ত্রের অন্যতম ব্যক্তিত্ব।" },
  { id: 14, name: "📜 Muhammad al-Tabari (839-923)", ar: "محمد بن جرير الطبري", desc: "প্রখ্যাত ঐতিহাসিক ও তাফসিরকারক, 'তারিখ আল-রাসুল ওয়াল-মুলুক' গ্রন্থের রচয়িতা।" },
  { id: 15, name: "🌌 Abu Nasr al-Farabi (c.870-950)", ar: "أبو نصر الفارابي", desc: "প্রখ্যাত দার্শনিক, 'দ্বিতীয় শিক্ষক' নামে পরিচিত (প্রথম শিক্ষক এরিস্টটল)।" },
  { id: 16, name: "🏛️ Ubaydallah 'Al-Mahdi' (c.873-934)", ar: "عبيد الله المهدي", desc: "ফাতেমীয় খিলাফতের প্রতিষ্ঠাতা, শিয়া ইসমাইলি মতবাদের নেতা।" },
  { id: 17, name: "⚖️ Abu al-Hasan Ali al-Mawardi (972-1058)", ar: "أبو الحسن الماوردي", desc: "শাফেয়ি ফকিহ, 'আল-আহকাম আল-সুলতানিয়া' গ্রন্থের লেখক।" },
  { id: 18, name: "💊 Abu Ali ibn Sina (Avicenna) (980-1037)", ar: "أبو علي ابن سينا", desc: "বিশ্ববিখ্যাত চিকিৎসক ও দার্শনিক, 'আল-কানুন ফিত-তিব' গ্রন্থের রচয়িতা।" },
  { id: 19, name: "💫 Abu Hamid Muhammad al-Ghazali (1058-1111)", ar: "أبو حامد الغزالي", desc: "মহান সুফি দার্শনিক, 'ইহইয়া উলুম আল-দীন' গ্রন্থের লেখক।" },
  { id: 20, name: "📗 Mahmud ibn Umar al-Zamakhshari (1075-1144)", ar: "الزمخشري", desc: "মুতাজিলা পণ্ডিত, 'আল-কাশশাফ' তাফসিরের জন্য বিখ্যাত।" },
  { id: 21, name: "🧪 Abu al-Walid Muhammad ibn Rushd (Averroes) (1126-1198)", ar: "ابن رشد", desc: "আন্দালুসীয় দার্শনিক, এরিস্টটলের ভাষ্যকার, পাশ্চাত্যে 'আভেরোস' নামে পরিচিত।" },
  { id: 22, name: "⚔️ Salah al-Din (Saladin) (1138-1193)", ar: "صلاح الدين الأيوبي", desc: "আইয়ুবীয় সালতানাতের প্রতিষ্ঠাতা, ক্রুসেড থেকে জেরুজালেম পুনরুদ্ধার করেন।" },
  { id: 23, name: "💡 Yahya Suhrawardi (1154-1191)", ar: "يحيى السهروردي", desc: "ইশরাকি দর্শনের প্রতিষ্ঠাতা, 'আল-হিকমাত আল-ইশরাক' গ্রন্থের রচয়িতা।" },
  { id: 24, name: "🕯️ Ibn Arabi (1165-1240)", ar: "ابن عربي", desc: "মহান সুফি দার্শনিক, 'ওয়াহদাত আল-উজুদ' মতবাদের জন্য বিখ্যাত।" },
  { id: 25, name: "🔭 Nasir al-Din Tusi (1201-1274)", ar: "نصير الدين الطوسي", desc: "ফার্সি পলিম্যাথ, জ্যোতির্বিদ, জীববিজ্ঞানী ও দার্শনিক।" },
  { id: 26, name: "🥀 Jalal al-Din Rumi (1207-1273)", ar: "جلال الدين الرومي", desc: "মহান সুফি কবি, 'মাসনাভি' গ্রন্থের রচয়িতা।" },
  { id: 27, name: "🔥 Ibn Taymiyya (1263-1328)", ar: "ابن تيمية", desc: "হাম্বলি পণ্ডিত, ইসলামী সংস্কার আন্দোলনের প্রেরণা।" },
  { id: 28, name: "📊 Abd al-Rahman ibn Khaldun (1332-1406)", ar: "ابن خلدون", desc: "সমাজবিজ্ঞানের জনক, 'মুকাদ্দিমা' গ্রন্থের রচয়িতা।" },
  { id: 29, name: "📚 Al-Suyuti (1445-1505)", ar: "جلال الدين السيوطي", desc: "শাফেয়ি পণ্ডিত, তাফসির, হাদিস ও ইতিহাসের অসংখ্য গ্রন্থের লেখক।" },
  { id: 30, name: "🏹 Suleiman 'the Magnificent' (c.1494-1566)", ar: "سليمان القانوني", desc: "উসমানীয় খলিফা, উসমানীয় সাম্রাজ্যের স্বর্ণযুগের শাসক।" },
  { id: 31, name: "🐘 Akbar (1542-1605)", ar: "أكبر", desc: "মুঘল সম্রাট, ধর্মীয় সহিষ্ণুতা ও শিল্পের পৃষ্ঠপোষকতার জন্য বিখ্যাত।" },
  { id: 32, name: "🤲 Sadr al-Din Shirazi 'Mulla Sadra' (c.1572-1640)", ar: "صدر الدين الشيرازي", desc: "ইরানী দার্শনিক, 'আল-হিকমা আল-মুতাআলিয়া' মতবাদের প্রতিষ্ঠাতা।" },
  { id: 33, name: "🕯️ Shah Wali-Allah (1703-1762)", ar: "شاه ولي الله الدهلوي", desc: "ভারতীয় ইসলামী পণ্ডিত, কুরআনের ফার্সি অনুবাদক।" },
  { id: 34, name: "🛐 Muhammad ibn Abd al-Wahhab (1703-1792)", ar: "محمد بن عبد الوهاب", desc: "ওয়াহাবি আন্দোলনের প্রতিষ্ঠাতা, তাওহিদের পুনরুজ্জীবনকারী।" },
  { id: 35, name: "🏫 Sir Sayyid Ahmad Khan (1817-1898)", ar: "سيد أحمد خان", desc: "ভারতীয় মুসলিম সংস্কারক, আলিগড় মুসলিম বিশ্ববিদ্যালয়ের প্রতিষ্ঠাতা।" },
  { id: 36, name: "🌍 Sayyid Jamal al-Din 'Al-Afghani' (1838/9-1897)", ar: "جمال الدين الأفغاني", desc: "প্যান-ইসলামিজমের প্রবক্তা, মুসলিম জাগরণের অন্যতম পথিকৃৎ।" },
  { id: 37, name: "🕌 Muhammad Abduh (1849-1905)", ar: "محمد عبده", desc: "মিশরীয় সংস্কারক, আধুনিকতাবাদী ইসলামী চিন্তাধারার প্রবক্তা।" },
  { id: 38, name: "📖 Rashid Rida (1865-1935)", ar: "رشيد رضا", desc: "সিরীয়-মিশরীয় পণ্ডিত, 'আল-মানার' পত্রিকার সম্পাদক।" },
  { id: 39, name: "✍️ Sir Muhammad Iqbal (1873-1938)", ar: "محمد إقبال", desc: "উর্দু ও ফার্সি কবি, পাকিস্তান আন্দোলনের দার্শনিক।" },
  { id: 40, name: "🕋 Sayyid Ruhollah Khomeini (1902-1989)", ar: "روح الله الخميني", desc: "ইরানের ইসলামী বিপ্লবের নেতা, ইরানের সর্বোচ্চ নেতা।" },
  { id: 41, name: "📜 Sayyid Abul Ala Mawdudi (1903-1979)", ar: "أبو الأعلى المودودي", desc: "জামায়াতে ইসলামীর প্রতিষ্ঠাতা, আধুনিক ইসলামী রাষ্ট্রচিন্তার স্থপতি।" },
  { id: 42, name: "🤝 Hasan al-Bana (1906-1949)", ar: "حسن البنا", desc: "মুসলিম ব্রাদারহুডের প্রতিষ্ঠাতা, মিশরে ইসলামী জাগরণের নেতা।" },
  { id: 43, name: "⚡ Sayyid Qutb (1906-1966)", ar: "سيد قطب", desc: "মিশরীয় লেখক ও চিন্তাবিদ, আধুনিক ইসলামী আন্দোলনের তাত্ত্বিক।" },
  { id: 44, name: "🌅 Muhammad Taha (1908-1985)", ar: "محمد طه", desc: "সুদানী চিন্তাবিদ, 'রিপাবলিকান ব্রাদারহুড' আন্দোলনের প্রতিষ্ঠাতা।" },
  { id: 45, name: "✊ El-Hajj Malik El-Shabazz (Malcolm X) (1925-1965)", ar: "مالك شباز", desc: "আফ্রো-আমেরিকান মুসলিম নেতা, মানবাধিকার কর্মী।" },
  { id: 46, name: "📌 Hasan Al-Turabi (b. 1932)", ar: "حسن الترابي", desc: "সুদানী ইসলামী চিন্তাবিদ ও রাজনীতিবিদ।" },
  { id: 47, name: "🖋️ Ali Shariati (1933-1977)", ar: "علي شريعتي", desc: "ইরানী সমাজবিজ্ঞানী ও বিপ্লবী চিন্তাবিদ।" },
  { id: 48, name: "💭 Hasan Hanafi (b.1935)", ar: "حسن حنفي", desc: "মিশরীয় দার্শনিক, 'বামপন্থী ইসলাম' চিন্তার প্রবক্তা।" },
  { id: 49, name: "🗣️ Rachid Ghannoushi (b. 1941)", ar: "راشد الغنوشي", desc: "তিউনিসীয় ইসলামী চিন্তাবিদ, 'আল-নাহদা' আন্দোলনের নেতা।" },
  { id: 50, name: "🌐 Abd al-Karim Soroush (b.1945)", ar: "عبد الكريم سروش", desc: "ইরানী দার্শনিক, ধর্মীয় গণতন্ত্র ও ইসলামী আধুনিকতাবাদের প্রবক্তা।" }
];

// ডিটেইল স্টোরেজ ফাইল
const detailsFile = path.join(__dirname, "..", "..", "nabiDetails.json");

// ডিটেইল ডাটা লোড/সেভ ফাংশন
async function getNabiDetails() {
  try {
    if (fs.existsSync(detailsFile)) {
      return JSON.parse(fs.readFileSync(detailsFile, "utf8"));
    }
  } catch (e) {
    console.error("Error loading nabi details:", e);
  }
  return {};
}

async function saveNabiDetail(nabiId, detailText) {
  try {
    let details = await getNabiDetails();
    details[nabiId] = detailText;
    fs.writeFileSync(detailsFile, JSON.stringify(details, null, 2));
  } catch (e) {
    console.error("Error saving nabi detail:", e);
  }
}

module.exports = {
  config: {
    name: "nabi",
    version: "1.0",
    author: "Vydron1122",
    countDown: 5,
    role: 0,
    description: {
      en: "📖 ইসলামের শ্রেষ্ঠ ৫০ নবীর জীবনী (পেইজিনেশন সহ)"
    },
    category: "islam",
    guide: {
      en: "{pn} [page number] - দেখাবে ১০ জন নবীর নাম\n{pn} [নবী আইডি] - দেখাবে সেই নবীর বিস্তারিত জীবনী\n\nউদাহরণ:\n{pn} 1 - প্রথম পৃষ্ঠা\n{pn} 1 (রিপ্লাই) - প্রথম নবীর বিস্তারিত"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const { threadID, messageID, senderID } = event;

    if (!args[0]) {
      return message.reply("❌ ব্যবহার: ! religion[পৃষ্ঠা নম্বর] অথবা ! religion [নবী আইডি]\nযেমন: ! religion 1 (প্রথম পৃষ্ঠা দেখতে) অথবা ! religion 1 (রিপ্লাই করে)");
    }

    const input = parseInt(args[0]);
    if (isNaN(input) || input < 1) {
      return message.reply("❌ সঠিক নম্বর দিন (১ থেকে ৫০ এর মধ্যে)");
    }

    // ============ রিপ্লাই করে ডিটেইল দেখানো ============
    if (event.messageReply) {
      const nabiId = input;
      if (nabiId < 1 || nabiId > 50) {
        return message.reply("❌ ১ থেকে ৫০ এর মধ্যে নবী আইডি দিন");
      }

      const nabi = nabiList[nabiId - 1];

      // ডিটেইল লোড
      const details = await getNabiDetails();
      let detailText = details[nabiId];

      if (!detailText) {
        // ডিফল্ট ডিটেইল (যদি ইউজার এখনও না দেয়)
        detailText = `${nabi.name}\nআরবি নাম: ${nabi.ar}\n\n${nabi.desc}\n\n📌 বিস্তারিত জীবনী এখনও যোগ করা হয়নি। অ্যাডমিন শীঘ্রই যোগ করবেন ইনশাআল্লাহ।`;
      }

      // লম্বা টেক্সট পেইজিনেশন
      const lines = detailText.split('\n');
      const totalLines = lines.length;
      const linesPerPage = 15;
      const totalPages = Math.ceil(totalLines / linesPerPage);

      let currentPage = 1;
      let start = 0;
      let end = linesPerPage;

      const getPageText = (page) => {
        const s = (page - 1) * linesPerPage;
        const e = s + linesPerPage;
        return lines.slice(s, e).join('\n');
      };

      let msg = `📖 **${nabi.name}**\n━━━━━━━━━━━━━━━━\n`;
      msg += getPageText(currentPage);
      msg += `\n━━━━━━━━━━━━━━━━\n📄 পৃষ্ঠা ${currentPage}/${totalPages}\n\n`;
      msg += `🔁 পরবর্তী পৃষ্ঠা দেখতে এই মেসেজের রিপ্লাই দিন: +`;

      return message.reply(msg, (err, info) => {
        if (err) return;
        // পেজিনেশন লিসেনার
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "nabi",
          author: senderID,
          messageID: info.messageID,
          nabiId: nabiId,
          currentPage: currentPage,
          totalPages: totalPages,
          lines: lines
        });
      });
    }

    // ============ পৃষ্ঠা অনুযায়ী নবী লিস্ট দেখানো ============
    if (input <= 5) {
      const startIdx = (input - 1) * 10;
      const endIdx = startIdx + 10;
      const pageNabis = nabiList.slice(startIdx, endIdx);

      let msg = `╔══════════════╗\n`;
      msg += `     📖 **নবী লিস্ট** 📖\n`;
      msg += `╚══════════════╝\n\n`;
      msg += `━━━━━━━━━━━━━━━━\n`;

      pageNabis.forEach((nabi, index) => {
        const globalIndex = startIdx + index + 1;
        msg += `${globalIndex}. ${nabi.name}\n`;
      });

      msg += `━━━━━━━━━━━━━━━━\n`;
      msg += `📄 পৃষ্ঠা ${input}/৫\n`;
      msg += `━━━━━━━━━━━━━━━━\n`;
      msg += `🔍 বিস্তারিত পড়তে যেকোনো নাম্বারের রিপ্লাই দিন।\n`;
      msg += `💡 যেমন: ${pageNabis[0].name.split(' ')[1]} এর জীবনী পড়তে "!nabi ${startIdx + 1}" দিন।`;

      return message.reply(msg);
    }

    // ============ সরাসরি নবী আইডি দিয়ে ডিটেইল ============
    if (input >= 1 && input <= 50) {
      const nabi = nabiList[input - 1];

      const details = await getNabiDetails();
      let detailText = details[input];

      if (!detailText) {
        detailText = `${nabi.name}\nআরবি নাম: ${nabi.ar}\n\n${nabi.desc}\n\n📌 বিস্তারিত জীবনী এখনও যোগ করা হয়নি। অ্যাডমিন শীঘ্রই যোগ করবেন ইনশাআল্লাহ।`;
      }

      const lines = detailText.split('\n');
      const totalLines = lines.length;
      const linesPerPage = 15;
      const totalPages = Math.ceil(totalLines / linesPerPage);

      let currentPage = 1;
      let start = 0;
      let end = linesPerPage;

      const getPageText = (page) => {
        const s = (page - 1) * linesPerPage;
        const e = s + linesPerPage;
        return lines.slice(s, e).join('\n');
      };

      let msg = `📖 **${nabi.name}**\n━━━━━━━━━━━━━━━━\n`;
      msg += getPageText(currentPage);
      msg += `\n━━━━━━━━━━━━━━━━\n📄 পৃষ্ঠা ${currentPage}/${totalPages}\n\n`;
      msg += `🔁 পরবর্তী পৃষ্ঠা দেখতে এই মেসেজের রিপ্লাই দিন: +`;

      return message.reply(msg, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "nabi",
          author: senderID,
          messageID: info.messageID,
          nabiId: input,
          currentPage: currentPage,
          totalPages: totalPages,
          lines: lines
        });
      });
    }

    return message.reply("❌ সঠিক নম্বর দিন (১ থেকে ৫০ এর মধ্যে)");
  },

  onReply: async function ({ message, event, Reply, args, api }) {
    const { author, commandName, nabiId, currentPage, totalPages, lines } = Reply;
    const { senderID, threadID, messageID, body } = event;

    if (senderID !== author) return;

    if (body === "+" && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      const start = (nextPage - 1) * 15;
      const end = start + 15;

      const nabi = nabiList[nabiId - 1];

      let msg = `📖 **${nabi.name}**\n━━━━━━━━━━━━━━━━\n`;
      msg += lines.slice(start, end).join('\n');
      msg += `\n━━━━━━━━━━━━━━━━\n📄 পৃষ্ঠা ${nextPage}/${totalPages}\n\n`;

      if (nextPage < totalPages) {
        msg += `🔁 পরবর্তী পৃষ্ঠা দেখতে আবার রিপ্লাই দিন: +`;
      } else {
        msg += `🔚 শেষ পৃষ্ঠা`;
      }

      return api.sendMessage(msg, threadID, messageID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "nabi",
          author: senderID,
          messageID: info.messageID,
          nabiId: nabiId,
          currentPage: nextPage,
          totalPages: totalPages,
          lines: lines
        });
      });
    }

    if (body === "+" && currentPage >= totalPages) {
      return message.reply("🔚 আপনি শেষ পৃষ্ঠায় আছেন।");
    }
  }
};
