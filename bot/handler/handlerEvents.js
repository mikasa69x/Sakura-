const fs = require("fs-extra");

/* ------------------------------------------------------------------ */
/*                              ROLES                                 */
/* ------------------------------------------------------------------ */
// Priority: Developer (4) > Bot Admin (2) > Premium (3) > Group Admin (1) > Normal (0)
function getRole(threadData, senderID) {
    if (!senderID)
        return 0;

    const config = global.GoatBot.config;
    const id = senderID.toString();
    const adminBox = threadData?.adminIDs || [];
    const isGroupAdmin = () => adminBox.map(String).includes(id);

    if ((config.devUsers || []).includes(id))
        return 4;
    if ((config.adminBot || []).includes(id))
        return 2;

    if ((config.premiumUsers || []).includes(id)) {
        const userData = global.db.allUserData.find(u => u.userID == senderID);
        const expireTime = userData?.data?.premiumExpireTime;
        if (expireTime && expireTime < Date.now()) {
            const expired = global.temp.expiredPremiumUsers = global.temp.expiredPremiumUsers || [];
            if (!expired.includes(senderID)) {
                expired.push(senderID);
                const queue = global.GoatBot._expiredPremiumNotifyQueue = global.GoatBot._expiredPremiumNotifyQueue || [];
                queue.push(senderID);
            }
            return isGroupAdmin() ? 1 : 0;
        }
        return 3;
    }

    return isGroupAdmin() ? 1 : 0;
}

// Role permission matrix:
//   Role 0 - Normal user   : needRole === 0
//   Role 1 - Group Admin   : needRole <= 1
//   Role 2 - Bot Admin     : ALL commands
//   Role 3 - Premium       : needRole === 0 OR needRole === 3 ONLY
//   Role 4 - Bot Developer : ALL commands
function canUseCommand(userRole, needRole) {
    if (userRole === 4 || userRole === 2)
        return true;
    if (userRole === 3)
        return needRole === 0 || needRole === 3;
    return needRole <= userRole;
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
    const role = command.config.role;
    let roleConfig;

    if (utils.isNumber(role))
        roleConfig = { onStart: role };
    else if (role && typeof role === "object" && !Array.isArray(role))
        roleConfig = { ...role, onStart: role.onStart ?? 0 }; // copy: never mutate the command config
    else
        roleConfig = { onStart: 0 };

    if (isGroup)
        roleConfig.onStart = threadData?.data?.setRole?.[commandName] ?? roleConfig.onStart;

    for (const key of ["onChat", "onReaction", "onReply"]) {
        if (roleConfig[key] == undefined)
            roleConfig[key] = roleConfig.onStart;
    }

    return roleConfig;
}

/* ------------------------------------------------------------------ */
/*                              HELPERS                               */
/* ------------------------------------------------------------------ */
function getText(type, reason, time, targetID, lang) {
    const utils = global.utils;
    const head = { lang, head: "handlerEvents" };
    switch (type) {
        case "userBanned": return utils.getText(head, "userBanned", reason, time, targetID);
        case "threadBanned": return utils.getText(head, "threadBanned", reason, time, targetID);
        case "onlyAdminBox": return utils.getText(head, "onlyAdminBox");
        case "onlyAdminBot": return utils.getText(head, "onlyAdminBot");
    }
}

function replaceShortcutInLang(text, prefix, commandName) {
    return text
        .replace(/\{(?:p|prefix)\}/g, prefix)
        .replace(/\{(?:n|name)\}/g, commandName)
        .replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
    const config = global.GoatBot.config;
    const adminBot = config.adminBot || [];
    const hideNotiMessage = config.hideNotiMessage || {};

    if (userData?.banned?.status == true) {
        const { reason, date } = userData.banned;
        if (hideNotiMessage.userBanned == false)
            message.reply(getText("userBanned", reason, date, senderID, lang));
        return true;
    }

    if (
        config.adminOnly?.enable == true
        && !adminBot.includes(senderID.toString())
        && !(config.adminOnly.ignoreCommand || []).includes(commandName)
    ) {
        if (hideNotiMessage.adminOnly == false)
            message.reply(getText("onlyAdminBot", null, null, null, lang));
        return true;
    }

    if (isGroup == true && threadData) {
        if (
            threadData.data.onlyAdminBox === true
            && !(threadData.adminIDs || []).map(String).includes(senderID.toString())
            && !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
        ) {
            if (!threadData.data.hideNotiMessageOnlyAdminBox)
                message.reply(getText("onlyAdminBox", null, null, null, lang));
            return true;
        }

        if (threadData.banned?.status == true) {
            const { reason, date } = threadData.banned;
            if (hideNotiMessage.threadBanned == false)
                message.reply(getText("threadBanned", reason, date, threadID, lang));
            return true;
        }
    }
    return false;
}

/* ———— ANALYTICS BUFFER ———— */
// Counts in memory, flushes to DB at most once every 30s.
const analyticsBuffer = {};
let analyticsTimer = null;
function bufferAnalytics(globalData, commandName) {
    analyticsBuffer[commandName] = (analyticsBuffer[commandName] || 0) + 1;
    if (analyticsTimer)
        return;
    analyticsTimer = setTimeout(async () => {
        analyticsTimer = null;
        const pending = { ...analyticsBuffer };
        for (const k in analyticsBuffer)
            delete analyticsBuffer[k];
        try {
            const analytics = await globalData.get("analytics", "data", {});
            for (const [name, count] of Object.entries(pending))
                analytics[name] = (analytics[name] || 0) + count;
            await globalData.set("analytics", analytics, "data");
        } catch (_) { }
    }, 30000);
    if (analyticsTimer.unref)
        analyticsTimer.unref();
}

/* ———— LANGUAGE FILE CACHE ———— */
const customLangCache = new Map();
function loadCustomLangFile(pathCustomLang) {
    if (!customLangCache.has(pathCustomLang))
        customLangCache.set(pathCustomLang, fs.existsSync(pathCustomLang) ? require(pathCustomLang) : null);
    return customLangCache.get(pathCustomLang);
}

function createGetText2(langCode, pathCustomLang, prefix, command) {
    const commandType = command.config.countDown ? "command" : "command event";
    const commandName = command.config.name;
    const customLangFile = loadCustomLangFile(pathCustomLang);
    const customLang = customLangFile?.[commandName]?.text || {};

    if (!command.langs && Object.keys(customLang).length === 0)
        return () => { };

    return function getText2(key, ...args) {
        let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
        lang = replaceShortcutInLang(lang, prefix, commandName);
        for (let i = args.length - 1; i >= 0; i--)
            lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
        return lang || `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
    };
}

/* ———— COMMAND SUGGESTION (edit distance) ———— */
function editDistance(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 3)
        return 99;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        }
        prev = cur;
    }
    return prev[n];
}

function getCachedCommandNames() {
    const { GoatBot } = global;
    const cmdCount = GoatBot.commands.size;
    const aliasCount = GoatBot.aliases.size;
    let cache = GoatBot._cmdNameCache;
    if (!cache || cache.cmdCount !== cmdCount || cache.aliasCount !== aliasCount) {
        const list = [...GoatBot.commands.keys(), ...GoatBot.aliases.keys()];
        cache = GoatBot._cmdNameCache = { list, lower: list.map(s => s.toLowerCase()), cmdCount, aliasCount };
    }
    return cache;
}

function getSuggestions(input) {
    const { list, lower } = getCachedCommandNames();
    input = input.toLowerCase();
    const scored = [];
    for (let i = 0; i < lower.length; i++) {
        const name = lower[i];
        let score;
        if (name === input) score = 0;
        else if (name.startsWith(input) || input.startsWith(name)) score = 1;
        else if (Math.abs(name.length - input.length) <= 3) {
            const d = editDistance(input, name);
            if (d > 3) continue;
            score = d + 1;
        } else continue;
        scored.push({ name: list[i], score });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.map(s => s.name);
}

/* ———— THREAD INFO CACHE (for @tag resolving) ———— */
const threadInfoCache = new Map();
const THREAD_INFO_TTL = 2 * 60 * 1000;
async function getThreadInfoCached(api, threadID) {
    const now = Date.now();
    const cached = threadInfoCache.get(threadID);
    if (cached && now - cached.t < THREAD_INFO_TTL)
        return cached.info;
    const info = await api.getThreadInfo(threadID);
    if (threadInfoCache.size > 200)
        threadInfoCache.delete(threadInfoCache.keys().next().value);
    threadInfoCache.set(threadID, { t: now, info });
    return info;
}

/* ———— TYP / PRESENCE / READ RECEIPT HANDLER CACHE ———— */
// Only loops over commands that actually define the handler.
// After reloading/loading/unloading a command, run: global.GoatBot._evtCache = {}
function getHandlerKeys(method) {
    const { GoatBot } = global;
    const cache = GoatBot._evtCache = GoatBot._evtCache || {};
    const size = GoatBot.commands.size;
    if (!cache[method] || cache[method].size !== size) {
        const keys = [];
        for (const [key, cmd] of GoatBot.commands)
            if (typeof cmd[method] === "function")
                keys.push(key);
        cache[method] = { size, keys };
    }
    return cache[method].keys;
}

/* ------------------------------------------------------------------ */
/*                               MAIN                                 */
/* ------------------------------------------------------------------ */
module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
    return async function (event, message) {

        const { utils, client, GoatBot } = global;
        const { getPrefix, removeHomeDir, log, getTime } = utils;
        const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
        const { autoRefreshThreadInfoFirstTime } = config.database;
        let { hideNotiMessage = {} } = config;

        const { body, messageID, threadID, isGroup } = event;

        if (!threadID)
            return;

        const senderID = event.userID || event.senderID || event.author;

        let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
        let userData = global.db.allUserData.find(u => u.userID == senderID);

        if (!userData && !isNaN(senderID))
            userData = await usersData.create(senderID);

        if (!threadData && !isNaN(threadID)) {
            if (global.temp.createThreadDataError.includes(threadID))
                return;
            threadData = await threadsData.create(threadID);
            global.db.receivedTheFirstMessage[threadID] = true;
        } else if (autoRefreshThreadInfoFirstTime === true && !global.db.receivedTheFirstMessage[threadID]) {
            global.db.receivedTheFirstMessage[threadID] = true;
            await threadsData.refreshInfo(threadID);
        }

        if (!threadData)
            return;

        if (typeof threadData.settings?.hideNotiMessage == "object")
            hideNotiMessage = threadData.settings.hideNotiMessage;

        const prefix = getPrefix(threadID);
        const role = getRole(threadData, senderID);
        const parameters = {
            api, usersData, threadsData, message, event,
            userModel, threadModel, prefix, dashBoardModel,
            globalModel, dashBoardData, globalData, envCommands,
            envEvents, envGlobal, role
        };
        const langCode = threadData.data.lang || config.language || "en";
        const handlerHead = { lang: langCode, head: "handlerEvents" };

        /* ———— small local helpers ———— */
        const t = (key, ...args) => utils.getText(handlerHead, key, ...args);

        const errorText = (key, commandName, err) => t(
            key,
            getTime("DD/MM/YYYY HH:mm:ss"), // computed only when an error happens
            commandName,
            removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))
        );

        // getLang is only built if the command really calls it
        const lazyLang = (type, command) => {
            let fn;
            return (...a) => (fn ||= createGetText2(langCode, `${process.cwd()}/languages/${type}/${langCode}.js`, prefix, command))(...a);
        };

        function createMessageSyntaxError(commandName) {
            message.SyntaxError = () => message.reply(t("commandSyntaxError", prefix, commandName));
        }

        function replyMention(text) {
            const userName = userData?.name || "ᴜꜱᴇʀ";
            const greeting = `ʜᴇʏ ${userName}`;
            return message.reply({
                body: `${greeting}, ${text}`,
                mentions: [{ tag: userName, id: senderID, fromIndex: greeting.indexOf(userName) }]
            });
        }

        function replyLord(text) {
            const userName = userData?.name || "ᴜꜱᴇʀ";
            const greeting = `ᴏʜ ɪᴛ'ꜱ ʏᴏᴜ  ─⃝‌‌愛🩶 ${userName} ᴍʏ ᴍᴏɴᴀʀᴄʜ`;
            return message.reply({
                body: `${greeting}, ${text}`,
                mentions: [{ tag: userName, id: senderID, fromIndex: greeting.indexOf(userName) }]
            });
        }

        function getRandomCommands(n) {
            const keys = [...GoatBot.commands.keys()];
            for (let i = keys.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [keys[i], keys[j]] = [keys[j], keys[i]];
            }
            return keys.slice(0, n);
        }

        function removeCommandNameFromBody(body_, prefix_, commandName_) {
            if (typeof body_ != "string")
                throw new Error(`The first argument (body) must be a string, but got "${typeof body_}"`);
            if (typeof prefix_ != "string")
                throw new Error(`The second argument (prefix) must be a string, but got "${typeof prefix_}"`);
            if (typeof commandName_ != "string")
                throw new Error(`The third argument (commandName) must be a string, but got "${typeof commandName_}"`);
            return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
        }

        // Shared permission check for onReply / onReaction
        async function denyIfNoRole(needRole, hideKey, keys) {
            if (canUseCommand(role, needRole))
                return false;
            if (hideNotiMessage[hideKey])
                return true;
            const commandName = keys.commandName;
            if (needRole == 1)
                await message.reply(t(keys.admin, commandName));
            else if (needRole == 2)
                await message.reply(t(keys.botAdmin, commandName));
            else if (needRole == 3)
                await message.reply(t("onlyPremium"));
            else if (needRole == 4)
                await message.reply(t("onlyDev"));
            return true;
        }

        /*
         +------------------------------------------------+
         |                 WHEN CALL COMMAND              |
         +------------------------------------------------+
        */
        let isUserCallCommand = false;
        async function onStart() {
            if (!body)
                return;

            // ———— RESOLVE noPrefix MODE ———— //
            const npRaw = config.noPrefix;
            let npMode = "off";
            if (npRaw === "on" || npRaw === true)
                npMode = "on";
            else if (npRaw === "admin" || npRaw === "adminOnly")
                npMode = "admin";
            else if (npRaw && typeof npRaw === "object") {
                const v = npRaw.enable;
                if (v === "on") npMode = "on";
                else if (v === true || v === "admin") npMode = "admin";
            }

            const adminPfx = config.adminPrefix || ".";
            const devPfx = config.devPrefix || "";
            const isBotAdmin = role === 2 || role === 4;

            const hasPrefix = body.startsWith(prefix);
            const hasAdminPrefix = !!adminPfx && body.startsWith(adminPfx) && isBotAdmin;
            const hasDevPrefix = !!devPfx && body.startsWith(devPfx) && role === 4;
            const userCanSkipPrefix = npMode === "on" || (npMode === "admin" && isBotAdmin);
            const hasNoPrefix = userCanSkipPrefix && !hasPrefix && !hasAdminPrefix && !hasDevPrefix;
            const hasAnyPrefix = hasPrefix || hasAdminPrefix || hasDevPrefix;

            if (!hasAnyPrefix && !hasNoPrefix)
                return;

            const dateNow = Date.now();
            const activePrefix = hasAdminPrefix ? adminPfx : hasDevPrefix ? devPfx : hasPrefix ? prefix : "";
            const args = body.slice(activePrefix.length).trim().split(/ +/);

            let commandName = args.shift().toLowerCase();
            let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));

            // ———— CHECK GROUP ALIASES ———— //
            const aliasesData = threadData.data.aliases || {};
            for (const cmdName in aliasesData) {
                if (aliasesData[cmdName].includes(commandName)) {
                    command = GoatBot.commands.get(cmdName);
                    break;
                }
            }

            if (command)
                commandName = command.config.name;

            if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                return;

            // ———— COMMAND NOT FOUND ———— //
            if (!command) {
                if (!hasAnyPrefix)
                    return;
                if (hideNotiMessage.commandNotFound)
                    return true;

                if (!commandName) {
                    if (role >= 2) {
                        if (npMode === "on" || npMode === "admin")
                            return await replyLord(t("noPrefixReminder"));
                        const cmds = getRandomCommands(3);
                        return await replyLord(t("onlyPrefixLord") + "\n" + cmds.map((c, i) => `${i + 1}. ${c}`).join("\n"));
                    }
                    return await replyMention(t("onlyPrefix", prefix));
                }

                const matches = getSuggestions(commandName);

                if (role >= 2) {
                    const top = matches.slice(0, 4);
                    const seen = new Set(top.map(s => s.toLowerCase()));
                    const displayList = [...top, ...getRandomCommands(5).filter(c => !seen.has(c.toLowerCase()))].slice(0, 4);
                    return await replyLord(
                        t("commandNotFoundLord", commandName) +
                        "\n" + displayList.map((c, i) => `${i + 1}. ${c}`).join("\n")
                    );
                }

                let suggestionMsg = t("commandNotFound", commandName, prefix);
                const topFive = matches.slice(0, 5);
                if (topFive.length > 0)
                    suggestionMsg += "\n\nᴍᴀʏʙᴇ ʏᴏᴜ ᴍᴇᴀɴ:\n" + topFive.map((c, i) => `${i + 1}. ${c}`).join("\n");
                return await replyMention(suggestionMsg);
            }

            // ———— RESOLVE MENTIONS (only for real command calls) ———— //
            if (!Object.keys(event.mentions || {}).length) {
                if (event.messageReply?.senderID) {
                    event.mentions = { [event.messageReply.senderID]: "" };
                } else {
                    const tagMatch = body.match(/@([^ ]+)/);
                    if (tagMatch) {
                        try {
                            const tagName = tagMatch[1].toLowerCase();
                            const info = await getThreadInfoCached(api, threadID);
                            const nicknames = info.nicknames || {};
                            let foundID = Object.keys(nicknames).find(id => nicknames[id].toLowerCase().includes(tagName));
                            if (!foundID) {
                                const user = (info.userInfo || []).find(u =>
                                    u.name?.toLowerCase().includes(tagName) ||
                                    u.firstName?.toLowerCase().includes(tagName)
                                );
                                if (user)
                                    foundID = user.id;
                            }
                            if (foundID)
                                event.mentions = { [foundID]: "" };
                        } catch (_) { }
                    }
                }
            }

            // ———— NOTIFY EXPIRED PREMIUM (once per session) ———— //
            try {
                const queue = GoatBot._expiredPremiumNotifyQueue;
                const idx = queue ? queue.indexOf(senderID) : -1;
                if (idx !== -1) {
                    queue.splice(idx, 1);
                    await replyMention("⚠️ Your premium has expired! You've been downgraded to a normal user. Please contact the bot admin to renew.");
                }
            } catch (_) { }

            // ———— CHECK PERMISSION ———— //
            const needRole = getRoleConfig(utils, command, isGroup, threadData, commandName).onStart;
            if (!canUseCommand(role, needRole)) {
                if (hideNotiMessage.needRoleToUseCmd)
                    return true;
                if (needRole == 1)
                    return await replyMention(t("onlyAdmin", commandName));
                if (needRole == 2)
                    return await replyMention(t("onlyAdminBot2", commandName));
                if (needRole == 3)
                    return await replyMention(t("onlyPremium"));
                if (needRole == 4)
                    return await replyMention(t("onlyDev"));
                return await replyMention(t("noPermission"));
            }

            // ———— COOLDOWN ———— //
            const timestamps = client.countDown[commandName] || (client.countDown[commandName] = {});
            let getCoolDown = command.config.countDown;
            if ((!getCoolDown && getCoolDown != 0) || isNaN(getCoolDown))
                getCoolDown = 1;
            if (timestamps[senderID]) {
                const expirationTime = timestamps[senderID] + getCoolDown * 1000;
                if (dateNow < expirationTime)
                    return await message.reply(t("waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
            }

            // ———— RUN COMMAND ———— //
            isUserCallCommand = true;
            try {
                bufferAnalytics(globalData, commandName);
                createMessageSyntaxError(commandName);
                const getLang = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
                await command.onStart({ ...parameters, args, commandName, getLang, removeCommandNameFromBody });
                timestamps[senderID] = dateNow;
                log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
            } catch (err) {
                log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
                return await message.reply(errorText("errorOccurred", commandName, err));
            }
        }

        /*
         +------------------------------------------------+
         |                    ON CHAT                     |
         +------------------------------------------------+
        */
        async function onChat() {
            const allOnChat = GoatBot.onChat || [];
            if (!allOnChat.length)
                return;
            const args = body ? body.split(/ +/) : [];

            for (const key of allOnChat) {
                const command = GoatBot.commands.get(key);
                if (!command)
                    continue;
                const commandName = command.config.name;

                const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
                if (!canUseCommand(role, roleConfig.onChat))
                    continue;

                createMessageSyntaxError(commandName);
                const getLang = lazyLang("cmds", command);

                command.onChat({ ...parameters, isUserCallCommand, args, commandName, getLang })
                    .then(async (handler) => {
                        if (typeof handler != "function")
                            return;
                        if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                            return;
                        try {
                            await handler();
                            log.info("onChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
                        } catch (err) {
                            await message.reply(errorText("errorOccurred2", commandName, err));
                        }
                    })
                    .catch(err => log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err));
            }
        }

        /*
         +------------------------------------------------+
         |                   ON ANY EVENT                 |
         +------------------------------------------------+
        */
        async function onAnyEvent() {
            const allOnAnyEvent = GoatBot.onAnyEvent || [];
            if (!allOnAnyEvent.length)
                return;
            const args = typeof event.body == "string" && event.body.startsWith(prefix) ? event.body.split(/ +/) : [];

            for (const key of allOnAnyEvent) {
                if (typeof key !== "string")
                    continue;
                const command = GoatBot.commands.get(key);
                if (!command)
                    continue;
                const commandName = command.config.name;
                createMessageSyntaxError(commandName);
                const getLang = lazyLang("events", command);

                command.onAnyEvent({ ...parameters, args, commandName, getLang })
                    .then(async (handler) => {
                        if (typeof handler != "function")
                            return;
                        try {
                            await handler();
                            log.info("onAnyEvent", `${commandName} | ${senderID} | ${userData.name} | ${threadID}`);
                        } catch (err) {
                            message.reply(errorText("errorOccurred7", commandName, err));
                            log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
                        }
                    })
                    .catch(err => log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err));
            }
        }

        /*
         +------------------------------------------------+
         |                  ON FIRST CHAT                 |
         +------------------------------------------------+
        */
        async function onFirstChat() {
            const allOnFirstChat = GoatBot.onFirstChat || [];
            if (!allOnFirstChat.length)
                return;
            const args = body ? body.split(/ +/) : [];

            for (const item of allOnFirstChat) {
                const { commandName, threadIDsChattedFirstTime } = item;
                if (threadIDsChattedFirstTime.includes(threadID))
                    continue;
                const command = GoatBot.commands.get(commandName);
                if (!command)
                    continue;

                threadIDsChattedFirstTime.push(threadID);
                createMessageSyntaxError(commandName);
                const getLang = lazyLang("cmds", command);

                command.onFirstChat({ ...parameters, isUserCallCommand, args, commandName, getLang })
                    .then(async (handler) => {
                        if (typeof handler != "function")
                            return;
                        if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                            return;
                        try {
                            await handler();
                            log.info("onFirstChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
                        } catch (err) {
                            await message.reply(errorText("errorOccurred2", commandName, err));
                        }
                    })
                    .catch(err => log.err("onFirstChat", `An error occurred when calling the command onFirstChat ${commandName}`, err));
            }
        }

        /*
         +------------------------------------------------+
         |                    ON REPLY                    |
         +------------------------------------------------+
        */
        async function onReply() {
            if (!event.messageReply)
                return;
            const { onReply } = GoatBot;
            const Reply = onReply.get(event.messageReply.messageID);
            if (!Reply)
                return;
            Reply.delete = () => onReply.delete(event.messageReply.messageID);

            const commandName = Reply.commandName;
            if (!commandName) {
                message.reply(t("cannotFindCommandName"));
                return log.err("onReply", "Can't find command name to execute this reply!", Reply);
            }
            const command = GoatBot.commands.get(commandName);
            if (!command) {
                message.reply(t("cannotFindCommand", commandName));
                return log.err("onReply", `Command "${commandName}" not found`, Reply);
            }

            const needRole = getRoleConfig(utils, command, isGroup, threadData, commandName).onReply;
            if (await denyIfNoRole(needRole, "needRoleToUseCmdOnReply", {
                commandName,
                admin: "onlyAdminToUseOnReply",
                botAdmin: "onlyAdminBot2ToUseOnReply"
            }))
                return;

            try {
                const args = body ? body.split(/ +/) : [];
                createMessageSyntaxError(commandName);
                if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                    return;
                const getLang = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
                await command.onReply({ ...parameters, Reply, args, commandName, getLang });
                log.info("onReply", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
            } catch (err) {
                log.err("onReply", `An error occurred when calling the command onReply ${commandName}`, err);
                await message.reply(errorText("errorOccurred3", commandName, err));
            }
        }

        /*
         +------------------------------------------------+
         |                   ON REACTION                  |
         +------------------------------------------------+
        */
        async function onReaction() {
            const { onReaction } = GoatBot;
            const Reaction = onReaction.get(messageID);
            if (!Reaction)
                return;
            Reaction.delete = () => onReaction.delete(messageID);

            const commandName = Reaction.commandName;
            if (!commandName) {
                message.reply(t("cannotFindCommandName"));
                return log.err("onReaction", "Can't find command name to execute this reaction!", Reaction);
            }
            const command = GoatBot.commands.get(commandName);
            if (!command) {
                message.reply(t("cannotFindCommand", commandName));
                return log.err("onReaction", `Command "${commandName}" not found`, Reaction);
            }

            const needRole = getRoleConfig(utils, command, isGroup, threadData, commandName).onReaction;
            if (await denyIfNoRole(needRole, "needRoleToUseCmdOnReaction", {
                commandName,
                admin: "onlyAdminToUseOnReaction",
                botAdmin: "onlyAdminBot2ToUseOnReaction"
            }))
                return;

            try {
                createMessageSyntaxError(commandName);
                if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                    return;
                const getLang = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
                await command.onReaction({ ...parameters, Reaction, args: [], commandName, getLang });
                log.info("onReaction", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${event.reaction}`);
            } catch (err) {
                log.err("onReaction", `An error occurred when calling the command onReaction ${commandName}`, err);
                await message.reply(errorText("errorOccurred4", commandName, err));
            }
        }

        /*
         +------------------------------------------------+
         |                 EVENT COMMAND                  |
         +------------------------------------------------+
        */
        async function handlerEvent() {
            const { author } = event;
            for (const [, getEvent] of GoatBot.eventCommands) {
                if (!getEvent)
                    continue;
                const commandName = getEvent.config.name;
                const getLang = lazyLang("events", getEvent);
                try {
                    const handler = await getEvent.onStart({ ...parameters, commandName, getLang });
                    if (typeof handler == "function") {
                        await handler();
                        log.info("EVENT COMMAND", `Event: ${commandName} | ${author} | ${userData.name} | ${threadID}`);
                    }
                } catch (err) {
                    log.err("EVENT COMMAND", `An error occurred when calling the command event ${commandName}`, err);
                    await message.reply(errorText("errorOccurred5", commandName, err));
                }
            }
        }

        /*
         +------------------------------------------------+
         |                    ON EVENT                    |
         +------------------------------------------------+
        */
        async function onEvent() {
            const allOnEvent = GoatBot.onEvent || [];
            if (!allOnEvent.length)
                return;
            const { author } = event;

            for (const key of allOnEvent) {
                if (typeof key !== "string")
                    continue;
                const command = GoatBot.commands.get(key);
                if (!command)
                    continue;
                const commandName = command.config.name;
                createMessageSyntaxError(commandName);
                const getLang = lazyLang("events", command);

                command.onEvent({ ...parameters, args: [], commandName, getLang })
                    .then(async (handler) => {
                        if (typeof handler != "function")
                            return;
                        try {
                            await handler();
                            log.info("onEvent", `${commandName} | ${author} | ${userData.name} | ${threadID}`);
                        } catch (err) {
                            message.reply(errorText("errorOccurred6", commandName, err));
                            log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
                        }
                    })
                    .catch(err => log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err));
            }
        }

        /*
         +------------------------------------------------+
         |            TYP / PRESENCE / READ RECEIPT        |
         +------------------------------------------------+
         handlerAction.js calls these directly. A command file may export
         onTyp / onPresence / onReadReceipt; only those commands are looped.
        */
        async function runOptionalHandlers(method, label) {
            for (const key of getHandlerKeys(method)) {
                const command = GoatBot.commands.get(key);
                if (typeof command?.[method] !== "function")
                    continue;
                try {
                    await command[method]({ ...parameters, commandName: command.config?.name });
                } catch (err) {
                    log.err(label, `An error occurred when calling ${method} for ${command.config?.name}`, err);
                }
            }
        }

        const typ = () => runOptionalHandlers("onTyp", "onTyp");
        const presence = () => runOptionalHandlers("onPresence", "onPresence");
        const read_receipt = () => runOptionalHandlers("onReadReceipt", "onReadReceipt");

        return { onAnyEvent, onFirstChat, onChat, onStart, onReaction, onReply, onEvent, handlerEvent, typ, presence, read_receipt };
    };
};
