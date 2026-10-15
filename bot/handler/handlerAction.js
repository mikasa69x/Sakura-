const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

// Optional hooks a command file may export for these low-level events.
// (handlerEvents.js dispatches to them; commands without the hook are skipped.)
const OPTIONAL_HOOKS = {
  typ: "onTyp",
  presence: "onPresence",
  read_receipt: "onReadReceipt"
};

function anyCommandHasHook(hookName) {
  for (const command of global.GoatBot.commands.values())
    if (typeof command[hookName] === "function")
      return true;
  return false;
}

// Run a handler without awaiting it, but never let a rejection escape as an
// unhandled promise rejection (which can take the whole bot down).
function safeRun(name, fn) {
  if (typeof fn !== "function") return;
  try {
    Promise.resolve(fn()).catch(err => {
      global.utils.log.err("handlerAction", `Error in ${name}`, err);
    });
  } catch (err) {
    global.utils.log.err("handlerAction", `Error in ${name}`, err);
  }
}

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
  const handlerEvents = require(
    process.env.NODE_ENV === "development"
      ? "./handlerEvents.dev.js"
      : "./handlerEvents.js"
  )(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

  return async function (event) {
    if (
      global.GoatBot.config.antiInbox === true &&
      event.isGroup === false
    )
      return;

    // typ / presence / read_receipt fire very often. Skip the DB check and
    // handlerEvents completely unless some command actually listens to them.
    const hookName = OPTIONAL_HOOKS[event.type];
    if (hookName && !anyCommandHasHook(hookName))
      return;

    const message = createFuncMessage(api, event);

    await handlerCheckDB(usersData, threadsData, event);
    const handlerChat = await handlerEvents(event, message);
    if (!handlerChat) return;

    const {
      onAnyEvent, onFirstChat, onStart, onChat,
      onReply, onEvent, handlerEvent, onReaction,
      typ, presence, read_receipt
    } = handlerChat;

    safeRun("onAnyEvent", onAnyEvent);

    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        safeRun("onFirstChat", onFirstChat);
        safeRun("onChat", onChat);
        safeRun("onStart", onStart);
        safeRun("onReply", onReply);
        break;

      case "event":
        safeRun("handlerEvent", handlerEvent);
        safeRun("onEvent", onEvent);
        break;

      case "message_reaction": {
        safeRun("onReaction", onReaction);

        const adminBot = (global.GoatBot.config.adminBot || []).map(String);
        const isAdmin = adminBot.includes(String(event.userID));

        // FIX: this used to kick event.userID, i.e. the admin who reacted
        // (kicking themselves). The target is the author of the message that
        // was reacted to: event.senderID. Bot admins and the bot itself are
        // never kicked.
        if (event.reaction === "🫩" && isAdmin) {
          const targetID = String(event.senderID || "");
          if (targetID && !adminBot.includes(targetID) && targetID !== String(api.getCurrentUserID?.())) {
            api.removeUserFromGroup(targetID, event.threadID, err => {
              if (err) console.log(err);
            });
          }
        }

        if (
          isAdmin &&
          (event.reaction === "😡" ||
            event.reaction === "😠" ||
            event.reaction === "😴")
        ) {
          message.unsend(event.messageID);
        }
        break;
      }

      case "typ":
        safeRun("typ", typ);
        break;

      case "presence":
        safeRun("presence", presence);
        break;

      case "read_receipt":
        safeRun("read_receipt", read_receipt);
        break;

      default:
        break;
    }
  };
};
