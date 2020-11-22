// const requireHacker = require('require-hacker')
// requireHacker.hook('png', (path) => 'module.exports={}')
// requireHacker.hook('gif', (path) => 'module.exports={}')
// requireHacker.hook('svg', (path) => 'module.exports={}')
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
  var api = await getApi()
  var modules = getNodeModules(api)
  var modes = getModes()
  startNetworkStatsRefreshing(api)
  const substrateBot = new SubstrateBot({
    settings,
    api,
    modules,
    modes,
    getNetworkStatsMessage,
  })
  substrateBot.run()
}

main()
