const { createTool, ok, resolveWorkspacePath, safeReadText, normalizeLimit } = require("../../lib/tooling")

module.exports = createTool({
  name: "docs.extractLinks",
  description: "Extract markdown links with location",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      file: { type: "string" },
      maxLinks: { type: "number", minimum: 1, maximum: 10000 },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["file"]
  },
  async run({ file, maxLinks = 1000, maxBytes = 1000000 }) {
    const { absolutePath } = resolveWorkspacePath(file)
    const boundedLinks = normalizeLimit(maxLinks, 1000, 1, 10000, "maxLinks")
    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")
    const content = safeReadText(absolutePath, boundedBytes)

    const links = []
    const lines = content.split(/\r?\n/)
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]
      let match
      while ((match = regex.exec(line)) !== null) {
        links.push({
          text: match[1].trim(),
          url: match[2].trim(),
          line: i + 1
        })
        if (links.length >= boundedLinks) {
          return ok({ file: absolutePath, count: links.length, links, truncated: true })
        }
      }
    }

    return ok({ file: absolutePath, count: links.length, links, truncated: false })
  }
})
