const { createTool, ok, resolveWorkspacePath, safeReadText, normalizeLimit } = require("../../lib/tooling")

function parseFrontmatter(content) {
  const lines = content.split(/\r?\n/)
  if (lines[0] !== "---") {
    return { hasFrontmatter: false, data: {}, lineCount: 0 }
  }

  const data = {}
  let endLine = -1
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line === "---") {
      endLine = i
      break
    }
    const idx = line.indexOf(":")
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (key.length > 0) data[key] = value
  }

  if (endLine === -1) {
    return { hasFrontmatter: false, data: {}, lineCount: 0 }
  }

  return {
    hasFrontmatter: true,
    data,
    lineCount: endLine + 1
  }
}

module.exports = createTool({
  name: "docs.frontmatter",
  description: "Parse markdown frontmatter key-value pairs",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      file: { type: "string" },
      requiredKeys: { type: "array", items: { type: "string" } },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["file"]
  },
  async run({ file, requiredKeys = [], maxBytes = 1000000 }) {
    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")
    const filePath = resolveWorkspacePath(file).absolutePath
    const content = safeReadText(filePath, boundedBytes)
    const parsed = parseFrontmatter(content)

    const missingKeys = requiredKeys.filter(key => !Object.prototype.hasOwnProperty.call(parsed.data, key))
    return ok({
      file: filePath,
      hasFrontmatter: parsed.hasFrontmatter,
      frontmatter: parsed.data,
      missingKeys,
      valid: parsed.hasFrontmatter && missingKeys.length === 0
    })
  }
})
