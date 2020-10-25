const Telegraf = require("telegraf")
const Extra = require("telegraf/extra")
const session = require("telegraf/session")
const { botParams, keyboardOn, keyboardOff } = require("./config")
const { mainAddAlerts } = require("./menus/add/addAlerts")
const { setParam } = require("./menus/add/setFilterMenu")
const modeMenu = require("./menus/add/modeMenu")
const { renameAddress } = require("./menus/edit/editWalletNotificationsMenu")
const {
  walletsNotificationsMenu,
  walletsNotificationsMenuMiddleware,
} = require("./menus/edit/walletsNotificationsMenu")
const { refreshMenu, refreshMenuMiddleware } = require("./menus/statsMenu")
const { checkIsGroup, getGroupOrCreate } = require("./tools/utils")

module.exports.run = async function (params) {
  /*
   *   BOT initialization
   */
  const bot = new Telegraf(botParams.settings.botToken)
  bot.use(session())

  /*
   *   Message on command /start (Hello msg)
   */
  bot.start(ctx => {
    if (ctx.chat.type == "private") {
      botParams.db.read()
      var user = botParams.db.get("users").find({ chatid: ctx.chat.id }).value()
      if (!user) {
        user = {
          first_name: ctx.chat.first_name,
          username: ctx.chat.username,
          chatid: ctx.chat.id,
          type: ctx.chat.type,
          wallets: [],
          maxLimit: 100,
          enabled: true,
          blocked: false,
        }
        botParams.db.get("users").push(user).write()
      }

      return ctx.replyWithMarkdown(
        `Welcome to ${botParams.settings.network.name} Bot. It can help you create and manage usefull alerts.\n\n${botParams.settings.startMsg}`,
        Extra.webPreview(false).markup(markup => {
          return markup
            .resize()
            .keyboard(user.enabled ? keyboardOn() : keyboardOff())
        })
      )
    }
  })

  /*
   *   /validator command handler
   */
  bot.command("validators", ctx => {
    if (ctx.chat.type == "private") {
      ctx.replyWithMarkdown(botParams.settings.validatorsMessage)
    }
  })

  /*
   *   /stats command handler
   */
  const antispamOn = {}
  bot.command("stats", async ctx => {
    if (await checkIsGroup(ctx)) {
      if (!antispamOn[ctx.chat.id]) {
        antispamOn[ctx.chat.id] = true
        setTimeout(() => (antispamOn[ctx.chat.id] = false), 60000)
        refreshMenuMiddleware.setSpecific(ctx)
      } else {
        ctx.reply("Time limit 1 min for /stats command")
      }
    } else if (ctx.chat.type == "private") {
      ctx.replyWithMarkdown(botParams.getNetworkStatsMessage())
    }
  })

  bot.command("priceon", async ctx => {
    if (await checkIsGroup(ctx, true)) {
      var group = getGroupOrCreate(ctx)
      if (!group.price) {
        botParams.db
          .get("users")
          .find({ chatid: ctx.chat.id })
          .assign({ price: true })
          .write()
        ctx.reply("Price display is turned on.")
      } else {
        ctx.reply("Price are already ON for your group.")
      }
    }
  })

  bot.command("priceoff", async ctx => {
    if (await checkIsGroup(ctx, true)) {
      var group = getGroupOrCreate(ctx)
      if (group.price) {
        botParams.db
          .get("users")
          .find({ chatid: ctx.chat.id })
          .assign({ price: false })
          .write()
        ctx.reply("Price display is turned off.")
      } else {
        ctx.reply("Price are already OFF for your group.")
      }
    }
  })

  bot.command("alertson", async ctx => {
    if (await checkIsGroup(ctx, true)) {
      var group = getGroupOrCreate(ctx)
      if (!group.enabled) {
        var events = botParams.settings.groupAlerts.events
        var calls = botParams.settings.groupAlerts.calls
        events.forEach(e => {
          var notification = {
            chatid: ctx.chat.id,
            contract: e[0],
            event: e[1],
          }
          botParams.db.get("notifications").push(notification).write()
        })
        calls.forEach(e => {
          var notification = {
            chatid: ctx.chat.id,
            contract: e[0],
            call: e[1],
          }
          botParams.db.get("notifications").push(notification).write()
        })
        botParams.db
          .get("users")
          .find({ chatid: ctx.chat.id })
          .assign({ enabled: true })
          .write()
        ctx.reply("Alerts have been successfully activated.")
      } else {
        ctx.reply("Alerts are already ON for your group.")
      }
    }
  })

  bot.command("alertsoff", async ctx => {
    if (await checkIsGroup(ctx, true)) {
      var group = getGroupOrCreate(ctx)
      if (group.enabled) {
        botParams.db
          .get("notifications")
          .remove(n => n.chatid == ctx.chat.id)
          .write()
        botParams.db
          .get("users")
          .find({ chatid: ctx.chat.id })
          .assign({ enabled: false })
          .write()
        ctx.reply("Alerts have been successfully turned off.")
      } else {
        ctx.reply("Alerts are already OFF for your group.")
      }
    }
  })

  /*
   *   React bot on add message
   */
  bot.hears(botParams.ui.keyboard.add, ctx => {
    if (ctx.chat.type == "private") {
      mainAddAlerts.middleware.setSpecific(ctx)
    }
  })

  /*
   *   React bot on alerts message
   */
  bot.hears(botParams.ui.keyboard.alerts, ctx => {
    if (ctx.chat.type == "private") {
      walletsNotificationsMenuMiddleware.setSpecific(ctx)
    }
  })

  /*
   *   React bot on stats message
   */
  bot.hears(botParams.ui.keyboard.stats, async ctx => {
    if (ctx.chat.type == "private") {
      ctx.replyWithMarkdown(botParams.getNetworkStatsMessage())
    }
  })

  /*
   *   React bot on OFF message.
   */
  bot.hears(botParams.ui.keyboard.off, ctx => {
    if (ctx.chat.type == "private") {
      botParams.db
        .get("users")
        .find({ chatid: ctx.chat.id })
        .assign({ enabled: true })
        .write()

      ctx.reply(
        "All notifications are turned on",
        Extra.markup(markup => {
          return markup.resize().keyboard(keyboardOn())
        })
      )
    }
  })

  /*
   *   React bot on ON message.
   */
  bot.hears(botParams.ui.keyboard.on, ctx => {
    if (ctx.chat.type == "private") {
      botParams.db
        .get("users")
        .find({ chatid: ctx.chat.id })
        .assign({ enabled: false })
        .write()

      ctx.reply(
        "All notifications are turned off",
        Extra.markup(markup => {
          return markup.resize().keyboard(keyboardOff())
        })
      )
    }
  })

  /*
   *   Collect and show in console all bot errors
   *   except 'message is not modified' & 'message to edit not found'
   */
  bot.catch(error => {
    if (
      error.message.includes("message is not modified") ||
      error.message.includes("message to edit not found")
    ) {
      return
    }
    console.log(new Date(), "Error", error)
  })

  modeMenu.init()
  //Initialization of all menus
  bot.use(
    mainAddAlerts.menu.init({
      backButtonText: "< back",
      mainMenuButtonText: "< main menu",
    })
  )
  bot.use(
    walletsNotificationsMenu.init({
      actionCode: "n",
      backButtonText: "< back",
      mainMenuButtonText: "< main menu",
    })
  )
  bot.use(refreshMenu.init())
  bot.use(modeMenu.enterAddress.middleware())
  bot.use(renameAddress.middleware())
  bot.use(setParam.middleware())

  await bot.launch()
  console.log(new Date(), "Bot started as", bot.options.username)
  return bot
}
