const fs = require("fs")
const path = require("path")
const {
  createTool,
  ok,
  normalizeLimit,
  resolveWorkspacePath,
  DEFAULT_LIMITS
} = require("../../lib/tooling")

function gatherFiles(root, current, files, depth, maxDepth) {
  if (depth > maxDepth) return
  const entries = fs.readdirSync(current, { withFileTypes: true })
  for (const entry of entries) {
    const next = path.join(current, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") continue
      gatherFiles(root, next, files, depth + 1, maxDepth)
      continue
    }
    if (entry.isFile()) {
      files.push(next)
    }
  }
}

module.exports = createTool({
  name: "repo.searchText",
  description: "Search text in workspace files",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      path: { type: "string" },
      query: { type: "string" },
      caseSensitive: { type: "boolean" },
      useRegex: { type: "boolean" },
      maxDepth: { type: "number", minimum: 1, maximum: 25 },
      maxMatches: { type: "number", minimum: 1, maximum: 10000 },
      maxFileBytes: { type: "number", minimum: 1, maximum: 10000000 }
    },
    required: ["path", "query"]
  },
  async run({
    path: inputPath,
    query,
    caseSensitive = false,
    useRegex = false,
    maxDepth = 8,
    maxMatches = 500,
    maxFileBytes = DEFAULT_LIMITS.maxContentBytes
  }) {
    const { absolutePath } = resolveWorkspacePath(inputPath)
    if (!fs.statSync(absolutePath).isDirectory()) {
      throw new Error(`Path is not a directory: ${inputPath}`)
    }

    const boundedDepth = normalizeLimit(maxDepth, 8, 1, 25, "maxDepth")
    const boundedMatches = normalizeLimit(maxMatches, 500, 1, 10000, "maxMatches")
    const boundedFileBytes = normalizeLimit(maxFileBytes, DEFAULT_LIMITS.maxContentBytes, 1, 10000000, "maxFileBytes")

    const files = []
    gatherFiles(absolutePath, absolutePath, files, 1, boundedDepth)

    const matches = []
    const flags = caseSensitive ? "g" : "gi"
    const matcher = useRegex ? new RegExp(query, flags) : null
    for (const file of files) {
      if (matches.length >= boundedMatches) break
      const stat = fs.statSync(file)
      if (stat.size > boundedFileBytes) continue
      const content = fs.readFileSync(file, "utf8")
      const lines = content.split(/\r?\n/)
      for (let i = 0; i < lines.length; i += 1) {
        if (matches.length >= boundedMatches) break
        const line = lines[i]
        const found = useRegex
          ? matcher.test(line)
          : caseSensitive
            ? line.includes(query)
            : line.toLowerCase().includes(query.toLowerCase())
        if (!found) continue
        matches.push({
          file: path.relative(absolutePath, file),
          line: i + 1,
          text: line
        })
        if (useRegex) matcher.lastIndex = 0
      }
    }

    return ok({
      root: absolutePath,
      query,
      count: matches.length,
      matches,
      truncated: matches.length >= boundedMatches
    })
  }
})
