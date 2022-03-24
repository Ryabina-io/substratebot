const { ApiPromise, WsProvider } = require("@polkadot/api")

module.exports = {
  getApi: async () => {
    const nodeUri = process.env.NODE_URI || "wss://mainnet-rpc.stafi.io"
    const provider = new WsProvider(nodeUri)
    const types = {
      Address: "IndicesLookupSource",
      LookupSource: "IndicesLookupSource",
      RefCount: "u32",
      ChainId: "u8",
      ResourceId: "[u8; 32]",
      DepositNonce: "u64",
      RateType: "u64",
      AccountInfo: {
        nonce: "u32",
        refcount: "RefCount",
        data: "AccountData",
      },
      AccountRData: {
        free: "u128",
      },
      RSymbol: {
        _enum: ["RFIS", "RDOT", "RKSM", "RATOM", "RSOL", "RMATIC", "RBNB"],
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
        _enum: ["Transfer", "Bond", "Unbond", "WithdrawUnbond", "ClaimRewards"],
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
      SwapTransactionInfo: {
        account: "AccountId",
        receiver: "Vec<u8>",
        value: "u128",
        is_deal: "bool",
      },
      SwapRate: {
        lock_number: "u64",
        rate: "u128",
      },
      BondAction: {
        _enum: [
          "BondOnly",
          "UnbondOnly",
          "BothBondUnbond",
          "EitherBondUnbond",
          "InterDeduct",
        ],
      },
      BondSwap: {
        bonder: "AccountId",
        swap_fee: "Balance",
        swap_receiver: "AccountId",
        bridger: "AccountId",
        recipient: "Vec<u8>",
        dest_id: "ChainId",
        expire: "BlockNumber",
        bond_state: "BondState",
        refunded: "bool",
      },
      ClaimInfo: {
        mint_amount: "u128",
        native_token_amount: "u128",
        total_reward: "Balance",
        total_claimed: "Balance",
        latest_claimed_block: "BlockNumber",
        mint_block: "BlockNumber",
      },
      MintRewardAct: {
        begin: "BlockNumber",
        end: "BlockNumber",
        cycle: "u32",
        reward_rate: "u128",
        total_reward: "Balance",
        left_amount: "Balance",
        user_limit: "Balance",
        locked_blocks: "u32",
        total_rtoken_amount: "u128",
        total_native_token_amount: "u128",
      },
      AccountLpData: {
        free: "u128",
      },
      SwapPool: {
        symbol: "RSymbol",
        fis_balance: "u128",
        rtoken_balance: "u128",
        total_unit: "u128",
      },
      StakePool: {
        symbol: "RSymbol",
        emergency_switch: "bool",
        total_stake_lp: "u128",
        start_block: "u32",
        reward_per_block: "u128",
        total_reward: "u128",
        left_reward: "u128",
        lp_locked_blocks: "u32",
        last_reward_block: "u32",
        reward_per_share: "u128",
        guard_impermanent_loss: "bool",
      },
      StakeUser: {
        account: "AccountId",
        lp_amount: "u128",
        reward_debt: "u128",
        reserved_lp_reward: "u128",
        total_fis_value: "u128",
        total_rtoken_value: "u128",
        deposit_height: "u32",
        grade_index: "u32",
        claimed_reward: "u128",
      },
      ValidatorPrefs: {
        commission: "Compact<Perbill>",
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
