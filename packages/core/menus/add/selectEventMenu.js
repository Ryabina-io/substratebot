const TelegrafInlineMenu = require("telegraf-inline-menu")
const { setFilterMenu } = require("./setFilterMenu")
const { stringUpperFirst } = require("@polkadot/util")
const { botParams } = require("../../config")

const selectEventMenu = new TelegrafInlineMenu(ctx => {
  if (ctx.session.notification) {
    ctx.session.notification.filters = []
    //ctx.session.notification.contract = ctx.match[1][0].toLowerCase() + ctx.match[1].substr(1)
    ctx.session.isNumEditing = false
    ctx.session.isFiltering = false
  }
  return `This is events of the *${ctx.session.module}* module. 
        
Please select one`
})

selectEventMenu.selectSubmenu(
  "e",
  ctx => {
    if (botParams.ui.modules[ctx.session.module]) {
      if (ctx.match[2] == "clls") {
        return Object.keys(botParams.ui.modules[ctx.session.module].calls).map(
          k => botParams.ui.modules[ctx.session.module].calls[k].short
        )
      } else if (ctx.match[2] == "evnts") {
        var egvnts = Object.keys(
          botParams.ui.modules[ctx.session.module].events
        ).map(k => botParams.ui.modules[ctx.session.module].events[k].short)
        return egvnts
      } else {
        console.log(new Date(), "wrong")
      }
    }
    return []
  },
  setFilterMenu,
  {
    maxRows: 7,
    columns: 1,
    getCurrentPage: ctx => ctx.session.eventsPage,
    setPage: (ctx, page) => {
      ctx.session.eventsPage = page
    },
    textFunc: (ctx, key) => {
      if (ctx.match[2] == "clls") {
        var call = Object.keys(
          botParams.ui.modules[ctx.session.module].calls
        ).find(
          k => botParams.ui.modules[ctx.session.module].calls[k].short == key
        )
        if (call) return stringUpperFirst(call)
        return key
      } else if (ctx.match[2] == "evnts") {
        var event = Object.keys(
          botParams.ui.modules[ctx.session.module].events
        ).find(
          k => botParams.ui.modules[ctx.session.module].events[k].short == key
        )
        if (event) return event
        return key
      }
    },
  }
)

module.exports = selectEventMenu
