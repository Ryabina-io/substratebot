const { botParams } = require("../config")
const { parse } = require("../tools/typeParser")
const _ = require("lodash")
const { stringUpperFirst } = require("@polkadot/util")
const { isIterable, checkFilter } = require("../tools/utils")
const Markup = require("telegraf/markup")

const alreadyRecieved = new Map()

async function sendEvent(record, currentBlock) {
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
  if (
    botParams.ui.modules[stringUpperFirst(event.section)] &&
    botParams.ui.modules[stringUpperFirst(event.section)].events[event.method]
  ) {
    botParams.callback(record, false)
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
          var links = botParams.settings
            .getEventLinks(
              event,
              eventDB,
              phase.value["toNumber"] && phase.value.toNumber() < 1000
                ? phase.value.toNumber()
                : null,
              currentBlock
            )
            .map(row => {
              return row.map(link => {
                return Markup.urlButton(link[0], link[1])
              })
            })
          try {
            await botParams.bot.telegram.sendMessage(n.chatid, message, {
              parse_mode: "html",
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
            console.log(new Date(), error)
          }
        }
      })
  }
}

module.exports = {
  alreadyRecieved: alreadyRecieved,
  sendEvent: sendEvent,
}
