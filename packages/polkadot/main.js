const SubstrateBot = require("@ryabina-io/substratebot")
const {
  startNetworkStatsRefreshing,
  getNetworkStatsMessage,
} = require("./src/networkStats")
const { getSettings } = require("./src/settings")
const { getModes } = require("./src/modes")
const { getApi } = require("./src/api")
const { getNodeModules } = require("./src/metadata")
const networkEvents = require("./src/newEvents/networkEventsHandler")
const githubReleaseAlert = require("./src/newEvents/githubRelease")
const substrateGithubReleaseAlert = require("./src/newEvents/substrateGithubRelease")
const polkaProjectAlert = require("./src/newEvents/polkaProject")
require("dotenv").config()

async function main() {
  var settings = getSettings()
  settings.callback = (data, isExtrinsic) => {
    networkEvents.handler(substrateBot, data, isExtrinsic)
  }
  var { api, subscribeApi } = await getApi()
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
