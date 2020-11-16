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

let substrateBot
async function main() {
  var settings = getSettings()
  settings.callback = (data, isExtrinsic) => {
    networkEvents.handler(substrateBot, data, isExtrinsic)
  }
  var api = await getApi()
  var modules = getNodeModules(api)
  var modes = getModes()
  startNetworkStatsRefreshing(api)
  substrateBot = new SubstrateBot({
    settings,
    api,
    modules,
    modes,
    getNetworkStatsMessage,
  })
  substrateBot.run()

  polkaProjectAlert.run(substrateBot, 30000)
  githubReleaseAlert.run(substrateBot, process.env.GITHUB_TOKEN ? 5000 : 100000)
  substrateGithubReleaseAlert.run(
    substrateBot,
    process.env.GITHUB_TOKEN ? 10000 : 100000
  )
}

main()
