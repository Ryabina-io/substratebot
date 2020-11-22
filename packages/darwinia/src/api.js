const { ApiPromise, WsProvider } = require("@polkadot/api")
const {
  typesChain,
  typesSpec,
  typesBundle,
  typesRpc,
} = require("@polkadot/apps-config/api")

module.exports = {
  getApi: async () => {
    const nodeUri = process.env.NODE_URI || "wss://cc1.darwinia.network"
    const provider = new WsProvider(nodeUri)
    const api = await new ApiPromise({
      provider,
      rpc: typesRpc,
      types: {},
      typesBundle,
      typesChain,
      typesSpec,
    })
    await new Promise(resolve => api.once("ready", resolve))
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
