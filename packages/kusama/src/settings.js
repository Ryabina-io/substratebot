let network = "kusama"

function getEventLinks(event, eventDB, index, block) {
  var links = []
  if (event.section == "democracy" && event.method == "Proposed") {
    var argIndex = _.findIndex(eventDB.args, a => a.name == "proposalIndex")
    var proposalId = event.data[argIndex].toNumber()
    links.push([
      [
        "commonwealth",
        `https://commonwealth.im/${network}/proposal/democracyproposal/${proposalId}`,
      ],
      [
        "polkassembly",
        `https://${network}.polkassembly.io/proposal/${proposalId}`,
      ],
    ])
    links.push(
      [
        "polkascan",
        `https://polkascan.io/${network}/democracy/proposal/${proposalId}`,
      ],
      [
        "subscan",
        `https://${network}.subscan.io/democracy_proposal/${proposalId}`,
      ]
    )
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
      [
        "polkassembly",
        `https://${network}.polkassembly.io/referendum/${referendumId}`,
      ],
    ])
    links.push(
      [
        "polkascan",
        `https://polkascan.io/${network}/democracy/referendum/${referendumId}`,
      ],
      ["subscan", `https://${network}.subscan.io/referenda/${referendumId}`]
    )
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
      [
        "polkassembly",
        `https://${network}.polkassembly.io/treasury/${proposalId}`,
      ],
    ])
    links.push(
      [
        "polkascan",
        `https://polkascan.io/${network}/treasury/proposal/${proposalId}`,
      ],
      ["subscan", `https://${network}.subscan.io/treasury/${proposalId}`]
    )
  } else if (index) {
    links.push([
      ["subscan", `https://${network}.subscan.io/extrinsic/${block}-${index}`],
      [
        "polkascan",
        `https://polkascan.io/${network}/transaction/${block}-${index}`,
      ],
    ])
  } else {
    links.push([
      ["subscan", `https://${network}.subscan.io/block/${block}?tab=event`],
      ["polkascan", `https://polkascan.io/${network}/block/${block}#events`],
    ])
  }
  return links
}

function getExtrinsicLinks(extrinsic, extrinsicDB, index, block) {
  var links = []
  links.push([
    ["subscan", `https://${network}.subscan.io/extrinsic/${block}-${index}`],
    [
      "polkascan",
      `https://polkascan.io/${network}/transaction/${block}-${index}`,
    ],
  ])
  return links
}

module.exports = {
  getSettings: () => {
    const settings = {
      network: {
        name: "Kusama",
        prefix: "2",
        decimals: "12",
        token: "KSM",
      },
      startMsg:
        "Created by Ryabina team.\n\nIf you like this bot, you can thank by voting for our /validators\nFeel free to describe any issues, typo, errors at @RyabinaValidator",
      validatorsMessage:
        'To nominate us:\nGo to https://polkadot.js.org/apps/#/staking/actions\nType RYABINA in the search of "Set nominees".\nWait a while until the addreses load and select all RYABINA nodes.\nThank you!',
      getEventLinks: getEventLinks,
      getExtrinsicLinks: getExtrinsicLinks,
      groupAlerts: {
        events: [
          ["democracy", "Proposed"],
          ["democracy", "Started"],
          ["treasury", "Proposed"],
          ["treasury", "BountyProposed"],
          ["ecosystem", "KusamaAlert"],
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
        broadcastOn: "Broadcast on✅ (Press to OFF)",
        broadcastOff: "Broadcast off❌ (Press to ON)",
      },
      botToken: process.env.BOT_TOKEN,
      dbFilePath: process.env.DB_FILE_PATH,
      callback: (data, isExtrinsic) => {},
    }
    return settings
  },
}
