const fs = require("fs")
const path = require("path")
const { test, expect } = require("@playwright/test")
const { rootDir } = require("./helpers")
const findFiles = require("../tools/repo/findFiles")
const searchText = require("../tools/repo/searchText")
const readFile = require("../tools/repo/readFile")
const writeFile = require("../tools/repo/writeFile")
const patchFile = require("../tools/repo/patchFile")
const listSymbols = require("../tools/repo/listSymbols")

test("repo.findFiles returns matching files", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/repo")
  const result = await findFiles.run({
    path: fixture,
    include: ["*.txt"],
    maxDepth: 3
  })

  expect(result.ok).toBe(true)
  expect(result.files).toContain("file-a.txt")
  expect(result.files).toContain("dir-b/file-b.txt")
})

test("repo.searchText finds query with line numbers", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/repo")
  const result = await searchText.run({
    path: fixture,
    query: "alpha",
    maxDepth: 3
  })

  expect(result.ok).toBe(true)
  expect(result.count).toBeGreaterThan(0)
  expect(result.matches[0]).toHaveProperty("line")
})

test("repo.readFile reads line range", async () => {
  const file = path.join(rootDir, "tests/fixtures/docs/sample.md")
  const result = await readFile.run({
    path: file,
    startLine: 1,
    endLine: 1
  })

  expect(result.ok).toBe(true)
  expect(result.content).toBe("# TLBT")
})

test("repo.writeFile and repo.patchFile write and patch", async () => {
  const tempDir = path.join(rootDir, "test-results")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
  const target = path.join(tempDir, "tmp-write.txt")
  const writeResult = await writeFile.run({
    path: target,
    content: "hello world"
  })
  expect(writeResult.ok).toBe(true)

  const patchResult = await patchFile.run({
    path: target,
    search: "world",
    replace: "agent"
  })
  expect(patchResult.ok).toBe(true)
  expect(patchResult.replacements).toBe(1)

  const readResult = await readFile.run({ path: target })
  expect(readResult.content).toContain("hello agent")
  fs.rmSync(target, { force: true })
})

test("repo.listSymbols finds JS symbols", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/repo")
  const result = await listSymbols.run({
    path: fixture,
    extensions: [".js"],
    maxDepth: 4
  })

  expect(result.ok).toBe(true)
  expect(result.count).toBeGreaterThan(0)
})
