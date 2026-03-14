const express = require("express")
const { loadTools } = require("./registry")
const { getToolsMetadata } = require("./runtime")
const { createExecutor } = require("./lib/executor")
const {
  ERROR_CODES,
  createInvocationId,
  errorEnvelope,
  successEnvelope,
  statusCodeForErrorCode
} = require("./lib/contracts")

function commandMeta(command) {
  return {
    invocationId: createInvocationId(),
    tool: command,
    transport: "http",
    startedAt: new Date().toISOString(),
    durationMs: 0
  }
}

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

  const executor = createExecutor({
    tools,
    policy: options.policy,
    executionTimeoutMs: options.executionTimeoutMs,
    logger: options.logger,
    transport: "http"
  })

  app.get("/tools", (req, res) => {
    res.json(
      successEnvelope(
        {
          tools: getToolsMetadata(tools),
          loadErrors
        },
        commandMeta("tools")
      )
    )
  })

  app.post("/run", async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json(
        errorEnvelope(
          ERROR_CODES.invalidRequest,
          "Request body must be a JSON object",
          undefined,
          commandMeta("run")
        )
      )
    }

    const { tool, input } = req.body
    if (typeof tool !== "string" || tool.length === 0) {
      return res.status(400).json(
        errorEnvelope(
          ERROR_CODES.invalidRequest,
          "Field \"tool\" must be a non-empty string",
          { tool },
          commandMeta("run")
        )
      )
    }

    const result = await executor.execute(tool, input || {})
    if (!result.ok) {
      const statusCode = statusCodeForErrorCode(result.error.code)
      return res.status(statusCode).json(result)
    }

    return res.json(result)
  })

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res
        .status(400)
        .json(errorEnvelope(ERROR_CODES.invalidRequest, "Invalid JSON body", undefined, commandMeta("run")))
    }
    return next(err)
  })

  app.use((err, req, res, next) => {
    res.status(500).json(
      errorEnvelope(
        ERROR_CODES.internalError,
        err.message || "Internal server error",
        undefined,
        commandMeta("server")
      )
    )
  })

  return app
}

function startServer(options = {}) {
  const host = options.host || process.env.HOST || "127.0.0.1"
  const port = Number(options.port || process.env.PORT || 8787)
  const loaded = options.loaded || loadTools()
  const logger =
    options.logger ||
    (process.env.TLBT_LOG_JSON === "1"
      ? (event, payload) => {
          console.error(JSON.stringify({ event, ...payload }))
        }
      : null)
  const app = createApp({
    tools: loaded.tools,
    loadErrors: loaded.errors,
    requestTimeoutMs: options.requestTimeoutMs,
    executionTimeoutMs: options.executionTimeoutMs || options.requestTimeoutMs,
    policy: options.policy,
    logger
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