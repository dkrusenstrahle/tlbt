const { createTool, ok } = require("../../lib/tooling")

function parsePath(pathExpr) {
  return pathExpr
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
}

function getByPath(value, pathExpr) {
  if (!pathExpr) return value
  const parts = parsePath(pathExpr)
  let current = value
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }
  return current
}

module.exports = createTool({
  name: "data.jsonQuery",
  description: "Query JSON value by simple path expression",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      data: {},
      path: { type: "string" }
    },
    required: ["data"]
  },
  async run({ data, path }) {
    const value = getByPath(data, path)
    return ok({
      path: path || "",
      value
    })
  }
})
