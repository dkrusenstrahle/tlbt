const path = require("path")
const { test, expect } = require("@playwright/test")
const headingsTool = require("../tools/docs/headings")
const { rootDir } = require("./helpers")

test("extracts heading levels and line numbers", async () => {
  const file = path.join(rootDir, "tests/fixtures/docs/sample.md")
  const result = await headingsTool.run({ file })

  expect(result).toEqual({
    headings: [
      { level: 1, text: "TLBT", line: 1 },
      { level: 2, text: "Overview", line: 5 },
      { level: 3, text: "Details", line: 6 },
      { level: 4, text: "Deep Dive", line: 8 },
      { level: 6, text: "Edge Case", line: 9 }
    ]
  })
})

test("throws when file is missing", async () => {
  const file = path.join(rootDir, "tests/fixtures/docs/missing.md")
  await expect(headingsTool.run({ file })).rejects.toThrow()
})
