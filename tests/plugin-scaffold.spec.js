const fs = require("fs")
const path = require("path")
const { test, expect } = require("@playwright/test")
const { createPluginScaffold } = require("../lib/plugin-scaffold")
const { rootDir, runCli } = require("./helpers")

test("createPluginScaffold generates plugin files", async () => {
  const target = path.join(rootDir, "test-results", "scaffold-lib")
  fs.rmSync(target, { recursive: true, force: true })

  const result = createPluginScaffold({
    name: "sample",
    targetDir: target
  })

  expect(result.ok).toBe(true)
  expect(fs.existsSync(path.join(target, "index.js"))).toBe(true)
  expect(fs.existsSync(path.join(target, "tests/plugin.spec.js"))).toBe(true)
})

test("tlbt create plugin writes scaffold to target dir", async () => {
  const target = path.join(rootDir, "test-results", "scaffold-cli")
  fs.rmSync(target, { recursive: true, force: true })

  const result = await runCli(["create", "plugin", "cli-sample", target])
  expect(result.code).toBe(0)
  const payload = JSON.parse(result.stdout.trim())
  expect(payload.ok).toBe(true)
  expect(fs.existsSync(path.join(target, "README.md"))).toBe(true)
})
