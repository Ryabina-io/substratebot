const TelegrafInlineMenu = require("telegraf-inline-menu")
const selectTypeMenu = require("./selectTypeMenu")
const { botParams } = require("../../config")

const selectModuleMenu = new TelegrafInlineMenu(ctx => {
  ctx.session.notification = {}
  ctx.session.module = ""
  ctx.session.notification.chatid = ctx.chat.id
  return `This is a Advanced Mode. Here collected all the events and extrinsics of all the modules. It's a big list. Hope you know exactly what you're interested in 😉

Please select a module`
})

selectModuleMenu.selectSubmenu(
  "c",
  ctx => {
    return Object.keys(botParams.ui.modules)
      .sort((a, b) => {
        if (a < b) {
          return -1
        }
        if (a > b) {
          return 1
        }
        return 0
      })
      .map(k => botParams.ui.modules[k].short)
  },
  selectTypeMenu,
  {
    maxRows: 7,
    columns: 1,
    getCurrentPage: ctx => ctx.session.contractsPage,
    setPage: (ctx, page) => {
      ctx.session.contractsPage = page
    },
    textFunc: (ctx, key) => {
      var shortModule = Object.keys(botParams.ui.modules).find(
        k => botParams.ui.modules[k].short == key
      )
      if (shortModule) return shortModule
      return key
    },
  }
)

module.exports = selectModuleMenu
