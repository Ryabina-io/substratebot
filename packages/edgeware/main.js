const SubstrateBot = require("@ryabina-io/substratebot")
const {
  startNetworkStatsRefreshing,
  getNetworkStatsMessage,
} = require("./src/networkStats")
const { getSettings } = require("./src/settings")
const { getModes } = require("./src/modes")
const { getApi } = require("./src/api")
const { getNodeModules } = require("./src/metadata")

async function main() {
  var settings = getSettings()
  var { api, subscribeApi } = await getApi()
  var chain = await api.rpc.system.chain()
  settings.network.name = chain
  settings.network.prefix = nodeProperties.ss58Format
  settings.network.decimals = nodeProperties.tokenDecimals
  settings.network.token = nodeProperties.tokenSymbol
  var modules = getNodeModules(api)
  var modes = getModes()
  startNetworkStatsRefreshing(api)
  var substrateBot = new SubstrateBot({
    settings,
    api,
    subscribeApi,
    modules,
    modes,
    getNetworkStatsMessage,
  })
  substrateBot.run()
}

main()
