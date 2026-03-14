const fs = require("fs")

module.exports = {
  name: "docs.headings",

  description: "Extract markdown headings",

  input: {
    type: "object",
    properties: {
      file: {
        type: "string"
      }
    },
    required: ["file"]
  },

  async run({ file }) {
    const content = fs.readFileSync(file, "utf8")

    const headings = []

    for (const [index, line] of content.split("\n").entries()) {
      const match = line.match(/^(#{1,6})\s+(.+)\s*$/)
      if (!match) continue

      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: index + 1
      })
    }

    return { headings }
  }
}