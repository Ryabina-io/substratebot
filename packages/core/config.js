const botParams = {
  api: {},
  ui: {
    modules: {},
    modes: [],
    keyboard: {
      add: "",
      alerts: "",
      on: "",
      off: "",
      stats: "",
    },
    commands: [],
  },
  db: {},
  networkStats: {},
  settings: {},
}

module.exports = {
  botParams: botParams,
  setUserEnable: (ctx, enable) => {
    botParams.db
      .get("users")
      .find({ chatid: ctx.chat.id })
      .assign({ enabled: enable })
      .write()
  },
  setUserBroadcast: (ctx, broadcast) => {
    botParams.db
      .get("users")
      .find({ chatid: ctx.chat.id })
      .assign({ broadcast: broadcast })
      .write()
  },
  getKeyboard: ctx => {
    var user = botParams.db.get("users").find({ chatid: ctx.chat.id }).value()
    var keyboard = [
      [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
      [],
    ]
    if (user.enabled) {
      keyboard[1].push(botParams.ui.keyboard.on)
    } else {
      keyboard[1].push(botParams.ui.keyboard.off)
    }
    keyboard[1].push(botParams.ui.keyboard.stats)
    if (user.broadcast) {
      keyboard[1].push(botParams.ui.keyboard.broadcastOn)
    } else {
      keyboard[1].push(botParams.ui.keyboard.broadcastOff)
    }
    return keyboard
  },
}
