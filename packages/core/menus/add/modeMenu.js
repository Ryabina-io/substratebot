const TelegrafInlineMenu = require("telegraf-inline-menu")
const TelegrafStatelessQuestion = require("telegraf-stateless-question")
const Extra = require("telegraf/extra")
const { keyboardOff, keyboardOn, botParams } = require("../../config")
const { checkAddress } = require("@polkadot/util-crypto")
const { mainAddAlerts } = require("./addAlerts")
const selectModuleMenu = require("./selectModuleMenu")

const modeMenu = new TelegrafInlineMenu(ctx => {
  if (!ctx.session.mode) {
    ctx.session.mode = botParams.ui.modes.find(
      mode => mode.index == ctx.callbackQuery.data
    )
  }
  if (!ctx.session.modeEvents) {
    ctx.session.modeEvents = ctx.session.mode.alerts.map(e => {
      return { name: e.short, selected: e.selected }
    })
  }
  return ctx.session.mode.description
})

modeMenu
  .select(
    "m",
    ctx => {
      return ctx.session.mode.alerts.map(u => u.short)
    },
    {
      setFunc: (ctx, key) => {
        ctx.session.modeEvents.find(
          e => e.name == key
        ).selected = !ctx.session.modeEvents.find(e => e.name == key).selected
      },
      isSetFunc: (ctx, key) => {
        var selectedMode = ctx.session.modeEvents.find(e => e.name == key)
        return selectedMode.selected ? "🟢" : "⚪️"
      },
      multiselect: true,
      textFunc: (ctx, key) => {
        return ctx.session.mode.alerts.find(u => u.short == key).name
      },
      getCurrentPage: ctx => ctx.session.modePage,
      setPage: (ctx, page) => {
        ctx.session.modePage = page
      },
      columns: 1,
    }
  )
  .button(
    ctx => {
      return ctx.session.mode.isAddressFiltering
        ? "Enter Address 🚀"
        : "Create Alerts 🚀"
    },
    "n",
    {
      doFunc: ctx => {
        if (!ctx.session.mode.isAddressFiltering) {
          var events = ctx.session.mode.alerts.filter(e =>
            ctx.session.modeEvents
              .filter(u => u.selected)
              .find(u => u.name == e.short)
          )
          var notifications = botParams.db.get("notifications").value()
          ctx.deleteMessage().catch(() => {
            /* ignore */
          })
          events.some(e => {
            var notification = {
              chatid: ctx.chat.id,
              contract: e.contract,
              event: e.event,
              call: e.call,
            }
            if (
              !notifications.find(
                n =>
                  n.contract == notification.contract &&
                  n.event == notification.event &&
                  n.chatid == notification.chatid &&
                  n.call == notification.call
              )
            ) {
              var user = botParams.db
                .get("users")
                .find({ chatid: ctx.chat.id })
                .value()
              if (
                botParams.db
                  .get("notifications")
                  .filter({ chatid: ctx.chat.id })
                  .value().length >= user.maxLimit
              ) {
                ctx.replyWithMarkdown(
                  `Sorry, but you've reached the subscription limit = ${user.maxLimit}.`,
                  Extra.markup(markup => {
                    return markup
                      .resize()
                      .keyboard(user.enabled ? keyboardOn : keyboardOff)
                  })
                )
                return true
              }
              botParams.db.get("notifications").push(notification).write()
            }
            return false
          })
          var user = botParams.db
            .get("users")
            .find({ chatid: ctx.chat.id })
            .value()
          if (
            botParams.db
              .get("notifications")
              .filter({ chatid: ctx.chat.id })
              .value().length >= user.maxLimit
          )
            return
          var reply = `Alerts have been successfully created.`
          ctx.replyWithMarkdown(
            reply,
            Extra.markup(markup => {
              return markup
                .resize()
                .keyboard(user.enabled ? keyboardOn : keyboardOff)
            })
          )
        } else {
          ctx.session.context = ctx.callbackQuery.data
            .split(":")
            .splice(0, 2)
            .join(":")
          ctx.deleteMessage().catch(() => {
            /* ignore */
          })
          var replyMsg = `You have select the following events:
            `
          ctx.session.modeEvents
            .filter(u => u.selected)
            .forEach(
              e =>
                (replyMsg += `
    - ${ctx.session.mode.alerts.find(m => m.short == e.name).name}`)
            )
          replyMsg += `
            
Please send me a public address of ${botParams.settings.network.name} account that you want to link to these events.`
          return enterAddress.replyWithMarkdown(ctx, replyMsg)
        }
      },
      hide: ctx => {
        if (ctx.session.modeEvents.filter(e => e.selected).length == 0)
          return true
        return false
      },
    }
  )

const enterAddress = new TelegrafStatelessQuestion("adr", async ctx => {
  botParams.db.read()
  var user = botParams.db.get("users").find({ chatid: ctx.chat.id })
  var isValid
  try {
    isValid = checkAddress(
      ctx.message.text,
      parseInt(botParams.settings.network.prefix)
    )[0]
  } catch (error) {
    isValid = false
  }
  if (!ctx.session.wallet && !isValid) {
    ctx.replyWithMarkdown(
      `Incorrect address. Please try again.`,
      Extra.markup(markup => {
        return markup
          .resize()
          .keyboard(user.value().enabled ? keyboardOn : keyboardOff)
      })
    )
    mainAddAlerts.middleware.setSpecific(ctx)
    return
  } else if (ctx.session.wallet && ctx.message.text.match(/^\s+$/)) {
    return enterAddress.replyWithMarkdown(
      ctx,
      `Sorry, but an empty name is not acceptable. Please try again.`
    )
  } else if (ctx.session.wallet && ctx.message.text.length > 30) {
    return enterAddress.replyWithMarkdown(
      ctx,
      `Sorry, but name shouldn't be more than 30 characters long. Please try again.‌`
    )
  } else if (ctx.session.wallet) {
    if (user.get("wallets").find({ name: ctx.message.text }).value())
      return enterAddress.replyWithMarkdown(
        ctx,
        `You already have a wallet by that name. Please Enter another name.`
      )
  }

  if (!ctx.session.wallet) {
    ctx.session.wallet = { address: ctx.message.text, name: "" }
    var dbwallet = user
      .get("wallets")
      .value()
      .find(w => w.address == ctx.session.wallet.address)
    if (dbwallet) ctx.session.wallet.name = dbwallet.name
    //else {
    //var name = await contracts.find(c => c.name == 'Accounts').contract.getName(ctx.session.wallet.address)
    //if(name){
    //    ctx.session.wallet.name = name;
    //}
    //}
  } else {
    ctx.session.wallet.name = ctx.message.text
  }

  if (ctx.session.wallet.name == "") {
    return enterAddress.replyWithMarkdown(
      ctx,
      `Please enter a name for the address you have entered. 
This is necessary for readable notifications and easy navigation.`
    )
  }

  var userWallets = user.get("wallets").value()
  if (!userWallets.find(w => w.address == ctx.session.wallet.address)) {
    userWallets.push(ctx.session.wallet)
    user.assign({ wallets: userWallets }).write()
  }

  var events = ctx.session.mode.alerts.filter(e =>
    ctx.session.modeEvents.filter(u => u.selected).find(u => u.name == e.short)
  )
  var notifications = botParams.db.get("notifications").value()
  var newNotifications = []
  for (var e = 0; e < events.length; e++) {
    if (events[e].filters && events[e].filters.length > 0) {
      for (var f = 0; f < events[e].filters.length; f++) {
        var wallet = ctx.session.wallet.address
        var notification = {
          chatid: ctx.chat.id,
          contract: events[e].contract,
          filters: [],
        }
        if (events[e].event) {
          notification.event = events[e].event
        } else if (events[e].call) {
          notification.call = events[e].call
        }
        var filter = {
          name: events[e].filters[f],
          value: wallet,
          isEqual: true,
        }
        if (events[e].source) {
          filter.source = events[e].source
        }
        notification.filters.push(filter)
        newNotifications.push(notification)
      }
    } else {
      var wallet = ctx.session.wallet.address
      var notification = {
        chatid: ctx.chat.id,
        contract: events[e].contract,
      }
      if (events[e].event) {
        notification.event = events[e].event
      } else if (events[e].call) {
        notification.call = events[e].call
      } else {
        throw new Error("There is no event and no call.")
      }
      newNotifications.push(notification)
    }
  }
  for (var newN = 0; newN < newNotifications.length; newN++) {
    if (
      !notifications.find(n =>
        botParams.db._.isEqual(n, newNotifications[newN])
      )
    ) {
      if (checkMaxLimit(botParams.db, ctx)) {
        ctx.session.wallet = null
        return
      }
      botParams.db.get("notifications").push(newNotifications[newN]).write()
    }
  }
  ctx.session.wallet = null
  //if (db.get('notifications').filter({ chatid: ctx.chat.id }).value().length >= user.value().maxLimit) return;
  var reply = `Alerts have been successfully created.`
  ctx.replyWithMarkdown(
    reply,
    Extra.markup(markup => {
      return markup
        .resize()
        .keyboard(user.value().enabled ? keyboardOn : keyboardOff)
    })
  )
})

function checkMaxLimit(db, ctx) {
  var user = db.get("users").find({ chatid: ctx.chat.id }).value()
  if (
    db.get("notifications").filter({ chatid: ctx.chat.id }).value().length >=
    user.maxLimit
  ) {
    ctx.replyWithMarkdown(
      `Sorry, but you've reached the subscription limit = ${user.maxLimit}.`,
      Extra.markup(markup => {
        return markup.resize().keyboard(user.enabled ? keyboardOn : keyboardOff)
      })
    )
    return true
  } else return false
}

function init() {
  botParams.ui.modes.forEach(mode => {
    mainAddAlerts.menu.submenu(mode.name, mode.index, modeMenu)
  })

  mainAddAlerts.menu.submenu("Advanced", "adv", selectModuleMenu)
}

module.exports = {
  modeMenu: modeMenu,
  enterAddress: enterAddress,
  init: init,
}
