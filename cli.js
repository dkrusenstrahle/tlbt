#!/usr/bin/env node

const fs = require("fs")
const { loadTools } = require("./registry")
const { installPlugin } = require("./plugins")
const { getToolsMetadata, parseJsonInput } = require("./runtime")
const { startServer } = require("./server")
const { startMcpServer } = require("./lib/mcp-server")
const { createExecutor } = require("./lib/executor")
const { createPluginScaffold } = require("./lib/plugin-scaffold")
const { runPluginConformance } = require("./lib/plugin-conformance")
const { resolvePolicyPreset, mergePolicies } = require("./lib/policy")
const {
  ERROR_CODES,
  createInvocationId,
  successEnvelope,
  errorEnvelope
} = require("./lib/contracts")
const pkg = require("./package.json")

function showHelp() {
  return `
TLBT — Agent Toolbelt

Usage:
  tlbt tools
  tlbt <tool> [input]
  tlbt run <tool> <json>
  tlbt install <plugin>
  tlbt create plugin <name> [dir]
  tlbt plugin:test <path>
  tlbt serve
  tlbt mcp
  tlbt --version

Examples:
  tlbt repo.map .
  tlbt docs.headings README.md
  tlbt run repo.map '{"path":"."}'
  tlbt create plugin github
  tlbt plugin:test ./node_modules/tlbt-tool-github
`
}

function printJson(log, value) {
  log(JSON.stringify(value, null, 2))
}

function commandMeta(command) {
  return {
    invocationId: createInvocationId(),
    tool: command,
    transport: "cli",
    startedAt: new Date().toISOString(),
    durationMs: 0
  }
}

function fail(log, command, code, message, details) {
  const payload = errorEnvelope(code, message, details, commandMeta(command))
  printJson(log, payload)
  return 1
}

function loadPolicy(deps = {}) {
  const presetName = deps.policyPreset || process.env.TLBT_POLICY_PRESET
  const presetPolicy = resolvePolicyPreset(presetName) || {}
  const directPolicy = deps.policy || {}

  const policyFile = deps.policyFile || process.env.TLBT_POLICY_FILE
  if (!policyFile) {
    const mergedWithoutFile = mergePolicies(presetPolicy, directPolicy)
    return Object.keys(mergedWithoutFile).length > 0 ? mergedWithoutFile : null
  }
  const content = fs.readFileSync(policyFile, "utf8")
  const parsed = JSON.parse(content)
  const filePolicy = {
    ...parsed,
    workspaceRoot: parsed.workspaceRoot || process.cwd()
  }
  const merged = mergePolicies(mergePolicies(presetPolicy, filePolicy), directPolicy)
  return Object.keys(merged).length > 0 ? merged : null
}

function shouldEmitStructuredLogs(deps = {}) {
  if (deps.structuredLogging !== undefined) {
    return Boolean(deps.structuredLogging)
  }
  return process.env.TLBT_LOG_JSON === "1"
}

function createStructuredLogger(deps = {}) {
  if (!shouldEmitStructuredLogs(deps)) return null
  const eventLog = deps.eventLog || console.error
  return (event, payload) => {
    eventLog(
      JSON.stringify({
        event,
        ...payload
      })
    )
  }
}

async function main(argv, deps = {}) {
  const log = deps.log || console.log
  const loaded = deps.loaded || loadTools()
  const startServerFn = deps.startServer || startServer
  const startMcpServerFn = deps.startMcpServer || startMcpServer
  const installPluginFn = deps.installPlugin || installPlugin
  const tools = loaded.tools
  const loadErrors = loaded.errors
  const command = argv[0]
  let policy

  try {
    policy = loadPolicy(deps)
  } catch (err) {
    return fail(
      log,
      command || "policy",
      ERROR_CODES.invalidRequest,
      `Failed to load policy: ${err.message || String(err)}`
    )
  }
  const structuredLogger = createStructuredLogger(deps)

  if (!command || command === "help") {
    log(showHelp())
    return 0
  }

  if (command === "--version" || command === "-v") {
    printJson(log, successEnvelope({ version: pkg.version }, commandMeta(command)))
    return 0
  }

  if (command === "tools") {
    printJson(
      log,
      successEnvelope(
        {
          tools: getToolsMetadata(tools),
          loadErrors
        },
        commandMeta(command)
      )
    )
    return 0
  }

  if (command === "install") {
    const plugin = argv[1]
    if (!plugin) {
      return fail(
        log,
        command,
        ERROR_CODES.invalidRequest,
        "Please provide a plugin name"
      )
    }

    const result = installPluginFn(plugin, deps.installOptions)
    if (!result.ok) {
      return fail(
        log,
        command,
        ERROR_CODES.toolExecutionFailed,
        "Plugin install failed",
        result
      )
    }

    printJson(log, successEnvelope(result, commandMeta(command)))
    return 0
  }

  if (command === "create") {
    const entity = argv[1]
    if (entity !== "plugin") {
      return fail(log, command, ERROR_CODES.invalidRequest, "Only `tlbt create plugin` is supported")
    }

    const pluginName = argv[2]
    const targetDir = argv[3]
    try {
      const scaffold = createPluginScaffold({ name: pluginName, targetDir })
      printJson(log, successEnvelope(scaffold, commandMeta(command)))
      return 0
    } catch (err) {
      return fail(
        log,
        command,
        ERROR_CODES.invalidRequest,
        err.message || "Failed to create plugin scaffold"
      )
    }
  }

  if (command === "plugin:test") {
    const pluginPath = argv[1]
    const report = await runPluginConformance({ pluginPath })
    if (!report.ok) {
      printJson(
        log,
        errorEnvelope(
          ERROR_CODES.validationError,
          "Plugin conformance checks failed",
          report,
          commandMeta(command)
        )
      )
      return 1
    }
    printJson(log, successEnvelope(report, commandMeta(command)))
    return 0
  }

  if (command === "serve") {
    startServerFn({
      loaded,
      host: deps.host,
      port: deps.port,
      attachSignalHandlers: deps.attachSignalHandlers,
      policy,
      logger: structuredLogger
    })
    return 0
  }

  if (command === "mcp") {
    startMcpServerFn({
      loaded,
      policy,
      logger: structuredLogger,
      attachSignalHandlers: deps.attachSignalHandlers
    })
    return 0
  }

  const executor = createExecutor({
    tools,
    policy,
    transport: "cli",
    logger: structuredLogger,
    executionTimeoutMs: deps.executionTimeoutMs
  })

  if (command === "run") {
    const toolName = argv[1]
    const inputJson = argv[2] || "{}"

    const parsed = parseJsonInput(inputJson)
    if (!parsed.ok) {
      return fail(log, command, ERROR_CODES.invalidRequest, parsed.error)
    }

    const result = await executor.execute(toolName, parsed.value)
    if (!result.ok && result.error.code === ERROR_CODES.toolNotFound) {
      result.error.details = {
        ...(result.error.details || {}),
        loadErrors
      }
    }
    printJson(log, result)
    return result.ok ? 0 : 1
  }

  /*
  Direct tool execution
  Example:
    tlbt repo.map .
    tlbt docs.headings README.md
  */
  const rawInput = argv[1]
  let input = {}
  if (rawInput) {
    if (rawInput.startsWith("{")) {
      const parsed = parseJsonInput(rawInput)
      if (!parsed.ok) {
        return fail(log, command, ERROR_CODES.invalidRequest, parsed.error)
      }
      input = parsed.value
    } else {
      input = {
        path: rawInput,
        file: rawInput
      }
    }
  }

  const result = await executor.execute(command, input)
  if (!result.ok && result.error.code === ERROR_CODES.toolNotFound) {
    result.error.message = "Unknown command or tool"
    result.error.details = {
      command,
      loadErrors
    }
  }
  printJson(log, result)
  return result.ok ? 0 : 1
}

if (require.main === module) {
  main(process.argv.slice(2)).then(code => {
    process.exitCode = code
  })
}

module.exports = {
  main,
  showHelp
}