module.exports.getNewEvents = function () {
  return [
    {
      name: "Ecosystem",
      short: "Ecsstm",
      events: [
        {
          name: "NewGithubRelease",
          short: "NwGthbRls",
          documentation:
            " A new github release in Stafi repo has been published",
          args: [
            {
              name: "title",
              baseType: "String",
              type: "String",
              visible: "hide",
            },
            {
              name: "author",
              baseType: "String",
              type: "String",
              visible: "hide",
            },
            {
              name: "description",
              baseType: "String",
              type: "String",
              visible: "hide",
            },
          ],
        },
        {
          name: "NewSubstrateGithubRelease",
          short: "NwSbstrtGthbRls",
          documentation:
            " A new github release in Substrate repo has been published",
          args: [
            {
              name: "title",
              baseType: "String",
              type: "String",
              visible: "hide",
            },
            {
              name: "author",
              baseType: "String",
              type: "String",
              visible: "hide",
            },
            {
              name: "description",
              baseType: "String",
              type: "String",
              visible: "hide",
            },
          ],
        },
      ],
    },
  ]
}
