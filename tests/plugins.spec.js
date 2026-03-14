const { test, expect } = require("@playwright/test")
const { installPlugin } = require("../plugins")

test("rejects invalid plugin names", async () => {
  const result = installPlugin("Bad;name")
  expect(result.ok).toBe(false)
  expect(result.error).toContain("Plugin name")
})

test("returns success with injected command runner", async () => {
  const result = installPlugin("github", {
    commandRunner: () => ({ status: 0 })
  })
  expect(result).toEqual({ ok: true, plugin: "tlbt-tool-github" })
})

test("returns failure when command runner errors", async () => {
  const result = installPlugin("github", {
    commandRunner: () => ({ status: 1, error: new Error("network down") })
  })
  expect(result.ok).toBe(false)
  expect(result.plugin).toBe("tlbt-tool-github")
  expect(result.error).toContain("network down")
})
