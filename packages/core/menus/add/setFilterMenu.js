const TelegrafInlineMenu = require("telegraf-inline-menu")
const TelegrafStatelessQuestion = require("telegraf-stateless-question")
const { checkAddress } = require("@polkadot/util-crypto")
const Extra = require("telegraf/extra")
const { botParams, getKeyboard } = require("../../config")
const { getInnerType, replaceMarkdownSymbols } = require("../../tools/utils")

const setFilterMenu = new TelegrafInlineMenu(ctx => {
  var action
  var actionName
  if (ctx.match[2] == "evnts") {
    actionName = Object.keys(
      botParams.ui.modules[ctx.session.module].events
    ).find(
      k =>
        botParams.ui.modules[ctx.session.module].events[k].short == ctx.match[3]
    )
    action = botParams.ui.modules[ctx.session.module].events[actionName]
    if (ctx.session.notification) ctx.session.notification.event = actionName
  } else if (ctx.match[2] == "clls") {
    actionName = Object.keys(
      botParams.ui.modules[ctx.session.module].calls
    ).find(
      k =>
        botParams.ui.modules[ctx.session.module].calls[k].short == ctx.match[3]
    )
    action = botParams.ui.modules[ctx.session.module].calls[actionName]
    if (ctx.session.notification) ctx.session.notification.call = actionName
  }
  ctx.session.current = action
  action.documentation = replaceMarkdownSymbols(action.documentation, false)
  var reply = `${
    ctx.match[2] == "evnts" ? "Event" : "Extrinsic"
  } *${actionName}*\n\nDescription: ${
    action.documentation == "" ? "_No description._" : action.documentation
  }\n\n`
  var args = []
  if (ctx.session.notification && ctx.session.notification.call) {
    args.push("sender")
  }
  ctx.session.current.args
    .filter(a => !a.visible || a.visible != "hide")
    .forEach(a => args.push(a.name))
  if (args.length > 0) {
    reply += `1. Check *FILTERS* (or else you'll have to redo)\n2. *Create alert*.`
  }
  return reply
})

setFilterMenu
  .select(
    "f",
    ctx => {
      var args = []
      if (ctx.session.notification && ctx.session.notification.call) {
        args.push("sender")
      }
      ctx.session.current.args
        .filter(a => !a.visible || a.visible != "hide")
        .forEach(a => args.push(a.name))
      return args
    },
    {
      setFunc: (ctx, key) => {
        if (!ctx.session.currentFilter) {
          ctx.session.currentFilter = {
            name: key,
            value: "",
            isMore: false,
            isEqual: false,
            isLess: false,
          }
          if (ctx.session.notification.call && key == "sender") {
            ctx.session.currentFilterType = "AccountId"
            ctx.session.currentFilterBaseType = "GenericAccountId"
          } else {
            ctx.session.currentFilterType = getInnerType(
              ctx.session.current.args.find(p => p.name == key).type
            )
            ctx.session.currentFilterBaseType = getInnerType(
              ctx.session.current.args.find(p => p.name == key).baseType
            )
          }
          if (
            ctx.session.currentFilterBaseType == "GenericAccountId" ||
            ctx.session.currentFilterBaseType == "GenericAddress"
          ) {
            ctx.session.currentFilter.isEqual = true
            ctx.session.context = ctx.callbackQuery.data
              .split(":")
              .splice(0, 4)
              .join(":")
            ctx.deleteMessage().catch(() => {
              /* ignore */
            })
            var replyMsg = `Please enter the value of '${ctx.session.currentFilter.name}' parameter.`
            return setParam.replyWithMarkdown(ctx, replyMsg)
          } else if (
            [
              "i8",
              "i16",
              "i32",
              "i64",
              "i128",
              "i256",
              "u8",
              "u16",
              "u32",
              "u64",
              "u128",
              "u256",
            ].includes(ctx.session.currentFilterBaseType)
          ) {
            ctx.session.isNumEditing = true
          } else {
            console.log(
              new Date(),
              "Wrong type of parameters:",
              ctx.session.current,
              ctx.session.currentFilter
            )
          }
        } else {
          ctx.session.currentFilter = null
          ctx.session.isNumEditing = false
        }
      },
      isSetFunc: (ctx, key) => {
        if (
          ctx.session.currentFilter &&
          ctx.session.currentFilter.name == key
        ) {
          return "✏️"
        } else if (
          ctx.session.notification.filters &&
          ctx.session.notification.filters.find(f => {
            return f.name == key
          })
        ) {
          return "✔️"
        } else return ""
      },
      hide: (ctx, key) => {
        if (
          !ctx.session.isFiltering ||
          (ctx.session.currentFilter && ctx.session.currentFilter.name != key)
        )
          return true
        else return false
      },
      columns: 1,
    }
  )
  .select("t", [">", "=", "<"], {
    setFunc: (ctx, key) => {
      if (key == "=") {
        ctx.session.currentFilter.isEqual = true
      } else if (key == ">") {
        ctx.session.currentFilter.isMore = true
      } else if (key == "<") {
        ctx.session.currentFilter.isLess = true
      }
      ctx.session.context = ctx.callbackQuery.data
        .split(":")
        .splice(0, 4)
        .join(":")
      ctx.deleteMessage().catch(() => {
        /* ignore */
      })
      var replyMsg = `Please enter value for *${ctx.session.currentFilter.name}* parameter.`
      return setParam.replyWithMarkdown(ctx, replyMsg)
    },
    hide: (ctx, key) => {
      if (ctx.session.isNumEditing) return false
      return true
    },
    columns: 3,
  })
  .button(
    ctx => (ctx.session.isFiltering ? "Exit 'Filtering mode'" : "FILTERS"),
    "af",
    {
      doFunc: ctx => {
        ctx.session.isFiltering = !ctx.session.isFiltering
      },
      joinLastRow: true,
      hide: ctx => {
        var args = []
        if (ctx.session.notification && ctx.session.notification.call) {
          args.push("sender")
        }
        ctx.session.current.args
          .filter(a => !a.visible || a.visible != "hide")
          .forEach(a => args.push(a.name))
        return args.length == 0
      },
    }
  )
  .button("Create Alert", "g", {
    doFunc: async ctx => {
      if (
        ctx.session.notification &&
        ctx.session.notification.contract &&
        (ctx.session.notification.event || ctx.session.notification.call) &&
        ctx.session.notification.chatid
      ) {
        var notifications = botParams.db.get("notifications").value()
        var result = checkExistingNotification(
          notifications,
          ctx.session.notification
        )
        if (result) {
          ctx.reply("You're already subscribed for this alert.")
        } else {
          var checkFilters = true
          var requireArgs = ctx.session.current.args
            .filter(a => a.visible == "require")
            .map(a => a.name)
          var notSetReqArfs = requireArgs.filter(ra => {
            return !ctx.session.notification.filters
              .map(f => f.name)
              .find(f => f == ra)
          })
          if (notSetReqArfs.length > 0) {
            var reply = `To create this alert, you must first set the following filters:\n`
            notSetReqArfs.forEach(r => (reply += r + "\n"))
            ctx.reply(reply)
            return
          }
          if (
            ctx.session.notification.filters &&
            ctx.session.notification.filters.length > 0
          ) {
            ctx.session.notification.filters.forEach(f => {
              if (f.value == "" || (!f.isEqual && !f.isLess && !f.isMore)) {
                ctx.reply(
                  `You chose ${f.name}, but you didn't set it. Please uncheck it or enter value`
                )
                checkFilters = false
              }
            })
          }
          if (checkFilters) {
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
              ctx.deleteMessage().catch(() => {
                /* ignore */
              })
              ctx.replyWithMarkdown(
                `Sorry, but you've reached the subscription limit = ${user.maxLimit}.`,
                Extra.markup(markup => {
                  return markup.resize().keyboard(getKeyboard(ctx))
                })
              )
              return
            }
            botParams.db
              .get("notifications")
              .push(ctx.session.notification)
              .write()
            ctx.deleteMessage().catch(() => {
              /* ignore */
            })
            ctx.reply(
              `A alert ${ctx.session.module}.${
                ctx.session.notification.event ?? ctx.session.notification.call
              } has been successfully added.`
            )
            ctx.session.notification = null
          }
        }
      } else ctx.reply("Please setup new notification")
    },
    hide: ctx => {
      return ctx.session.isFiltering
    },
    joinLastRow: true,
  })

const replyMiddleware = setFilterMenu.replyMenuMiddleware()

const setParam = new TelegrafStatelessQuestion("unique", async ctx => {
  if (!ctx.session.notification.filters) ctx.session.notification.filters = []
  if (
    ctx.session.currentFilterBaseType == "GenericAccountId" ||
    ctx.session.currentFilterBaseType == "GenericAddress"
  ) {
    var isValid
    try {
      isValid = checkAddress(
        ctx.message.text,
        parseInt(botParams.settings.network.prefix)
      )[0]
    } catch (error) {
      isValid = false
    }
    if (!isValid) {
      var user = botParams.db.get("users").find({ chatid: ctx.chat.id }).value()
      ctx.replyWithMarkdown(
        `Incorrect address. Please try again.`,
        Extra.markup(markup => {
          return markup.resize().keyboard(getKeyboard(ctx))
        })
      )
      ctx.session.isNumEditing = false
      ctx.session.currentFilter = null
      replyMiddleware.setSpecific(ctx, ctx.session.context)
      return
    }
  }
  if (ctx.session.currentFilterType.includes("Balance")) {
    ctx.session.currentFilter.value =
      ctx.message.text + `e${botParams.settings.network.decimals}`
  } else ctx.session.currentFilter.value = ctx.message.text
  ctx.session.notification.filters.push(ctx.session.currentFilter)
  var user = botParams.db.get("users").find({ chatid: ctx.chat.id }).value()
  ctx.replyWithMarkdown(
    `Value for *${ctx.session.currentFilter.name}* is set`,
    Extra.markup(markup => {
      return markup.resize().keyboard(getKeyboard(ctx))
    })
  )
  ctx.session.isNumEditing = false
  ctx.session.currentFilter = null
  replyMiddleware.setSpecific(ctx, ctx.session.context)
})

function checkExistingNotification(notifications, notification) {
  var filterNotifications = notifications
    .filter(n => n.chatid == notification.chatid)
    .filter(n => n.contract == notification.contract)
  if (notification.call) {
    filterNotifications = filterNotifications.filter(
      n => n.call === notification.call
    )
  } else if (notification.event) {
    filterNotifications = filterNotifications.filter(
      n => n.event === notification.event
    )
  }
  if (filterNotifications.length > 0) {
    notificationsWithoutFilters = filterNotifications.filter(
      n => !n.filters || n.filters.length == 0
    )
    if (notificationsWithoutFilters.length > 0) return true
    else if (!notification.filters || notification.filters.length == 0) {
      return false
    } else {
      filterNotifications = filterNotifications.filter(
        n =>
          n.filters &&
          n.filters.length > 0 &&
          n.filters.find(f =>
            notification.filters.find(
              newf => newf.name == f.name && newf.value == f.value
            )
          )
      )
      if (filterNotifications.length > 0) {
        return true
      }
    }
  }
  return false
}

module.exports = {
  setFilterMenu: setFilterMenu,
  setParam: setParam,
}
