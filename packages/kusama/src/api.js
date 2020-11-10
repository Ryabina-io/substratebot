const { ApiPromise, WsProvider } = require("@polkadot/api")

module.exports = {
  getApi: async () => {
    const nodeUri = process.env.NODE_URI || "ws://127.0.0.1:9955/"
    const provider = new WsProvider(nodeUri)
    const api = await ApiPromise.create({ provider })
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
