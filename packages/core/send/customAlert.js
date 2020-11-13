const { botParams } = require("../config")
const { checkFilter } = require("../tools/utils")
const Markup = require("telegraf/markup")
const { stringUpperFirst } = require("@polkadot/util")
const { parse } = require("../tools/typeParser")
const telegram = require("./telegram")

module.exports.sendCustomAlert = async function (event, broadcast) {
  if (
    botParams.ui.modules[stringUpperFirst(event.section)] &&
    botParams.ui.modules[stringUpperFirst(event.section)].events[event.method]
  ) {
    var eventDB =
      botParams.ui.modules[stringUpperFirst(event.section)].events[event.method]

    if (broadcast) {
      var users = botParams.db
        .get("users")
        .value()
        .filter(
          u =>
            u.enabled &&
            (u.broadcast === undefined || u.broadcast) &&
            u.type == "private"
        )
      var message = `Broadcast Event: <b>#${event.method}</b>\n\n<i>${
        eventDB.documentation == ""
          ? "A new event has occurred."
          : eventDB.documentation.replace("`(", "(").replace(")`", ")")
      }\n\nP.S. If you want to unsubscribe from broadcast messages, please press Broadcast button in keyboard menu.</i>\n
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
              eventDB.args[i].baseType == "GenericAccountId" ||
              eventDB.args[i].baseType == "GenericAddress"
            ) {
              value += await parse(
                data,
                eventDB.args[i].type,
                eventDB.args[i].baseType,
                4
              )
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
          links.push([Markup.urlButton(link.name, link.url)])
        })
      }

      users.forEach(async user => {
        telegram.send(user.chatid, message, links)
      })
    } else {
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
          var user = botParams.db
            .get("users")
            .find({ chatid: n.chatid })
            .value()
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
                links.push([Markup.urlButton(link.name, link.url)])
              })
            }
            telegram.send(n.chatid, message, links)
          }
        })
    }
  }
}
