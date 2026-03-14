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

    const headings = content
      .split("\n")
      .filter(line => line.startsWith("#"))

    return { headings }
  }
}