const fs = require("fs")
const path = require("path")
const { createTool, ok, resolveWorkspacePath, normalizeLimit, DEFAULT_LIMITS } = require("../../lib/tooling")

function collectFiles(current, out, depth, maxDepth) {
  if (depth > maxDepth) return
  const entries = fs.readdirSync(current, { withFileTypes: true })
  for (const entry of entries) {
    const next = path.join(current, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") continue
      collectFiles(next, out, depth + 1, maxDepth)
    } else if (entry.isFile()) {
      out.push(next)
    }
  }
}

function parseSymbols(content) {
  const lines = content.split(/\r?\n/)
  const symbols = []
  const rules = [
    { type: "function", regex: /^\s*function\s+([A-Za-z0-9_$]+)\s*\(/ },
    { type: "class", regex: /^\s*class\s+([A-Za-z0-9_$]+)\b/ },
    { type: "const", regex: /^\s*(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/ },
    { type: "export", regex: /^\s*export\s+(?:const|function|class)\s+([A-Za-z0-9_$]+)\b/ }
  ]
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    for (const rule of rules) {
      const match = line.match(rule.regex)
      if (!match) continue
      symbols.push({ type: rule.type, name: match[1], line: i + 1 })
      break
    }
  }
  return symbols
}

module.exports = createTool({
  name: "repo.listSymbols",
  description: "List likely code symbols using lightweight heuristics",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      path: { type: "string" },
      extensions: { type: "array", items: { type: "string" } },
      maxDepth: { type: "number", minimum: 1, maximum: 20 },
      maxFiles: { type: "number", minimum: 1, maximum: 5000 },
      maxFileBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["path"]
  },
  async run({
    path: inputPath,
    extensions = [".js", ".ts", ".tsx", ".py"],
    maxDepth = 8,
    maxFiles = 800,
    maxFileBytes = DEFAULT_LIMITS.maxContentBytes
  }) {
    const { absolutePath } = resolveWorkspacePath(inputPath)
    const boundedDepth = normalizeLimit(maxDepth, 8, 1, 20, "maxDepth")
    const boundedFiles = normalizeLimit(maxFiles, 800, 1, 5000, "maxFiles")
    const boundedBytes = normalizeLimit(maxFileBytes, DEFAULT_LIMITS.maxContentBytes, 1, 5000000, "maxFileBytes")

    const files = []
    collectFiles(absolutePath, files, 1, boundedDepth)

    const results = []
    for (const file of files) {
      if (results.length >= boundedFiles) break
      if (!extensions.some(ext => file.endsWith(ext))) continue
      const stat = fs.statSync(file)
      if (stat.size > boundedBytes) continue
      const content = fs.readFileSync(file, "utf8")
      const symbols = parseSymbols(content)
      if (symbols.length === 0) continue
      results.push({
        file: path.relative(absolutePath, file),
        symbols
      })
    }

    return ok({
      root: absolutePath,
      filesAnalyzed: Math.min(files.length, boundedFiles),
      count: results.reduce((acc, next) => acc + next.symbols.length, 0),
      results
    })
  }
})
