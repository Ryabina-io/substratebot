module.exports.getNewEvents = function () {
  return [
    {
      name: "Ecosystem",
      short: "Ecsstm",
      events: [
        {
          name: "PolkadotAlert",
          short: "PlkdtAlrt",
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
      ],
    },
  ]
}
