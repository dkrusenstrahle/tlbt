const { test, expect, request } = require("@playwright/test")
const { createApp, startServer } = require("../server")

async function startTestServer(app) {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance))
  })
  const address = server.address()
  const api = await request.newContext({ baseURL: `http://127.0.0.1:${address.port}` })
  return {
    server,
    api,
    async close() {
      await api.dispose()
      await new Promise(resolve => server.close(resolve))
    }
  }
}

test("GET /tools returns metadata and load errors", async () => {
  const app = createApp({
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echo value",
        input: {
          type: "object",
          properties: { value: { type: "string" } },
          required: ["value"]
        },
        run: async ({ value }) => ({ value })
      }
    },
    loadErrors: [{ source: "plugin:x", error: "broken plugin" }]
  })

  const ctx = await startTestServer(app)

  const response = await ctx.api.get("/tools")
  expect(response.status()).toBe(200)
  const payload = await response.json()
  expect(payload.tools["example.echo"]).toBeTruthy()
  expect(payload.loadErrors).toHaveLength(1)

  await ctx.close()
})

test("POST /run executes tool successfully", async () => {
  const app = createApp({
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echo",
        input: {
          type: "object",
          properties: { value: { type: "string" } },
          required: ["value"]
        },
        run: async ({ value }) => ({ echoed: value })
      }
    }
  })

  const ctx = await startTestServer(app)

  const response = await ctx.api.post("/run", {
    data: { tool: "example.echo", input: { value: "hello" } }
  })
  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ echoed: "hello" })

  await ctx.close()
})

test("POST /run returns 400 for invalid body shape", async () => {
  const app = createApp({ tools: {} })
  const ctx = await startTestServer(app)

  const response = await ctx.api.post("/run", {
    headers: { "content-type": "application/json" },
    data: "not-an-object"
  })
  expect(response.status()).toBe(400)
  expect(await response.json()).toEqual({ error: "Invalid JSON body" })

  await ctx.close()
})

test("POST /run returns 400 for invalid JSON body", async () => {
  const app = createApp({ tools: {} })
  const ctx = await startTestServer(app)

  const response = await ctx.api.fetch("/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    data: "{"
  })
  expect(response.status()).toBe(400)
  expect(await response.json()).toEqual({ error: "Invalid JSON body" })

  await ctx.close()
})

test("POST /run returns 400 when body is an array", async () => {
  const app = createApp({ tools: {} })
  const ctx = await startTestServer(app)

  const response = await ctx.api.post("/run", {
    data: []
  })
  expect(response.status()).toBe(400)
  expect(await response.json()).toEqual({ error: "Request body must be a JSON object" })

  await ctx.close()
})

test("POST /run returns 400 for missing tool field", async () => {
  const app = createApp({ tools: {} })
  const ctx = await startTestServer(app)

  const response = await ctx.api.post("/run", { data: { input: {} } })
  expect(response.status()).toBe(400)
  expect(await response.json()).toEqual({ error: "Field \"tool\" must be a non-empty string" })

  await ctx.close()
})

test("POST /run returns 404 for unknown tool", async () => {
  const app = createApp({ tools: {} })
  const ctx = await startTestServer(app)

  const response = await ctx.api.post("/run", { data: { tool: "missing.tool", input: {} } })
  expect(response.status()).toBe(404)
  expect(await response.json()).toEqual({ error: "Tool not found", tool: "missing.tool" })

  await ctx.close()
})

test("POST /run returns 400 for schema validation errors", async () => {
  const app = createApp({
    tools: {
      "example.strict": {
        name: "example.strict",
        description: "Strict schema",
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
    }
  })

  const ctx = await startTestServer(app)

  const response = await ctx.api.post("/run", {
    data: { tool: "example.strict", input: { count: 0 } }
  })
  expect(response.status()).toBe(400)
  const payload = await response.json()
  expect(payload.error).toContain("must be >=")

  await ctx.close()
})

test("POST /run returns 500 when tool throws", async () => {
  const app = createApp({
    tools: {
      "example.throw": {
        name: "example.throw",
        description: "Throw",
        input: { type: "object", properties: {} },
        run: async () => {
          throw new Error("exploded")
        }
      }
    }
  })

  const ctx = await startTestServer(app)

  const response = await ctx.api.post("/run", {
    data: { tool: "example.throw", input: {} }
  })
  expect(response.status()).toBe(500)
  expect(await response.json()).toEqual({
    error: "exploded",
    tool: "example.throw"
  })

  await ctx.close()
})

test("startServer returns server metadata and can be closed", async () => {
  const loaded = {
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echo",
        input: { type: "object", properties: {} },
        run: async () => ({ ok: true })
      }
    },
    errors: []
  }

  const started = startServer({
    loaded,
    host: "127.0.0.1",
    port: 0,
    attachSignalHandlers: false,
    requestTimeoutMs: 50
  })

  expect(started).toHaveProperty("host")
  expect(started).toHaveProperty("server")

  await new Promise(resolve => started.server.close(resolve))
})
