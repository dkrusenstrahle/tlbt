const http = require("http")
const { createApp } = require("../server")

function httpPostJson(baseUrl, path, payload) {
  const encoded = JSON.stringify(payload)
  const target = new URL(path, baseUrl)
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method: "POST",
        hostname: target.hostname,
        port: target.port,
        path: target.pathname,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(encoded, "utf8")
        }
      },
      res => {
        const chunks = []
        res.on("data", chunk => chunks.push(chunk))
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8")
          resolve({
            status: res.statusCode || 0,
            json: JSON.parse(body)
          })
        })
      }
    )
    req.on("error", reject)
    req.write(encoded)
    req.end()
  })
}

async function run() {
  const app = createApp({
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echo input",
        input: {
          type: "object",
          properties: {
            value: { type: "string" }
          },
          required: ["value"]
        },
        async run({ value }) {
          return { echoed: value }
        }
      }
    }
  })

  const server = await new Promise(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance))
  })

  try {
    const address = server.address()
    const baseUrl = `http://127.0.0.1:${address.port}`
    const response = await httpPostJson(baseUrl, "/run", {
      tool: "example.echo",
      input: { value: "kit-http" }
    })
    process.stdout.write(JSON.stringify({ status: response.status, payload: response.json }))
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

if (require.main === module) {
  run().catch(err => {
    process.stderr.write(String(err.stack || err.message || err))
    process.exit(1)
  })
}
