const path = require("path")
const { test, expect } = require("@playwright/test")
const repoMap = require("../tools/repo/map")
const { rootDir } = require("./helpers")

test("maps fixture repo deterministically with defaults", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/repo")
  const result = await repoMap.run({ path: fixture, maxDepth: 2 })

  expect(result.root).toBe(path.resolve(fixture))
  expect(result.truncated).toBe(false)
  expect(result.entries.map(entry => entry.path)).toEqual([
    "dir-b",
    "dir-b/file-b.txt",
    "file-a.txt"
  ])
})

test("includes hidden entries when includeHidden is true", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/repo")
  const result = await repoMap.run({
    path: fixture,
    maxDepth: 2,
    includeHidden: true,
    excludes: []
  })

  const paths = result.entries.map(entry => entry.path)
  expect(paths).toContain(".hidden")
  expect(paths).toContain(".git")
})

test("truncates results when maxEntries limit is reached", async () => {
  const fixture = path.join(rootDir, "tests/fixtures/repo")
  const result = await repoMap.run({
    path: fixture,
    maxDepth: 5,
    includeHidden: true,
    excludes: [],
    maxEntries: 2
  })

  expect(result.truncated).toBe(true)
  expect(result.count).toBe(2)
})

test("throws for missing path", async () => {
  await expect(repoMap.run({ path: "./does-not-exist" })).rejects.toThrow("Path does not exist")
})

test("throws for file path input", async () => {
  const filePath = path.join(rootDir, "tests/fixtures/docs/sample.md")
  await expect(repoMap.run({ path: filePath })).rejects.toThrow("Path is not a directory")
})
