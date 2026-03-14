const { loadTools } = require("../registry")
const { getToolsMetadata } = require("../runtime")
const { createExecutor } = require("./executor")

const JSON_RPC_VERSION = "2.0"
const SUPPORTED_MCP_PROTOCOL_VERSION = "2024-11-05"

function computeToolsFingerprint(tools) {
  const metadata = getToolsMetadata(tools)
  return JSON.stringify(
    Object.keys(metadata)
      .sort()
      .map(name => ({
        name,
        description: metadata[name].description || "",
        inputSchema: metadata[name].input || { type: "object", properties: {} }
      }))
  )
}

function createMcpHandler(options = {}) {
  const tools = options.tools || loadTools().tools
  const serverVersion = options.serverVersion || "1.0.0"
  let toolsFingerprint = computeToolsFingerprint(tools)
  const executor = createExecutor({
    tools,
    policy: options.policy,
    transport: "mcp",
    logger: options.logger,
    executionTimeoutMs: options.executionTimeoutMs
  })

  async function handle(request) {
    const id = request ? request.id : null
    const method = request && typeof request.method === "string" ? request.method : ""
    const params = request && request.params ? request.params : {}

    if (method === "initialize") {
      const protocolVersion =
        typeof params.protocolVersion === "string" && params.protocolVersion.length > 0
          ? params.protocolVersion
          : SUPPORTED_MCP_PROTOCOL_VERSION
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: {
          protocolVersion,
          serverInfo: {
            name: "tlbt",
            version: serverVersion
          },
          capabilities: {
            tools: {
              listChanged: true
            }
          }
        }
      }
    }

    if (method === "notifications/initialized") {
      return null
    }

    if (method === "ping") {
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: {}
      }
    }

    if (method === "tools/list") {
      const metadata = getToolsMetadata(tools)
      const listedTools = Object.keys(metadata).map(name => ({
        name,
        description: metadata[name].description || "",
        inputSchema: metadata[name].input || { type: "object", properties: {} }
      }))
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: {
          tools: listedTools
        }
      }
    }

    if (method === "notifications/tools/list_changed") {
      return null
    }

    if (method === "tools/call") {
      const toolName = params.name
      const toolArgs = params.arguments || {}
      const result = await executor.execute(toolName, toolArgs)
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result)
            }
          ],
          structuredContent: result,
          isError: !result.ok
        }
      }
    }

    return {
      jsonrpc: JSON_RPC_VERSION,
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    }
  }

  return {
    handle,
    hasToolListChanged() {
      const nextFingerprint = computeToolsFingerprint(tools)
      if (nextFingerprint === toolsFingerprint) return false
      toolsFingerprint = nextFingerprint
      return true
    }
  }
}

function writeMessage(stream, message) {
  const body = JSON.stringify(message)
  stream.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`)
}

function createMessageReader(input, onMessage) {
  let buffer = Buffer.alloc(0)

  input.on("data", chunk => {
    buffer = Buffer.concat([buffer, Buffer.from(chunk)])
    while (true) {
      const marker = buffer.indexOf("\r\n\r\n")
      if (marker === -1) return

      const header = buffer.slice(0, marker).toString("utf8")
      const match = header.match(/Content-Length:\s*(\d+)/i)
      if (!match) {
        buffer = Buffer.alloc(0)
        return
      }

      const length = Number(match[1])
      const total = marker + 4 + length
      if (buffer.length < total) return

      const payload = buffer.slice(marker + 4, total).toString("utf8")
      buffer = buffer.slice(total)

      try {
        const parsed = JSON.parse(payload)
        onMessage(parsed)
      } catch (err) {
        // Ignore invalid payloads on stream.
      }
    }
  })
}

function startMcpServer(options = {}) {
  const loaded = options.loaded || loadTools()
  const handler = createMcpHandler({
    tools: loaded.tools,
    policy: options.policy,
    logger: options.logger,
    executionTimeoutMs: options.executionTimeoutMs,
    serverVersion: options.serverVersion
  })
  const input = options.input || process.stdin
  const output = options.output || process.stdout

  createMessageReader(input, async message => {
    const response = await handler.handle(message)
    if (!response) return
    writeMessage(output, response)
  })

  function notifyToolsChanged() {
    writeMessage(output, {
      jsonrpc: JSON_RPC_VERSION,
      method: "notifications/tools/list_changed",
      params: {}
    })
  }

  if (options.attachSignalHandlers !== false) {
    const shutdown = () => process.exit(0)
    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
  }

  return {
    transport: "stdio",
    notifyToolsChanged,
    hasToolListChanged: handler.hasToolListChanged
  }
}

module.exports = {
  SUPPORTED_MCP_PROTOCOL_VERSION,
  createMcpHandler,
  createMessageReader,
  writeMessage,
  startMcpServer
}
