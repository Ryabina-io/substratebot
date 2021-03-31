const {
  checkPolkaProject,
} = require("@ryabina-io/substratebot/tools/polkaProjectChecker")

module.exports.run = async function (bot, interval) {
  setInterval(async () => {
    checkPolkaProject().then(
      newProjects => {
        if (newProjects && newProjects.length != 0) {
          var alerts = newProjects.map(newProject => {
            var alert = {
              section: "ecosystem",
              method: "NewPolkaProject",
              data: [
                newProject.title,
                newProject.introduction.length > 0
                  ? newProject.introduction
                  : "",
                newProject.tags.length > 0 ? newProject.tags.join(" ") : "",
              ],
            }
            alert.links = [
              {
                name: "PolkaProject.com",
                url: `https://polkaproject.com/#/project/${newProject.ID}`,
              },
            ]
            return alert
          })
          alerts.forEach(async alert => {
            bot
              .sendCustomAlert(alert, false)
              .catch(error => console.log(new Date(), error))
          })
        }
      },
      error => {
        console.log(new Date(), error)
      }
    )
  }, interval)
}
