const bot = require("./bot.js")
const { botParams, getDB } = require("./config")
const { sendCustomAlert } = require("./send/customAlert")
const { newHeaderHandler } = require("./send/handler")
const { alreadyRecieved } = require("./send/event")
const prom = require("./metrics")

const lastEventCacheSize = new prom.Gauge({
  name: "substrate_bot_last_event_cache_size",
  help: "metric_help",
})

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
    botParams.ui.keyboard = this.settings.keyboard
    botParams.db = this.db
    botParams.callback = this.settings.callback

    var networkProperties = await this.api.rpc.system.properties()
    if (!this.settings.network.prefix && networkProperties.ss58Format) {
      this.settings.network.prefix = networkProperties.ss58Format.toString()
    }
    if (!this.settings.network.decimals && networkProperties.tokenDecimals) {
      this.settings.network.decimals = networkProperties.tokenDecimals.toString()
    }
    if (
      this.settings.network.token === undefined &&
      networkProperties.tokenSymbol
    ) {
      this.settings.network.token = networkProperties.tokenSymbol.toString()
    }
    botParams.settings = this.settings
    if (this.api.registry.chainToken)
      botParams.getNetworkStatsMessage = this.getNetworkStatsMessage

    botParams.bot = await bot.run(this)
    prom.register.setDefaultLabels({
      telegram_bot_name: botParams.bot.options.username,
      network: botParams.settings.network.name,
    })
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
      lastEventCacheSize.set(alreadyRecieved.size)
    }, 60000)
  }

  async stop() {
    clearInterval(this.invalidateCacheInterval)
  }

  async sendCustomAlert(alert, broadcast) {
    try {
      await sendCustomAlert(alert, broadcast)
    } catch (error) {
      console.log(new Date(), error)
    }
  }
}
