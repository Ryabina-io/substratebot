const SubstrateBot = require("@ryabina-io/substratebot")
const {
  runPolkaProjectChecker,
} = require("@ryabina-io/substratebot/tools/polkaProjectChecker")
const {
  startNetworkStatsRefreshing,
  getNetworkStatsMessage,
} = require("./src/networkStats")
const { getSettings } = require("./src/settings")
const { getModes } = require("./src/modes")
const { getApi } = require("./src/api")
const { getNodeModules } = require("./src/metadata")
const { hexToString } = require("@ryabina-io/substratebot/tools/typeParser")

let substrateBot
async function main() {
  var settings = getSettings()
  settings.callback = callbackHandler
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
  runPolkaProjectChecker(substrateBot, 5000)
}

async function callbackHandler(data, isExtrinsic) {
  if (isExtrinsic) {
    var extrinsic = data
    if (extrinsic.section == "system" && extrinsic.method == "remark") {
      if (
        extrinsic.signer == "143uSKnHNLTjTLWTyEnpivVS8hCtY2UuwtrfLSSN5qxQhGWu"
      ) {
        var remark = await hexToString(extrinsic.args["_remark"], "", "", 0)
        remark = JSON.parse(remark)
        var alert = {
          section: "ecosystem",
          method: "PolkadotAlert",
          data: [remark.message],
        }
        alert.links = remark.links.map(link => {
          return { name: Object.keys(link)[0], url: link[Object.keys(link)[0]] }
        })
        await substrateBot.sendCustomAlert(alert)
      }
    }
  }
}

main()
