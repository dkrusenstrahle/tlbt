const path = require("path")
const Ajv = require("ajv")

const ajv = new Ajv({ allErrors: true, strict: false })

function isJsonSerializable(value) {
  try {
    JSON.stringify(value)
    return true
  } catch (err) {
    return false
  }
}

async function runPluginConformance(options = {}) {
  const cwd = options.cwd || process.cwd()
  const pluginPath = options.pluginPath
  if (!pluginPath || typeof pluginPath !== "string") {
    return {
      ok: false,
      errors: ["Plugin path is required"]
    }
  }

  const resolvedPath = path.resolve(cwd, pluginPath)
  let plugin
  try {
    plugin = require(resolvedPath)
  } catch (err) {
    return {
      ok: false,
      pluginPath: resolvedPath,
      errors: [`Failed to load plugin: ${err.message || String(err)}`]
    }
  }

  const errors = []
  if (!plugin || !Array.isArray(plugin.tools)) {
    errors.push("Plugin export must include a tools array")
    return {
      ok: false,
      pluginPath: resolvedPath,
      errors
    }
  }

  const report = []
  for (const tool of plugin.tools) {
    const row = {
      name: tool && tool.name ? tool.name : null,
      checks: {
        name: false,
        description: false,
        inputSchema: false,
        runFunction: false,
        schemaCompiles: false,
        sampleRun: "skipped",
        jsonSerializableResult: "skipped"
      }
    }

    row.checks.name = Boolean(tool && typeof tool.name === "string" && tool.name.length > 0)
    if (!row.checks.name) errors.push("Tool is missing a valid name")

    row.checks.description = Boolean(
      tool && typeof tool.description === "string" && tool.description.length > 0
    )
    if (!row.checks.description) errors.push(`Tool "${tool && tool.name ? tool.name : "unknown"}" missing description`)

    row.checks.inputSchema = Boolean(tool && tool.input && typeof tool.input === "object")
    if (!row.checks.inputSchema) errors.push(`Tool "${tool && tool.name ? tool.name : "unknown"}" missing input schema`)

    row.checks.runFunction = Boolean(tool && typeof tool.run === "function")
    if (!row.checks.runFunction) errors.push(`Tool "${tool && tool.name ? tool.name : "unknown"}" missing run(input)`)

    let validate
    if (row.checks.inputSchema) {
      try {
        validate = ajv.compile(tool.input)
        row.checks.schemaCompiles = true
      } catch (err) {
        errors.push(`Tool "${tool.name}" has invalid schema: ${err.message || String(err)}`)
      }
    }

    const required = Array.isArray(tool && tool.input && tool.input.required) ? tool.input.required : []
    const hasSampleInput = required.length === 0 && row.checks.runFunction
    if (hasSampleInput) {
      try {
        const output = await Promise.resolve(tool.run({}))
        row.checks.sampleRun = true
        row.checks.jsonSerializableResult = isJsonSerializable(output)
        if (!row.checks.jsonSerializableResult) {
          errors.push(`Tool "${tool.name}" run({}) returned non-serializable data`)
        }
      } catch (err) {
        row.checks.sampleRun = false
        errors.push(`Tool "${tool.name}" run({}) failed: ${err.message || String(err)}`)
      }
    }

    if (validate && required.length === 0) {
      const valid = validate({})
      if (!valid) {
        errors.push(`Tool "${tool.name}" schema rejects empty object despite no required fields`)
      }
    }

    report.push(row)
  }

  return {
    ok: errors.length === 0,
    pluginPath: resolvedPath,
    toolCount: plugin.tools.length,
    checks: report,
    errors
  }
}

module.exports = {
  runPluginConformance
}
