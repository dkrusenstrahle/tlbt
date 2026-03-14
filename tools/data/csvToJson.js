const { createTool, ok, resolveWorkspacePath, safeReadText, normalizeLimit } = require("../../lib/tooling")

function parseCsvLine(line) {
  const out = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === "\"") {
      const next = line[i + 1]
      if (inQuotes && next === "\"") {
        current += "\""
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === "," && !inQuotes) {
      out.push(current)
      current = ""
      continue
    }
    current += ch
  }
  out.push(current)
  return out
}

module.exports = createTool({
  name: "data.csvToJson",
  description: "Convert CSV text or file into JSON rows",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      csv: { type: "string" },
      file: { type: "string" },
      maxRows: { type: "number", minimum: 1, maximum: 100000 },
      maxBytes: { type: "number", minimum: 1, maximum: 5000000 }
    }
  },
  async run({ csv, file, maxRows = 5000, maxBytes = 1000000 }) {
    if (!csv && !file) {
      throw new Error("Either \"csv\" or \"file\" is required")
    }
    const boundedRows = normalizeLimit(maxRows, 5000, 1, 100000, "maxRows")
    const boundedBytes = normalizeLimit(maxBytes, 1000000, 1, 5000000, "maxBytes")
    const text = csv || safeReadText(resolveWorkspacePath(file).absolutePath, boundedBytes)
    const lines = text.split(/\r?\n/).filter(line => line.length > 0)
    if (lines.length === 0) return ok({ headers: [], rows: [], count: 0 })

    const headers = parseCsvLine(lines[0]).map(h => h.trim())
    const rows = []
    for (let i = 1; i < lines.length; i += 1) {
      if (rows.length >= boundedRows) break
      const cols = parseCsvLine(lines[i])
      const row = {}
      headers.forEach((header, idx) => {
        row[header] = cols[idx] !== undefined ? cols[idx] : ""
      })
      rows.push(row)
    }

    return ok({
      headers,
      rows,
      count: rows.length,
      truncated: rows.length >= boundedRows
    })
  }
})
