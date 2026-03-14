const path = require("path")
const { test, expect } = require("@playwright/test")
const { runNode, rootDir } = require("./helpers")

test("framework MCP kit example executes tool call", async () => {
  const script = path.join(rootDir, "examples/framework-mcp-client.js")
  const result = await runNode([script], { cwd: rootDir })
  expect(result.code).toBe(0)
  const payload = JSON.parse(result.stdout)
  expect(payload.ok).toBe(true)
  expect(payload.data).toEqual({ echoed: "kit-mcp" })
})

test("framework HTTP fallback kit example executes tool call", async () => {
  const script = path.join(rootDir, "examples/framework-http-fallback-client.js")
  const result = await runNode([script], { cwd: rootDir })
  expect(result.code).toBe(0)
  const payload = JSON.parse(result.stdout)
  expect(payload.status).toBe(200)
  expect(payload.payload.ok).toBe(true)
  expect(payload.payload.data).toEqual({ echoed: "kit-http" })
})
