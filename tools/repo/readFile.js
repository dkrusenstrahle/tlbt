const { createTool, ok, normalizeLimit, resolveWorkspacePath, safeReadText, DEFAULT_LIMITS } = require("../../lib/tooling")

module.exports = createTool({
  name: "repo.readFile",
  description: "Read file content with optional line range",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      path: { type: "string" },
      startLine: { type: "number", minimum: 1, maximum: 1000000 },
      endLine: { type: "number", minimum: 1, maximum: 1000000 },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["path"]
  },
  async run({ path: inputPath, startLine, endLine, maxBytes = DEFAULT_LIMITS.maxContentBytes }) {
    const { absolutePath } = resolveWorkspacePath(inputPath)
    const boundedBytes = normalizeLimit(maxBytes, DEFAULT_LIMITS.maxContentBytes, 1, 5000000, "maxBytes")
    const content = safeReadText(absolutePath, boundedBytes)
    const lines = content.split(/\r?\n/)

    if (startLine === undefined && endLine === undefined) {
      return ok({
        path: absolutePath,
        lineCount: lines.length,
        content
      })
    }

    const from = normalizeLimit(startLine || 1, 1, 1, lines.length || 1, "startLine")
    const to = normalizeLimit(endLine || lines.length, lines.length, from, lines.length || 1, "endLine")
    return ok({
      path: absolutePath,
      lineCount: lines.length,
      startLine: from,
      endLine: to,
      content: lines.slice(from - 1, to).join("\n")
    })
  }
})
