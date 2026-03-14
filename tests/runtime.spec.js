const { test, expect } = require("@playwright/test")
const { parseJsonInput, validateInput, getToolsMetadata } = require("../runtime")

test("parseJsonInput handles empty and invalid values", async () => {
  expect(parseJsonInput(undefined)).toEqual({ ok: true, value: {} })
  expect(parseJsonInput(null)).toEqual({ ok: true, value: {} })
  expect(parseJsonInput("")).toEqual({ ok: true, value: {} })

  const nonString = parseJsonInput(123)
  expect(nonString.ok).toBe(false)
  expect(nonString.error).toContain("must be a string")

  const invalid = parseJsonInput("{")
  expect(invalid.ok).toBe(false)
  expect(invalid.error).toContain("Invalid JSON input")
})

test("validateInput supports rich JSON schema checks", async () => {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      count: { type: "number", minimum: 1 },
      mode: { enum: ["fast", "safe"] },
      nested: {
        type: "object",
        properties: {
          enabled: { type: "boolean" }
        },
        required: ["enabled"]
      }
    },
    required: ["count", "mode"]
  }

  expect(validateInput(schema, { count: 2, mode: "fast", nested: { enabled: true } }).ok).toBe(true)
  expect(validateInput(schema, { mode: "fast" }).ok).toBe(false)
  expect(validateInput(schema, { count: 0, mode: "fast" }).ok).toBe(false)
  expect(validateInput(schema, { count: 1, mode: "invalid" }).ok).toBe(false)
  expect(validateInput(schema, { count: 1, mode: "fast", extra: true }).ok).toBe(false)
})

test("getToolsMetadata extracts public tool shape", async () => {
  const metadata = getToolsMetadata({
    "repo.map": {
      description: "Map repo",
      input: { type: "object", properties: {} }
    }
  })

  expect(metadata).toEqual({
    "repo.map": {
      description: "Map repo",
      input: { type: "object", properties: {} }
    }
  })
})
