const express = require("express")
const { loadTools } = require("./registry")
const { getToolsMetadata, validateInput } = require("./runtime")

function createApp(options = {}) {
  const app = express()
  const tools = options.tools || loadTools().tools
  const loadErrors = options.loadErrors || []
  const requestTimeoutMs = options.requestTimeoutMs || 15000

  app.use(express.json({ limit: "1mb" }))
  app.use((req, res, next) => {
    req.setTimeout(requestTimeoutMs)
    res.setTimeout(requestTimeoutMs)
    next()
  })

  app.get("/tools", (req, res) => {
    res.json({
      tools: getToolsMetadata(tools),
      loadErrors
    })
  })

  app.post("/run", async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Request body must be a JSON object" })
    }

    const { tool, input } = req.body
    if (typeof tool !== "string" || tool.length === 0) {
      return res.status(400).json({ error: "Field \"tool\" must be a non-empty string" })
    }

    const t = tools[tool]
    if (!t) {
      return res.status(404).json({ error: "Tool not found", tool })
    }

    const validation = validateInput(t.input, input || {})
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error, tool })
    }

    try {
      const result = await t.run(input || {})
      res.json(result)
    } catch (err) {
      res.status(500).json({ error: err.message || "Tool execution failed", tool })
    }
  })

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({ error: "Invalid JSON body" })
    }
    return next(err)
  })

  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || "Internal server error" })
  })

  return app
}

function startServer(options = {}) {
  const host = options.host || process.env.HOST || "127.0.0.1"
  const port = Number(options.port || process.env.PORT || 8787)
  const loaded = options.loaded || loadTools()
  const app = createApp({
    tools: loaded.tools,
    loadErrors: loaded.errors,
    requestTimeoutMs: options.requestTimeoutMs
  })

  const server = app.listen(port, host, () => {
    console.log(`TLBT server running at http://${host}:${port}`)
  })

  if (options.attachSignalHandlers !== false) {
    const shutdown = () => {
      server.close(() => process.exit(0))
    }
    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
  }

  return { app, server, host, port, loadErrors: loaded.errors }
}

if (require.main === module) {
  startServer()
}

module.exports = {
  createApp,
  startServer
}