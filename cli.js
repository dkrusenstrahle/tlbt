#!/usr/bin/env node

const { loadTools } = require("./registry")
const { installPlugin } = require("./plugins")
const { getToolsMetadata, parseJsonInput, validateInput } = require("./runtime")
const { startServer } = require("./server")
const pkg = require("./package.json")

function showHelp() {
  return `
TLBT — Agent Toolbelt

Usage:
  tlbt tools
  tlbt <tool> [input]
  tlbt run <tool> <json>
  tlbt install <plugin>
  tlbt serve
  tlbt --version

Examples:
  tlbt repo.map .
  tlbt docs.headings README.md
  tlbt run repo.map '{"path":"."}'
`
}

function printJson(log, value) {
  log(JSON.stringify(value, null, 2))
}

function fail(log, error, details) {
  const payload = { error }
  if (details !== undefined) payload.details = details
  printJson(log, payload)
  return 1
}

async function main(argv, deps = {}) {
  const log = deps.log || console.log
  const loaded = deps.loaded || loadTools()
  const startServerFn = deps.startServer || startServer
  const installPluginFn = deps.installPlugin || installPlugin
  const tools = loaded.tools
  const loadErrors = loaded.errors
  const command = argv[0]

  if (!command || command === "help") {
    log(showHelp())
    return 0
  }

  if (command === "--version" || command === "-v") {
    printJson(log, { version: pkg.version })
    return 0
  }

  if (command === "tools") {
    printJson(log, {
      tools: getToolsMetadata(tools),
      loadErrors
    })
    return 0
  }

  if (command === "install") {
    const plugin = argv[1]
    if (!plugin) {
      return fail(log, "Please provide a plugin name")
    }

    const result = installPluginFn(plugin, deps.installOptions)
    if (!result.ok) {
      return fail(log, "Plugin install failed", result)
    }

    printJson(log, result)
    return 0
  }

  if (command === "serve") {
    startServerFn({
      loaded,
      host: deps.host,
      port: deps.port,
      attachSignalHandlers: deps.attachSignalHandlers
    })
    return 0
  }

  if (command === "run") {
    const toolName = argv[1]
    const inputJson = argv[2] || "{}"
    const tool = tools[toolName]

    if (!tool) {
      return fail(log, "Tool not found", { tool: toolName, loadErrors })
    }

    const parsed = parseJsonInput(inputJson)
    if (!parsed.ok) {
      return fail(log, parsed.error)
    }

    const validation = validateInput(tool.input, parsed.value)
    if (!validation.ok) {
      return fail(log, validation.error, { tool: toolName })
    }

    try {
      const result = await Promise.resolve(tool.run(parsed.value))
      printJson(log, result)
      return 0
    } catch (err) {
      return fail(log, err.message || String(err), { tool: toolName })
    }
  }

  /*
  Direct tool execution
  Example:
    tlbt repo.map .
    tlbt docs.headings README.md
  */
  const tool = tools[command]
  if (!tool) {
    return fail(log, "Unknown command or tool", { command, loadErrors })
  }

  const rawInput = argv[1]
  let input = {}
  if (rawInput) {
    if (rawInput.startsWith("{")) {
      const parsed = parseJsonInput(rawInput)
      if (!parsed.ok) {
        return fail(log, parsed.error)
      }
      input = parsed.value
    } else {
      input = {
        path: rawInput,
        file: rawInput
      }
    }
  }

  const validation = validateInput(tool.input, input)
  if (!validation.ok) {
    return fail(log, validation.error, { tool: command })
  }

  try {
    const result = await Promise.resolve(tool.run(input))
    printJson(log, result)
    return 0
  } catch (err) {
    return fail(log, err.message || String(err), { tool: command })
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).then(code => process.exit(code))
}

module.exports = {
  main,
  showHelp
}