const fs = require("fs")
const path = require("path")
const { createTool, ok, normalizeLimit, resolveWorkspacePath } = require("../../lib/tooling")

function toRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&")
  const normalized = escaped.replace(/\*/g, ".*").replace(/\?/g, ".")
  return new RegExp(`^${normalized}$`)
}

function matchesAny(value, patterns) {
  if (!patterns || patterns.length === 0) return true
  return patterns.some(pattern => toRegExp(pattern).test(value))
}

function walk(baseDir, currentDir, depth, options, out, state) {
  if (state.done) return
  if (depth > options.maxDepth) return

  const entries = fs.readdirSync(currentDir, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    if (state.done) return
    const absolutePath = path.join(currentDir, entry.name)
    const relativePath = path.relative(baseDir, absolutePath) || "."

    if (entry.isDirectory()) {
      if (options.exclude.some(pattern => toRegExp(pattern).test(entry.name))) {
        continue
      }
      walk(baseDir, absolutePath, depth + 1, options, out, state)
      continue
    }

    if (!entry.isFile()) continue
    const fileName = path.basename(relativePath)
    if (options.exclude.some(pattern => toRegExp(pattern).test(fileName))) continue
    if (!matchesAny(relativePath, options.include) && !matchesAny(fileName, options.include)) continue

    out.push(relativePath)
    if (out.length >= options.maxResults) {
      state.done = true
      return
    }
  }
}

module.exports = createTool({
  name: "repo.findFiles",
  description: "Find files by include and exclude patterns",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      path: { type: "string" },
      include: { type: "array", items: { type: "string" } },
      exclude: { type: "array", items: { type: "string" } },
      maxDepth: { type: "number", minimum: 1, maximum: 25 },
      maxResults: { type: "number", minimum: 1, maximum: 10000 }
    },
    required: ["path"]
  },
  async run({ path: inputPath, include = ["*"], exclude = [], maxDepth = 6, maxResults = 1000 }) {
    const { absolutePath } = resolveWorkspacePath(inputPath)
    const stat = fs.statSync(absolutePath)
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${inputPath}`)
    }

    const boundedDepth = normalizeLimit(maxDepth, 6, 1, 25, "maxDepth")
    const boundedResults = normalizeLimit(maxResults, 1000, 1, 10000, "maxResults")
    const files = []
    const state = { done: false }
    walk(
      absolutePath,
      absolutePath,
      1,
      { include, exclude, maxDepth: boundedDepth, maxResults: boundedResults },
      files,
      state
    )

    return ok({
      root: absolutePath,
      count: files.length,
      files,
      truncated: state.done
    })
  }
})
