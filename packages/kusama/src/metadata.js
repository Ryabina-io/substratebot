const { metaConvertToConfig } = require("@ryabina-io/substratebot/tools/utils")
const newMeta = require("./newEvents/meta")

module.exports = {
  getNodeModules: api => {
    const ingoreList = {
      events: [
        "ExtrinsicSuccess",
        "ExtrinsicFailed",
        "BatchInterrupted",
        "BatchCompleted",
      ],
      calls: ["batch"],
      hide: [
        "GenericAccountId",
        "GenericAddress",
        "uint",
        "u8",
        "u16",
        "u32",
        "u64",
        "u128",
        "u256",
        "int",
        "i8",
        "i16",
        "i32",
        "i64",
        "i128",
        "i256",
        "bool",
      ],
    }
    const modules = metaConvertToConfig(api, ingoreList)
    var newEvents = newMeta.getNewEvents()
    newEvents.forEach(module => {
      if (!modules[module.name]) {
        modules[module.name] = { events: {}, short: module.short }
      }
      module.events.forEach(event => {
        modules[module.name].events[event.name] = {
          short: event.short,
          documentation: event.documentation,
          args: event.args,
        }
      })
    })
    return modules
  },
}
