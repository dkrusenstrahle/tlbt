const path = require("path")
const { test, expect } = require("@playwright/test")
const { rootDir } = require("./helpers")
const { runPluginConformance } = require("../lib/plugin-conformance")
const { main } = require("../cli")

test("plugin conformance passes for valid plugin fixture", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/plugins/node_modules/tlbt-tool-good")
  const report = await runPluginConformance({ pluginPath: fixture })
  expect(report.ok).toBe(true)
  expect(report.toolCount).toBe(1)
})

test("plugin conformance fails for invalid plugin fixture", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/plugins/node_modules/tlbt-tool-invalid")
  const report = await runPluginConformance({ pluginPath: fixture })
  expect(report.ok).toBe(false)
  expect(report.errors.length).toBeGreaterThan(0)
})

test("cli plugin:test returns non-zero for invalid plugin", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/plugins/node_modules/tlbt-tool-invalid")
  const output = []
  const code = await main(["plugin:test", fixture], {
    log: line => output.push(line),
    loaded: { tools: {}, errors: [] }
  })

  expect(code).toBe(1)
  const payload = JSON.parse(output[0])
  expect(payload.ok).toBe(false)
  expect(payload.error.code).toBe("VALIDATION_ERROR")
})
