const { metaConvertToConfig } = require("@ryabina-io/substratebot/tools/utils")

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
        "u8",
        "u16",
        "u32",
        "u64",
        "u128",
        "u256",
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
    if (!modules["Ecosystem"]) {
      modules["Ecosystem"] = { events: {}, short: "Ecsstm" }
    }
    modules["Ecosystem"].events["NewPolkaProject"] = {
      args: [
        {
          name: "title",
          baseType: "String",
          type: "String",
          visible: "hide",
        },
        {
          name: "description",
          baseType: "String",
          type: "String",
          visible: "hide",
        },
        {
          name: "tags",
          baseType: "String",
          type: "String",
          visible: "hide",
        },
      ],
      documentation: " A new project has been added to PolkaProject.com",
      short: "NwPlkPrjct",
    }
    modules["Ecosystem"].events["PolkadotAlert"] = {
      documentation: " Important system alerts from the Polkadot team",
      short: "PlkdtAlrt",
      args: [
        {
          name: "message",
          baseType: "String",
          type: "String",
          visible: "hide",
        },
      ],
    }
    return modules
  },
}
