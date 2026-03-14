const path = require("path")
const { test, expect } = require("@playwright/test")
const { rootDir } = require("./helpers")
const jsonQuery = require("../tools/data/jsonQuery")
const csvToJson = require("../tools/data/csvToJson")
const jsonSchemaValidate = require("../tools/data/jsonSchemaValidate")

test("data.jsonQuery resolves nested path", async () => {
  const result = await jsonQuery.run({
    data: { user: { roles: ["admin", "editor"] } },
    path: "user.roles[0]"
  })
  expect(result.ok).toBe(true)
  expect(result.value).toBe("admin")
})

test("data.csvToJson converts CSV file", async () => {
  const file = path.join(rootDir, "tests/fixtures/data/sample.csv")
  const result = await csvToJson.run({ file })
  expect(result.ok).toBe(true)
  expect(result.count).toBe(2)
  expect(result.rows[0].name).toBe("Ada")
})

test("data.jsonSchemaValidate reports validation errors", async () => {
  const result = await jsonSchemaValidate.run({
    schema: {
      type: "object",
      properties: { count: { type: "number", minimum: 2 } },
      required: ["count"]
    },
    data: { count: 1 }
  })

  expect(result.ok).toBe(true)
  expect(result.valid).toBe(false)
  expect(result.errors.length).toBeGreaterThan(0)
})
