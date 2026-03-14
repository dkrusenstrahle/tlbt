const fs = require("fs")

module.exports = {
  name: "repo.map",

  description: "Map repository structure",

  input: {
    type: "object",
    properties: {
      path: {
        type: "string"
      }
    },
    required: ["path"]
  },

  async run({ path }) {
    const files = fs.readdirSync(path)

    return { files }
  }
}