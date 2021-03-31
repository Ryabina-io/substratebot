const { ApiPromise, WsProvider } = require("@polkadot/api")

module.exports = {
  getApi: async () => {
    const nodeUri =
      process.env.NODE_URI || "wss://api.mvp.testnet.equilibrium.io"
    const provider = new WsProvider(nodeUri)
    const api = await ApiPromise.create({
      provider,
      types: {
        BlockNumber: "u64",
        Keys: "SessionKeys3",
        Balance: "u64",
        FixedI64: "i64",
        SignedBalance: {
          _enum: {
            Positive: "Balance",
            Negative: "Balance",
          },
        },
        ReinitRequest: {
          account: "AccountId",
          authority_index: "AuthIndex",
          validators_len: "u32",
          block_num: "BlockNumber",
        },
        Currency: {
          _enum: ["Unknown", "Usd", "Eq", "Eth", "Btc", "Eos", "Dot"],
        },
        UserGroup: {
          _enum: ["Unknown", "Balances", "Balsmen"],
        },
        SubAccType: {
          _enum: ["Bailsman", "Borrower", "Lender"],
        },
        TotalAggregates: {
          collateral: "Balance",
          debt: "Balance",
        },
        PricePeriod: {
          _enum: ["Min", "TenMin", "Hour", "FourHour", "Day"],
        },
        DataPoint: {
          price: "u64",
          account_id: "AccountId",
          block_number: "BlockNumber",
          timestamp: "u64",
        },
        PricePoint: {
          block_number: "BlockNumber",
          timestamp: "u64",
          price: "u64",
          data_points: "Vec<DataPoint>",
        },
        BalancesAggregate: {
          total_issuance: "Balance",
          total_debt: "Balance",
        },
        VestingInfo: {
          locked: "Balance",
          perBlock: "Balance",
          startingBlock: "BlockNumber",
        },
        LookupSource: "AccountId",
        BalanceOf: "Balance",
        TransferReason: {
          _enum: [
            "Common",
            "InterestFee",
            "MarginCall",
            "BailsmenRedistribution",
            "TreasuryEqBuyout",
            "TreasuryBuyEq",
          ],
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
