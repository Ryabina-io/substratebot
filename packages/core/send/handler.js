const { botParams } = require("../config")
const _ = require("lodash")
const { sendEvent } = require("./event")
const { sendExtrinsic } = require("./extrinsic")

let currentBlock = 0
async function newHeaderHandler(header) {
  const blockNumber = header.number.toNumber()
  if (currentBlock < blockNumber) currentBlock = blockNumber
  else return
  const blockHash = await botParams.api.rpc.chain.getBlockHash(blockNumber)
  const block = await botParams.api.rpc.chain.getBlock(blockHash)
  const events = await botParams.api.query.system.events.at(blockHash)
  block.block.extrinsics.forEach(async (extr, index) => {
    var extrinsic = {
      method: extr.method.method ?? extr.method.methodName,
      section: extr.method.section ?? extr.method.sectionName,
      args: _.zipObject(Object.keys(extr.argsDef), extr.method.args),
    }
    if (extr.isSigned) {
      extrinsic.signer = extr.signer.toString()
    }
    var indexEvents = events
      .filter(e => {
        if (e.phase.value["toNumber"]) {
          return e.phase.value.toNumber() == index
        } else return false
      })
      .map(e => {
        return {
          section: e.event.section,
          method: e.event.method,
        }
      })
    if (
      indexEvents.find(
        e => e.section == "system" && e.method == "ExtrinsicFailed"
      )
    ) {
      extrinsic.success = false
    } else if (
      indexEvents.find(
        e => e.section == "system" && e.method == "ExtrinsicSuccess"
      )
    ) {
      extrinsic.success = true
    } else {
      console.log(
        new Date(),
        "Something wrong. Exist extrinsic don't have result event."
      )
    }
    if (extrinsic.success) {
      try {
        await sendExtrinsic(extrinsic, index, currentBlock)
      } catch (error) {
        console.log(new Date(), error)
      }
    }
  })
  if (events.length > 0) {
    try {
      await newEventsHandler(events)
    } catch (error) {
      console.log(new Date(), error)
    }
  }
}

async function newEventsHandler(events) {
  botParams.db.read()
  if (events.length > 0) {
    events.forEach(event => {
      try {
        sendEvent(event, currentBlock)
      } catch (error) {
        console.log(new Date(), error)
      }
    })
  }
}

module.exports = {
  newHeaderHandler: newHeaderHandler,
}
