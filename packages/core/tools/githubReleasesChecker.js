const fetch = require("node-fetch")
const { splitSentenceIntoRows } = require("../tools/utils")
const _ = require("lodash")

let lastGithubReleaseId = -1

async function checkGithubReleases(owner, repo, bot) {
  var githubReleasesRequest = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "if-none-match":
          'W/"b0a5faf4f7ea6951e82330e5eaaefca686f170f90861b7c67ad7f4ffcb0562e8"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1",
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
    }
  )
  var githubReleases = await githubReleasesRequest.json()
  var lastGithubRelease = _.orderBy(githubReleases, r => r.created_at, [
    "desc",
  ])[0]
  if (lastGithubReleaseId == -1) {
    lastGithubReleaseId = lastGithubRelease.id
  } else if (lastGithubReleaseId != lastGithubRelease.id) {
    var alert = {
      section: "ecosystem",
      method: "NewGithubRelease",
      data: [],
    }
    alert.links = [
      {
        name: "PolkaProject.com",
        url: `https://polkaproject.com/?id=${newProject.data.ID}`,
      },
    ]
  }
}

module.exports = {
  runGithubReleasesChecker: (owner, repo, bot, interval) => {
    setInterval(async () => {
      try {
        checkGithubReleases(owner, repo, bot)
      } catch (error) {
        console.log(new Date(), error)
      }
    }, interval)
  },
}
