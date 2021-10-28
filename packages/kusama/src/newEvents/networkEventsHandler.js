const { hexToString } = require("@ryabina-io/substratebot/tools/typeParser")

module.exports.handler = async function (bot, data, isExtrinsic) {
  if (isExtrinsic) {
    var extrinsic = data
    if (extrinsic.section == "system" && extrinsic.method == "remark") {
      if (
        extrinsic.signer == "DFfmNGJBuAexib19TbjhaubfekchJe8mMTVQv4Axd8ynSjw"
      ) {
        var remark = await hexToString(extrinsic.args["remark"], "", "", 0)
        remark = JSON.parse(remark)
        var alert = {
          section: "ecosystem",
          method: "KusamaAlert",
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
