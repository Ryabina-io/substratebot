module.exports.getNewEvents = function () {
  return [
    {
      name: "Ecosystem",
      short: "Ecsstm",
      events: [
        {
          name: "NewPolkaProject",
          short: "NwPlkPrjct",
          documentation: " A new project has been added to PolkaProject.com",
          args: [
            {
              name: "title",
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
            {
              name: "tags",
              baseType: "String",
              type: "String",
              visible: "hide",
            },
          ],
        },
        {
          name: "KusamaAlert",
          short: "KsmAlrt",
          documentation: " ⚡️ Important system alerts from the Parity team",
          args: [
            {
              name: "message",
              baseType: "String",
              type: "String",
              visible: "hide",
            },
          ],
        },
        {
          name: "NewGithubRelease",
          short: "NwGthbRls",
          documentation:
            " A new github release in Kusama (Polkadot) repo has been published",
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
