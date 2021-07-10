const SubstrateBot = require("@ryabina-io/substratebot")
const {
  startNetworkStatsRefreshing,
  getNetworkStatsMessage,
} = require("./src/networkStats")
const { getSettings } = require("./src/settings")
const { getModes } = require("./src/modes")
const { getApi } = require("./src/api")
const { getNodeModules } = require("./src/metadata")
const githubReleaseAlert = require("./src/newEvents/githubRelease")
const substrateGithubReleaseAlert = require("./src/newEvents/substrateGithubRelease")

async function main() {
  var settings = getSettings()
  var { api, subscribeApi } = await getApi()
  var modules = getNodeModules(api)
  var modes = getModes()
  startNetworkStatsRefreshing(api)
  const substrateBot = new SubstrateBot({
    settings,
    api,
    modules,
    modes,
    getNetworkStatsMessage,
    subscribeApi
  })
  substrateBot.run()

  githubReleaseAlert.run(
    substrateBot,
    process.env.GITHUB_TOKEN ? 10000 : 100000
  )
  substrateGithubReleaseAlert.run(
    substrateBot,
    process.env.GITHUB_TOKEN ? 10000 : 100000
  )
}

main()
