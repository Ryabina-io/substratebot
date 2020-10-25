const SubstrateBot = require("@ryabina-io/substratebot")
const { ApiPromise, WsProvider } = require("@polkadot/api")
const BigNumber = require("bignumber.js")
const { metaConvertToConfig } = require("@ryabina-io/substratebot/tools/utils")
const { formatBalance } = require("@polkadot/util")
const bent = require("bent")
const getJSON = bent("json")
const _ = require("lodash")
const types = require("./types.json")

let networkStats = {}

async function main() {
  var settings = getSettings()
  var api = await getAPI()
  var modules = getNodeModules(api)
  var modes = getModes()
  getNetworkStats(api).then(result => (networkStats = result))
  setInterval(async () => {
    networkStats = await getNetworkStats(api)
  }, 10000)

  const substrateBot = new SubstrateBot({
    settings,
    api,
    modules,
    modes,
    getNetworkStatsMessage,
  })
  substrateBot.run()
}

function getSettings() {
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
    botToken: process.env.BOT_TOKEN,
    dbFilePath: process.env.DB_FILE_PATH,
  }
  return settings
}

async function getAPI() {
  const nodeUri = process.env.NODE_URI || "wss://cc1.darwinia.network"
  const provider = new WsProvider(nodeUri)
  const api = await ApiPromise.create({
    provider,
    types: types,
  })
  Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]).then(data => {
    console.log(
      new Date(),
      `You are connected to chain ${data[0]} using ${data[1]} v${data[2]}`
    )
  })
  return api
}

function getModes() {
  const modes = [
    {
      name: "Address alerts",
      index: "u",
      description:
        "Here are most useful events for your account.\n\nYou can select🟢/ unselect⚪️ by clicking on them.",
      isAddressFiltering: true,
      alerts: [
        {
          name: "Transfer",
          contract: "balances",
          event: "Transfer",
          filters: ["from", "to"],
          short: "Trnsfr",
          selected: true,
        },
        {
          name: "Reward",
          contract: "staking",
          event: "Reward",
          filters: ["stash"],
          short: "Rwrd",
          selected: true,
        },
        {
          name: "Slash",
          contract: "staking",
          event: "Slash",
          filters: ["address"],
          short: "Slsh",
          selected: true,
        },
        {
          name: "Nominated validator has updated the fee",
          contract: "staking",
          call: "validate",
          filters: ["sender"],
          source: "nominator",
          short: "Vldt",
          selected: true,
        },
        {
          name: "Account was nominating validators (for nominators)",
          contract: "staking",
          call: "nominate",
          filters: ["sender"],
          short: "nmntsndr",
          selected: false,
        },
        {
          name: "Account was nominated (for validators)",
          contract: "staking",
          call: "nominate",
          filters: ["targets"],
          short: "nmnttrgts",
          selected: false,
        },
        {
          name: "Account has unbonded some amount",
          contract: "staking",
          event: "Unbonded",
          filters: ["stash"],
          short: "nbndd",
          selected: false,
        },
      ],
    },
    {
      name: "Democracy and Treasury events",
      index: "d",
      description:
        "Here are most useful events for Democracy and Treasury.\n\nYou can select🟢/ unselect⚪️ by clicking on them.",
      isAddressFiltering: false,
      alerts: [
        {
          name: " A motion has been proposed",
          contract: "democracy",
          event: "Proposed",
          short: "DPrpsd",
          selected: true,
        },
        {
          name: "A referendum has begun",
          contract: "democracy",
          event: "Started",
          short: "Strtd",
          selected: true,
        },
        {
          name: "A proposal has been Passed",
          contract: "democracy",
          event: "Passed",
          short: "Pssd",
          selected: false,
        },
        {
          name: "A proposal has been No passed",
          contract: "democracy",
          event: "NotPassed",
          short: "NtPssd",
          selected: false,
        },
        {
          name: "A proposal has been Canceled",
          contract: "democracy",
          event: "Cancelled",
          short: "Cnclld",
          selected: false,
        },
        {
          name: "A proposal has been executed",
          contract: "democracy",
          event: "Executed",
          short: "Exctd",
          selected: false,
        },
        {
          name: "New Treasury Tip",
          contract: "treasury",
          call: "tipNew",
          short: "NwTp",
          selected: true,
        },
        {
          name: "New Treasury proposal",
          contract: "treasury",
          call: "proposeSpend",
          short: "TPrpsd",
          selected: true,
        },
      ],
    },
  ]
  return modes
}

function getNodeModules(api) {
  const ingoreList = {
    events: [
      "ExtrinsicSuccess",
      "ExtrinsicFailed",
      "BatchInterrupted",
      "BatchCompleted",
    ],
    calls: ["batch"],
    hide: [
      "GenericAccountId",
      "GenericAddress",
      "u8",
      "u16",
      "u32",
      "u64",
      "u128",
      "u256",
      "i8",
      "i16",
      "i32",
      "i64",
      "i128",
      "i256",
      "bool",
    ],
  }
  const modules = metaConvertToConfig(api, ingoreList)
  return modules
}

function getNetworkStatsMessage(priceIncluded = true, isGroup = false) {
  var result = `Darwinia CC1 network Stats:\n\n`
  if (priceIncluded) {
    result += `Current Price: ${networkStats.price}
Market Capitalisation: ${networkStats.marketcap}
Total Volume: ${networkStats.volume}\n`
  }
  result += `Total issuance: ${networkStats.totalIssuance}
Total staked: ${networkStats.totalStaked} (${networkStats.percentStaked}%)
Validators: 
    Elected - ${networkStats.elected}
    Waiting - ${networkStats.waiting}`
  if (
    networkStats.ongoingReferendumsCount &&
    networkStats.ongoingProposalsCount
  ) {
    result += `
Democracy:
    Ongoing referendums: ${networkStats.ongoingReferendumsCount}
    Ongoing proposals: ${networkStats.ongoingProposalsCount}
`
  }
  if (!isGroup) {
    result += `
Nominate our /validators
Feedback and support @RyabinaValidator`
  }
  return result
}

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

async function getNetworkStats(api) {
  const networkStats = {}
  var token_data
  try {
    var token_data = await getJSON(
      `https://api.coingecko.com/api/v3/coins/darwinia-network-native-token`
    )
  } catch (error) {
    token_data = "NA"
  }
  var validators = await api.query.session.validators()
  var validators2 = await api.query.staking.validators.entries()
  var nominators = await api.query.staking.nominators.entries()
  var era = await api.query.staking.activeEra()
  const totalIssuance = await api.query.balances.totalIssuance()
  const totalStake = await api.query.staking.erasTotalStake(
    era.value.index.toString()
  )
  const marketcap =
    token_data != "NA"
      ? formatBalance(
          new BigNumber(totalIssuance.toString())
            .multipliedBy(
              new BigNumber(token_data.market_data.current_price.usd)
            )
            .toFixed(0),
          {
            decimals: api.registry.chainDecimals,
            withSi: true,
            withUnit: "USD",
          }
        )
      : token_data

  if (api.query.democracy) {
    const referendums = await api.query.democracy.referendumInfoOf.entries()
    const ongoingReferendums = referendums.filter(r => r[1].value.isOngoing)
    const ongoingProposals = await api.query.democracy.publicProps()

    networkStats.ongoingProposalsCount = ongoingProposals.length
    networkStats.ongoingReferendumsCount = ongoingReferendums.length
  }

  networkStats.price =
    token_data != "NA"
      ? token_data.market_data.current_price.usd.toString() + " USD"
      : token_data
  networkStats.volume =
    token_data != "NA"
      ? new BigNumber(token_data.market_data.total_volume.usd.toString())
          .dividedBy(new BigNumber("1e6"))
          .toFixed(2) + "M USD"
      : token_data
  networkStats.marketcap = marketcap
  networkStats.totalIssuance = totalIssuance.toHuman()
  networkStats.totalStaked = totalStake.toHuman()
  networkStats.percentStaked = new BigNumber(totalStake.toString())
    .dividedBy(new BigNumber(totalIssuance.toString()))
    .multipliedBy(new BigNumber(100))
    .toFixed(2)
  networkStats.elected = validators.length
  networkStats.waiting = validators2.length - validators.length
  networkStats.nominators = nominators.length
  return networkStats
}

main()
