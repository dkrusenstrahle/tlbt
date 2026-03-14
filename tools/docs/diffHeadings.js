const { createTool, ok, resolveWorkspacePath, safeReadText, normalizeLimit } = require("../../lib/tooling")

function readHeadings(content) {
  const out = []
  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/)
    if (!match) continue
    out.push({
      level: match[1].length,
      text: match[2].trim(),
      line: i + 1
    })
  }
  return out
}

module.exports = createTool({
  name: "docs.diffHeadings",
  description: "Compare markdown headings between two files",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      beforeFile: { type: "string" },
      afterFile: { type: "string" },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["beforeFile", "afterFile"]
  },
  async run({ beforeFile, afterFile, maxBytes = 1000000 }) {
    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")
    const beforePath = resolveWorkspacePath(beforeFile).absolutePath
    const afterPath = resolveWorkspacePath(afterFile).absolutePath
    const before = readHeadings(safeReadText(beforePath, boundedBytes))
    const after = readHeadings(safeReadText(afterPath, boundedBytes))

    const beforeKeys = new Set(before.map(item => `${item.level}:${item.text}`))
    const afterKeys = new Set(after.map(item => `${item.level}:${item.text}`))

    const added = after.filter(item => !beforeKeys.has(`${item.level}:${item.text}`))
    const removed = before.filter(item => !afterKeys.has(`${item.level}:${item.text}`))

    return ok({
      beforeFile: beforePath,
      afterFile: afterPath,
      added,
      removed,
      unchangedCount: after.length - added.length
    })
  }
})
