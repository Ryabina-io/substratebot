const { botParams } = require("../config")
const { stringCamelCase } = require("@polkadot/util")
const _ = require("lodash")
const BigNumber = require("bignumber.js")
const marked = require("marked")
const { result } = require("lodash")

function metaConvertToConfig(api, hideIgnore) {
  if (api.runtimeMetadata.version >= 14) {
    return convertMetaV14(api.runtimeMetadata, api.registry, hideIgnore)
  } else {
    let modules = {}
    api.runtimeMetadata["asV" + api.runtimeMetadata.version]
      .toJSON()
      .modules.forEach(module => {
        modules[module.name.toString()] = {
          events: {},
          calls: {},
          short: module.name.toString().replace(/[aeiou]/g, ""),
        }
        if (module.events && module.events.length > 0) {
          module.events.forEach(event => {
            if (!hideIgnore.events.includes(event.name.toString())) {
              var emptyIndex = event[getDocsPropertyName(event)].indexOf("")
              if (emptyIndex == -1) {
                emptyIndex = event[getDocsPropertyName(event)].indexOf(
                  " # <weight>"
                )
              }
              var documentation = ""
              if (emptyIndex > 0)
                event[getDocsPropertyName(event)].length = emptyIndex
              var documentationArgs = []
              var docStr =
                event[getDocsPropertyName(event)].length > 0
                  ? event[getDocsPropertyName(event)]
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
              } else if (event[getDocsPropertyName(event)].length > 0) {
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
        if (module.calls && module.calls.length > 0) {
          module.calls.forEach(call => {
            var callName = stringCamelCase(call.name.toString())
            if (!hideIgnore.calls.includes(callName)) {
              var emptyIndex = call[getDocsPropertyName(call)].indexOf("")
              if (emptyIndex == -1) {
                emptyIndex = call[getDocsPropertyName(call)].indexOf(
                  " # <weight>"
                )
              }
              var documentation = call[getDocsPropertyName(call)]
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
                var newArg = {
                  name: stringCamelCase(arg.name),
                  type: arg.type,
                  baseType: getBaseDef(arg.type, api.registry),
                }
                if (isHide(arg.type, api.registry, hideIgnore))
                  newArg.visible = "hide"
                modules[module.name.toString()].calls[callName].args.push(
                  newArg
                )
              })
            }
          })
        }
        if (
          Object.keys(modules[module.name.toString()].events).length === 0 &&
          Object.keys(modules[module.name.toString()].calls).length === 0
        ) {
          delete modules[module.name.toString()]
        }
      })
    return modules
  }
}

function convertMetaV14(metadata, registry, hideIgnore) {
  let modules = {}
  let pallets = metadata.asLatest.pallets
  let types = metadata.asLatest.lookup.types
  pallets.forEach(pallet => {
    let events = []
    let calls = []
    if (pallet.events.value.toHuman()) {
      let eventsId = pallet.events.value.type.toHuman()
      events = types[eventsId].toJSON().type.def.variant.variants
    }
    if (pallet.calls.value.toHuman()) {
      let callsId = pallet.calls.value.type.toHuman()
      calls = types[callsId].toJSON().type.def.variant.variants
    }
    if (events.length > 0 || calls.length > 0) {
      modules[pallet.name.toString()] = {
        events: {},
        calls: {},
        short: pallet.name.toString().replace(/[aeiou]/g, ""),
      }

      if (events.length > 0) {
        events.forEach(event => {
          if (!hideIgnore.events.includes(event.name)) {
            let emptyIndex = event.docs.indexOf("")
            if (emptyIndex == -1) {
              emptyIndex = event.docs.indexOf(" # <weight>")
            }
            let documentation = ""
            if (emptyIndex > 0) event.docs.length = emptyIndex
            let documentationArgs = []
            var docStr =
              event.docs.length > 0
                ? event.docs
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
            } else if (event.docs.length > 0) {
              documentation = docStr
            }
            modules[pallet.name.toString()].events[event.name] = {
              short: event.name.replace(/[aeiou]/g, ""),
              documentation: documentation,
              args: [],
            }
            event.fields.forEach((arg, index) => {
              //name of argument
              var docName = ""
              if (documentationArgs && documentationArgs.length > index) {
                docName = stringCamelCase(documentationArgs[index])
              } else if (arg.name) {
                docName = stringCamelCase(arg.name)
              } else {
                if (types[arg.type].type.path.length > 0) {
                  docName = types[arg.type].type.path[
                    types[arg.type].type.path.length - 1
                  ].toString()
                } else {
                  docName = arg.typeName
                }
              }
              var checkExistName = (name, index = 1) => {
                var result = name
                if (
                  modules[pallet.name.toString()].events[event.name].args.find(
                    a => a.name == result
                  )
                ) {
                  result = result + `${index + 1}`
                  return checkExistName(result, index + 1)
                } else return result
              }
              docName = checkExistName(docName)

              //type of argument
              let argBaseTypeName = ""
              let argTypeName = ""

              if (
                arg.typeName.startsWith("Vec<") ||
                arg.typeName.startsWith("Option<") ||
                arg.typeName.startsWith("Compact<")
              ) {
                argTypeName = clearTypeName(
                  arg.typeName.substring(
                    arg.typeName.indexOf("<") + 1,
                    arg.typeName.lastIndexOf(">")
                  ),
                  arg.typeName.substring(0, arg.typeName.indexOf("<"))
                )
              } else argTypeName = clearTypeName(arg.typeName)
              argBaseTypeName = getBaseDef(argTypeName, registry)
              if (argBaseTypeName === argTypeName) {
                if (types[arg.type].type.path.length > 0) {
                  argBaseTypeName = getBaseDef(
                    types[arg.type].type.path[
                      types[arg.type].type.path.length - 1
                    ].toString(),
                    registry
                  )
                } else if (types[arg.type].type.def.toJSON().primitive) {
                  argBaseTypeName = types[arg.type].type.def
                    .toJSON()
                    .primitive.toLowerCase()
                }
              }
              var newArg = {
                name: docName,
                type: argTypeName,
                baseType: argBaseTypeName,
              }
              if (isHide(argBaseTypeName, registry, hideIgnore))
                newArg.visible = "hide"
              modules[pallet.name.toString()].events[event.name].args.push(
                newArg
              )
            })
          }
        })
      }
      if (calls.length > 0) {
        calls.forEach(call => {
          var callName = stringCamelCase(call.name)
          if (!hideIgnore.calls.includes(callName)) {
            var emptyIndex = call.docs.indexOf("")
            if (emptyIndex == -1) {
              emptyIndex = call.docs.indexOf(" # <weight>")
            }
            var documentation = call.docs
            if (emptyIndex > 0) documentation.length = emptyIndex
            if (documentation.length > 0) {
              documentation = documentation
                .map(d => d.toString())
                .reduce((total, d) => {
                  return total + " " + d
                })
            } else documentation = ""
            modules[pallet.name.toString()].calls[callName] = {
              short: callName.replace(/[aeiou]/g, ""),
              documentation: documentation,
              args: [],
            }
            call.fields.forEach(arg => {
              let argBaseTypeName = ""
              let argTypeName = ""
              if (
                arg.typeName.startsWith("Vec<") ||
                arg.typeName.startsWith("Option<") ||
                arg.typeName.startsWith("Compact<")
              ) {
                argTypeName = clearTypeName(
                  arg.typeName.substring(
                    arg.typeName.indexOf("<") + 1,
                    arg.typeName.lastIndexOf(">")
                  ),
                  arg.typeName.substring(0, arg.typeName.indexOf("<"))
                )
              } else argTypeName = clearTypeName(arg.typeName)
              argBaseTypeName = getBaseDef(argTypeName, registry)
              if (argBaseTypeName === argTypeName) {
                if (types[arg.type].type.path.length > 0) {
                  argBaseTypeName = getBaseDef(
                    types[arg.type].type.path[
                      types[arg.type].type.path.length - 1
                    ].toString(),
                    registry
                  )
                } else if (types[arg.type].type.def.toJSON().primitive) {
                  argBaseTypeName = types[arg.type].type.def
                    .toJSON()
                    .primitive.toLowerCase()
                } else if (types[arg.type].type.def.toJSON().sequence) {
                  let seqType = types[arg.type].type.def.toJSON().sequence.type
                  if (types[seqType].type.path.length > 0) {
                    argBaseTypeName =
                      "Vec<" +
                      getBaseDef(
                        types[seqType].type.path[
                          types[seqType].type.path.length - 1
                        ].toString(),
                        registry
                      ) +
                      ">"
                  }
                }
              }
              var newArg = {
                name: stringCamelCase(arg.name),
                type: argTypeName,
                baseType: argBaseTypeName,
              }

              if (isHide(argBaseTypeName, registry, hideIgnore))
                newArg.visible = "hide"
              modules[pallet.name.toString()].calls[callName].args.push(newArg)
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
    var innerType = type.substring(type.indexOf("<") + 1, type.lastIndexOf(">"))
    return isHide(innerType, registry, hideIgnore)
  } else {
    let baseDef = getBaseDef(type, registry)
    return (
      !hideIgnore.hide.includes(type) &&
      !hideIgnore.hide.includes(baseDef) &&
      _.findIndex(
        hideIgnore.hide,
        h => baseDef.toLowerCase().indexOf(h + "<") > 0
      ) === -1
    )
  }
}

function getBaseDef(typeArg, registry, wrapType = "") {
  let type = ""
  if (isObject(typeArg)) {
    type = JSON.stringify(typeArg)
  } else type = typeArg
  if (
    type.startsWith("Compact<") ||
    type.startsWith("Option<") ||
    type.startsWith("Vec<")
  ) {
    let innerType = type.substring(type.indexOf("<") + 1, type.lastIndexOf(">"))
    return getBaseDef(innerType, registry, type.substring(0, type.indexOf("<")))
  } else if (type.startsWith("Box<")) {
    let innerType = type.substring(type.indexOf("<") + 1, type.lastIndexOf(">"))
    return getBaseDef(innerType, registry, wrapType)
  } else if (type.startsWith("UInt<")) {
    return type
      .substring(type.indexOf("<") + 1, type.lastIndexOf(">"))
      .replace(" ", "")
      .split(",")[1]
  } else if (type.includes("<")) {
    let formatType = clearTypeName(type)
    return getBaseDef(formatType, registry, wrapType)
  } else if (type.includes("::")) {
    return getBaseDef(type.split("::")[1], registry, wrapType)
  } else {
    if (registry) {
      var baseDef = registry.getDefinition(type)
      if (!baseDef || baseDef == type) {
        if (wrapType == "") {
          return type
        } else {
          return `${wrapType}<${type}>`
        }
      } else if (baseDef.startsWith("(")) {
        let tupleDefs = baseDef
          .substring(baseDef.indexOf("(") + 1, baseDef.lastIndexOf(")"))
          .replace(" ", "")
          .split(",")
        let baseDefs = tupleDefs.map(d => {
          return getBaseDef(d, registry)
        })
        let resultType = "(" + baseDefs.join(", ") + ")"
        if (wrapType == "") {
          return resultType
        } else {
          return `${wrapType}<${resultType}>`
        }
      } else if (baseDef.startsWith("{")) {
        if (baseDef.includes("_enum")) {
          if (wrapType == "") {
            return baseDef
          } else {
            return `${wrapType}<${baseDef}>`
          }
        } else if (baseDef.includes("_bitLength")) {
          if (wrapType == "") {
            return baseDef
          } else {
            return `${wrapType}<${type}>`
          }
        } else {
          let defStruct = JSON.parse(baseDef)
          let resultStruct = {}
          for (var key in defStruct) {
            try {
              resultStruct[key] = getBaseDef(defStruct[key], registry)
            } catch (error) {
              console.log("!")
            }
          }
          let resultType = JSON.stringify(resultStruct)
          if (wrapType == "") {
            return resultType
          } else {
            return `${wrapType}<${resultType}>`
          }
        }
      } else return getBaseDef(baseDef, registry, wrapType)
    } else {
      return type
    }
  }
}

function clearTypeName(name, wrapType = "") {
  let formatName = ""
  let innerTagElements = getInnerTagsElements(name)
  if (innerTagElements.length > 0) {
    innerTagElements.forEach(e => (formatName = name.replace(e, "")))
  } else formatName = name
  if (formatName.includes("::")) {
    formatName = formatName.split("::")[1]
  }
  if (wrapType === "") {
    return formatName
  } else {
    return `${wrapType}<${formatName}>`
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
      type.substring(type.indexOf("<") + 1, type.lastIndexOf(">"))
    )
  } else return type
}

function getFirstInnerType(type) {
  return type.substring(type.indexOf("<") + 1, type.lastIndexOf(">"))
}

function replaceMarkdownSymbols(text, includingCode = true) {
  var result = text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
  if (includingCode) result = result.replace(/`/g, "\\`")
  return result
}

function splitSentenceIntoRows(sentence, n) {
  var result = []
  var subsentences = sentence.split("\n")
  subsentences.forEach(s => {
    var lastDivIndex = 0
    var currentDivIndex = 0
    for (var i = 0; i < s.length; i++) {
      currentDivIndex = i - lastDivIndex
      if (currentDivIndex >= n - 1 && s[i] == " ") {
        result.push(s.substr(lastDivIndex, currentDivIndex))
        lastDivIndex = i + 1
        currentDivIndex = 0
      }
      if (i + 1 == s.length) {
        result.push(s.substr(lastDivIndex, currentDivIndex + 1))
      }
    }
  })
  return result.join("\n")
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

async function checkFilter(filter, action, actionType, config) {
  var arg, data

  if (actionType == "call" && filter.name == "sender") {
    if (!action.signer) {
      return false
    }
    var signer = action.signer
    var stash = await getStashAccount(signer.toString())
    var compareResult = filter.isEqual && filter.value == signer
    if (compareResult) return true
    else {
      if (stash.isSome) {
        compareResult =
          filter.isEqual && filter.value == stash.value.stash.toString()
        if (compareResult) return true
        else if (filter.source && filter.source == "nominator") {
          var targets = await getTargets(filter.value)
          if (
            targets.includes(signer.toString()) ||
            targets.includes(stash.value.stash.toString())
          ) {
            return true
          }
        }
      }
      return false
    }
  }

  if (actionType == "call") {
    arg = config.args.find(a => a.name == filter.name)
    if (!arg) return false
    data = action.args[filter.name]
  } else {
    arg = config.args.find(a => a.name == filter.name)
    if (!arg) return false
    if (!action.data) {
      console.log(
        new Date(),
        "Error No Data in action",
        action.toHuman ? action.toHuman() : action.toJSON()
      )
    }
    data = action.data[_.findIndex(config.args, a => a.name == filter.name)]
  }

  if (arg.type.startsWith("Vec<")) {
    var item = data.find(a => {
      if (
        (filter.isEqual && filter.value == a.toString()) ||
        (filter.isLess &&
          new BigNumber(a.toString()).isLessThan(
            new BigNumber(filter.value)
          )) ||
        (filter.isMore &&
          new BigNumber(a.toString()).isGreaterThan(
            new BigNumber(filter.value)
          ))
      )
        return true
      else return false
    })
    if (item) return true
    else return false
  } else if (
    (filter.isEqual && filter.value == data.toString()) ||
    (filter.isLess &&
      new BigNumber(data.toString()).isLessThan(new BigNumber(filter.value))) ||
    (filter.isMore &&
      new BigNumber(data.toString()).isGreaterThan(new BigNumber(filter.value)))
  ) {
    return true
  } else return false
}

async function getAccountName(account, user) {
  if (user.wallets) {
    var wallet = user.wallets.find(w => w.address == account)
    if (wallet) return wallet.name
  }
  var accountInfo = await botParams.api.derive.accounts.info(account)
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
  return account
}

function htmlEscapeToText(text) {
  return text.replace(/\&\#[0-9]*;|&amp;/g, function (escapeCode) {
    if (escapeCode.match(/amp/)) {
      return "&"
    }
    return String.fromCharCode(escapeCode.match(/[0-9]+/))
  })
}

function render_plain() {
  var render = new marked.Renderer()
  render.link = function (href, title, text) {
    return text
  }
  render.paragraph = function (text) {
    return "\r\n" + htmlEscapeToText(text)
  }
  render.heading = function (text, level) {
    return "\r\n\n" + text
  }
  render.image = function (href, title, text) {
    return ""
  }
  render.blockquote = function (text) {
    return text
  }
  render.codespan = function (text) {
    return text
  }
  render.del = function (text) {
    return text
  }
  render.code = function (code, lang, isEscaped) {
    return code
  }
  render.list = function (body, ordered, start) {
    return body + "\r\n"
  }
  render.listitem = function (text) {
    return "\r\n  - " + text
  }
  render.strong = function (text) {
    return text
  }
  render.em = function (text) {
    return text
  }
  return render
}

function convertMarkdownToText(md) {
  var result = marked(md, { renderer: render_plain() })
  return result
}

function getDocsPropertyName(obj) {
  if (!obj["docs"]) return "documentation"
  return "docs"
}

function getInnerTagsElements(text) {
  let result = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "<") {
      let tagText = getTagText(text.substring(i + 1, text.length))
      result.push(text[i] + tagText)
      i += tagText.length
    }
  }
  return result
}

function getTagText(tag) {
  let result = ""
  for (let i = 0; i < tag.length; i++) {
    result += tag[i]
    if (tag[i] === "<") {
      let tagText = getTagText(tag.substring(i + 1, tag.length))
      result += tagText
      i += tagText.length
    } else if (tag[i] === ">") {
      return result
    }
  }
  return result
}

function isObject(a) {
  return !!a && a.constructor === Object
}

module.exports = {
  metaConvertToConfig: metaConvertToConfig,
  isIterable: isIterable,
  getTargets: getTargets,
  getBaseDef: getBaseDef,
  getInnerType: getInnerType,
  getInnerTagsElements: getInnerTagsElements,
  getStashAccount: getStashAccount,
  replaceMarkdownSymbols: replaceMarkdownSymbols,
  splitSentenceIntoRows: splitSentenceIntoRows,
  checkIsGroup: checkIsGroup,
  getGroupOrCreate: getGroupOrCreate,
  checkFilter: checkFilter,
  getAccountName: getAccountName,
  convertMarkdownToText: convertMarkdownToText,
}
