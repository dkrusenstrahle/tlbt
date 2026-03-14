const { spawnSync } = require("child_process")
const { createTool, ok, normalizeLimit } = require("../../lib/tooling")

module.exports = createTool({
  name: "sys.processList",
  description: "List running processes with optional text filter",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      contains: { type: "string" },
      maxResults: { type: "number", minimum: 1, maximum: 5000 }
    }
  },
  async run({ contains = "", maxResults = 200 }) {
    const boundedResults = normalizeLimit(maxResults, 200, 1, 5000, "maxResults")
    const out = spawnSync("ps", ["-ax", "-o", "pid=,ppid=,command="], {
      encoding: "utf8"
    })

    if (out.status !== 0) {
      const fallback = [{
        pid: process.pid,
        ppid: process.ppid,
        command: process.argv.join(" ")
      }].filter(item => (contains ? item.command.includes(contains) : true))

      return ok({
        count: fallback.length,
        processes: fallback,
        limited: true,
        note: "ps command unavailable; returning current process only"
      })
    }

    const rows = out.stdout
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split(/\s+/)
        return {
          pid: Number(parts[0]),
          ppid: Number(parts[1]),
          command: parts.slice(2).join(" ")
        }
      })
      .filter(item => (contains ? item.command.includes(contains) : true))
      .slice(0, boundedResults)

    return ok({
      count: rows.length,
      processes: rows
    })
  }
})
