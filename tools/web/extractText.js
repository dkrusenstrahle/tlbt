const { createTool, ok, normalizeLimit } = require("../../lib/tooling")
const { fetchUrl, stripHtml } = require("../../lib/web")

module.exports = createTool({
  name: "web.extractText",
  description: "Extract readable text from HTML or URL",
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
    let sourceUrl = null
    if (!sourceHtml) {
      const response = await fetchUrl(url, { timeoutMs: boundedTimeout, maxBytes: boundedBytes })
      sourceHtml = response.body
      sourceUrl = response.url
    }

    const text = stripHtml(sourceHtml)
    return ok({
      url: sourceUrl || url || null,
      length: text.length,
      text
    })
  }
})
