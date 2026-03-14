const path = require("path")
const { test, expect } = require("@playwright/test")
const { loadTools, clearToolsCache } = require("../registry")
const { rootDir } = require("./helpers")

test.afterEach(async () => {
  clearToolsCache()
})

test("loads local and plugin tools while collecting load errors", async () => {
  const cwd = path.join(rootDir, "tests/fixtures/plugins")
  const result = loadTools({
    baseDir: rootDir,
    cwd,
    useCache: false
  })

  expect(result.tools["repo.map"]).toBeTruthy()
  expect(result.tools["docs.headings"]).toBeTruthy()
  expect(result.tools["repo.findFiles"]).toBeTruthy()
  expect(result.tools["repo.searchText"]).toBeTruthy()
  expect(result.tools["repo.readFile"]).toBeTruthy()
  expect(result.tools["repo.writeFile"]).toBeTruthy()
  expect(result.tools["repo.patchFile"]).toBeTruthy()
  expect(result.tools["repo.listSymbols"]).toBeTruthy()
  expect(result.tools["docs.extractLinks"]).toBeTruthy()
  expect(result.tools["docs.summarizeMarkdown"]).toBeTruthy()
  expect(result.tools["docs.diffHeadings"]).toBeTruthy()
  expect(result.tools["docs.frontmatter"]).toBeTruthy()
  expect(result.tools["web.fetch"]).toBeTruthy()
  expect(result.tools["web.extractText"]).toBeTruthy()
  expect(result.tools["web.extractMetadata"]).toBeTruthy()
  expect(result.tools["web.checkStatus"]).toBeTruthy()
  expect(result.tools["data.jsonQuery"]).toBeTruthy()
  expect(result.tools["data.csvToJson"]).toBeTruthy()
  expect(result.tools["data.jsonSchemaValidate"]).toBeTruthy()
  expect(result.tools["sys.exec"]).toBeTruthy()
  expect(result.tools["sys.processList"]).toBeTruthy()
  expect(result.tools["sys.envInspect"]).toBeTruthy()
  expect(result.tools["good.echo"]).toBeTruthy()
  expect(result.tools["scoped.tool"]).toBeTruthy()

  expect(result.errors.some(entry => entry.error.includes("broken plugin load"))).toBe(true)
  expect(result.errors.some(entry => entry.error.includes("missing a valid name"))).toBe(true)
  expect(result.errors.some(entry => entry.error.includes("Duplicate tool name"))).toBe(true)
})

test("returns cached result by default", async () => {
  const cwd = path.join(rootDir, "tests/fixtures/plugins")
  const first = loadTools({ baseDir: rootDir, cwd })
  const second = loadTools({ baseDir: rootDir, cwd })
  expect(first).toBe(second)
})
