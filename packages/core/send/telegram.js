const { botParams } = require("../config")
const prom = require("../metrics")
const Markup = require("telegraf/markup")

const sentMessagesSuccessCounter = new prom.Counter({
  name: "substrate_bot_success_sent_messages",
  help: "metric_help",
})
const sentMessagesErrorCounter = new prom.Counter({
  name: "substrate_bot_sent_messages_with_error",
  help: "metric_help",
})

module.exports.send = function (id, message, links) {
  botParams.bot.telegram
    .sendMessage(id, message, {
      parse_mode: "html",
      disable_web_page_preview: "true",
      reply_markup: Markup.inlineKeyboard(links),
    })
    .then(
      success => {
        sentMessagesSuccessCounter.inc()
      },
      error => {
        sentMessagesErrorCounter.inc()
        if (error.message.includes("bot was blocked by the user")) {
          botParams.db
            .get("users")
            .find({ chatid: id })
            .assign({ enabled: false, blocked: true })
            .write()
          console.log(new Date(), `Bot was blocked by user with chatid ${id}`)
          return
        }
        console.log(new Date(), error)
      }
    )
}
