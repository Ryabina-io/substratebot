const TelegrafInlineMenu = require("telegraf-inline-menu")
const { botParams } = require("../config")

const refreshMenu = new TelegrafInlineMenu(ctx => {
  if (!ctx.session.statsMessage) {
    ctx.session.statsMessage = ""
    var group = botParams.db.get("users").find({ chatid: ctx.chat.id }).value()
    if (group && group.price) {
      ctx.session.statsMessage = botParams.getNetworkStatsMessage(true, true)
    } else
      ctx.session.statsMessage = botParams.getNetworkStatsMessage(false, true)
  }
  return ctx.session.statsMessage
})

refreshMenu.button("refresh", "r", {
  doFunc: ctx => {
    ctx.session.statsMessage = ""
    var group = botParams.db.get("users").find({ chatid: ctx.chat.id }).value()
    if (group && group.price) {
      ctx.session.statsMessage = botParams.getNetworkStatsMessage(true, true)
    } else
      ctx.session.statsMessage = botParams.getNetworkStatsMessage(false, true)
  },
})

refreshMenuMiddleware = refreshMenu.replyMenuMiddleware()

module.exports = {
  refreshMenu: refreshMenu,
  refreshMenuMiddleware: refreshMenuMiddleware,
}
