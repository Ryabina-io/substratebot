const BigNumber = require("bignumber.js")
const { botParams } = require("../config")
const { getBaseDef, getInnerType } = require("../tools/utils")
const { stringShorten } = require("@polkadot/util")
const { splitSentenceIntoRows } = require("../tools/utils")

const parsingMap = {
  AccountId: accountToString,
  GenericAccountId: accountToString,
  GenericAddress: accountToString,
  GenericAccountIndex: uintToString,
  GenericLookupSource: accountToString,
  GenericMultiAddress: accountToString,
  AccountIndex: uintToString,
  AccountVote: enumToString,
  AccountVoteStandart: structToString,
  AuthorityId: accountToString,
  Balance: balanceToString,
  BalanceOf: balanceToString,
  BlockNumber: uintToString,
  Bytes: hexToString,
  Call: callToString,
  GenericCall: callToString,
  CallHash: primitiveToString,
  ChangesTrieConfiguration: structToString,
  CodeHash: primitiveToString,
  Conviction: enumToString,
  Data: enumToString,
  DispatchError: enumToString,
  DispatchResult: resultToString,
  ElectionCompute: enumToString,
  EquivocationProof: structToString,
  EraIndex: uintToString,
  Gas: uintToString,
  Moment: dateToString,
  Hash: primitiveToString,
  H256: primitiveToString,
  H512: primitiveToString,
  H160: primitiveToString,
  Heartbeat: structToString,
  IdentityFields: structToString,
  IdentityInfo: structToString,
  IdentityJudgement: enumToString,
  Key: primitiveToString,
  KeyOwnerProof: structToString,
  Keys: primitiveToString,
  MemberCount: uintToString,
  Null: primitiveToString,
  OpaqueNetworkState: structToString,
  OracleKey: oracleKeyToString,
  OracleValue: priceToString,
  Perbill: uintToString,
  Period: tupleToString,
  PhantomData: primitiveToString,
  Price: priceToString,
  Priority: uintToString,
  PropIndex: uintToString,
  Proposal: callToString,
  ProposalIndex: uintToString,
  ReferendumIndex: uintToString,
  RegistrarIndex: uintToString,
  Renouncing: enumToString,
  RewardDestination: enumToString,
  String: primitiveToString,
  Schedule: structToString,
  SessionIndex: uintToString,
  Signature: primitiveToString,
  SocietyJudgement: enumToString,
  TaskAddress: primitiveToString,
  Timepoint: dateToString,
  ValidatorPrefs: structToString,
  VestingInfo: structToString,
  VoteThreshold: enumToString,
  Vote: objectToString,
  Weight: uintToString,
  bool: primitiveToString,
  u8: uintToString,
  u16: uintToString,
  u32: uintToString,
  u64: uintToString,
  u128: uintToString,
  u256: uintToString,
  i8: uintToString,
  i16: uintToString,
  i32: uintToString,
  i64: uintToString,
  i128: uintToString,
  i256: uintToString,
}

async function parse(value, type, baseType, depth) {
  if (type == "Timepoint" || type == "Moment") {
    return await dateToString(value)
  } else if (type == "Balance" || type == "BalanceOf" || type == "Amount") {
    return await balanceToString(value)
  } else if (type == "Call" || type == "Proposal") {
    return await callToString(value, type, baseType, depth)
  } else if (baseType.startsWith("Compact<")) {
    return await compactToString(value, type, baseType, depth)
  } else if (baseType.startsWith("Option<")) {
    return await optionToString(value, type, baseType, depth)
  } else if (baseType == "Vec<u8>") {
    return await hexToString(value, type, baseType, depth)
  } else if (baseType.startsWith("Vec<")) {
    return await vecToString(value, type, baseType, depth)
  } else if (baseType.startsWith("(")) {
    return await tupleToString(value, type, baseType, depth)
  } else if (baseType.startsWith("{")) {
    if (baseType.includes("_enum")) {
      return await enumToString(value, type, baseType, depth)
    } else {
      return await objectToString(value, type, baseType, depth)
    }
  } else if (baseType.startsWith("[")) {
    return await primitiveToString(value, type, baseType, depth)
  } else {
    if (!parsingMap[baseType]) {
      var checkBaseType = getBaseDef(baseType, botParams.api.registry)
      if (checkBaseType == baseType) {
        console.log(new Date(), `BaseType ${baseType} missing in parsingMap`)
        return await primitiveToString(value, type, baseType, depth)
      } else {
        return await parse(value, type, checkBaseType, depth)
      }
    } else {
      return await parsingMap[baseType](value, type, baseType, depth)
    }
  }
}

async function compactToString(value, type, baseType, depth) {
  var innerType = getInnerType(type)
  var innerBaseType = getInnerType(baseType)
  return await parse(value.unwrap(), innerType, innerBaseType, depth)
}

async function optionToString(value, type, baseType, depth) {
  var innerType = getInnerType(type)
  var innerBaseType = getInnerType(baseType)
  return await parse(value.value, innerType, innerBaseType, depth)
}

async function structToString(value, type, baseType, depth = 4) {
  var struct = value.Type
  var result = ""
  for (var param in struct) {
    var valueType = struct[param]
    result += `\n${` `.repeat(depth)}${param}: `
    try {
      result += await parse(value[param], valueType, valueType, depth + 2)
    } catch (error) {
      console.log(new Date(), `ERROR: type:${struct[param]}\n${error} `)
    }
  }
  return result
}

async function objectToString(value, type, baseType, depth) {
  var result = ""
  if (baseType.startsWith("{")) {
    var subStruct = JSON.parse(baseType)
    for (var key in subStruct) {
      result += `\n${` `.repeat(depth)}${key}: `
      try {
        result += await parse(
          value[key],
          subStruct[key],
          subStruct[key],
          depth + 2
        )
      } catch (error) {
        console.log(new Date(), `ERROR: type:${subStruct[key]}\n${error}`)
      }
    }
  } else {
    var obj = value.toHuman ? value.toHuman() : value.toJSON()
    for (var key in obj) {
      result += `\n${` `.repeat(depth)}${key}: ${obj[key]}`
    }
  }
  return result
}

async function enumToString(value, type, baseType, depth = 4) {
  var enumStruct = JSON.parse(value.toRawType())
  var valueType = enumStruct._enum[value.type]
  if (!valueType || valueType == "Null" || /^-?\d+$/.test(valueType)) {
    return value.type
  } else if (valueType.includes("{")) {
    var subStruct = JSON.parse(valueType)
    var result = "" //`\n${` `.repeat(depth)}${value.type}: `
    for (var key in subStruct) {
      result += `\n${` `.repeat(depth + 2)}${key}: `
      try {
        result += await parse(value.value[key], type, subStruct[key], depth + 4)
      } catch (error) {
        console.log(new Date(), `ERROR: type:${subStruct[key]}\n${error}`)
      }
    }
    return result
  } else if (valueType.includes("[")) {
    var result = "" //`\n${` `.repeat(depth)}${value.type}: `
    result += await toString(value.value, valueType)
    return result
  } else {
    try {
      var result = "" //`\n${` `.repeat(depth)}${value.type}: `
      result += await parse(value.value, type, valueType, depth + 2)
      return result
    } catch (error) {
      console.log(new Date(), `ERROR: type:${valueType}\n${error}`)
    }
  }
}

async function vecToString(value, type, baseType, depth = 4) {
  var innerType = getInnerType(type)
  var innerBaseType = getInnerType(baseType)
  var result = ""
  for (var v = 0; v < value.length; v++) {
    if (v > 15) {
      result += `\n${` `.repeat(depth)}${
        v + 1
      }: too many elements in the array. length = ${value.length}`
      break
    }
    result += `\n${` `.repeat(depth)}${v + 1}: `
    result += await parse(value[v], innerType, innerBaseType, depth + 2)
  }
  return result
}

async function tupleToString(value, type, baseType, depth = 4) {
  var rawType = value.toRawType()
  var rawSplit = rawType.replace("(", "").replace(")", "").split(",")
  var currentObject = ""
  var types = []
  rawSplit.forEach(s => {
    if (!s.includes("{") && currentObject == "") {
      types.push(s)
    } else {
      currentObject += s
      var left = currentObject.split("").filter(c => c == "{").length
      var right = currentObject.split("").filter(c => c == "}").length
      if (left == right) {
        types.push(currentObject)
        currentObject = ""
      }
    }
  })
  var result = ""
  for (var i = 0; i < value.length; i++) {
    result += `\n${` `.repeat(depth)}`
    result += await parse(value[i], types[i], types[i], depth + 2)
  }
  return result
}

async function resultToString(value, type, baseType, depth) {
  if (value.value.type) {
    return `${value.type}(${value.value.type})`
  } else return value.type
}

async function callToString(value, type, baseType, depth = 4) {
  var result = ""
  result += `\n${` `.repeat(depth)}index: ${value.callIndex.toString()}`
  result += `\n${` `.repeat(depth)}module: ${value.section}`
  result += `\n${` `.repeat(depth)}method: ${value.method}`
  result += `\n${` `.repeat(depth)}args: `
  var defs = value.argsDef
  for (var i = 0; i < value.args.length; i++) {
    var argType = JSON.parse(value.Type["args"])[Object.keys(value.argsDef)[0]]
    result += `\n${` `.repeat(depth + 2)}${Object.keys(value.argsDef)[i]}: `
    result += await parse(value.args[i], argType, argType, depth + 4)
  }
  return result
}

async function accountToString(value, type, baseType, depth) {
  var accountInfo = await botParams.api.derive.accounts.info(value.toString())
  if (accountInfo.identity.displayParent || accountInfo.identity.display) {
    var value = ""
    if (accountInfo.identity.displayParent) {
      value += accountInfo.identity.displayParent + ":"
    }
    if (accountInfo.identity.display) {
      value += accountInfo.identity.display
    }
    return value
  } else if (accountInfo.accountIndex) {
    return accountInfo.accountIndex
  }
  return value.toString()
}

async function balanceToString(value, type, baseType, depth) {
  var decimals = botParams.settings.network.decimals
  if(decimals.toRawType() === 'Option<Vec<u32>>'){
    decimals = decimals.toJSON()[0]
  }
  var token = botParams.settings.network.token
  if(token.toRawType() === 'Option<Vec<Text>>'){
    token = token.toJSON()[0]
  }
  return (
    new BigNumber(value.toString())
      .dividedBy(new BigNumber("1e" + decimals))
      .toFixed(4) + (token ? " " + token : "")
  )
}

async function priceToString(value, type, baseType, depth) {
  return new BigNumber(value.toString())
    .dividedBy(new BigNumber("1e" + botParams.settings.network.decimals))
    .toFixed(4)
}

async function uintToString(value, type, baseType, depth) {
  if (value["toHuman"] && typeof value["toHuman"] == "function") {
    var humanValue = value.toHuman()
    if (humanValue.includes(botParams.settings.network.token)) {
      return (
        new BigNumber(value.toString())
          .dividedBy(new BigNumber("1e" + botParams.settings.network.decimals))
          .toFixed(4) +
        " " +
        botParams.settings.network.token
      )
    }
    return humanValue
  } else return new BigNumber(value.toString()).toFixed(4)
}

async function dateToString(value, type, baseType, depth) {
  var date = new Date(value.toNumber())
  let formatted_date =
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1) +
    "-" +
    date.getDate() +
    " " +
    date.getHours() +
    ":" +
    date.getMinutes() +
    ":" +
    date.getSeconds()
  return formatted_date + " (UTC+0)"
}

async function primitiveToString(value, type, baseType, depth) {
  if (value["toHuman"] && typeof value["toHuman"] == "function") {
    var humanValue = value.toHuman()
    if (!humanValue) {
      return humanValue
    } else
      return humanValue.length > 45 ? stringShorten(humanValue, 12) : humanValue
  } else return value.toString()
}

async function hexToString(value, type, baseType, depth) {
  var hex
  if (value.toString().startsWith("0x")) {
    var hex = value.toString().slice(2)
  } else hex = value.toString()
  var str = ""
  var char = ""
  for (var i = 0; i < hex.length; i += 2) {
    char += "%" + hex.substr(i, 2)
    try {
      str += decodeURIComponent(char)
      char = ""
    } catch {
      continue
    }
  }
  if (str == "") {
    return value.toString().length > 45
      ? stringShorten(value.toString(), 12)
      : value.toString()
  } else return str
}

async function oracleKeyToString(value, type, baseType, depth) {
  var result = ""
  var oracleKey = value.toHuman()
  if (oracleKey.toString() === "[object Object]") {
    for (var key in oracleKey) {
      result += oracleKey[key] + " "
    }
  } else result = oracleKey.toString()
  return result
}

module.exports = {
  parse: parse,
  objectToString: objectToString,
  balanceToString: balanceToString,
  dateToString: dateToString,
  hexToString: hexToString,
}
