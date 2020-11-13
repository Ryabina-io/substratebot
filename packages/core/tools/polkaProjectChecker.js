const fetch = require("node-fetch")
const _ = require("lodash")

let last20PolkaProjects = []

async function checkPolkaProject() {
  var newProjects = []
  var checkLast20IDRequest = await fetch(
    "https://api.staked.xyz/apiPolka/getPolkaList?limit=20&tagID=0&page=0",
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
  var checkLast20IDResult = await checkLast20IDRequest.json()
  if (checkLast20IDResult.error) {
    console.log(new Date(), "Error. PolkaProject API Request.", error)
  }
  if (!checkLast20IDResult.data || checkLast20IDResult.data.length === 0) {
    console.log(
      new Date(),
      "Error. PolkaProject API Request.",
      `No data returned`
    )
  }
  var currentLast20IDs = checkLast20IDResult.data.polkas.map(p =>
    parseInt(p.ID)
  )
  if (last20PolkaProjects.length == 0) {
    last20PolkaProjects = currentLast20IDs
    return
  }
  var diffIDs = _.difference(currentLast20IDs, last20PolkaProjects)
  if (diffIDs.length > 0) {
    var newProjects = await Promise.all(
      diffIDs.map(async id => {
        var request = `https://api.staked.xyz/apiPolka/getProjectById?v=1.0&id=${id}`
        var newProjectRequest = await fetch(request, {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "sec-gpc": "1",
          },
          referrer: "https://www.polkaproject.com/",
          referrerPolicy: "strict-origin-when-cross-origin",
          body: null,
          method: "GET",
          mode: "cors",
        })
        var newProject = await newProjectRequest.json()
        if (newProject.error) {
          console.log(new Date(), "Error. PolkaProject API Request.", error)
          return null
        }
        if (!newProject.data || newProject.data.length === 0) {
          console.log(
            new Date(),
            "Error. PolkaProject API Request.",
            `No data returned`
          )
          return null
        }

        return newProject.data
      })
    )
    newProjects = newProjects.filter(p => p != null)

    newProjects.forEach(async project => {
      last20PolkaProjects.pop()
      last20PolkaProjects.unshift(project.ID)
    })
  }
  return newProjects
}

module.exports = {
  checkPolkaProject: checkPolkaProject,
}
