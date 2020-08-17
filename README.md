# Substrate Telegram Bot

The project is designed to help projects in the Substrate ecosystem set up telegram bot to monitor and alert for any events and actions in the network.

This repository is split up into a number of packages. The main part is the Substrate Bot Core package. It provides basic functionality for create your own bot. For more information please check description [here](https://github.com/Ryabina-io/substratebot/tree/master/packages/core).

The rest of the packages are examples of bot implementation for projects such as:
- [Polkadot](https://github.com/Ryabina-io/substratebot/tree/master/packages/polkadot)
- [Kusama](https://github.com/Ryabina-io/substratebot/tree/master/packages/kusama)
- [Acala](https://github.com/Ryabina-io/substratebot/tree/master/packages/acala)
- [Edgeware](https://github.com/Ryabina-io/substratebot/tree/master/packages/edgeware)
- [Joystream](https://github.com/Ryabina-io/substratebot/tree/master/packages/joystream)
![Logo](https://miro.medium.com/max/1400/1*xFT5MT_GuyzdwMuc-qddhQ.png)

Their main functions are to alert about events that take place in the networks and to collect statistic about networks status. However the variety of possible single notifications and combination of notifications is huge, that makes these bots very useful and powerful tools.
Bots can be used in two ways:
as a personal informational bot, sending alerts in a private chat;
as informational bot for Telegram groups showing statistic of network, current price (optional) and sending democracy alerts (optional).

## Personal informational bot.
All notifications are divided into 3 groups: `Address alerts`, `Democracy and Treasury` alerts and alerts of `Advanced mode`.

![selectone](https://cdn-images-1.medium.com/max/1600/1*fZajClfmBTJHtwp8mjUEGw.png)

`Transfer` - bot sends message about transfers from or to tracked account is done;
`Rewards` - bot sends message about rewards received to tracked account;
`Slash` - bot sends message if tracked account is slashed;
`Nominated` validator has updated the fee - bot sends message if validator nominated by tracked account changes its fee;
`Account nominated validators`(for nominators) - bot sends message if tracked account nominated some validator(s);
`Account nominated`(for validators) - bot sends message if tracked validators account was nominated

![address alerts](https://cdn-images-1.medium.com/max/1600/0*1OReNynW4iDJ0WrT)

By default some points of menu are selected, but you can select/deselect only those points you need. After selecting, choose `Enter address`.

You'll get first confirmation about chosen notifications and requirement of public address you want to track.

![1st conf](https://cdn-images-1.medium.com/max/1600/0*zv5mGQ9cD95Tms-w)

Put in the Polkadot/Kusama public address in the field below. As an answer you will get requirement to enter a name for this address (in case tracked address has no Identity on chain, if it has, bot uses Identity).

![name it](https://cdn-images-1.medium.com/max/1600/0*0DfqPCXkQY9mSgjb)

After sending the name to bot, you will get second confirmation on alert set.

![done](https://cdn-images-1.medium.com/max/1600/0*Ha-UIFcjtSQCNKe-)

## Democracy and Treasury alerts.
This set of notifications let users never miss events in the networks. Following alerts can be set up here:
* `A motion has been proposed`
* `A referendum has begun`
* `A Proposal has been passed`
* `A Proposal has been No passed`
* `A Proposal has been cancelled`
* `A Proposal has been executed`
* `New Treasury Tip`
* `New Treasury Proposal`

![democracy list](https://cdn-images-1.medium.com/max/1600/0*tbyVz9p5EqKLxSvl)

Choose items you need by selecting/deselecting them and push "Create Alerts" button.
You will get a confirmation:

![done2](https://cdn-images-1.medium.com/max/1600/0*x3Mp5LMYU4HqsE7I)

## Advanced mode.
If pre-configured notifications are not enough, please choose `Advanced mode`. Please be noted that you should understand what [Substrate](https://www.substrate.io/) is to get maximum value from this mode.
All [Events](https://substrate.dev/docs/en/knowledgebase/runtime/events) and [Extrinsics](https://substrate.dev/docs/en/knowledgebase/learn-substrate/extrinsics) are collected here. In short, Extrinsics - are methods that either users or smart contracts call in the network, Events - are the events that these methods trigger.

Also they are grouped into modules from Polkadot and Kusama.

![advanced1](https://cdn-images-1.medium.com/max/1600/0*y1Mf0ZApjAmlCH8A)

After selecting a module you are required to select a type of alert: Extrinsics or Events (if available)

![module](https://cdn-images-1.medium.com/max/1600/0*3AaWcPG899tukX2O)

Next step is to set up `Filters`. Please be noted that correct use of `Filters` is very important stage and helps you to avoid unnecessary information.

*For example: in case Filter `Target` is not selected for Event `Transfer` bot will send information about ALL transfers in the network.

![event transfer](https://cdn-images-1.medium.com/max/1600/0*slNq3pV6KjPU5wKp)

If there no need in filters choose `Create Alert` button and get confirmation.

![done3](https://cdn-images-1.medium.com/max/1600/0*vSrp9S-7mwKDrpVj)

## Examples of notification in advanced mode.

1.In case you want to be notified when transfer on more than 100000 $KSM takes place, following path should be done:

`Advanced > Balances > Events > Transfer > Filters > Value > 
> 100000 > Exit filtering mode > Create alert`

![transfer10k](https://cdn-images-1.medium.com/max/1600/1*9d9Usv60fjHmWLG1qtkAmA.png)

2. If you want to track when some account votes.

`Advanced > Democracy > Extrinsics > Vote > FILTERS > sender > Enter address > Exit 'Filtering mode' > Create Alert`

![dem sender](https://cdn-images-1.medium.com/max/1600/0*QlnkfkMTbyzzXBoS.png)

3. Track when new identity load on-chain.

`Advanced > Identity > Extrinsics > SetIdentity > Create Alert`

![set identity](https://cdn-images-1.medium.com/max/1600/0*YnoBlCcMTQ6voEkM.png)

## Alerts managements. My addresses/alerts.
All your alerts are grouped by the accounts they're linked to. If an alert is not linked to any of your accounts, it is added to 'Other Alerts' group.

![my alerts](https://cdn-images-1.medium.com/max/1600/1*H9lq41YjE77nP0SReXMP7w.png)

You can easily manage added addresses, delete and rename .

## Usage within telegram groups.
Additional way to use bot is to get alerts about statistic, prices and democracy events into Telegram group.Information about validators, nominators, supply is shown by default, about price, volume, market cap and democracy events is optional.

![groups](telegramhttps://cdn-images-1.medium.com/max/1600/0*kPGRvHIMePjx5Pl0)

To start using bot in the group just invite bot as a group member.

Command to control bot:
* /stats - to show statistic
* /alertson - to turn on alerts on democracy events
* /alertsoff - to turn off alerts on democracy event
* /priceon - to show current price
* /priceoff - not to show current price

Democracy and price information is disabled by default. Activate them if needed.

List of Ryabina bots:
* [@Polkadot_Ryabina_bot](https://t.me/Polkadot_Ryabina_bot)
* [@Kusasma_bot](https://t.me/Kusasma_bot)
* [@Edgeware_bot](https://t.me/Edgeware_bot)
* [@Acala_Ryabina_bot](https://t.me/Acala_Ryabina_bot)

If you liked our bots, nominate **Ryabina validators**.
Thank you!

