let network = "stafi"

function getEventLinks(event, eventDB, index, block) {
  var links = []
  var network = "darwinia-cc1"
  if (event.section == "democracy" && event.method == "Proposed") {
    var argIndex = _.findIndex(eventDB.args, a => a.name == "proposalIndex")
    var proposalId = event.data[argIndex].toNumber()
    links.push([
      "subscan",
      `https://${network}.subscan.io/democracy_proposal/${proposalId}`,
    ])
  } else if (
    (event.section == "democracy" && event.method == "Started") ||
    (event.section == "democracy" && event.method == "Cancelled") ||
    (event.section == "democracy" && event.method == "Passed") ||
    (event.section == "democracy" && event.method == "NotPassed") ||
    (event.section == "democracy" && event.method == "Executed")
  ) {
    var argIndex = _.findIndex(eventDB.args, a => a.name == "refIndex")
    var referendumId = event.data[argIndex].toNumber()
    links.push([
      "subscan",
      `https://${network}.subscan.io/referenda/${referendumId}`,
    ])
  } else if (
    (event.section == "treasury" && event.method == "Proposed") ||
    (event.section == "treasury" && event.method == "Awarded") ||
    (event.section == "treasury" && event.method == "Rejected")
  ) {
    var argIndex = _.findIndex(eventDB.args, a => a.name == "proposalIndex")
    var proposalId = event.data[argIndex].toNumber()
    links.push([
      "subscan",
      `https://${network}.subscan.io/treasury/${proposalId}`,
    ])
  } else if (index) {
    links.push([
      ["subscan", `https://${network}.subscan.io/extrinsic/${block}-${index}`],
    ])
  } else {
    links.push([
      ["subscan", `https://${network}.subscan.io/block/${block}?tab=event`],
    ])
  }
  return links
}

function getExtrinsicLinks(extrinsic, extrinsicDB, index, block) {
  var links = []
  var network = "darwinia-cc1"
  links.push([
    ["subscan", `https://${network}.subscan.io/extrinsic/${block}-${index}`],
  ])
  return links
}

module.exports = {
  getSettings: () => {
    const settings = {
      network: {
        name: "Darwinia CC1",
        prefix: "18",
        decimals: "9",
        token: "RING",
        tracker: "darwinia-cc1",
      },
      startMsg:
        "Created by Ryabina team.\n\nIf you like this bot, you can thank us by voting for our /validators\nFeel free to describe any issues, typo, errors at @RyabinaValidator",
      validatorsMessage:
        'To nominate us:\nGo to https://polkadot.js.org/apps/#/staking/actions\nType RYABINA in the search of "Set nominees".\nWait a while until the addreses load and select all RYABINA nodes.\nThank you!',
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
