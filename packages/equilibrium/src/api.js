const { ApiPromise, WsProvider } = require("@polkadot/api")

module.exports = {
  getApi: async () => {
    const nodeUri = process.env.NODE_URI || "wss://testnet.equilibrium.io"
    const provider = new WsProvider(nodeUri)
    const api = await ApiPromise.create({
      provider,
      types: {
        ChainId: "u8",
        ResourceId: "[u8; 32]",
        DepositNonce: "u64",
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
        OperationRequest: {
          account: "AccountId",
          authority_index: "AuthIndex",
          validators_len: "u32",
          block_num: "BlockNumber",
        },
        Currency: {
          _enum: ["Unknown", "Usd", "Eq", "Eth", "Btc", "Eos", "Dot", "Hbtc"],
        },
        UserGroup: {
          _enum: ["Unknown", "Balances", "Bailsmen", "Borrowers", "Lenders"],
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
        ProposalStatus: {
          _enum: ["Initiated", "Approved", "Rejected"],
        },
        ProposalVotes: {
          votes_for: "Vec<AccountId>",
          votes_against: "Vec<AccountId>",
          status: "ProposalStatus",
          expiry: "BlockNumber",
        },
        LookupSource: "AccountId",
        BalanceOf: "Balance",
        TransferReason: {
          _enum: [
            "Common",
            "InterestFee",
            "MarginCall",
            "LiquidityFarming",
            "BailsmenRedistribution",
            "TreasuryEqBuyout",
            "TreasuryBuyEq",
            "Subaccount",
          ],
        },
        PricePayload: "Data",
        Duration: {
          secs: "u64",
          nanos: "u32",
        },
        Asset: "Currency",
        FixedNumber: "u128",
        Price: "u128",
        PriceUpdate: {
          period_start: "Duration",
          time: "Duration",
          price: "FixedNumber",
        },
        PriceLog: {
          latest_timestamp: "Duration",
          prices: "CapVec<Price>",
        },
        CapVec: {
          head_index: "u32",
          len_cap: "u32",
          items: "Vec<FixedNumber>",
        },
        AssetMetrics: {
          period_start: "Duration",
          period_end: "Duration",
          returns: "Vec<FixedNumber>",
          volatility: "FixedNumber",
          correlations: "Vec<(Asset, FixedNumber)>",
        },
        FinancialMetrics: {
          period_start: "Duration",
          period_end: "Duration",
          assets: "Vec<Asset>",
          mean_returns: "Vec<FixedNumber>",
          volatilities: "Vec<FixedNumber>",
          correlations: "Vec<FixedNumber>",
          covariances: "Vec<FixedNumber>",
        },
        PortfolioMetrics: {
          period_start: "Duration",
          period_end: "Duration",
          assets: "Vec<Asset>",
          mean_returns: "Vec<FixedNumber>",
          volatilities: "Vec<FixedNumber>",
          correlations: "Vec<FixedNumber>",
          covariances: "Vec<FixedNumber>",
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
