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
    return modules
  },
}
