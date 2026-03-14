const { createTool, ok, normalizeLimit } = require("../../lib/tooling")
const { fetchUrl } = require("../../lib/web")

module.exports = createTool({
  name: "web.fetch",
  description: "Fetch a URL with timeout and content limits",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      url: { type: "string" },
      timeoutMs: { type: "number", minimum: 100, maximum: 120000 },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    },
    required: ["url"]
  },
  async run({ url, timeoutMs = 10000, maxBytes = 1000000 }) {
    const boundedTimeout = normalizeLimit(timeoutMs, 10000, 100, 120000, "timeoutMs")
    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")
    const result = await fetchUrl(url, {
      timeoutMs: boundedTimeout,
      maxBytes: boundedBytes
    })
    return ok(result)
  }
})
