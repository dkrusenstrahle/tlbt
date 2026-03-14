const http = require("http")
const https = require("https")

function fetchUrl(url, options = {}) {
  const timeoutMs = options.timeoutMs || 10_000
  const maxBytes = options.maxBytes || 1_000_000
  const headers = options.headers || {}
  const method = options.method || "GET"
  const maxRedirects = options.maxRedirects === undefined ? 5 : options.maxRedirects

  return new Promise((resolve, reject) => {
    let redirects = 0

    function run(currentUrl) {
      const transport = currentUrl.startsWith("https://") ? https : http
      const req = transport.request(currentUrl, { method, headers }, res => {
        const status = res.statusCode || 0
        const location = res.headers.location
        if (location && status >= 300 && status < 400 && redirects < maxRedirects) {
          redirects += 1
          const nextUrl = new URL(location, currentUrl).toString()
          run(nextUrl)
          return
        }

        const chunks = []
        let bytes = 0
        res.on("data", chunk => {
          bytes += chunk.length
          if (bytes > maxBytes) {
            req.destroy(new Error(`Response exceeded maxBytes (${maxBytes})`))
            return
          }
          chunks.push(chunk)
        })
        res.on("end", () => {
          resolve({
            url: currentUrl,
            status,
            headers: res.headers,
            redirects,
            body: Buffer.concat(chunks).toString("utf8")
          })
        })
      })

      req.on("error", reject)
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Request timed out after ${timeoutMs}ms`))
      })
      req.end()
    }

    run(url)
  })
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractMetadata(html) {
  const getTagContent = pattern => {
    const match = html.match(pattern)
    return match ? match[1].trim() : null
  }

  const title = getTagContent(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const description = getTagContent(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  const canonical = getTagContent(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
  const ogTitle = getTagContent(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  const ogDescription = getTagContent(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  return {
    title,
    description,
    canonical,
    og: {
      title: ogTitle,
      description: ogDescription
    }
  }
}

module.exports = {
  fetchUrl,
  stripHtml,
  extractMetadata
}
