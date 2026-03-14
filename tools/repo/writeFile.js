const fs = require("fs")
const path = require("path")
const { createTool, ok, resolveWorkspacePath, normalizeLimit } = require("../../lib/tooling")

module.exports = createTool({
  name: "repo.writeFile",
  description: "Write UTF-8 content to a workspace file",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      path: { type: "string" },
      content: { type: "string" },
      createDirs: { type: "boolean" },
      overwrite: { type: "boolean" },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["path", "content"]
  },
  async run({ path: inputPath, content, createDirs = true, overwrite = true, maxBytes = 1000000 }) {
    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")
    const byteLength = Buffer.byteLength(content, "utf8")
    if (byteLength > boundedBytes) {
      throw new Error(`Content exceeds maxBytes (${boundedBytes})`)
    }

    const { absolutePath } = resolveWorkspacePath(inputPath)
    if (fs.existsSync(absolutePath) && !overwrite) {
      throw new Error(`File already exists and overwrite is false: ${inputPath}`)
    }

    const dir = path.dirname(absolutePath)
    if (!fs.existsSync(dir)) {
      if (!createDirs) {
        throw new Error("Parent directory does not exist and createDirs is false")
      }
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(absolutePath, content, "utf8")
    return ok({
      path: absolutePath,
      bytesWritten: byteLength
    })
  }
})
