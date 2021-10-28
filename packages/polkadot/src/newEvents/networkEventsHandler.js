const { hexToString } = require("@ryabina-io/substratebot/tools/typeParser")

module.exports.handler = async function (bot, data, isExtrinsic) {
  if (isExtrinsic) {
    var extrinsic = data
    if (extrinsic.section == "system" && extrinsic.method == "remark") {
      if (
        extrinsic.signer == "143uSKnHNLTjTLWTyEnpivVS8hCtY2UuwtrfLSSN5qxQhGWu"
      ) {
        var remark = await hexToString(extrinsic.args["remark"], "", "", 0)
        remark = JSON.parse(remark)
        var alert = {
          section: "ecosystem",
          method: "PolkadotAlert",
          data: [remark.message],
        }
        alert.links = remark.links
        //broadcast
        await bot.sendCustomAlert(alert, true)
        //regular alert
        await bot.sendCustomAlert(alert, false)
      }
    }
  }
}
