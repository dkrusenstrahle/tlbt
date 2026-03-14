const { test, expect } = require("@playwright/test")
const {
  POLICY_PRESETS,
  resolvePolicyPreset,
  mergePolicies,
  evaluatePolicy
} = require("../lib/policy")

test("policy presets expose strict balanced dev", async () => {
  expect(POLICY_PRESETS.strict).toBeTruthy()
  expect(POLICY_PRESETS.balanced).toBeTruthy()
  expect(POLICY_PRESETS.dev).toBeTruthy()
})

test("resolvePolicyPreset handles unknown names", async () => {
  expect(resolvePolicyPreset("strict").denyToolPrefixes).toContain("sys.")
  expect(resolvePolicyPreset("unknown")).toBe(null)
})

test("mergePolicies allows explicit override", async () => {
  const merged = mergePolicies(
    { denyToolPrefixes: ["sys."], enforceWorkspacePaths: true },
    { denyToolPrefixes: [], enforceWorkspacePaths: false }
  )
  expect(merged.denyToolPrefixes).toEqual([])
  expect(merged.enforceWorkspacePaths).toBe(false)
})

test("strict preset blocks sys tool execution", async () => {
  const strict = resolvePolicyPreset("strict")
  const result = evaluatePolicy(strict, "sys.exec", {})
  expect(result.ok).toBe(false)
})
