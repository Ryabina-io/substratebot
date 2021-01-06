const { ApiPromise, WsProvider } = require("@polkadot/api")

module.exports = {
  getApi: async () => {
    const nodeUri = process.env.NODE_URI || "wss://mainnet-rpc.stafi.io"
    const provider = new WsProvider(nodeUri)
    const api = await ApiPromise.create({
      provider,
      types: {
        RefCount: "u32",
        ChainId: "u8",
        ResourceId: "[u8; 32]",
        DepositNonce: "u64",
        RateType: "u64",
        AccountRData: {
          free: "u128",
        },
        RSymbol: {
          _enum: ["RFIS"],
        },
      },
    })

    Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
    ]).then(data => {
      console.log(
        new Date(),
        `You are connected to chain ${data[0]} using ${data[1]} v${data[2]}`
      )
    })
    return api
  },
}
