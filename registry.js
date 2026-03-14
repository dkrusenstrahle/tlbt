const fs = require("fs")
const path = require("path")

function loadLocalTools(tools) {
  const base = path.join(__dirname, "tools")

  const categories = fs.readdirSync(base)

  for (const cat of categories) {
    const files = fs.readdirSync(path.join(base, cat))

    for (const file of files) {
      const tool = require(`./tools/${cat}/${file}`)
      tools[tool.name] = tool
    }
  }
}

function loadPluginTools(tools) {
  const nodeModules = path.join(process.cwd(), "node_modules")

  if (!fs.existsSync(nodeModules)) return

  const packages = fs.readdirSync(nodeModules)

  for (const pkg of packages) {
    if (pkg.startsWith("tlbt-tool-")) {
      const plugin = require(path.join(nodeModules, pkg))

      if (plugin.tools) {
        for (const tool of plugin.tools) {
          tools[tool.name] = tool
        }
      }
    }
  }
}

function loadTools() {
  const tools = {}

  loadLocalTools(tools)
  loadPluginTools(tools)

  return tools
}

module.exports = { loadTools }