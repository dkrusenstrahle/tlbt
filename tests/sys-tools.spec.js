const { test, expect } = require("@playwright/test")
const sysExec = require("../tools/sys/exec")
const processList = require("../tools/sys/processList")
const envInspect = require("../tools/sys/envInspect")

test("sys.exec runs allowlisted command", async () => {
  const result = await sysExec.run({
    command: "node",
    args: ["-e", "process.stdout.write('ok')"]
  })
  expect(result.ok).toBe(true)
  expect(result.code).toBe(0)
  expect(result.stdout).toContain("ok")
})

test("sys.exec rejects non-allowlisted command", async () => {
  await expect(sysExec.run({ command: "python" })).rejects.toThrow("not allowlisted")
})

test("sys.processList returns process rows", async () => {
  const result = await processList.run({ maxResults: 10 })
  expect(result.ok).toBe(true)
  expect(result.count).toBeGreaterThan(0)
  expect(result.processes[0]).toHaveProperty("pid")
})

test("sys.envInspect returns runtime metadata", async () => {
  const result = await envInspect.run({ keys: ["SHELL"], maxKeys: 5 })
  expect(result.ok).toBe(true)
  expect(result.runtime).toHaveProperty("node")
  expect(result.runtime).toHaveProperty("cwd")
})
