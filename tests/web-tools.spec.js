const http = require("http")
const { test, expect } = require("@playwright/test")
const webFetch = require("../tools/web/fetch")
const extractText = require("../tools/web/extractText")
const extractMetadata = require("../tools/web/extractMetadata")
const checkStatus = require("../tools/web/checkStatus")

async function withServer(handler, fn) {
  const server = await new Promise(resolve => {
    const instance = http.createServer(handler)
    instance.listen(0, "127.0.0.1", () => resolve(instance))
  })
  const { port } = server.address()
  const baseUrl = `http://127.0.0.1:${port}`
  try {
    await fn(baseUrl)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

test("web.fetch returns html response body", async () => {
  await withServer((req, res) => {
    res.setHeader("content-type", "text/html")
    res.end("<html><body>Hello agent</body></html>")
  }, async baseUrl => {
    const result = await webFetch.run({ url: `${baseUrl}/` })
    expect(result.ok).toBe(true)
    expect(result.status).toBe(200)
    expect(result.body).toContain("Hello agent")
  })
})

test("web.extractText strips html tags", async () => {
  const result = await extractText.run({
    html: "<html><body><h1>Title</h1><p>Text</p></body></html>"
  })
  expect(result.ok).toBe(true)
  expect(result.text).toContain("Title")
  expect(result.text).toContain("Text")
})

test("web.extractMetadata extracts title and description", async () => {
  const result = await extractMetadata.run({
    html: "<html><head><title>Home</title><meta name=\"description\" content=\"Desc\"></head><body></body></html>"
  })
  expect(result.ok).toBe(true)
  expect(result.metadata.title).toBe("Home")
  expect(result.metadata.description).toBe("Desc")
})

test("web.checkStatus includes status and headers", async () => {
  await withServer((req, res) => {
    res.setHeader("x-test", "yes")
    res.statusCode = 204
    res.end()
  }, async baseUrl => {
    const result = await checkStatus.run({ url: `${baseUrl}/status` })
    expect(result.ok).toBe(true)
    expect(result.status).toBe(204)
    expect(result.headers["x-test"]).toBe("yes")
  })
})
