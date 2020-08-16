const TelegrafInlineMenu = require("telegraf-inline-menu")

const mainAddAlertsMenu = new TelegrafInlineMenu(ctx => {
  ctx.session.contractsPage = 0
  ctx.session.eventsPage = 0
  ctx.session.modePage = 0
  ctx.session.notification = {}
  ctx.session.notification.chatid = ctx.chat.id
  ctx.session.mode = null
  ctx.session.modeEvents = null
  ctx.session.wallet = null

  return `What do you want to add alerts for? Select one:`
})

const mainAddAlertsMenuMiddleware = mainAddAlertsMenu.replyMenuMiddleware()

module.exports.mainAddAlerts = {
  menu: mainAddAlertsMenu,
  middleware: mainAddAlertsMenuMiddleware,
}
