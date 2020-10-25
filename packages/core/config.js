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
  keyboardOn: () => {
    return [
      [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
      [botParams.ui.keyboard.on, botParams.ui.keyboard.stats],
    ]
  },
  keyboardOff: () => {
    return [
      [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
      [botParams.ui.keyboard.off, botParams.ui.keyboard.stats],
    ]
  },
}
