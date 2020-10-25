const TelegrafInlineMenu = require("telegraf-inline-menu")
const { stringUpperFirst } = require("@polkadot/util")
const TelegrafStatelessQuestion = require("telegraf-stateless-question")
const { botParams, keyboardOn, keyboardOff } = require("../../config")
const { replaceMarkdownSymbols } = require("../../tools/utils")
const Extra = require("telegraf/extra")

const editWalletNotificationsMenu = new TelegrafInlineMenu(ctx => {
  var reply
  botParams.db.read()
  var name = ctx.match[1]
  ctx.session.wallet = botParams.db
    .get("users")
    .find({ chatid: ctx.chat.id })
    .get("wallets")
    .value()
    .find(w => w.name == name)
  if (ctx.session.wallet) {
    ctx.session.currentWalletNotifications = botParams.db
      .get("notifications")
      .value()
      .filter(n => n.chatid == ctx.chat.id)
      .filter(
        n =>
          n.filters &&
          n.filters.find(f => f.value == ctx.session.wallet.address)
      )
    reply = `Name: ${replaceMarkdownSymbols(name)}
Address: \`${ctx.session.wallet.address}\`

Alerts:`
  } else {
    ctx.session.currentWalletNotifications = botParams.db
      .get("notifications")
      .value()
      .filter(n => n.chatid == ctx.chat.id)
      .filter(
        n =>
          !n.filters ||
          !n.filters.find(f =>
            botParams.db
              .get("users")
              .find({ chatid: ctx.chat.id })
              .get("wallets")
              .value()
              .map(w => w.address)
              .find(a => {
                return f.value == a
              })
          )
      )
    reply = "Other Alerts:"
  }
  if (!ctx.session.totalNotificationPages) {
    ctx.session.totalNotificationPages = Math.ceil(
      ctx.session.currentWalletNotifications.length / 10
    )
    ctx.session.notificationPage = 1
  }

  for (
    var i = 10 * (ctx.session.notificationPage - 1);
    i <
    Math.min(
      10 * (ctx.session.notificationPage - 1) + 10,
      ctx.session.currentWalletNotifications.length
    );
    i++
  ) {
    var n = ctx.session.currentWalletNotifications[i]
    reply += `\n\n${i + 1}. Module: \`${stringUpperFirst(n.contract)}\`  ${
      n.event ? "Event" : "Extrinsic"
    }: \`${n.event ?? stringUpperFirst(n.call)}\``
    if (n.filters && n.filters.length > 0) {
      reply += "\nFilters:"
      n.filters.forEach(f => {
        reply += `\n  ${f.name} ${f.isLess ? "<" : ""}${f.isMore ? ">" : ""}${
          f.isEqual ? "=" : ""
        } \`${f.value}\``
        reply += `${f.source ? "\n  (source: " + f.source + ")" : ""}`
      })
    }
  }
  return reply
})

editWalletNotificationsMenu
  .pagination("p", {
    setPage: (ctx, page) => {
      ctx.session.notificationPage = page
    },
    getCurrentPage: ctx => {
      return ctx.session.notificationPage
    },
    getTotalPages: ctx => {
      return ctx.session.totalNotificationPages
    },
    hide: ctx => {
      return ctx.session.isDeleting
    },
  })
  .button("Rename address", "r", {
    doFunc: ctx => {
      ctx.session.context = ctx.callbackQuery.data
        .split(":")
        .splice(0, 2)
        .join(":")
      ctx.session.oldName = ctx.session.wallet.name
      ctx.deleteMessage().catch(() => {
        /* ignore */
      })
      renameAddress.replyWithMarkdown(
        ctx,
        `Current Name: ${replaceMarkdownSymbols(ctx.session.wallet.name)}
Address: ${ctx.session.wallet.address}

Enter new name:`
      )
    },
    joinLastRow: true,
    hide: ctx => {
      return !ctx.session.wallet || ctx.session.isDeleting
    },
  })
  .button("Delete Alert", "d", {
    doFunc: ctx => {
      ctx.session.isDeleting = true
    },
    joinLastRow: true,
    hide: ctx => {
      return ctx.session.isDeleting
    },
  })
  .select(
    "ns",
    ctx => {
      return ctx.session.currentWalletNotifications
        .map((n, i) => i + 1)
        .filter(
          i =>
            i > 10 * (ctx.session.notificationPage - 1) &&
            i <=
              Math.min(
                10 * (ctx.session.notificationPage - 1) + 10,
                ctx.session.currentWalletNotifications.length
              )
        )
    },
    {
      setFunc: async (ctx, key) => {
        var notification = ctx.session.currentWalletNotifications[key - 1]
        botParams.db
          .get("notifications")
          .remove(n => botParams.db._.isEqual(n, notification))
          .write()
        if (ctx.session.currentWalletNotifications.length == 1) {
          if (ctx.session.wallet) {
            botParams.db
              .get("users")
              .find({ chatid: ctx.chat.id })
              .get("wallets")
              .remove(w => botParams.db._.isEqual(w, ctx.session.wallet))
              .write()
          }
          await ctx.deleteMessage().catch(() => {
            /* ignore */
          })
          walletsNotificationsMenu.replyMenuMiddleware()
        }
      },
      hide: ctx => {
        return (
          ctx.session.currentWalletNotifications.length == 1 ||
          !ctx.session.isDeleting
        )
      },
    }
  )
  .button(
    ctx =>
      ctx.session.currentWalletNotifications.length == 1
        ? "Delete"
        : "Delete All",
    "dall",
    {
      doFunc: ctx => {
        ctx.session.currentWalletNotifications.forEach(n => {
          botParams.db.get("notifications").remove(n).write()
        })
        if (ctx.session.wallet) {
          botParams.db
            .get("users")
            .find({ chatid: ctx.chat.id })
            .get("wallets")
            .remove(ctx.session.wallet)
            .write()
        }
      },
      joinLastRow: true,
      setParentMenuAfter: true,
      hide: ctx => {
        return (
          ctx.session.currentWalletNotifications.length == 0 ||
          !ctx.session.isDeleting
        )
      },
    }
  )
  .button("Exit 'Delete mode'", "b", {
    doFunc: ctx => {
      ctx.session.isDeleting = false
    },
    joinLastRow: true,
    hide: ctx => {
      return (
        ctx.session.currentWalletNotifications.length == 0 ||
        !ctx.session.isDeleting
      )
    },
  })

const editWalletNotificationsMenuMiddleware = editWalletNotificationsMenu.replyMenuMiddleware()

const renameAddress = new TelegrafStatelessQuestion("readrNm", async ctx => {
  if (ctx.message.text.match(/^\s+$/)) {
    return renameAddress.replyWithMarkdown(
      ctx,
      `Sorry, but an empty name is not acceptable. Please try again.`
    )
  }
  var user = botParams.db.get("users").find({ chatid: ctx.chat.id })
  user
    .get("wallets")
    .find({ address: ctx.session.wallet.address })
    .assign({ name: ctx.message.text })
    .write()
  ctx.replyWithMarkdown(
    `New name for *${ctx.session.wallet.address}* is set`,
    Extra.markup(markup => {
      return markup
        .resize()
        .keyboard(user.value().enabled ? keyboardOn() : keyboardOff())
    })
  )
  var newContext = ctx.session.context.replace(
    ctx.session.oldName,
    ctx.message.text
  )
  editWalletNotificationsMenuMiddleware.setSpecific(ctx, newContext)
})

module.exports = {
  editWalletNotificationsMenu: editWalletNotificationsMenu,
  renameAddress: renameAddress,
}
