# Substrate Telegram Bot

Core Lib for Substrate Telegram Bot. 

## Install

```
npm i substratebot
```

## Use

```js
const substrateBot = new SubstrateBot(
    settings,
    api,
    modules,
    modes,
    getNetworkStatsMessage
)
substrateBot.run()
```

### `@settings` 
main bot settings, should contain substrate network params (name, prefix, decimals, token), telegram bot token, start & validators messages, links (governance, common), list of group alerts.

#### sample:
```js
const settings = {
    network: {
      name: "Kusama",
      prefix: "2",
      decimals: "12",
      token: "KSM",
    },
    startMsg: "Hello. This is Substrate BOT!",
    validatorsMessage: "This message shows up when /validators call",
    governanceLinks: ["commonwealth", "polkassembly", "subscan", "polkascan"],
    commonLinks: ["subscan", "polkascan"],
    groupAlerts: {
      events: [
        ["democracy", "Proposed"],
        ["democracy", "Started"],
        ["treasury", "Proposed"],
      ],
      calls: [
        ["treasury", "tipNew"],
        ["treasury", "reportAwesome"],
      ],
    },
    BOT_TOKEN: process.env.BOT_TOKEN,
}
```

`network` - basic network parameters. Most often, the bot will take these parameters from the api, but if they are undefined, it will use settings.

`startMsg` - this message is sent to the user after calling the /start command.

`validatorsMessage` - this message is sent to the user after calling the /validators command.

The information in alerts is often not complete, so it is very useful to add links to network explorers.  

`governanceLinks` - links under governance messages (e.g. democracy.proposed)

`commonLinks` - links under regular messages

`groupAlerts` - bot also works in group chats, but its functionality is limited and can notify about events described in this parameter. It's written in that style:

```js
groupAlerts: {
    events:[
        ["moduleName","eventName"]
    ],
    calls:[
        ["moduleName","callName"]
    ]
}
```

`BOT_TOKEN` - telegram bot token. Information about how to authorize your own bot, you can find [here](https://core.telegram.org/bots/api#authorizing-your-bot).

### `@api`
[polkadot-api](https://github.com/polkadot-js/api) instance for connect to node.
API functions that uses by bot:
- api.rpc.chain.subscribeNewHeads
- api.rpc.chain.getHeader
- api.rpc.chain.getBlockHash
- api.rpc.chain.getBlock
- api.query.system.events
- api.query.balances.locks
- api.query.staking.ledger
- api.derive.accounts.info
- api.query.staking.nominators (not required)

If API instance do not support any function from this list, the bot is not compatible with your Substrate version of the network.

### `@modules`
this parameter describes the structure of events in the node. A Substrate node consists of modules that consist of constants, storages data, events and extrinsincs. Two components of the module are important to the bot: events and extrinsincs. 

To describe the modules it is necessary to maintain this style:
```js
const modules = {
    ModuleName: {
        short: "ShrtMdlNm",
        events:{
            EventName: {
                short: "ShrtEvntNm",
                documentation: "This is full doccumentation that describe this event",
                args: [
                    {
                        name: "argName",
                        type: "argType",
                        baseType: "baseType",
                        visible: "hide"
                    }
                ]
            }
        },
        calls:{
            ExtrinsicName: {               
                short: "ShrtExtrnscNm",
                documentation: "This is full doccumentation that describe this extrinsic",
                args: [
                    {
                        name: "argName",
                        type: "argType",
                        baseType: "baseType",
                        visible: "hide"
                    }
                ]
            }
        }
    }
}
```

`substratebot/tools/utils` have a useful feature - `metaConvertToConfig(api, ingoreList)`. It will allow you to automatically load metadata from the node in the format required for the bot. `ignoreList` is a list of ignored events and calls, as well as instructions for displaying the visible flag. sample: 
```js
  const ingoreList = {
    events: [
      "ExtrinsicSuccess",
      "ExtrinsicFailed",
      "BatchInterrupted",
      "BatchCompleted",
    ],
    calls: ["batch"],
    /// All types in this list will be shown in the FILTER menu
    hide: [
      "GenericAccountId",
      "GenericAddress",
      "u8",
      "u16",
      "u32",
      "u64",
      "u128",
      "u256",
      "i8",
      "i16",
      "i32",
      "i64",
      "i128",
      "i256",
      "bool",
    ],
  }
```

### `@modes`
By default, the bot has only one event and call mode - `Advanced`. It contains everything you have described in the modules. But it is very difficult to navigate through all the event/calls lists of all the modules. For simplicity, we have added the option to group events into additional modes. Sample:
```js
  const modes = [
    {
      /// Modes name. Shows in the name of the mode button
      name: "Address alerts",
      // Unique index, must contain signle letter, no repeats are allowed.
      index: "u",
      // Modes description.
      description:
        "Here are most useful events for your account.\n\nYou can select🟢/ unselect⚪️ by clicking on them.",
      // If events/calls in the mode need filtering by address, the flag is true. 
      isAddressFiltering: true,
      // List of events/calls
      alerts: [
        {
          // Name that shows in alerts menu
          name: "Transfer",
          // Which module contain this event/call
          contract: "balances",
          // Event name, if this is not event then write 
          // call: "Transfer"
          event: "Transfer",
          // list of arguments which should filter by input address
          filters: ["from", "to"],
          // short name of event/call
          short: "Trnsfr",
          // default value of select
          selected: true,
        }
      ]
    }
```

### `@getNetworkStatsMessage`
This is the function that the bot calls when it needs to respond to the query "show current network statistics".
