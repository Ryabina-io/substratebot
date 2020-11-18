const fetch = require("node-fetch")
const _ = require("lodash")

let lastSavePolkaProjectID = -1

async function checkPolkaProject() {
  var newProjects = []
  var checkLastIDRequest
  try {
    checkLastIDRequest = await fetch(
      "https://api.staked.xyz/apiPolka/getPolkaList?limit=1&tagID=0&page=0",
      {
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-US,en;q=0.9",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
        },
        referrer: "https://polkaproject.com/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
      }
    )
  } catch (error) {
    console.log(new Date(), "Error. PolkaProject API Request.", error.message)
  }
  var checkLastID = await checkLastIDRequest.json()
  if (checkLastID.error) {
    console.log(
      new Date(),
      "Error. PolkaProject API Request.",
      checkLastID.error
    )
  }
  if (!checkLastID.data || checkLastID.data.length === 0) {
    console.log(
      new Date(),
      "Error. PolkaProject API Request.",
      `No data returned`
    )
  }
  var lastCurrentID = parseInt(checkLastID.data.polkas[0].ID)
  if (lastSavePolkaProjectID == -1) {
    lastSavePolkaProjectID = lastCurrentID
  } else if (lastSavePolkaProjectID != lastCurrentID) {
    var getLastIDsRequest
    try {
      getLastIDsRequest = await fetch(
        "https://api.staked.xyz/apiPolka/getPolkaList?limit=25&tagID=0&page=0",
        {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
          },
          referrer: "https://polkaproject.com/",
          referrerPolicy: "strict-origin-when-cross-origin",
          body: null,
          method: "GET",
          mode: "cors",
        }
      )
    } catch (error) {
      console.log(new Date(), "Error. PolkaProject API Request.", error.message)
    }
    var lastIDs = await getLastIDsRequest.json()
    if (lastIDs.error) {
      console.log(new Date(), "Error. PolkaProject API Request.", lastIDs.error)
    }
    if (!lastIDs.data || lastIDs.data.length === 0) {
      console.log(
        new Date(),
        "Error. PolkaProject API Request.",
        `No data returned`
      )
    }
    newProjects = lastIDs.data.polkas.filter(
      p => parseInt(p.ID) > lastSavePolkaProjectID
    )
    lastSavePolkaProjectID = lastCurrentID
  }
  return newProjects
}

module.exports = {
  checkPolkaProject: checkPolkaProject,
}
