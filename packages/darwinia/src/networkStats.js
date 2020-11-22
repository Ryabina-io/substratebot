const BigNumber = require("bignumber.js")
const { formatBalance } = require("@polkadot/util")
const bent = require("bent")
const getJSON = bent("json")

let networkStats = {}

function getNetworkStatsMessage(priceIncluded = true, isGroup = false) {
  var result = `Darwinia CC1 network Stats:\n\n`

  if (networkStats.tokens) {
    networkStats.tokens.forEach(token => {
      result += `${token.name}\n`
      if (priceIncluded) {
        result += `    Current Price: ${token.stats.price}
    Market Capitalisation: ${token.stats.marketcap}
    Total Volume: ${token.stats.volume}\n`
      }
      result += `    Total issuance: ${token.stats.totalIssuance}
    Total staked: ${token.stats.totalStaked} (${token.stats.percentStaked}%)\n`
    })
  }

  result += `Validators: 
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

async function getNetworkStats(api) {
  const networkStats = {}
  var ringStats = {}
  var ktonStats = {}

  /*
   * get RING stats
   */
  try {
    const ring_data = await getJSON(
      `https://api.coingecko.com/api/v3/coins/darwinia-network-native-token`
    )

    ringStats.marketcap = formatBalance(ring_data.market_data.market_cap.usd, {
      decimals: 0,
      withSi: true,
      withUnit: "USD",
    })
    ringStats.price =
      ring_data.market_data.current_price.usd.toString() + " USD"
    ringStats.volume = formatBalance(ring_data.market_data.total_volume.usd, {
      decimals: 0,
      withSi: true,
      withUnit: "USD",
    })
  } catch {
    ringStats.marketcap = "NA"
    ringStats.price = "NA"
    ringStats.volume = "NA"
  }
  const totalIssuanceRing = await api.query.balances.totalIssuance()
  ringStats.totalIssuance = formatBalance(totalIssuanceRing, {
    decimals: api.registry.chainDecimals,
    withUnit: "RING",
  })
  const stakedRing = await api.query.staking.ringPool()
  ringStats.percentStaked = ((100 * stakedRing) / totalIssuanceRing).toFixed(2)
  ringStats.totalStaked = formatBalance(stakedRing, {
    decimals: api.registry.chainDecimals,
    withUnit: "RING",
  })

  /*
   * get KTON stats
   */
  var kton_data
  try {
    kton_data = await getJSON(
      `https://api.coingecko.com/api/v3/coins/darwinia-commitment-token`
    )
    ktonStats.price =
      kton_data.market_data.current_price.usd.toString() + " USD"
    ktonStats.volume = formatBalance(kton_data.market_data.total_volume.usd, {
      decimals: 0,
      withSi: true,
      withUnit: "USD",
    })
  } catch {
    ktonStats.marketcap = "NA"
    ktonStats.price = "NA"
    ktonStats.volume = "NA"
  }
  const totalIssuanceKton = await api.query.kton.totalIssuance()
  ktonStats.totalIssuance = formatBalance(totalIssuanceKton, {
    decimals: api.registry.chainDecimals,
    withUnit: "KTON",
  })
  ktonMarketcap = new BigNumber(
    kton_data.market_data.current_price.usd
  ).multipliedBy(totalIssuanceKton.toNumber())
  ktonStats.marketcap = formatBalance(ktonMarketcap.toNumber(), {
    decimals: 9,
    withSi: true,
    withUnit: "USD",
  })
  const stakedKton = await api.query.staking.ktonPool()
  ktonStats.percentStaked = ((100 * stakedKton) / totalIssuanceKton).toFixed(2)
  ktonStats.totalStaked = formatBalance(stakedKton, {
    decimals: api.registry.chainDecimals,
    withUnit: "KTON",
  })
  var validators = await api.query.session.validators()
  var validators2 = await api.query.staking.validators.entries()
  var nominators = await api.query.staking.nominators.entries()

  if (api.query.democracy) {
    const referendums = await api.query.democracy.referendumInfoOf.entries()
    const ongoingReferendums = referendums.filter(r => r[1].value.isOngoing)
    const ongoingProposals = await api.query.democracy.publicProps()

    networkStats.ongoingProposalsCount = ongoingProposals.length
    networkStats.ongoingReferendumsCount = ongoingReferendums.length
  }

  networkStats.tokens = [
    { name: "RING", stats: ringStats },
    { name: "KTON", stats: ktonStats },
  ]

  networkStats.elected = validators.length
  networkStats.waiting = validators2.length - validators.length
  networkStats.nominators = nominators.length
  return networkStats
}

function startNetworkStatsRefreshing(api) {
  getNetworkStats(api).then(result => (networkStats = result))
  setInterval(async () => {
    networkStats = await getNetworkStats(api)
  }, 10000)
}

module.exports = {
  startNetworkStatsRefreshing: startNetworkStatsRefreshing,
  getNetworkStatsMessage: getNetworkStatsMessage,
}
