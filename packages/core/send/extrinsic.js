const { botParams } = require("../config")
const { parse } = require("../tools/typeParser")
const _ = require("lodash")
const { stringCamelCase, stringUpperFirst } = require("@polkadot/util")
const {
  getStashAccount,
  checkFilter,
  getAccountName,
} = require("../tools/utils")
const Markup = require("telegraf/markup")
const BigNumber = require("bignumber.js")

async function sendExtrinsic(extrinsic, extrinsicIndex, currentBlock) {
  var module = stringUpperFirst(extrinsic.section)
  var method = stringCamelCase(extrinsic.method)

  if (module == "Utility" && method == "batch") {
    var calls = extrinsic.args["calls"]
    for (var i = 0; i < calls.length; i++) {
      var call = {
        method: calls[i].method,
        section: calls[i].section,
        args: _.zipObject(Object.keys(calls[i].argsDef), calls[i].args),
        signer: extrinsic.signer,
      }
      try {
        await sendExtrinsic(call, extrinsicIndex)
      } catch (error) {
        console.log(new Date(), error)
      }
    }
    return
  } else if (
    (module == "Sudo" && method == "sudo") ||
    (module == "Sudo" && method == "sudoUncheckedWeight") ||
    (module == "Sudo" && method == "sudoAs") ||
    (module == "Multisig" && method == "asMulti") ||
    (module == "Proxy" && method == "proxy") ||
    (module == "Utility" && method == "asSub") ||
    (module == "Utility" && method == "asMulti") ||
    (module == "Utility" && method == "asDerivative") ||
    (module == "Recovery" && method == "asRecovered")
  ) {
    try {
      var callArg = extrinsic.args["call"]
      if (callArg.toRawType() == "Bytes") {
        callArg = botParams.api.registry.createType("Call", callArg.toHex())
      }
      var signer = extrinsic.signer
      if (module == "Proxy" && method == "proxy") {
        signer = extrinsic.args["real"].toString()
      }
      var call = {
        method: callArg.method,
        section: callArg.section,
        args: _.zipObject(Object.keys(callArg.argsDef), callArg.args),
        signer: signer,
      }
      await sendExtrinsic(call, extrinsicIndex)
    } catch (error) {
      console.log(new Date(), error)
    }
  } else {
    if (
      botParams.ui.modules[module] &&
      botParams.ui.modules[module].calls[extrinsic.method]
    ) {
      botParams.callback(extrinsic, true)
      var extrinsicDB = botParams.ui.modules[module].calls[extrinsic.method]
      botParams.db
        .get("notifications")
        .value()
        .filter(
          n =>
            stringCamelCase(n.contract) == stringCamelCase(extrinsic.section) &&
            n.call &&
            stringCamelCase(n.call) == stringCamelCase(extrinsic.method)
        )
        .forEach(async n => {
          var filters = []
          if (n.filters && n.filters.length > 0) {
            await Promise.all(
              n.filters.map(async f => {
                var checkResult = await checkFilter(
                  f,
                  extrinsic,
                  "call",
                  extrinsicDB
                )
                filters.push(checkResult)
              })
            )
          }
          var user = botParams.db
            .get("users")
            .find({ chatid: n.chatid })
            .value()
          if (!filters.includes(false) && user.enabled) {
            var signer, stashName
            if (extrinsic.signer) {
              signer = await getAccountName(extrinsic.signer, user)
              var stash = await getStashAccount(extrinsic.signer)
              if (stash.isSome) {
                stashName = await getAccountName(
                  stash.value.stash.toString(),
                  user
                )
              }
            }
            var message = `Extrinsic: <b>#${stringUpperFirst(method)}</b>
    \n<i>${
      extrinsicDB.documentation == ""
        ? "A new extrinsic has occurred."
        : extrinsicDB.documentation
    }</i>\n
Block: ${currentBlock}
Index: ${extrinsicIndex}
Module: #${module}${signer ? "\nSigner: " + signer : ""}${
              stashName && signer != stashName ? "\nStash: " + stashName : ""
            }`
            if (Object.keys(extrinsic.args).length > 0) {
              message += `\nParameters:\n<code>`
              for (var argName in extrinsic.args) {
                var value = `  ${stringCamelCase(argName)}: `
                var index = Object.keys(extrinsic.args).indexOf(argName)
                var arg = extrinsic.args[argName]
                try {
                  if (
                    (extrinsicDB.args[index].baseType == "GenericAccountId" ||
                      extrinsicDB.args[index].baseType == "GenericAddress") &&
                    user.wallets &&
                    user.wallets.find(w => w.address == arg.toString())
                  ) {
                    value += user.wallets.find(w => w.address == arg.toString())
                      .name
                  } else {
                    value += await parse(
                      arg,
                      extrinsicDB.args[index].type,
                      extrinsicDB.args[index].baseType,
                      4
                    )
                  }
                } catch (error) {
                  console.log(new Date(), error)
                }
                message += `${value}\n`
              }
              if (extrinsic.method == "nominate") {
                var locks = await botParams.api.query.balances.locks(
                  extrinsic.signer.toString()
                )
                var allLock = locks.find(l => l.reasons == "All")
                if (allLock) {
                  message += `  bond ${
                    new BigNumber(allLock.amount.toString())
                      .dividedBy(
                        new BigNumber(
                          "1e" + botParams.settings.network.decimals
                        )
                      )
                      .toFixed(4) +
                    " " +
                    botParams.settings.network.token
                  }`
                } else {
                  var ledger = await getStashAccount(
                    extrinsic.signer.toString()
                  )
                  message += `  bond ${
                    new BigNumber(ledger.value.active.toString())
                      .dividedBy(
                        new BigNumber(
                          "1e" + botParams.settings.network.decimals
                        )
                      )
                      .toFixed(4) +
                    " " +
                    botParams.settings.network.token
                  }`
                }
              }
              message += `</code>`
            }
            var links = botParams.settings
              .getExtrinsicLinks(
                extrinsic,
                extrinsicDB,
                extrinsicIndex,
                currentBlock
              )
              .map(row => {
                return row.map(link => {
                  return Markup.urlButton(link[0], link[1])
                })
              })
            try {
              await botParams.bot.telegram.sendMessage(n.chatid, message, {
                parse_mode: "HTML",
                disable_web_page_preview: "true",
                reply_markup: Markup.inlineKeyboard(links),
              })
            } catch (error) {
              if (error.message.includes("bot was blocked by the user")) {
                botParams.db
                  .get("users")
                  .find({ chatid: n.chatid })
                  .assign({ enabled: false, blocked: true })
                  .write()
                console.log(
                  new Date(),
                  `Bot was blocked by user with chatid ${n.chatid}`
                )
                return
              }
              console.log(new Date(), error.message)
            }
          }
        })
    }
  }
}

module.exports = {
  sendExtrinsic: sendExtrinsic,
}
