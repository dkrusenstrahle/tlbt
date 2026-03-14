const { test, expect, request } = require("@playwright/test")
const { main } = require("../cli")
const { createApp } = require("../server")
const { createMcpHandler } = require("../lib/mcp-server")

function buildLoaded() {
  return {
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echo input",
        input: {
          type: "object",
          additionalProperties: false,
          properties: {
            value: { type: "string" }
          },
          required: ["value"]
        },
        run: async ({ value }) => ({ echoed: value })
      },
      "example.strict": {
        name: "example.strict",
        description: "Strict input",
        input: {
          type: "object",
          additionalProperties: false,
          properties: {
            count: { type: "number", minimum: 1 }
          },
          required: ["count"]
        },
        run: async ({ count }) => ({ count })
      }
    },
    errors: []
  }
}

async function runCliCommand(args, loaded) {
  const output = []
  const code = await main(args, {
    loaded,
    log: line => output.push(line)
  })
  return {
    code,
    payload: JSON.parse(output[0])
  }
}

async function withHttpContext(loaded, fn) {
  const app = createApp({
    tools: loaded.tools,
    loadErrors: loaded.errors
  })

  const server = await new Promise(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance))
  })
  const address = server.address()
  const api = await request.newContext({
    baseURL: `http://127.0.0.1:${address.port}`
  })

  try {
    await fn(api)
  } finally {
    await api.dispose()
    await new Promise(resolve => server.close(resolve))
  }
}

test("success responses are equivalent across CLI, HTTP, and MCP", async () => {
  const loaded = buildLoaded()
  const cli = await runCliCommand(["run", "example.echo", '{"value":"hello"}'], loaded)
  expect(cli.code).toBe(0)

  let httpPayload
  await withHttpContext(loaded, async api => {
    const res = await api.post("/run", {
      data: {
        tool: "example.echo",
        input: { value: "hello" }
      }
    })
    expect(res.status()).toBe(200)
    httpPayload = await res.json()
  })

  const mcp = createMcpHandler({ tools: loaded.tools })
  const mcpResponse = await mcp.handle({
    jsonrpc: "2.0",
    id: 11,
    method: "tools/call",
    params: {
      name: "example.echo",
      arguments: { value: "hello" }
    }
  })
  const mcpPayload = mcpResponse.result.structuredContent

  expect(cli.payload.ok).toBe(true)
  expect(httpPayload.ok).toBe(true)
  expect(mcpPayload.ok).toBe(true)

  expect(cli.payload.data).toEqual(httpPayload.data)
  expect(httpPayload.data).toEqual(mcpPayload.data)
})

test("validation errors use stable error code across transports", async () => {
  const loaded = buildLoaded()
  const cli = await runCliCommand(["run", "example.strict", '{"count":0}'], loaded)
  expect(cli.code).toBe(1)
  expect(cli.payload.error.code).toBe("VALIDATION_ERROR")

  await withHttpContext(loaded, async api => {
    const res = await api.post("/run", {
      data: {
        tool: "example.strict",
        input: { count: 0 }
      }
    })
    expect(res.status()).toBe(400)
    const payload = await res.json()
    expect(payload.error.code).toBe("VALIDATION_ERROR")
  })

  const mcp = createMcpHandler({ tools: loaded.tools })
  const mcpResponse = await mcp.handle({
    jsonrpc: "2.0",
    id: 12,
    method: "tools/call",
    params: {
      name: "example.strict",
      arguments: { count: 0 }
    }
  })
  expect(mcpResponse.result.structuredContent.ok).toBe(false)
  expect(mcpResponse.result.structuredContent.error.code).toBe("VALIDATION_ERROR")
})
