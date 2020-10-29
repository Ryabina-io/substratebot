const fetch = require("node-fetch")
const { splitSentenceIntoRows } = require("../tools/utils")

let lastPolkaProjectID = -1
module.exports = {
  checkPolkaProject: async bot => {
    var checkLastIDRequest = await fetch(
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
    var checkLastIDResult = await checkLastIDRequest.json()
    if (checkLastIDResult.error) {
      console.log(new Date(), "Error. PolkaProject API Request.", error)
    }
    if (!checkLastIDResult.data || checkLastIDResult.data.length === 0) {
      console.log(
        new Date(),
        "Error. PolkaProject API Request.",
        `No data returned`
      )
    }
    var currentLastID = parseInt(checkLastIDResult.data.polkas[0].ID)
    if (lastPolkaProjectID == -1) {
      lastPolkaProjectID = currentLastID
    } else if (currentLastID > lastPolkaProjectID) {
      var limit = currentLastID - lastPolkaProjectID
      lastPolkaProjectID = currentLastID
      var newProjectsRequest = await fetch(
        `https://api.staked.xyz/apiPolka/getPolkaList?limit=${limit}&tagID=0&page=0`,
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
      var newProjects = await newProjectsRequest.json()
      if (newProjects.error) {
        console.log(new Date(), "Error. PolkaProject API Request.", error)
      }
      if (!newProjects.data || newProjects.data.length === 0) {
        console.log(
          new Date(),
          "Error. PolkaProject API Request.",
          `No data returned`
        )
      }
      var alerts = newProjects.data.polkas.map(project => {
        var alert = {
          section: "ecosystem",
          method: "NewPolkaProject",
          data: [
            project.title,
            project.introduction.length > 0
              ? "\n" + splitSentenceIntoRows(project.introduction, 40)
              : "",
            project.tags.length > 0 ? project.tags.join(" ") : "",
          ],
        }
        alert.links = []
        if (project.website) {
          alert.links.push({
            name: project.title + " website",
            url: project.website,
          })
        } else if (project.github) {
          alert.links.push({
            name: project.title + " github",
            url: project.github,
          })
        } else if (project.twitter) {
          alert.links.push({
            name: project.title + " twitter",
            url: project.twitter,
          })
        } else if (project.telegram) {
          alert.links.push({
            name: project.title + " telegram",
            url: project.telegram,
          })
        }
        alert.links.push({
          name: "PolkaProject.com",
          url: "https://polkaproject.com/",
        })
        return alert
      })
      alerts.forEach(async alert => {
        await bot.sendCustomAlert(alert)
      })
    }
  },
}
