const fs = require("fs")
const { createTool, ok, resolveWorkspacePath, safeReadText, normalizeLimit } = require("../../lib/tooling")

module.exports = createTool({
  name: "repo.patchFile",
  description: "Patch file text by string replacement",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      path: { type: "string" },
      search: { type: "string" },
      replace: { type: "string" },
      replaceAll: { type: "boolean" },
      dryRun: { type: "boolean" },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["path", "search", "replace"]
  },
  async run({
    path: inputPath,
    search,
    replace,
    replaceAll = false,
    dryRun = false,
    maxBytes = 1000000
  }) {
    if (search.length === 0) {
      throw new Error("Field \"search\" must be non-empty")
    }

    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")
    const { absolutePath } = resolveWorkspacePath(inputPath)
    const original = safeReadText(absolutePath, boundedBytes)

    const occurrenceCount = original.split(search).length - 1
    if (occurrenceCount === 0) {
      return ok({
        path: absolutePath,
        changed: false,
        replacements: 0
      })
    }

    const next = replaceAll ? original.split(search).join(replace) : original.replace(search, replace)
    const replacements = replaceAll ? occurrenceCount : 1

    if (!dryRun) {
      fs.writeFileSync(absolutePath, next, "utf8")
    }

    return ok({
      path: absolutePath,
      changed: true,
      replacements,
      dryRun
    })
  }
})
