const { createTool, ok, normalizeLimit } = require("../../lib/tooling")
const { fetchUrl } = require("../../lib/web")

module.exports = createTool({
  name: "web.checkStatus",
  description: "Check HTTP status, headers, and redirect count",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      url: { type: "string" },
      timeoutMs: { type: "number", minimum: 100, maximum: 120000 },
      maxRedirects: { type: "number", minimum: 0, maximum: 20 }
    },
    required: ["url"]
  },
  async run({ url, timeoutMs = 10000, maxRedirects = 5 }) {
    const boundedTimeout = normalizeLimit(timeoutMs, 10000, 100, 120000, "timeoutMs")
    const boundedRedirects = normalizeLimit(maxRedirects, 5, 0, 20, "maxRedirects")
    const response = await fetchUrl(url, {
      timeoutMs: boundedTimeout,
      maxBytes: 200000,
      maxRedirects: boundedRedirects
    })

    return ok({
      url: response.url,
      status: response.status,
      redirects: response.redirects,
      headers: response.headers
    })
  }
})
