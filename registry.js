const fs = require("fs")
const path = require("path")

let cachedResult = null

function createRegistryResult() {
  return {
    tools: {},
    errors: []
  }
}

function registerTool(result, tool, source) {
  if (!tool || typeof tool !== "object") {
    result.errors.push({ source, error: "Invalid tool export (expected object)" })
    return
  }

  if (!tool.name || typeof tool.name !== "string") {
    result.errors.push({ source, error: "Tool is missing a valid name" })
    return
  }

  if (typeof tool.run !== "function") {
    result.errors.push({
      source,
      error: `Tool "${tool.name}" is missing a run(input) function`
    })
    return
  }

  if (result.tools[tool.name]) {
    result.errors.push({
      source,
      error: `Duplicate tool name "${tool.name}" ignored`
    })
    return
  }

  result.tools[tool.name] = tool
}

function safeRequire(modulePath, result, source) {
  try {
    return require(modulePath)
  } catch (err) {
    result.errors.push({
      source,
      error: err.message || "Failed to load module"
    })
    return null
  }
}

function loadLocalTools(result, baseDir) {
  const base = path.join(baseDir, "tools")
  if (!fs.existsSync(base)) return

  const categories = fs.readdirSync(base, { withFileTypes: true })

  for (const cat of categories) {
    if (!cat.isDirectory()) continue
    const categoryPath = path.join(base, cat.name)
    const files = fs.readdirSync(categoryPath, { withFileTypes: true })

    for (const file of files) {
      if (!file.isFile() || path.extname(file.name) !== ".js") continue
      const filePath = path.join(categoryPath, file.name)
      const tool = safeRequire(filePath, result, `local:${filePath}`)
      if (!tool) continue
      registerTool(result, tool, `local:${filePath}`)
    }
  }
}

function getPluginDirectories(nodeModulesPath) {
  const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true })
  const dirs = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    if (entry.name.startsWith("tlbt-tool-")) {
      dirs.push(path.join(nodeModulesPath, entry.name))
      continue
    }

    if (!entry.name.startsWith("@")) continue

    const scopePath = path.join(nodeModulesPath, entry.name)
    const scopedEntries = fs.readdirSync(scopePath, { withFileTypes: true })
    for (const scopedEntry of scopedEntries) {
      if (!scopedEntry.isDirectory()) continue
      if (!scopedEntry.name.startsWith("tlbt-tool-")) continue
      dirs.push(path.join(scopePath, scopedEntry.name))
    }
  }

  return dirs
}

function loadPluginTools(result, cwd) {
  const nodeModules = path.join(cwd, "node_modules")
  if (!fs.existsSync(nodeModules)) return

  const pluginDirs = getPluginDirectories(nodeModules)
  for (const pluginDir of pluginDirs) {
    const plugin = safeRequire(pluginDir, result, `plugin:${pluginDir}`)
    if (!plugin) continue

    if (!Array.isArray(plugin.tools)) {
      result.errors.push({
        source: `plugin:${pluginDir}`,
        error: "Plugin export is missing a tools array"
      })
      continue
    }

    for (const tool of plugin.tools) {
      registerTool(result, tool, `plugin:${pluginDir}`)
    }
  }
}

function loadTools(options = {}) {
  const useCache = options.useCache !== false
  if (useCache && cachedResult) return cachedResult

  const baseDir = options.baseDir || __dirname
  const cwd = options.cwd || process.cwd()
  const result = createRegistryResult()

  loadLocalTools(result, baseDir)
  loadPluginTools(result, cwd)

  if (useCache) cachedResult = result
  return result
}

function clearToolsCache() {
  cachedResult = null
}

module.exports = {
  loadTools,
  clearToolsCache
}