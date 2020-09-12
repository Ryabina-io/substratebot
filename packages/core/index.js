const bot = require("./bot.js")
const { parse } = require("./tools/typeParser")
const BigNumber = require("bignumber.js")
const Markup = require("telegraf/markup")
const { isIterable, getTargets, getStashAccount } = require("./tools/utils")
const { botParams } = require("./config")
const { stringCamelCase, stringUpperFirst } = require("@polkadot/util")
const _ = require("lodash")
const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")

var currentBlock = 0
var alreadyRecieved = new Map()

async function newHeaderHandler(header) {
  const blockNumber = header.number.toNumber()
  if (currentBlock < blockNumber) currentBlock = blockNumber
  else return
  const blockHash = await botParams.api.rpc.chain.getBlockHash(blockNumber)
  const block = await botParams.api.rpc.chain.getBlock(blockHash)
  const events = await botParams.api.query.system.events.at(blockHash)
  block.block.extrinsics.forEach(async (extr, index) => {
    var extrinsic = {
      method: extr.method.method ?? extr.method.methodName,
      section: extr.method.section ?? extr.method.sectionName,
      args: _.zipObject(Object.keys(extr.argsDef), extr.method.args),
    }
    if (extr.isSigned) {
      extrinsic.signer = extr.signer.toString()
    }
    var indexEvents = events
      .filter(e => {
        if (e.phase.value["toNumber"]) {
          return e.phase.value.toNumber() == index
        } else return false
      })
      .map(e => {
        return {
          section: e.event.section,
          method: e.event.method,
        }
      })
    if (
      indexEvents.find(
        e => e.section == "system" && e.method == "ExtrinsicFailed"
      )
    ) {
      extrinsic.success = false
    } else if (
      indexEvents.find(
        e => e.section == "system" && e.method == "ExtrinsicSuccess"
      )
    ) {
      extrinsic.success = true
    } else {
      console.log(
        new Date(),
        "Something wrong. Exist extrinsic don't have result event."
      )
    }
    if (extrinsic.success) {
      await sendExtrinsic(
        extrinsic,
        index,
        botParams.settings.network.token,
        botParams.settings.network.decimals
      )
    }
  })
  if (events.length > 0) {
    await newEventsHandler(events)
  }
}

async function newEventsHandler(events) {
  botParams.db.read()
  if (events.length > 0) {
    var header = await botParams.api.rpc.chain.getHeader()
    events.forEach(event => {
      sendEvent(event)
    })
  }
}

async function sendExtrinsic(extrinsic, extrinsicIndex, token, decimals) {
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
        await sendExtrinsic(call, extrinsicIndex, token, decimals)
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
      var call = {
        method: callArg.method,
        section: callArg.section,
        args: _.zipObject(Object.keys(callArg.argsDef), callArg.args),
        signer: extrinsic.signer,
      }
      await sendExtrinsic(call, extrinsicIndex, token, decimals)
    } catch (error) {
      console.log(new Date(), error)
    }
  } else {
    if (
      botParams.ui.modules[module] &&
      botParams.ui.modules[module].calls[extrinsic.method]
    ) {
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
            var signer, stash
            if (extrinsic.signer) {
              signer = await getAccountName(extrinsic.signer, user)
              stash = await getStashAccount(extrinsic.signer)
            }
            var message = `Extrinsic: <b>#${stringUpperFirst(method)}</b>
  \n<i>${
              extrinsicDB.documentation == ""
                ? "A new extrinsic has occurred."
                : extrinsicDB.documentation
              }</i>\n
Block: ${currentBlock}
Index: ${extrinsicIndex}
Module: #${module}${signer ? "\nSigner: " + signer : ""}${stash.isEmpty ? '' : "\nStash: " + stash.value.stash.toString()}`
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
                      .dividedBy(new BigNumber("1e" + decimals))
                      .toFixed(4) +
                    " " +
                    token
                    }`
                } else {
                  var ledger = await getStashAccount(extrinsic.signer.toString())
                  message += `  bond ${
                    new BigNumber(ledger.value.active.toString())
                      .dividedBy(new BigNumber("1e" + decimals))
                      .toFixed(4) +
                    " " +
                    token
                    }`
                }
              }
              message += `</code>`
            }
            var links = []
            var network = botParams.settings.network.name.toLowerCase()
            if (botParams.settings.commonLinks.includes("subscan")) {
              links.push(
                Markup.urlButton(
                  "subscan",
                  `https://${network}.subscan.io/extrinsic/${currentBlock}-${extrinsicIndex}`
                )
              )
            }
            if (botParams.settings.commonLinks.includes("polkascan")) {
              links.push(
                Markup.urlButton(
                  "polkascan",
                  `https://polkascan.io/${network}/transaction/${currentBlock}-${extrinsicIndex}`
                )
              )
            }
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

async function sendEvent(record) {
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
  const { event, phase } = record
  const types = event.typeDef
  const decimals = botParams.settings.network.decimals
  const token = botParams.settings.network.token
  if (
    botParams.ui.modules[stringUpperFirst(event.section)] &&
    botParams.ui.modules[stringUpperFirst(event.section)].events[event.method]
  ) {
    var eventDB =
      botParams.ui.modules[stringUpperFirst(event.section)].events[event.method]
    botParams.db
      .get("notifications")
      .value()
      .filter(n => n.contract == event.section && n.event == event.method)
      .forEach(async n => {
        var filters = []
        if (n.filters && n.filters.length > 0) {
          await Promise.all(
            n.filters.map(async f => {
              var checkResult = await checkFilter(f, event, "event", eventDB)
              filters.push(checkResult)
            })
          )
        } else filters.push(true)
        var user = botParams.db.get("users").find({ chatid: n.chatid }).value()
        if (!filters.includes(false) && user.enabled) {
          var message = `Event: <b>#${event.method}</b>\n\n<i>${
            eventDB.documentation == ""
              ? "A new event has occurred."
              : eventDB.documentation.replace("`(", "(").replace(")`", ")")
            }</i>\n
Block: ${currentBlock}
Module: #${stringUpperFirst(event.section)}`

          if (event.data && isIterable(event.data) && event.data.length > 0) {
            message += `\nParameters:\n<code>`
            for (var i = 0; i < event.data.length; i++) {
              var data = event.data[i]
              var value = `  ${eventDB.args[i].name
                .replace("<", "[")
                .replace(">", "]")}: `
              try {
                if (
                  (eventDB.args[i].baseType == "GenericAccountId" ||
                    eventDB.args[i].baseType == "GenericAddress") &&
                  user.wallets &&
                  user.wallets.find(w => w.address == data.toString())
                ) {
                  value += user.wallets.find(w => w.address == data.toString())
                    .name
                } else {
                  value += await parse(
                    data,
                    eventDB.args[i].type,
                    eventDB.args[i].baseType,
                    4
                  )
                }
              } catch (error) {
                console.log(new Date(), error)
              }
              message += value + `\n`
            }
            message += `</code>`
          }
          var links = []
          if (event.section == "democracy" && event.method == "Proposed") {
            var argIndex = _.findIndex(
              eventDB.args,
              a => a.name == "proposalIndex"
            )
            var proposalId = event.data[argIndex].toNumber()
            var network = botParams.settings.network.name.toLowerCase()
            links.push([])
            if (botParams.settings.governanceLinks.includes("commonwealth")) {
              links[0].push(
                Markup.urlButton(
                  "commonwealth",
                  `https://commonwealth.im/${network}/proposal/democracyproposal/${proposalId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("polkassembly")) {
              links[0].push(
                Markup.urlButton(
                  "polkassembly",
                  `https://${network}.polkassembly.io/proposal/${proposalId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("polkascan")) {
              links.push([])
              links[1].push(
                Markup.urlButton(
                  "polkascan",
                  `https://polkascan.io/${network}/democracy/proposal/${proposalId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("subscan")) {
              links[1].push(
                Markup.urlButton(
                  "subscan",
                  `https://${network}.subscan.io/democracy_proposal/${proposalId}`
                )
              )
            }
          } else if (
            (event.section == "democracy" && event.method == "Started") ||
            (event.section == "democracy" && event.method == "Cancelled") ||
            (event.section == "democracy" && event.method == "Passed") ||
            (event.section == "democracy" && event.method == "NotPassed") ||
            (event.section == "democracy" && event.method == "Executed")
          ) {
            var argIndex = _.findIndex(eventDB.args, a => a.name == "refIndex")
            var referendumId = event.data[argIndex].toNumber()
            var network = botParams.settings.network.name.toLowerCase()
            links.push([])
            if (botParams.settings.governanceLinks.includes("commonwealth")) {
              links[0].push(
                Markup.urlButton(
                  "commonwealth",
                  `https://commonwealth.im/${network}/proposal/referendum/${referendumId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("polkassembly")) {
              links[0].push(
                Markup.urlButton(
                  "polkassembly",
                  `https://${network}.polkassembly.io/referendum/${referendumId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("polkascan")) {
              links.push([])
              links[1].push(
                Markup.urlButton(
                  "polkascan",
                  `https://polkascan.io/${network}/democracy/referendum/${referendumId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("subscan")) {
              links[1].push(
                Markup.urlButton(
                  "subscan",
                  `https://${network}.subscan.io/referenda/${referendumId}`
                )
              )
            }
          } else if (
            (event.section == "treasury" && event.method == "Proposed") ||
            (event.section == "treasury" && event.method == "Awarded") ||
            (event.section == "treasury" && event.method == "Rejected")
          ) {
            var argIndex = _.findIndex(
              eventDB.args,
              a => a.name == "proposalIndex"
            )
            var proposalId = event.data[argIndex].toNumber()
            var network = botParams.settings.network.name.toLowerCase()
            links.push([])
            if (botParams.settings.governanceLinks.includes("commonwealth")) {
              links[0].push(
                Markup.urlButton(
                  "commonwealth",
                  `https://commonwealth.im/${network}/proposal/treasuryproposal/${proposalId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("polkassembly")) {
              links[0].push(
                Markup.urlButton(
                  "polkassembly",
                  `https://${network}.polkassembly.io/treasury/${proposalId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("polkascan")) {
              links.push([])
              links[1].push(
                Markup.urlButton(
                  "polkascan",
                  `https://polkascan.io/${network}/treasury/proposal/${proposalId}`
                )
              )
            }
            if (botParams.settings.governanceLinks.includes("subscan")) {
              links[1].push(
                Markup.urlButton(
                  "subscan",
                  `https://${network}.subscan.io/treasury/${proposalId}`
                )
              )
            }
          } else if (phase.value["toNumber"]) {
            var network = botParams.settings.network.name.toLowerCase()
            if (botParams.settings.commonLinks.includes("subscan")) {
              links.push(
                Markup.urlButton(
                  "subscan",
                  `https://${network}.subscan.io/extrinsic/${currentBlock}-${phase.value.toNumber()}`
                )
              )
            }
            if (botParams.settings.commonLinks.includes("polkascan")) {
              links.push(
                Markup.urlButton(
                  "polkascan",
                  `https://polkascan.io/${network}/transaction/${currentBlock}-${phase.value.toNumber()}`
                )
              )
            }
          }
          try {
            var result = await botParams.bot.telegram.sendMessage(
              n.chatid,
              message,
              {
                parse_mode: "html",
                disable_web_page_preview: "true",
                reply_markup: Markup.inlineKeyboard(links),
              }
            )
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
            console.log(new Date(), error)
          }
        }
      })
  }
}

async function sendCustomAlert(event) {
  if (
    botParams.ui.modules[stringUpperFirst(event.section)] &&
    botParams.ui.modules[stringUpperFirst(event.section)].events[event.method]
  ) {
    var eventDB =
      botParams.ui.modules[stringUpperFirst(event.section)].events[event.method]
    botParams.db
      .get("notifications")
      .value()
      .filter(n => n.contract == event.section && n.event == event.method)
      .forEach(async n => {
        var filters = []
        if (n.filters && n.filters.length > 0) {
          await Promise.all(
            n.filters.map(async f => {
              var checkResult = await checkFilter(f, event, "event", eventDB)
              filters.push(checkResult)
            })
          )
        } else filters.push(true)
        var user = botParams.db.get("users").find({ chatid: n.chatid }).value()
        if (!filters.includes(false) && user.enabled) {
          var message = `Event: <b>#${event.method}</b>\n\n<i>${
            eventDB.documentation == ""
              ? "A new event has occurred."
              : eventDB.documentation.replace("`(", "(").replace(")`", ")")
            }</i>\n
Module: #${stringUpperFirst(event.section)}`
          if (event.data.length > 0) {
            message += `\nParameters:\n<code>`
            for (var i = 0; i < event.data.length; i++) {
              var data = event.data[i]
              var value = `  ${eventDB.args[i].name
                .replace("<", "[")
                .replace(">", "]")}: `
              try {
                if (
                  (eventDB.args[i].baseType == "GenericAccountId" ||
                    eventDB.args[i].baseType == "GenericAddress") &&
                  user.wallets &&
                  user.wallets.find(w => w.address == data.toString())
                ) {
                  if (
                    user.wallets &&
                    user.wallets.find(w => w.address == data.toString())
                  ) {
                    value += user.wallets.find(
                      w => w.address == data.toString()
                    ).name
                  } else {
                    value += await parse(
                      data,
                      eventDB.args[i].type,
                      eventDB.args[i].baseType,
                      4
                    )
                  }
                } else {
                  value += data
                }
              } catch (error) {
                console.log(new Date(), error)
              }
              message += value + `\n`
            }
            message += `</code>`
          }
          var links = []
          if (event.links && event.links.length > 0) {
            event.links.forEach(link => {
              links.push(Markup.urlButton(link.name, link.url))
            })
          }
          try {
            var result = await botParams.bot.telegram.sendMessage(
              n.chatid,
              message,
              {
                parse_mode: "html",
                disable_web_page_preview: "true",
                reply_markup: Markup.inlineKeyboard(links),
              }
            )
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
            console.log(new Date(), error)
          }
        }
      })
  }
}

async function getAccountName(account, user) {
  if (user.wallets) {
    var wallet = user.wallets.find(w => w.address == account)
    if (wallet) return wallet.name
  }
  var accountInfo = await botParams.api.derive.accounts.info(account)
  if (accountInfo.identity.displayParent || accountInfo.identity.display) {
    var value = ""
    if (accountInfo.identity.displayParent) {
      value += accountInfo.identity.displayParent + ":"
    }
    if (accountInfo.identity.display) {
      value += accountInfo.identity.display
    }
    return value
  } else if (accountInfo.accountIndex) {
    return accountInfo.accountIndex
  }
  return account
}

async function checkFilter(filter, action, actionType, config) {
  var arg, data

  if (actionType == "call" && filter.name == "sender") {
    if (!action.signer) {
      return false
    }
    var sender = action.signer;
    var stash = await getStashAccount(sender)
    var compareResult = filter.isEqual && filter.value == sender
    if (compareResult) return true
    else {
      if (stash.isSome) {
        sender = stash.value.stash.toString()
        compareResult = filter.isEqual && filter.value == sender
        if (compareResult) return true
      }
      return false
    }
  }


  if (actionType == "call") {
    arg = config.args.find(a => a.name == filter.name)
    if (!arg) return false
    data = action.args[filter.name]
  } else {
    arg = config.args.find(a => a.name == filter.name)
    if (!arg) return false
    if (!action.data) {
      console.log(
        new Date(),
        "Error No Data in action",
        action.toHuman ? action.toHuman() : action.toJSON()
      )
    }
    data = action.data[_.findIndex(config.args, a => a.name == filter.name)]
  }

  if (arg.type.startsWith("Vec<")) {
    var item = data.find(a => {
      if (
        (filter.isEqual && filter.value == a.toString()) ||
        (filter.isLess &&
          new BigNumber(a.toString()).isLessThan(
            new BigNumber(filter.value)
          )) ||
        (filter.isMore &&
          new BigNumber(a.toString()).isGreaterThan(
            new BigNumber(filter.value)
          ))
      )
        return true
      else return false
    })
    if (item) return true
    else return false
  } else {
    if (filter.source) {
      if (filter.source == "nominator") {
        var targets = await getTargets(filter.value)
        if (targets.includes(data.toString())) {
          return true
        } else return false
      }
    } else if (
      (filter.isEqual && filter.value == data.toString()) ||
      (filter.isLess &&
        new BigNumber(data.toString()).isLessThan(
          new BigNumber(filter.value)
        )) ||
      (filter.isMore &&
        new BigNumber(data.toString()).isGreaterThan(
          new BigNumber(filter.value)
        ))
    ) {
      return true
    } else return false
  }
}

function getDB(path) {
  const adapter = new FileSync(path || "/db/db.json")
  const db = low(adapter)
  return db
}

module.exports = class SubstrateBot {
  /**
   * Create SubstrateBot instance
   * @param config - SubstrateBot config
   * @param config.settings - main bot settings, should contain substrate network params (name, prefix, decimals, token),
   * telegram bot token, start & validators messages, links (governance, common), list of group alerts. See sample in examples
   * @param config.api - polkadot-api instance for connect to node
   * @param config.modules - substrate metadata
   * @param config.modes - custom modes in main menu
   * @param config.getNetworkStats - external function for getting substrate network stats
   */
  constructor({ settings, api, modules, modes, getNetworkStatsMessage }) {
    this.settings = settings
    this.api = api
    this.modules = modules
    this.modes = modes
    this.getNetworkStatsMessage = getNetworkStatsMessage
    this.db = getDB(settings.dbFilePath)
  }

  async run() {
    botParams.api = this.api
    botParams.ui.modules = this.modules
    botParams.ui.modes = this.modes
    botParams.db = this.db

    var networkProperties = await this.api.rpc.system.properties()
    if (networkProperties.ss58Format) {
      this.settings.network.prefix = networkProperties.ss58Format.toString()
    }
    if (networkProperties.tokenDecimals) {
      this.settings.network.decimals = networkProperties.tokenDecimals.toString()
    }
    if (networkProperties.tokenSymbol) {
      this.settings.network.token = networkProperties.tokenSymbol.toString()
    }
    botParams.settings = this.settings
    if (this.api.registry.chain)
      botParams.getNetworkStatsMessage = this.getNetworkStatsMessage

    botParams.bot = await bot.run(this)
    await this.api.rpc.chain.subscribeNewHeads(async header =>
      newHeaderHandler(header)
    )
    this.invalidateCacheInterval = setInterval(() => {
      ;[...alreadyRecieved.entries()].forEach(key => {
        var dateMinuteAgo = new Date()
        dateMinuteAgo.setSeconds(dateMinuteAgo.getSeconds() - 60)
        if (alreadyRecieved.get(key[0]) < dateMinuteAgo) {
          alreadyRecieved.delete(key[0])
        }
      })
    }, 60000)
  }

  async stop() {
    clearInterval(this.invalidateCacheInterval)
  }

  async sendCustomAlert(alert) {
    await sendCustomAlert(alert)
  }
}
