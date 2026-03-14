const path = require("path")
const { test, expect } = require("@playwright/test")
const { runCli, parseJson, rootDir } = require("./helpers")
const { main, showHelp } = require("../cli")

test("shows help without args", async () => {
  const result = await runCli([])
  expect(result.code).toBe(0)
  expect(result.stdout).toContain("TLBT — Agent Toolbelt")
})

test("prints version as JSON", async () => {
  const result = await runCli(["--version"])
  expect(result.code).toBe(0)
  const payload = parseJson(result.stdout)
  expect(payload).toHaveProperty("version")
})

test("lists tools metadata", async () => {
  const result = await runCli(["tools"])
  expect(result.code).toBe(0)
  const payload = parseJson(result.stdout)
  expect(payload).toHaveProperty("tools")
  expect(payload.tools["repo.map"]).toBeTruthy()
})

test("runs tool through run command", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/repo")
  const result = await runCli(["run", "repo.map", JSON.stringify({ path: fixture, maxDepth: 1 })])
  expect(result.code).toBe(0)
  const payload = parseJson(result.stdout)
  expect(payload).toHaveProperty("entries")
})

test("runs tool directly with path shortcut", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/docs/sample.md")
  const result = await runCli(["docs.headings", fixture])
  expect(result.code).toBe(0)
  const payload = parseJson(result.stdout)
  expect(payload.headings.length).toBeGreaterThan(0)
})

test("returns error for unknown command", async () => {
  const result = await runCli(["nope.command"])
  expect(result.code).toBe(1)
  const payload = parseJson(result.stdout)
  expect(payload.error).toContain("Unknown command or tool")
})

test("returns error for unknown tool on run", async () => {
  const result = await runCli(["run", "nope.tool", "{}"])
  expect(result.code).toBe(1)
  const payload = parseJson(result.stdout)
  expect(payload.error).toContain("Tool not found")
})

test("returns error for invalid JSON input", async () => {
  const result = await runCli(["run", "repo.map", "{not-json}"])
  expect(result.code).toBe(1)
  const payload = parseJson(result.stdout)
  expect(payload.error).toContain("Invalid JSON input")
})

test("returns validation error for missing required field", async () => {
  const result = await runCli(["run", "repo.map", "{}"])
  expect(result.code).toBe(1)
  const payload = parseJson(result.stdout)
  expect(payload.error).toContain("must have required property")
})

test("handles install command missing plugin argument", async () => {
  const output = []
  const exitCode = await main(["install"], {
    log: line => output.push(line),
    loaded: { tools: {}, errors: [] }
  })

  expect(exitCode).toBe(1)
  expect(JSON.parse(output[0]).error).toContain("Please provide a plugin name")
})

test("handles successful install command", async () => {
  const output = []
  const exitCode = await main(["install", "github"], {
    log: line => output.push(line),
    loaded: { tools: {}, errors: [] },
    installPlugin: () => ({ ok: true, plugin: "tlbt-tool-github" })
  })

  expect(exitCode).toBe(0)
  expect(JSON.parse(output[0])).toEqual({ ok: true, plugin: "tlbt-tool-github" })
})

test("handles failed install command", async () => {
  const output = []
  const exitCode = await main(["install", "github"], {
    log: line => output.push(line),
    loaded: { tools: {}, errors: [] },
    installPlugin: () => ({ ok: false, plugin: "tlbt-tool-github", error: "boom" })
  })

  expect(exitCode).toBe(1)
  const payload = JSON.parse(output[0])
  expect(payload.error).toContain("Plugin install failed")
})

test("calls injected server starter for serve command", async () => {
  let called = false
  const exitCode = await main(["serve"], {
    log: () => {},
    loaded: { tools: {}, errors: [] },
    startServer: () => {
      called = true
    }
  })

  expect(exitCode).toBe(0)
  expect(called).toBe(true)
})

test("showHelp returns usage text", async () => {
  expect(showHelp()).toContain("Usage:")
})

test("main handles help/version/tools directly for coverage", async () => {
  const output = []
  const loaded = {
    tools: {
      "repo.map": {
        input: { type: "object", properties: {}, required: [] },
        run: async () => ({ ok: true })
      }
    },
    errors: []
  }

  expect(await main([], { log: line => output.push(line), loaded })).toBe(0)
  expect(await main(["-v"], { log: line => output.push(line), loaded })).toBe(0)
  expect(await main(["tools"], { log: line => output.push(line), loaded })).toBe(0)
  expect(output.length).toBeGreaterThan(0)
})

test("main handles run and direct tool errors", async () => {
  const output = []
  const loaded = {
    tools: {
      "example.fail": {
        input: { type: "object", properties: {} },
        run: async () => {
          throw new Error("failed")
        }
      }
    },
    errors: []
  }

  const runCode = await main(["run", "example.fail", "{}"], {
    log: line => output.push(line),
    loaded
  })
  const directCode = await main(["example.fail", "{}"], {
    log: line => output.push(line),
    loaded
  })

  expect(runCode).toBe(1)
  expect(directCode).toBe(1)
})
