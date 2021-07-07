const _ = require("lodash")

function getEventLinks(event, eventDB, index, block) {
  var links = []
  var network = "edgeware"
  if (event.section == "democracy" && event.method == "Proposed") {
    var argIndex = _.findIndex(eventDB.args, a => a.name == "proposalIndex")
    var proposalId = event.data[argIndex].toNumber()
    links.push([
      [
        "commonwealth",
        `https://commonwealth.im/${network}/proposal/democracyproposal/${proposalId}`,
      ],
      [
        "subscan",
        `https://${network}.subscan.io/democracy_proposal/${proposalId}`,
      ],
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
      [
        "commonwealth",
        `https://commonwealth.im/${network}/proposal/referendum/${referendumId}`,
      ],
      ["subscan", `https://${network}.subscan.io/referenda/${referendumId}`],
    ])
  } else if (
    (event.section == "treasury" && event.method == "Proposed") ||
    (event.section == "treasury" && event.method == "Awarded") ||
    (event.section == "treasury" && event.method == "Rejected")
  ) {
    var argIndex = _.findIndex(eventDB.args, a => a.name == "proposalIndex")
    var proposalId = event.data[argIndex].toNumber()
    links.push([
      [
        "commonwealth",
        `https://commonwealth.im/${network}/proposal/treasuryproposal/${proposalId}`,
      ],
      ["subscan", `https://${network}.subscan.io/treasury/${proposalId}`],
    ])
  } else if (index) {
    links.push([
      ["subscan", `https://${network}.subscan.io/extrinsic/${block}-${index}`],
    ])
  } else if (block) {
    links.push([["subscan", `https://${network}.subscan.io/block/${block}`]])
  }
  return links
}

function getExtrinsicLinks(extrinsic, extrinsicDB, index, block) {
  var links = []
  var network = "edgeware"
  links.push([
    ["subscan", `https://${network}.subscan.io/extrinsic/${block}-${index}`],
  ])
  return links
}

module.exports = {
  getSettings: () => {
    const settings = {
      network: {
        name: "Edgware",
        prefix: "7",
        decimals: "18",
        token: "EDG",
      },
      startMsg: `Created by Ryabina team.
      
If you like this bot, you can thank by voting for our /validators
Feel free to describe any issues, typo, errors at @RyabinaValidator`,
      validatorsMessage: `To nominate us:
        Go to https://polkadot.js.org/apps/#/staking/actions
        Type RYABINA in the search of "Set nominees".
        Wait a while until the addreses load and select all RYABINA nodes.
        Thank you!`,
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
