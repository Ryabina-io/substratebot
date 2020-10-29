const { botParams } = require("../config")
const { stringCamelCase } = require("@polkadot/util")

function metaConvertToConfig(api, hideIgnore) {
  var modules = {}
  api.runtimeMetadata.asLatest.modules.forEach(module => {
    if (
      (module.events && module.events.value.length > 0) ||
      (module.calls && module.calls.value.length > 0)
    ) {
      modules[module.name.toString()] = {
        events: {},
        calls: {},
        short: module.name.toString().replace(/[aeiou]/g, ""),
      }

      if (module.events.value.length > 0) {
        module.events.value.forEach(event => {
          if (!hideIgnore.events.includes(event.name.toString())) {
            var emptyIndex = event.documentation.indexOf("")
            if (emptyIndex == -1) {
              emptyIndex = event.documentation.indexOf(" # <weight>")
            }
            var documentation = ""
            if (emptyIndex > 0) event.documentation.length = emptyIndex
            var documentationArgs = []
            var docStr =
              event.documentation.length > 0
                ? event.documentation
                    .map(d => d.toString())
                    .reduce((total, d) => {
                      return total + " " + d
                    })
                : ""
            var squareBrackets = docStr.match(/\[.*?\]/g)
            if (squareBrackets && squareBrackets.length > 0) {
              documentationArgs = docStr
                .match(/\[.*?\]/g)[0]
                .replace("[", "")
                .replace("]", "")
                .replace(/\\/g, "")
                .replace(/ /g, "")
                .split(",")
              documentation = docStr
                .replace(/\\/g, "")
                .replace("[", "`(")
                .replace("]", ")`")
            } else if (event.documentation.length > 0) {
              documentation = docStr
            }
            modules[module.name.toString()].events[event.name.toString()] = {
              short: event.name.toString().replace(/[aeiou]/g, ""),
              documentation: documentation,
              args: [],
            }
            event.args.forEach((arg, index) => {
              var docName = ""
              if (documentationArgs && documentationArgs.length > index) {
                docName = stringCamelCase(documentationArgs[index])
              } else {
                docName = stringCamelCase(arg.toString())
              }
              var checkExistName = (name, index = 1) => {
                var result = name
                if (
                  modules[module.name.toString()].events[
                    event.name.toString()
                  ].args.find(a => a.name == result)
                ) {
                  result = result + `${index + 1}`
                  return checkExistName(result, index + 1)
                } else return result
              }
              docName = checkExistName(docName)
              var newArg = {
                name: docName,
                type: arg.toString(),
                baseType: getBaseDef(arg.toString(), api.registry),
              }
              if (isHide(arg.toString(), api.registry, hideIgnore))
                newArg.visible = "hide"
              modules[module.name.toString()].events[
                event.name.toString()
              ].args.push(newArg)
            })
          }
        })
      }
      if (module.calls.value.length > 0) {
        module.calls.value.forEach(call => {
          var callName = stringCamelCase(call.name.toString())
          if (!hideIgnore.calls.includes(callName)) {
            var emptyIndex = call.documentation.indexOf("")
            if (emptyIndex == -1) {
              emptyIndex = call.documentation.indexOf(" # <weight>")
            }
            var documentation = call.documentation
            if (emptyIndex > 0) documentation.length = emptyIndex
            if (documentation.length > 0) {
              documentation = documentation
                .map(d => d.toString())
                .reduce((total, d) => {
                  return total + " " + d
                })
            } else documentation = ""
            modules[module.name.toString()].calls[callName] = {
              short: callName.replace(/[aeiou]/g, ""),
              documentation: documentation,
              args: [],
            }
            call.args.forEach(arg => {
              var argJSON = arg.toJSON()
              var newArg = {
                name: stringCamelCase(argJSON.name),
                type: argJSON.type,
                baseType: getBaseDef(argJSON.type, api.registry),
              }
              if (isHide(argJSON.type, api.registry, hideIgnore))
                newArg.visible = "hide"
              modules[module.name.toString()].calls[callName].args.push(newArg)
            })
          }
        })
      }
    }
  })
  return modules
}

function isHide(type, registry, hideIgnore) {
  if (
    type.startsWith("Compact<") ||
    type.startsWith("Option<") ||
    type.startsWith("Vec<")
  ) {
    var innerType = type.substring(type.lastIndexOf("<") + 1, type.indexOf(">"))
    return isHide(innerType, registry, hideIgnore)
  } else {
    return (
      !hideIgnore.hide.includes(type) &&
      !hideIgnore.hide.includes(getBaseDef(type, registry))
    )
  }
}

function getBaseDef(type, registry, wrapType = "") {
  if (
    type.startsWith("Compact<") ||
    type.startsWith("Option<") ||
    type.startsWith("Vec<")
  ) {
    var innerType = type.substring(type.lastIndexOf("<") + 1, type.indexOf(">"))
    return getBaseDef(
      innerType,
      registry,
      type.substring(0, type.lastIndexOf("<"))
    )
  } else {
    if (registry) {
      var baseDef = registry.getDefinition(type)
      if (!baseDef || baseDef == type) {
        if (wrapType == "") {
          return type
        } else {
          return `${wrapType}<${type}>`
        }
      } else return getBaseDef(baseDef, registry, wrapType)
    } else {
      return type
    }
  }
}

async function getTargets(address) {
  var nominator = await botParams.api.query.staking.nominators(address)
  if (nominator.toJSON()) {
    return nominator.toJSON().targets
  } else return []
}

async function getStashAccount(address) {
  var ledger = await botParams.api.query.staking.ledger(address)
  return ledger
}

function isIterable(obj) {
  if (obj == null) {
    return false
  }
  return typeof obj[Symbol.iterator] === "function"
}

function getInnerType(type) {
  if (type.includes("<") && type.includes(">")) {
    return getInnerType(
      type.substring(type.lastIndexOf("<") + 1, type.lastIndexOf(">"))
    )
  } else return type
}

function replaceMarkdownSymbols(text, includingCode = true) {
  var result = text
    .replace(/_/g, "_")
    .replace(/\*/g, "*")
    .replace(/\[/g, "[")
    .replace(/\]/g, "]")
    .replace(/-/g, "-")
    .replace(/=/g, "=")
  if (includingCode) result = result.replace(/`/g, "`")
  return result
}

function splitSentenceIntoRows(str, n) {
  var res = []
  var lastDivIndex = 0
  var currentDivIndex = 0
  for (var i = 0; i < str.length; i++) {
    currentDivIndex = i - lastDivIndex
    if (currentDivIndex >= n - 1 && str[i] == " ") {
      res.push(str.substr(lastDivIndex, currentDivIndex))
      lastDivIndex = i + 1
      currentDivIndex = 0
    }
  }
  if (res.length == 0) return str
  return res.join("\n")
}

async function checkIsGroup(ctx, checkAdmin = false) {
  if (ctx.chat.type == "group" || ctx.chat.type == "supergroup") {
    if (checkAdmin) {
      var admins = await ctx.telegram.getChatAdministrators(ctx.chat.id)
      var from = ctx.from
      if (admins.find(a => a.user.id == from.id)) {
        return true
      } else return false
    } else return true
  } else return false
}

function getGroupOrCreate(ctx) {
  var group = botParams.db.get("users").find({ chatid: ctx.chat.id }).value()
  if (!group) {
    group = {
      chatid: ctx.chat.id,
      type: ctx.chat.type,
      wallets: [],
      maxLimit: 100,
      enabled: false,
      blocked: false,
      price: false,
    }
    botParams.db.get("users").push(group).write()
  }
  return group
}

module.exports = {
  metaConvertToConfig: metaConvertToConfig,
  isIterable: isIterable,
  getTargets: getTargets,
  getBaseDef: getBaseDef,
  getInnerType: getInnerType,
  getStashAccount: getStashAccount,
  replaceMarkdownSymbols: replaceMarkdownSymbols,
  splitSentenceIntoRows: splitSentenceIntoRows,
  checkIsGroup: checkIsGroup,
  getGroupOrCreate: getGroupOrCreate,
}
