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

let isOn = true
let isBroadcastOn = true

module.exports = {
  botParams: botParams,
  keyboardOn: () => {
    isOn = true
    if (
      botParams.ui.keyboard.broadcastOn != undefined &&
      botParams.ui.keyboard.broadcastOff != undefined
    ) {
      if (isBroadcastOn) {
        return [
          [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
          [
            botParams.ui.keyboard.on,
            botParams.ui.keyboard.stats,
            botParams.ui.keyboard.broadcastOn,
          ],
        ]
      } else {
        return [
          [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
          [
            botParams.ui.keyboard.on,
            botParams.ui.keyboard.stats,
            botParams.ui.keyboard.broadcastOff,
          ],
        ]
      }
    } else {
      return [
        [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
        [botParams.ui.keyboard.on, botParams.ui.keyboard.stats],
      ]
    }
  },
  keyboardOff: () => {
    isOn = false
    if (
      botParams.ui.keyboard.broadcastOn != undefined &&
      botParams.ui.keyboard.broadcastOff != undefined
    ) {
      if (isBroadcastOn) {
        return [
          [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
          [
            botParams.ui.keyboard.off,
            botParams.ui.keyboard.stats,
            botParams.ui.keyboard.broadcastOn,
          ],
        ]
      } else {
        return [
          [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
          [
            botParams.ui.keyboard.off,
            botParams.ui.keyboard.stats,
            botParams.ui.keyboard.broadcastOff,
          ],
        ]
      }
    } else {
      return [
        [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
        [botParams.ui.keyboard.off, botParams.ui.keyboard.stats],
      ]
    }
  },
  keyboardBroadcastOn: () => {
    isBroadcastOn = true
    if (isOn) {
      return [
        [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
        [
          botParams.ui.keyboard.on,
          botParams.ui.keyboard.stats,
          botParams.ui.keyboard.broadcastOn,
        ],
      ]
    } else {
      return [
        [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
        [
          botParams.ui.keyboard.off,
          botParams.ui.keyboard.stats,
          botParams.ui.keyboard.broadcastOn,
        ],
      ]
    }
  },
  keyboardBroadcastOff: () => {
    isBroadcastOn = false
    if (isOn) {
      return [
        [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
        [
          botParams.ui.keyboard.on,
          botParams.ui.keyboard.stats,
          botParams.ui.keyboard.broadcastOff,
        ],
      ]
    } else {
      return [
        [botParams.ui.keyboard.add, botParams.ui.keyboard.alerts],
        [
          botParams.ui.keyboard.off,
          botParams.ui.keyboard.stats,
          botParams.ui.keyboard.broadcastOff,
        ],
      ]
    }
  },
}
