let network = "stafi"

function getEventLinks(event, eventDB, index, block) {
  var links = []
  if (index) {
    links.push([
      ["subscan", `https://${network}.subscan.io/extrinsic/${block}-${index}`],
    ])
  }
  return links
}

function getExtrinsicLinks(extrinsic, extrinsicDB, index, block) {
  var links = []
  links.push([
    ["subscan", `https://${network}.subscan.io/extrinsic/${block}-${index}`],
  ])
  return links
}

module.exports = {
  getSettings: () => {
    const settings = {
      network: {
        name: "Stafi",
        prefix: "20",
        decimals: "12",
        token: "FIS",
      },
      startMsg:
        "Created by Ryabina team.\n\nIf you like this bot, you can thank by voting for our /validators\nFeel free to describe any issues, typo, errors at @RyabinaValidator",
      validatorsMessage: `Please nominate to our validators:
Go to https://apps.stafi.io/#/staking/actions
Type RYABINA in the search of "Set nominees".
Wait a while until the addresses load and select all RYABINA nodes.`,
      getEventLinks: getEventLinks,
      getExtrinsicLinks: getExtrinsicLinks,
      groupAlerts: {
        events: [
          ["democracy", "Proposed"],
          ["democracy", "Started"],
          ["treasury", "Proposed"],
        ],
        calls: [
          ["treasury", "tipNew"],
          ["treasury", "reportAwesome"],
        ],
      },
      keyboard: {
        add: "Add new alert",
        alerts: "My addresses/alerts",
        on: "Turned on✅ (Press to OFF)",
        off: "Turned off❌ (Press to ON)",
        stats: "Network stats",
      },
      botToken: process.env.BOT_TOKEN,
      dbFilePath: process.env.DB_FILE_PATH,
      callback: (data, isExtrinsic) => {},
    }
    return settings
  },
}
