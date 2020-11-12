const prom = require("prom-client")
const http = require("http")

prom.collectDefaultMetrics()

const server = http.createServer(async function (req, res) {
  try {
    const metrics = await prom.register.metrics()
    res.setHeader("Content-Type", prom.register.contentType)
    res.end(metrics)
  } catch (e) {
    console.log(e)
    res.writeHead(500)
    res.end()
  }
})
server.listen(process.env.METRICS_PORT || 1337)
server.on("error", err => {
  console.log(err)
})

module.exports = prom
