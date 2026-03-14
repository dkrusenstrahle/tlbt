const { createTool, ok, normalizeLimit } = require("../../lib/tooling")
const { fetchUrl, extractMetadata } = require("../../lib/web")

module.exports = createTool({
  name: "web.extractMetadata",
  description: "Extract common metadata from HTML or URL",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      html: { type: "string" },
      url: { type: "string" },
      timeoutMs: { type: "number", minimum: 100, maximum: 120000 },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    }
  },
  async run({ html, url, timeoutMs = 10000, maxBytes = 1000000 }) {
    if (!html && !url) {
      throw new Error("Either \"html\" or \"url\" is required")
    }

    const boundedTimeout = normalizeLimit(timeoutMs, 10000, 100, 120000, "timeoutMs")
    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")

    let sourceHtml = html
    let resolvedUrl = null
    if (!sourceHtml) {
      const fetched = await fetchUrl(url, { timeoutMs: boundedTimeout, maxBytes: boundedBytes })
      sourceHtml = fetched.body
      resolvedUrl = fetched.url
    }

    return ok({
      url: resolvedUrl || url || null,
      metadata: extractMetadata(sourceHtml)
    })
  }
})
