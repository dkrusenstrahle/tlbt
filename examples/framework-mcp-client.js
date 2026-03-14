const { PassThrough } = require("stream")
const { createMcpHandler, createMessageReader, writeMessage } = require("../lib/mcp-server")

async function run() {
  const input = new PassThrough()
  const output = new PassThrough()
  const handler = createMcpHandler({
    tools: {
      "example.echo": {
        name: "example.echo",
        description: "Echo input",
        input: {
          type: "object",
          properties: {
            value: { type: "string" }
          },
          required: ["value"]
        },
        async run({ value }) {
          return { echoed: value }
        }
      }
    }
  })

  createMessageReader(input, async message => {
    const response = await handler.handle(message)
    if (response) {
      writeMessage(output, response)
    }
  })

  const responses = []
  createMessageReader(output, message => responses.push(message))

  writeMessage(input, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2024-11-05" }
  })
  writeMessage(input, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  })
  writeMessage(input, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "example.echo",
      arguments: { value: "kit-mcp" }
    }
  })

  await new Promise(resolve => setTimeout(resolve, 50))
  const toolResponse = responses.find(item => item.id === 3)
  process.stdout.write(JSON.stringify(toolResponse.result.structuredContent))
}

if (require.main === module) {
  run().catch(err => {
    process.stderr.write(String(err.stack || err.message || err))
    process.exit(1)
  })
}
