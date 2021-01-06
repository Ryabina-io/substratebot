let network = "polkadot"

function getEventLinks(event, eventDB, index, block) {
  var links = []
  if (event.section == "democracy" && event.method == "Proposed") {
    var argIndex = _.findIndex(eventDB.args, a => a.name == "proposalIndex")
    var proposalId = event.data[argIndex].toNumber()
    links.push([
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
        name: "Polkadot",
        prefix: "0",
        decimals: "10",
        token: "DOT",
      },
      startMsg:
        "Created by Ryabina team.\n\nIf you like this bot, you can thank by voting for our /validators\nFeel free to describe any issues, typo, errors at @RyabinaValidator",
      validatorsMessage: `Please nominate to our validators:
      Go to https://polkadot.js.org/apps/#/staking/actions
      Type RYABINA in the search of "Set nominees".
      Wait a while until the addresses load and select all RYABINA nodes.
      If the search doesn't work, use the addresses.
      Choose 16 validators from active and waiting sets to increase expected rewards.
      Thank you!
          
            RYABINA
            13T9UGfntid52aHuaxX1j6uh3zTYzMPMG1Des9Cmvf7K4xfq
            RYABINA/ 2
            14xKzzU1ZYDnzFj7FgdtDAYSMJNARjDc2gNw4XAFDgr4uXgp
            RYABINA/ 3
            1vEVWfqoLErB6MhhtDijrnmnHqjhrrFA5GzXGNL2HwESQ5r
            RYABINA/ 4
            1EmFhcsr7xt4HiMc8KZz6W6QcjYSFukKGKeDZeBjSmjjpNM
            RYABINA/ 5
            1HZMocNpdw6VYS1aKyrdu1V7kHpbdCvhL8VKayvzVzqTf6H
            RYABINA/ 8
            13asdY4e7sWdJ4hbGW9n2rkNro1mx5YKB6WBCC9gvqKmLvNH`,
      getEventLinks: getEventLinks,
      getExtrinsicLinks: getExtrinsicLinks,
      groupAlerts: {
        events: [
          ["democracy", "Proposed"],
          ["democracy", "Started"],
          ["treasury", "Proposed"],
          ["treasury", "BountyProposed"],
          ["ecosystem", "PolkadotAlert"],
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
