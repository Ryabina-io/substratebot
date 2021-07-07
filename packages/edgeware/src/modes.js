module.exports = {
  getModes: () => {
    const modes = [
      {
        name: "Address alerts",
        index: "u",
        description:
          "Here are most useful events for your account.\n\nYou can select🟢/ unselect⚪️ by clicking on them.",
        isAddressFiltering: true,
        alerts: [
          {
            name: "Transfer",
            contract: "balances",
            event: "Transfer",
            filters: ["from", "to"],
            short: "Trnsfr",
            selected: true,
          },
          {
            name: "Reward",
            contract: "staking",
            event: "Reward",
            filters: ["stash"],
            short: "Rwrd",
            selected: true,
          },
          {
            name: "Slash",
            contract: "staking",
            event: "Slash",
            filters: ["address"],
            short: "Slsh",
            selected: true,
          },
          {
            name: "Nominated validator has updated the fee",
            contract: "staking",
            call: "validate",
            filters: ["sender"],
            source: "nominator",
            short: "Vldt",
            selected: true,
          },
          {
            name: "Account nominated validators (for nominators)",
            contract: "staking",
            call: "nominate",
            filters: ["sender"],
            short: "nmntsndr",
            selected: false,
          },
          {
            name: "Account nominated (for validators)",
            contract: "staking",
            call: "nominate",
            filters: ["targets"],
            short: "nmnttrgts",
            selected: false,
          },
        ],
      },
      {
        name: "Democracy and Treasury events",
        index: "d",
        description:
          "Here are most useful events for Democracy and Treasury.\n\nYou can select🟢/ unselect⚪️ by clicking on them.",
        isAddressFiltering: false,
        alerts: [
          {
            name: " A motion has been proposed",
            contract: "democracy",
            event: "Proposed",
            short: "DPrpsd",
            selected: true,
          },
          {
            name: "A referendum has begun",
            contract: "democracy",
            event: "Started",
            short: "Strtd",
            selected: true,
          },
          {
            name: "A proposal has been Passed",
            contract: "democracy",
            event: "Passed",
            short: "Pssd",
            selected: false,
          },
          {
            name: "A proposal has been No passed",
            contract: "democracy",
            event: "NotPassed",
            short: "NtPssd",
            selected: false,
          },
          {
            name: "A proposal has been Canceled",
            contract: "democracy",
            event: "Cancelled",
            short: "Cnclld",
            selected: false,
          },
          {
            name: "A proposal has been executed",
            contract: "democracy",
            event: "Executed",
            short: "Exctd",
            selected: false,
          },
          {
            name: "New Treasury Tip",
            contract: "treasury",
            call: "tipNew",
            short: "NwTp",
            selected: true,
          },
          {
            name: "New Treasury proposal",
            contract: "treasury",
            call: "proposeSpend",
            short: "TPrpsd",
            selected: true,
          },
        ],
      },
    ]
    return modes
  },
}
