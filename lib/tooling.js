const fs = require("fs")
const path = require("path")

const DEFAULT_LIMITS = {
  maxContentBytes: 1_000_000,
  maxItems: 2000
}

function createTool(spec) {
  return {
    name: spec.name,
    description: spec.description,
    input: spec.input || { type: "object", properties: {} },
    run: spec.run
  }
}

function ok(payload = {}) {
  return {
    ok: true,
    ...payload
  }
}

function fail(message, details = {}) {
  const error = new Error(message)
  error.details = details
  throw error
}

function normalizeLimit(value, fallback, min, max, fieldName) {
  const selected = value === undefined || value === null ? fallback : value
  if (!Number.isFinite(selected)) {
    fail(`Field "${fieldName}" must be a finite number`)
  }
  if (selected < min || selected > max) {
    fail(`Field "${fieldName}" must be between ${min} and ${max}`)
  }
  return Math.floor(selected)
}

function resolveWorkspacePath(inputPath, options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.cwd())
  const absolutePath = path.resolve(workspaceRoot, inputPath || ".")
  const relativePath = path.relative(workspaceRoot, absolutePath)
  const outside =
    relativePath.startsWith("..") || path.isAbsolute(relativePath)

  if (!options.allowOutsideWorkspace && outside) {
    fail("Path must be inside workspace", {
      path: inputPath,
      workspaceRoot
    })
  }

  return {
    workspaceRoot,
    absolutePath,
    relativePath: relativePath || "."
  }
}

function ensureFileWithinSize(filePath, maxBytes = DEFAULT_LIMITS.maxContentBytes) {
  if (!fs.existsSync(filePath)) {
    fail(`File does not exist: ${filePath}`)
  }

  const stat = fs.statSync(filePath)
  if (!stat.isFile()) {
    fail(`Path is not a file: ${filePath}`)
  }

  if (stat.size > maxBytes) {
    fail(`File exceeds max allowed bytes (${maxBytes})`)
  }

  return stat
}

function safeReadText(filePath, maxBytes = DEFAULT_LIMITS.maxContentBytes) {
  ensureFileWithinSize(filePath, maxBytes)
  return fs.readFileSync(filePath, "utf8")
}

module.exports = {
  DEFAULT_LIMITS,
  createTool,
  ok,
  fail,
  normalizeLimit,
  resolveWorkspacePath,
  ensureFileWithinSize,
  safeReadText
}
