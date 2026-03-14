const { test, expect } = require("@playwright/test")
const { createExecutor } = require("../lib/executor")

function createEchoTool() {
  return {
    name: "repo.echo",
    description: "Echoes path",
    input: {
      type: "object",
      properties: {
        path: { type: "string" }
      },
      required: ["path"]
    },
    run: async ({ path }) => ({ echoed: path })
  }
}

test("executor enforces tool prefix policy", async () => {
  const executor = createExecutor({
    tools: {
      "repo.echo": createEchoTool()
    },
    policy: {
      denyToolPrefixes: ["repo."]
    },
    transport: "cli"
  })

  const result = await executor.execute("repo.echo", { path: "." })
  expect(result.ok).toBe(false)
  expect(result.error.code).toBe("POLICY_VIOLATION")
})

test("executor enforces workspace path constraints when configured", async () => {
  const executor = createExecutor({
    tools: {
      "repo.echo": createEchoTool()
    },
    policy: {
      enforceWorkspacePaths: true,
      workspaceRoot: process.cwd()
    },
    transport: "cli"
  })

  const result = await executor.execute("repo.echo", { path: "/tmp/outside" })
  expect(result.ok).toBe(false)
  expect(result.error.code).toBe("POLICY_VIOLATION")
})

test("executor emits structured invocation events", async () => {
  const events = []
  const executor = createExecutor({
    tools: {
      "repo.echo": createEchoTool()
    },
    logger: (event, payload) => events.push({ event, payload }),
    transport: "http"
  })

  const result = await executor.execute("repo.echo", { path: "." })
  expect(result.ok).toBe(true)
  expect(result.meta).toHaveProperty("invocationId")
  expect(events.length).toBe(2)
  expect(events[0].event).toBe("tool.execution.started")
  expect(events[1].event).toBe("tool.execution.succeeded")
  expect(events[0].payload).toHaveProperty("invocationId")
})
