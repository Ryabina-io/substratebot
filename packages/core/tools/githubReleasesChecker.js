const fetch = require("node-fetch")
const _ = require("lodash")
const { convertMarkdownToText } = require("./utils")

async function getLastGithubRelease(owner, repo, token) {
  var init = {
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
  if (token != undefined) {
    init.headers.Authorization = `Bearer ${token}`
  }
  var githubReleasesRequest = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    init
  )
  var githubReleases = await githubReleasesRequest.json()

  if (!Array.isArray(githubReleases)) {
    throw new Error(githubReleases.message)
  }

  var lastGithubRelease = _.orderBy(githubReleases, r => r.published_at, [
    "desc",
  ])[0]
  lastGithubRelease.body = convertMarkdownToText(lastGithubRelease.body)
  return lastGithubRelease
}

module.exports = {
  getLastGithubRelease: getLastGithubRelease,
}
