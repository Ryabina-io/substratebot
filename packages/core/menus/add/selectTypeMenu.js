const TelegrafInlineMenu = require("telegraf-inline-menu")
const selectEventMenu = require("./selectEventMenu")
const { botParams } = require("../../config")
const { stringLowerFirst } = require("@polkadot/util")

const selectTypeMenu = new TelegrafInlineMenu(ctx => {
  ctx.session.notification = {}
  ctx.session.notification.chatid = ctx.chat.id
  if (ctx.session.module == "") {
    ctx.session.module = Object.keys(botParams.ui.modules).find(
      k => botParams.ui.modules[k].short == ctx.match[1]
    )
  }
  return `Module *${ctx.session.module}*. 

Please select which type of alerts you want to setup`
})

selectTypeMenu.selectSubmenu(
  "q",
  ctx => {
    var types = []
    if (ctx.session.module == "") {
      ctx.session.module = Object.keys(botParams.ui.modules).find(
        k => botParams.ui.modules[k].short == ctx.match[1]
      )
    }
    ctx.session.notification.contract = stringLowerFirst(ctx.session.module)
    if (
      botParams.ui.modules[ctx.session.module] &&
      botParams.ui.modules[ctx.session.module].calls &&
      Object.keys(botParams.ui.modules[ctx.session.module].calls).length > 0
    ) {
      types.push("clls")
    }
    if (
      botParams.ui.modules[ctx.session.module] &&
      botParams.ui.modules[ctx.session.module].events &&
      Object.keys(botParams.ui.modules[ctx.session.module].events).length > 0
    ) {
      types.push("evnts")
    }
    return types
  },
  selectEventMenu,
  {
    textFunc: (ctx, key) => {
      if (key == "clls") return "Extrinsics"
      else return "Events"
    },
  }
)

module.exports = selectTypeMenu
