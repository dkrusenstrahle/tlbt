const { test, expect } = require("@playwright/test")
const path = require("path")
const { spawn } = require("child_process")
const { PassThrough } = require("stream")
const {
  SUPPORTED_MCP_PROTOCOL_VERSION,
  createMcpHandler,
  createMessageReader,
  writeMessage,
  startMcpServer
} = require("../lib/mcp-server")
const { cliPath } = require("./helpers")

test("initialize returns server capabilities", async () => {
  const handler = createMcpHandler({ tools: {} })
  const response = await handler.handle({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {}
  })

  expect(response.jsonrpc).toBe("2.0")
  expect(response.id).toBe(1)
  expect(response.result.protocolVersion).toBe(SUPPORTED_MCP_PROTOCOL_VERSION)
  expect(response.result.capabilities.tools).toBeTruthy()
  expect(response.result.capabilities.tools.listChanged).toBe(true)
})

test("tools/list exposes tool metadata", async () => {
  const handler = createMcpHandler({
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echoes input",
        input: {
          type: "object",
          properties: {
            value: { type: "string" }
          },
          required: ["value"]
        },
        run: async ({ value }) => ({ echoed: value })
      }
    }
  })

  const response = await handler.handle({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list"
  })

  expect(response.result.tools).toHaveLength(1)
  expect(response.result.tools[0]).toMatchObject({
    name: "example.echo",
    description: "Echoes input"
  })
})

test("tools/call returns structured result envelopes", async () => {
  const handler = createMcpHandler({
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echoes input",
        input: {
          type: "object",
          properties: {
            value: { type: "string" }
          },
          required: ["value"]
        },
        run: async ({ value }) => ({ echoed: value })
      }
    }
  })

  const response = await handler.handle({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "example.echo",
      arguments: { value: "hi" }
    }
  })

  expect(response.result.isError).toBe(false)
  expect(response.result.structuredContent).toMatchObject({
    ok: true,
    data: { echoed: "hi" }
  })
})

test("tools/call surfaces validation errors with stable code", async () => {
  const handler = createMcpHandler({
    tools: {
      "example.strict": {
        name: "example.strict",
        description: "Strict schema",
        input: {
          type: "object",
          properties: { count: { type: "number", minimum: 1 } },
          required: ["count"]
        },
        run: async ({ count }) => ({ count })
      }
    }
  })

  const response = await handler.handle({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "example.strict",
      arguments: { count: 0 }
    }
  })

  expect(response.result.isError).toBe(true)
  expect(response.result.structuredContent.ok).toBe(false)
  expect(response.result.structuredContent.error.code).toBe("VALIDATION_ERROR")
})

test("message reader parses framed content-length payloads", async () => {
  const input = new PassThrough()
  const output = new PassThrough()
  const messages = []
  createMessageReader(input, msg => messages.push(msg))

  writeMessage(output, { jsonrpc: "2.0", id: 9, method: "ping" })
  const chunk = output.read().toString("utf8")
  input.write(chunk)

  expect(messages).toHaveLength(1)
  expect(messages[0]).toMatchObject({ jsonrpc: "2.0", method: "ping" })
})

test("tlbt mcp command serves tools/list over stdio", async () => {
  const child = spawn(process.execPath, [cliPath, "mcp"], {
    cwd: path.resolve(__dirname, ".."),
    stdio: ["pipe", "pipe", "pipe"]
  })

  const responses = []
  createMessageReader(child.stdout, msg => responses.push(msg))

  const request = {
    jsonrpc: "2.0",
    id: 101,
    method: "tools/list",
    params: {}
  }
  const body = JSON.stringify(request)
  child.stdin.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`)

  await expect
    .poll(() => responses.length, {
      timeout: 3000
    })
    .toBeGreaterThan(0)

  expect(responses[0].id).toBe(101)
  expect(Array.isArray(responses[0].result.tools)).toBe(true)
  expect(responses[0].result.tools.length).toBeGreaterThan(0)

  child.kill("SIGTERM")
})

test("initialize respects client protocol version", async () => {
  const handler = createMcpHandler({ tools: {} })
  const response = await handler.handle({
    jsonrpc: "2.0",
    id: 15,
    method: "initialize",
    params: { protocolVersion: "2025-01-01" }
  })
  expect(response.result.protocolVersion).toBe("2025-01-01")
})

test("mcp server can emit tools/list changed notifications", async () => {
  const input = new PassThrough()
  const output = new PassThrough()
  const messages = []
  createMessageReader(output, msg => messages.push(msg))

  const running = startMcpServer({
    loaded: {
      tools: {},
      errors: []
    },
    input,
    output,
    attachSignalHandlers: false
  })
  running.notifyToolsChanged()

  await expect
    .poll(() => messages.length, {
      timeout: 2000
    })
    .toBeGreaterThan(0)

  expect(messages[0]).toMatchObject({
    jsonrpc: "2.0",
    method: "notifications/tools/list_changed"
  })
})
