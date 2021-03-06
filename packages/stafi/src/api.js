const { ApiPromise, WsProvider } = require("@polkadot/api")

module.exports = {
  getApi: async () => {
    const nodeUri = process.env.NODE_URI || "wss://mainnet-rpc.stafi.io"
    const provider = new WsProvider(nodeUri)
    const types = {
      RefCount: "u32",
      ChainId: "u8",
      ResourceId: "[u8; 32]",
      DepositNonce: "u64",
      RateType: "u64",
      AccountRData: {
        free: "u128",
      },
      RSymbol: {
        _enum: ["RFIS", "RDOT", "RKSM", "RATOM"],
      },
      AccountXData: {
        free: "u128",
      },
      XSymbol: {
        _enum: ["WRA"],
      },
      ProposalStatus: {
        _enum: ["Active", "Passed", "Expired", "Executed"],
      },
      ProposalVotes: {
        voted: "Vec<AccountId>",
        status: "ProposalStatus",
        expiry: "BlockNumber",
      },
      BondRecord: {
        bonder: "AccountId",
        symbol: "RSymbol",
        pubkey: "Vec<u8>",
        pool: "Vec<u8>",
        blockhash: "Vec<u8>",
        txhash: "Vec<u8>",
        amount: "u128",
      },
      BondReason: {
        _enum: [
          "Pass",
          "BlockhashUnmatch",
          "TxhashUnmatch",
          "PubkeyUnmatch",
          "PoolUnmatch",
          "AmountUnmatch",
        ],
      },
      BondState: {
        _enum: ["Dealing", "Fail", "Success"],
      },
      SigVerifyResult: {
        _enum: ["InvalidPubkey", "Fail", "Pass"],
      },
      PoolBondState: {
        _enum: [
          "EraUpdated",
          "BondReported",
          "ActiveReported",
          "WithdrawSkipped",
          "WithdrawReported",
          "TransferReported",
        ],
      },
      BondSnapshot: {
        symbol: "RSymbol",
        era: "u32",
        pool: "Vec<u8>",
        bond: "u128",
        unbond: "u128",
        active: "u128",
        last_voter: "AccountId",
        bond_state: "PoolBondState",
      },
      LinkChunk: {
        bond: "u128",
        unbond: "u128",
        active: "u128",
      },
      OriginalTxType: {
        _enum: [
          "Transfer",
          "Bond",
          "Unbond",
          "WithdrawUnbond",
          "ClaimRewards",
        ],
      },
      Unbonding: {
        who: "AccountId",
        value: "u128",
        recipient: "Vec<u8>",
      },
      UserUnlockChunk: {
        pool: "Vec<u8>",
        unlock_era: "u32",
        value: "u128",
        recipient: "Vec<u8>",
      },
      RproposalStatus: {
        _enum: ["Initiated", "Approved", "Rejected", "Expired"],
      },
      RproposalVotes: {
        votes_for: "Vec<AccountId>",
        votes_against: "Vec<AccountId>",
        status: "RproposalStatus",
        expiry: "BlockNumber",
      },
    }
    const api = await ApiPromise.create({
      provider: provider,
      types: types,
    })
    const subscribeApi = await ApiPromise.create({
      provider: provider,
      types: types,
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
