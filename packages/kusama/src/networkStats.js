const BigNumber = require("bignumber.js")
const { formatBalance } = require("@polkadot/util")
const bent = require("bent")
const getJSON = bent("json")

let networkStats = {}

function getNetworkStatsMessage(priceIncluded = true, isGroup = false) {
  var result = `Kusama network Stats:\n\n`
  if (priceIncluded) {
    result += `Current Price: ${networkStats.price}
Market Capitalisation: ${networkStats.marketcap}
Total Volume: ${networkStats.volume}\n`
  }
  result += `Total issuance: ${networkStats.totalIssuance}
Total staked: ${networkStats.totalStaked} (${networkStats.percentStaked}%)
Validators: 
    Elected - ${networkStats.elected}; 
    Waiting - ${networkStats.waiting}
Democracy:
    Ongoing referendums: ${networkStats.ongoingReferendumsCount}
    Ongoing proposals: ${networkStats.ongoingProposalsCount}
`
  if (!isGroup) {
    result += `
Nominate our /validators
Feedback and support @RyabinaValidator`
  }
  return result
}

async function getNetworkStats(api) {
  const result = {}
  var token_data
  try {
    var token_data = await getJSON(
      `https://api.coingecko.com/api/v3/coins/kusama/`
    )
  } catch (error) {
    console.error(new Date(), error.message)
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
            decimals: 12,
            withSi: true,
            withUnit: "USD",
          }
        )
      : token_data

  result.price =
    token_data != "NA"
      ? token_data.market_data.current_price.usd.toString() + " USD"
      : token_data
  result.volume =
    token_data != "NA"
      ? new BigNumber(token_data.market_data.total_volume.usd.toString())
          .dividedBy(new BigNumber("1e6"))
          .toFixed(2) + "M USD"
      : token_data
  result.marketcap = marketcap
  result.totalIssuance = formatBalance(
    new BigNumber(totalIssuance.toString()).toFixed(0),
    {
      decimals: 12,
      withSi: true,
      withUnit: "KSM",
    }
  )

  result.totalStaked = formatBalance(
    new BigNumber(totalStake.toString()).toFixed(0),
    {
      decimals: 12,
      withSi: true,
      withUnit: "KSM",
    }
  )

  result.percentStaked = new BigNumber(totalStake.toString())
    .dividedBy(new BigNumber(totalIssuance.toString()))
    .multipliedBy(new BigNumber(100))
    .toFixed(2)
  result.elected = validators.length
  result.waiting = validators2.length - validators.length
  result.nominators = nominators.length
  return result
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
