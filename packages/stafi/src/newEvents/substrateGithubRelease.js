const {
  getLastGithubRelease,
} = require("@ryabina-io/substratebot/tools/githubReleasesChecker")

let lastId = -1
module.exports.run = async function (bot, interval) {
  setInterval(async () => {
    getLastGithubRelease(
      "paritytech",
      "substrate",
      process.env.GITHUB_TOKEN
    ).then(
      release => {
        if (lastId == -1) {
          lastId = release.id
        } else if (lastId != release.id) {
          lastId = release.id
          var alert = {
            section: "ecosystem",
            method: "NewSubstrateGithubRelease",
            data: [release.name, release.author.login, release.body],
          }
          alert.links = [
            {
              name: "GitHub",
              url: release.html_url,
            },
          ]
          bot
            .sendCustomAlert(alert, false)
            .catch(error => console.log(new Date(), error))
        }
      },
      error => {
        console.log(new Date(), error)
      }
    )
  }, interval)
}
