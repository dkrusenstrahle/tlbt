const { test, expect } = require("@playwright/test")
const { createMcpHandler } = require("../lib/mcp-server")

function createFixtureHandler() {
  return createMcpHandler({
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echo",
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
}

async function runClientProfile(profileName, requestSequence) {
  const handler = createFixtureHandler()
  const responses = []
  for (const request of requestSequence) {
    const response = await handler.handle(request)
    responses.push(response)
  }
  return { profileName, responses }
}

test("compat matrix: strict client profile", async () => {
  const result = await runClientProfile("strict", [
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" }
    },
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "example.echo",
        arguments: { value: "strict" }
      }
    }
  ])

  expect(result.profileName).toBe("strict")
  expect(result.responses[0].result.protocolVersion).toBe("2024-11-05")
  expect(Array.isArray(result.responses[1].result.tools)).toBe(true)
  expect(result.responses[2].result.isError).toBe(false)
})

test("compat matrix: lenient client profile", async () => {
  const result = await runClientProfile("lenient", [
    {
      jsonrpc: "2.0",
      id: 11,
      method: "initialize",
      params: {}
    },
    {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "missing.tool",
        arguments: {}
      }
    }
  ])

  expect(result.profileName).toBe("lenient")
  expect(result.responses[0].result.protocolVersion).toBeTruthy()
  expect(result.responses[1].result.isError).toBe(true)
  expect(result.responses[1].result.structuredContent.error.code).toBe("TOOL_NOT_FOUND")
})
