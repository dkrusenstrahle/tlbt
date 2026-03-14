const path = require("path")
const { test, expect } = require("@playwright/test")
const { rootDir } = require("./helpers")
const extractLinks = require("../tools/docs/extractLinks")
const summarizeMarkdown = require("../tools/docs/summarizeMarkdown")
const diffHeadings = require("../tools/docs/diffHeadings")
const frontmatter = require("../tools/docs/frontmatter")

test("docs.extractLinks returns markdown links", async () => {
  const file = path.join(rootDir, "README.md")
  const result = await extractLinks.run({ file })
  expect(result.ok).toBe(true)
  expect(result.count).toBeGreaterThan(0)
})

test("docs.summarizeMarkdown summarizes section previews", async () => {
  const file = path.join(rootDir, "tests/fixtures/docs/sample.md")
  const result = await summarizeMarkdown.run({ file })
  expect(result.ok).toBe(true)
  expect(result.sectionCount).toBeGreaterThan(0)
  expect(result.sections[0]).toHaveProperty("heading")
})

test("docs.diffHeadings compares two markdown files", async () => {
  const beforeFile = path.join(rootDir, "tests/fixtures/docs/before.md")
  const afterFile = path.join(rootDir, "tests/fixtures/docs/after.md")
  const result = await diffHeadings.run({ beforeFile, afterFile })
  expect(result.ok).toBe(true)
  expect(result.added.some(item => item.text === "Install")).toBe(true)
  expect(result.removed.some(item => item.text === "Setup")).toBe(true)
})

test("docs.frontmatter parses key-value metadata", async () => {
  const file = path.join(rootDir, "tests/fixtures/docs/frontmatter.md")
  const result = await frontmatter.run({ file, requiredKeys: ["title", "owner"] })
  expect(result.ok).toBe(true)
  expect(result.hasFrontmatter).toBe(true)
  expect(result.valid).toBe(true)
  expect(result.frontmatter.title).toBe("TLBT Spec")
})
