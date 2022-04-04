const { ApiPromise, WsProvider } = require("@polkadot/api")
const { HttpProvider } = require("@polkadot/rpc-provider")
const { typesBundleForPolkadotApps } = require("@darwinia/types/mix")

const darwiniaTypesBundle = {
  spec: {
    Crab: typesBundleForPolkadotApps.spec.Crab,
    Darwinia: typesBundleForPolkadotApps.spec.Darwinia,
    Pangolin: typesBundleForPolkadotApps.spec.Pangolin,
  },
}

module.exports = {
  getApi: async () => {
    const wsNodeUri = process.env.WS_NODE_URI || "wss://rpc.darwinia.network"
    const wsProvider = new WsProvider(wsNodeUri)
    const httpProvider = new HttpProvider(process.env.HTTP_NODE_URI)
    const api = await ApiPromise.create({
      provider: wsProvider,
      typesBundle: darwiniaTypesBundle,
    })
    const subscribeApi = await ApiPromise.create({
      provider: wsProvider,
      typesBundle: darwiniaTypesBundle,
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
