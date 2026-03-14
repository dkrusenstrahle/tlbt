const { createTool, ok, resolveWorkspacePath, safeReadText, normalizeLimit } = require("../../lib/tooling")

function headingMatch(line) {
  return line.match(/^(#{1,6})\s+(.+?)\s*$/)
}

module.exports = createTool({
  name: "docs.summarizeMarkdown",
  description: "Summarize markdown document by heading sections",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      file: { type: "string" },
      maxSections: { type: "number", minimum: 1, maximum: 1000 },
      previewWords: { type: "number", minimum: 5, maximum: 120 },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["file"]
  },
  async run({ file, maxSections = 200, previewWords = 24, maxBytes = 1000000 }) {
    const { absolutePath } = resolveWorkspacePath(file)
    const boundedSections = normalizeLimit(maxSections, 200, 1, 1000, "maxSections")
    const boundedPreviewWords = normalizeLimit(previewWords, 24, 5, 120, "previewWords")
    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")
    const content = safeReadText(absolutePath, boundedBytes)
    const lines = content.split(/\r?\n/)

    const sections = []
    let current = null
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]
      const heading = headingMatch(line)
      if (heading) {
        if (current) sections.push(current)
        current = {
          heading: heading[2].trim(),
          level: heading[1].length,
          line: i + 1,
          body: []
        }
        continue
      }
      if (!current) continue
      current.body.push(line)
    }
    if (current) sections.push(current)

    const summary = sections.slice(0, boundedSections).map(section => {
      const body = section.body.join(" ").replace(/\s+/g, " ").trim()
      const words = body.length > 0 ? body.split(" ").filter(Boolean) : []
      return {
        heading: section.heading,
        level: section.level,
        line: section.line,
        wordCount: words.length,
        preview: words.slice(0, boundedPreviewWords).join(" ")
      }
    })

    return ok({
      file: absolutePath,
      sectionCount: summary.length,
      sections: summary,
      truncated: sections.length > boundedSections
    })
  }
})
