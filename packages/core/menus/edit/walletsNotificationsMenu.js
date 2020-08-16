const TelegrafInlineMenu = require("telegraf-inline-menu")
const { botParams } = require("../../config")
const { editWalletNotificationsMenu } = require("./editWalletNotificationsMenu")

const walletsNotificationsMenu = new TelegrafInlineMenu(ctx => {
  botParams.db.read()
  ctx.session.isDeleting = false
  ctx.session.walletsNotifications = []
  ctx.session.currentWalletNotifications = null
  ctx.session.totalNotificationPages = null
  ctx.session.wallet = null
  ctx.session.notifications = botParams.db
    .get("notifications")
    .value()
    .filter(n => n.chatid == ctx.chat.id)
  if (ctx.session.notifications.length == 0) {
    return `You don't have any alerts yet.`
  } else {
    var user = botParams.db.get("users").find({ chatid: ctx.chat.id })
    user
      .get("wallets")
      .value()
      .forEach(w => {
        var notifications = ctx.session.notifications.filter(
          n => n.filters && n.filters.find(f => f.value == w.address)
        )
        if (notifications.length > 0) {
          ctx.session.walletsNotifications.push({
            wallet: w,
            notifications: notifications,
          })
        }
      })
    var others = ctx.session.notifications.filter(
      n =>
        !n.filters ||
        !n.filters.find(f =>
          ctx.session.walletsNotifications
            .map(wn => wn.wallet)
            .find(w => f.value == w.address)
        )
    )
    if (others.length > 0)
      ctx.session.walletsNotifications.push({
        wallet: { name: "Other Alerts" },
        notifications: others,
      })
    var reply = `All your alerts are grouped by the accounts they're linked to.

If an alert is not linked to any of your accounts, it is added to 'Other Alerts' group.`
    return reply
  }
})

const walletsNotificationsMenuMiddleware = walletsNotificationsMenu.replyMenuMiddleware()

walletsNotificationsMenu.selectSubmenu(
  "a",
  ctx => {
    return ctx.session.walletsNotifications.map(wn =>
      wn.wallet.name != "" ? wn.wallet.name : wn.wallet.address
    )
  },
  editWalletNotificationsMenu,
  {
    hide: ctx => {
      if (
        !ctx.session ||
        !ctx.session.walletsNotifications ||
        ctx.session.walletsNotifications.length == 0
      )
        true
      return false
    },
    maxRows: 7,
    columns: 1,
    getCurrentPage: ctx => ctx.session.addressesPage,
    setPage: (ctx, page) => {
      ctx.session.addressesPage = page
    },
  }
)

module.exports = {
  walletsNotificationsMenu,
  walletsNotificationsMenuMiddleware,
}
