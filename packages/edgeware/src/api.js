const { ApiPromise, WsProvider } = require("@polkadot/api")
const { HttpProvider } = require("@polkadot/rpc-provider")

module.exports = {
  getApi: async () => {
    const wsNodeUri =
      process.env.WS_NODE_URI || "wss://mainnet.edgewa.re/"
    const wsProvider = new WsProvider(wsNodeUri)
    const httpProvider =
      new HttpProvider(process.env.HTTP_NODE_URI) ||
      "https://edgeware.api.onfinality.io/public"
    const api = await ApiPromise.create({
      provider: wsProvider,
    })
    const subscribeApi = await ApiPromise.create({
      provider: wsProvider,
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
    return { api, subscribeApi }
  },
}
