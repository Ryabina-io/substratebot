const { ApiPromise, WsProvider } = require("@polkadot/api")
const { options } = require("@acala-network/api")
const BigNumber = require("bignumber.js")
const SubstrateBot = require("@ryabina/substratebot")
const { metaConvertToConfig } = require("substratebot/tools/utils")
const { formatBalance } = require("@polkadot/util")
const bent = require("bent")
const getJSON = bent("json")

let networkStats = {}
let totalCollaterals, liquidationRatio, debitRate, liquidStakingExchangeRate
var alreadyRecieved = new Map()

async function main() {
  var settings = getSettings()
  var api = await getAPI()
  var modules = getNodeModules(api)
  var modes = getModes()
  getNetworkStats(api).then(result => (networkStats = result))
  setInterval(async () => {
    networkStats = await getNetworkStats(api)
  }, 10000)
  totalCollaterals = await getAllCollaterals(api)
  const substrateBot = new SubstrateBot({
    settings,
    api,
    modules,
    modes,
    getNetworkStatsMessage,
  })
  substrateBot.run()

  api.query.system.events(events => {
    events
      .filter(record => {
        const { event } = record
        if (
          (event.section == "loans" && event.method == "PositionUpdated") ||
          (event.section == "oracle" && event.method == "NewFeedData") ||
          (event.section == "cdpEngine" && event.method == "LiquidateUnsafeCDP")
        ) {
          return true
        } else return false
      })
      .forEach(record => {
        if (
          alreadyRecieved.get(
            record.hash.toHuman ? record.hash.toHuman() : record.hash.toJSON()
          )
        ) {
          return alreadyRecieved.set(
            record.hash.toHuman ? record.hash.toHuman() : record.hash.toJSON(),
            new Date()
          )
        }
        const { event } = record
        if (event.method == "PositionUpdated") {
          var account = event.data[0].toHuman()
          var collateralType = event.data[1].toHuman()
          var amount = new BigNumber(
            event.data[2].toString() + `e-${api.registry.chainDecimals}`
          )
          var debit = new BigNumber(
            event.data[3].toString() + `e-${api.registry.chainDecimals}`
          ).multipliedBy(new BigNumber(debitRate[collateralType]))
          if (!totalCollaterals[collateralType]) {
            totalCollaterals[collateralType] = {}
          }
          if (totalCollaterals[collateralType][account]) {
            totalCollaterals[collateralType][account].amount = totalCollaterals[
              collateralType
            ][account].amount.plus(amount)
            totalCollaterals[collateralType][account].debit = totalCollaterals[
              collateralType
            ][account].debit.plus(debit)
            if (
              totalCollaterals[collateralType][account].amount.toFixed() ==
                "0" &&
              totalCollaterals[collateralType][account].debit.toFixed() == "0"
            ) {
              delete totalCollaterals[collateralType][account]
            } else {
              totalCollaterals[collateralType][
                account
              ].liquidationPrice = new BigNumber(
                liquidationRatio[collateralType]
              )
                .multipliedBy(totalCollaterals[collateralType][account].debit)
                .dividedBy(totalCollaterals[collateralType][account].amount)
            }
          } else {
            totalCollaterals[collateralType][account] = {
              amount: amount,
              debit: debit,
            }
            totalCollaterals[collateralType][
              account
            ].liquidationPrice = new BigNumber(liquidationRatio[collateralType])
              .multipliedBy(debit)
              .dividedBy(amount)
          }
        } else if (event.method == "NewFeedData") {
          var updated = {}
          event.data[1].forEach(value => {
            updated[value[0].toString()] = new BigNumber(
              value[1].toString() + `e-${api.registry.chainDecimals}`
            )
          })
          updated["LDOT"] = new BigNumber(
            liquidStakingExchangeRate + `e-${api.registry.chainDecimals}`
          ).multipliedBy(updated["DOT"])
          checkLiquidationPrice(substrateBot, updated)
        } else if (event.method == "LiquidateUnsafeCDP") {
          var account = event.data[1].toHuman()
          var collateralType = event.data[0].toHuman()
          if (totalCollaterals[collateralType][account]) {
            delete totalCollaterals[collateralType][account]
          }
        }
      })
  })
}

async function getAPI() {
  const nodeUri = process.env.NODE_URI || "ws://127.0.0.1:1701"
  const provider = new WsProvider(nodeUri)
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
  const api = await ApiPromise.create(options({ provider }))
  Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
    api.rpc.system.properties(),
  ]).then(data => {
    console.log(
      new Date(),
      `You are connected to chain ${data[0]} using ${data[1]} v${data[2]}`
    )
  })
  return api
}

function getModes() {
  return require("./modes.json")
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
  //custom event LiquidationCDPWarning
  modules["CdpEngine"].events["LiquidationCDPWarning"] = {
    args: [
      {
        name: "owner",
        baseType: "GenericAccountId",
        type: "AccountId",
      },
      {
        name: "collateralType",
        baseType: '{"_enum":["ACA","AUSD","DOT","XBTC","LDOT","RENBTC"]}',
        type: "CurrencyId",
        visible: "hide",
      },
      {
        name: "collateralAmount",
        baseType: "u128",
        type: "Balance",
        visible: "hide",
      },
      {
        name: "debit",
        baseType: "u128",
        type: "Balance",
        visible: "hide",
      },
      {
        name: "liquidationPrice",
        baseType: "Price",
        type: "Price",
        visible: "hide",
      },
      {
        name: "currentPrice",
        baseType: "Price",
        type: "Price",
        visible: "hide",
      },
    ],
    documentation:
      " Warning callateral owner that price drop to 115% level of liquidation price.",
    short: "LqdtnCDPWrnng",
  }
  return modules
}

function getSettings() {
  const settings = {
    network: {
      name: "Acala-Testnet",
      prefix: "42",
      decimals: "18",
    },
    startMsg:
      "Created by Ryabina team.\n\nIf you like this bot, you can thank by voting for our /validators\nFeel free to describe any issues, typo, errors at @RyabinaValidator",
    validatorsMessage:
      "If you liked our bots, nominate Ryabina validators on Polkadot, Kusama and Edgeware!",
    governanceLinks: ["subscan"],
    commonLinks: ["subscan"],
    groupAlerts: {
      events: [],
      calls: [],
    },
    botToken: process.env.BOT_TOKEN,
  }
  return settings
}

function getNetworkStatsMessage(priceIncluded = false, isGroup = false) {
  var result = `Acala(Mandala) network Stats:\n\n`
  if (priceIncluded) {
    result += `Current ACA Price: ${networkStats.price}
ACA Market Capitalisation: ${networkStats.marketcap}
ACA Total Volume: ${networkStats.volume}\n`
  }

  result += `Total issuance: ${networkStats.totalIssuance}

Total collaterals:`
  networkStats.totalCollaterals.forEach(c => {
    result += `\n    ${c.collateralType}: ${c.value}`
  })
  result += `\nTotal debits:`
  networkStats.totalDebits.forEach(d => {
    result += `\n    ${d.collateralType}: ${d.value}`
  })
  result += `\n\nOracle Currency Prices:\n`
  networkStats.oraclePrices.forEach(currency => {
    result += `    1 ${currency.token} = ${currency.price} USD\n`
  })
  result += `\nDEX Currency Prices:\n`
  networkStats.dexPrices.forEach(currency => {
    result += `    1 ${currency.token} = ${currency.price} aUSD\n`
  })
  if (!isGroup) {
    result += `
Nominate our /validators
Feedback and support @RyabinaValidator`
  }
  return result
}

async function getNetworkStats(api) {
  const networkStats = {}
  var token_data
  try {
    var token_data = await getJSON(
      `https://api.coingecko.com/api/v3/coins/acala`
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

  var oraclePrices = await api.rpc.oracle.getAllValues()
  var dexPools = await api.query.dex.liquidityPool.entries()
  var liquidRate = await api.rpc.stakingPool.getLiquidStakingExchangeRate()
  var totalCollaterals = await api.query.loans.totalCollaterals.entries()
  totalCollaterals = totalCollaterals.map(c => {
    return {
      collateralType: c[0].toHuman()[0],
      value: formatBalance(new BigNumber(c[1].toString()).toFixed(0), {
        decimals: api.registry.chainDecimals,
        withSi: true,
        withUnit: "",
      }),
    }
  })
  var totalDebits = await api.query.loans.totalDebits.entries()
  totalDebits = totalDebits.map(d => {
    return {
      collateralType: d[0].toHuman()[0],
      value: formatBalance(new BigNumber(d[1].toString()).toFixed(0), {
        decimals: api.registry.chainDecimals,
        withSi: true,
        withUnit: "aUSD",
      }),
    }
  })

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
  networkStats.totalCollaterals = totalCollaterals
  networkStats.totalDebits = totalDebits
  networkStats.oraclePrices = oraclePrices.map(price => {
    var name = price[0].toHuman()
    var value = new BigNumber(
      price[1].value.value.toString() + `e-${api.registry.chainDecimals}`
    ).toFixed(2)
    return { token: name, price: value }
  })
  networkStats.oraclePrices.push({
    token: "LDOT",
    price: new BigNumber(liquidRate + `e-${api.registry.chainDecimals}`)
      .multipliedBy(
        new BigNumber(
          networkStats.oraclePrices.find(p => p.token == "DOT").price
        )
      )
      .toFixed(2),
  })
  networkStats.dexPrices = dexPools.map(pool => {
    var token = pool[0].toHuman()[0]
    var value1 = new BigNumber(
      pool[1][0].toString() + `e-${api.registry.chainDecimals}`
    )
    var value2 = new BigNumber(
      pool[1][1].toString() + `e-${api.registry.chainDecimals}`
    )
    var price = value2.dividedBy(value1).toFixed(2)
    return { token: token, price: price }
  })
  return networkStats
}

async function checkLiquidationPrice(bot, updated) {
  for (var collateralType in updated) {
    var updatedPrice = updated[collateralType]
    for (var account in totalCollaterals[collateralType]) {
      if (
        updatedPrice
          .dividedBy(totalCollaterals[collateralType][account].liquidationPrice)
          .isLessThan(new BigNumber("1.15"))
      ) {
        var alert = {
          section: "cdpEngine",
          method: "LiquidationCDPWarning",
          data: [
            account,
            collateralType,
            totalCollaterals[collateralType][account].amount.toFixed(4),
            totalCollaterals[collateralType][account].debit.toFixed(4),
            totalCollaterals[collateralType][account].liquidationPrice.toFixed(
              4
            ),
            updatedPrice.toFixed(4),
          ],
          documentation:
            " Warning callateral owner that price drop to 115% level of liquidation price.",
        }
        await bot.sendCustomAlert(alert)
      }
    }
  }
}

async function getAllCollaterals(api) {
  var result = {}

  var collateralParams = await api.query.cdpEngine.collateralParams.entries()
  liquidationRatio = {}
  collateralParams.forEach(c => {
    if (c[1].liquidationRatio.toString() == "") {
      liquidationRatio[c[0].toHuman()[0]] = "1"
    } else
      liquidationRatio[c[0].toHuman()[0]] =
        c[1].liquidationRatio.toString() + `e-${api.registry.chainDecimals}`
  })
  var debitExchangeRate = await api.query.cdpEngine.debitExchangeRate.entries()
  debitRate = {}
  debitExchangeRate.forEach(d => {
    debitRate[d[0].toHuman()[0]] =
      d[1].toString() + `e-${api.registry.chainDecimals}`
  })
  liquidStakingExchangeRate = await api.rpc.stakingPool.getLiquidStakingExchangeRate()

  var collaterals = await api.query.loans.collaterals.entries()

  var debits = await api.query.loans.debits.entries()
  var debitsKeyValues = {}
  debits.forEach(d => {
    debitsKeyValues[d[0].toHuman()[1] + ":" + d[0].toHuman()[0]] =
      d[1].toString() + `e-${api.registry.chainDecimals}`
  })

  collaterals
    .filter(c =>
      new BigNumber(
        c[1].toString() + `e-${api.registry.chainDecimals}`
      ).isGreaterThan(new BigNumber(0))
    )
    .forEach(c => {
      var collateralType = c[0].toHuman()[1]
      if (!result[collateralType]) {
        result[collateralType] = {}
      }
      var item = {
        amount: new BigNumber(
          c[1].toString() + `e-${api.registry.chainDecimals}`
        ),
      }
      item.debit = new BigNumber(
        debitsKeyValues[c[0].toHuman()[0] + ":" + collateralType]
      ).multipliedBy(new BigNumber(debitRate[collateralType]))
      item.liquidationPrice = new BigNumber(liquidationRatio[collateralType])
        .multipliedBy(item.debit)
        .dividedBy(item.amount)
      result[collateralType][c[0].toHuman()[0]] = item
    })
  return result
}

this.invalidateCacheInterval = setInterval(() => {
  ;[...alreadyRecieved.entries()].forEach(key => {
    var dateMinuteAgo = new Date()
    dateMinuteAgo.setSeconds(dateMinuteAgo.getSeconds() - 60)
    if (alreadyRecieved.get(key[0]) < dateMinuteAgo) {
      alreadyRecieved.delete(key[0])
    }
  })
}, 60000)

main()
