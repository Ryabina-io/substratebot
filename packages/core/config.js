const botParams = {
  api: {},
  ui: {
    modules: {},
    modes: [],
  },
  db: {},
  networkStats: {},
  settings: {},
}

const keyboardOff = [
  ["Add new alert", "My addresses/alerts"],
  ["Turned off❌ (Press to ON)", "Network stats"],
]

const keyboardOn = [
  ["Add new alert", "My addresses/alerts"],
  ["Turned on✅ (Press to OFF)", "Network stats"],
]

module.exports = {
  keyboardOff: keyboardOff,
  keyboardOn: keyboardOn,
  botParams: botParams,
}
