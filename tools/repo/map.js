const fs = require("fs")
const pathModule = require("path")

function shouldExclude(name, includeHidden, excludes) {
  if (!includeHidden && name.startsWith(".")) return true
  return excludes.includes(name)
}

function walk(rootPath, currentPath, depth, options, entries, state) {
  if (state.truncated) return
  const { maxDepth, includeHidden, excludes, maxEntries } = options
  if (depth > maxDepth) return

  const items = fs.readdirSync(currentPath, { withFileTypes: true })
  items.sort((a, b) => a.name.localeCompare(b.name))

  for (const item of items) {
    if (state.truncated) return
    if (shouldExclude(item.name, includeHidden, excludes)) continue

    const absolutePath = pathModule.join(currentPath, item.name)
    const relativePath = pathModule.relative(rootPath, absolutePath) || "."

    entries.push({
      path: relativePath,
      type: item.isDirectory() ? "directory" : "file"
    })

    if (entries.length >= maxEntries) {
      state.truncated = true
      return
    }

    if (item.isDirectory()) {
      walk(rootPath, absolutePath, depth + 1, options, entries, state)
    }
  }
}

module.exports = {
  name: "repo.map",

  description: "Map repository structure",

  input: {
    type: "object",
    properties: {
      path: {
        type: "string"
      },
      maxDepth: {
        type: "number",
        minimum: 1
      },
      includeHidden: {
        type: "boolean"
      },
      excludes: {
        type: "array",
        items: {
          type: "string"
        }
      },
      maxEntries: {
        type: "number",
        minimum: 1
      }
    },
    required: ["path"]
  },

  async run({
    path,
    maxDepth = 3,
    includeHidden = false,
    excludes = [".git", "node_modules"],
    maxEntries = 2000
  }) {
    const rootPath = pathModule.resolve(path)

    if (!fs.existsSync(rootPath)) {
      throw new Error(`Path does not exist: ${path}`)
    }

    const stat = fs.statSync(rootPath)
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${path}`)
    }

    const entries = []
    const state = { truncated: false }
    walk(
      rootPath,
      rootPath,
      1,
      { maxDepth, includeHidden, excludes, maxEntries },
      entries,
      state
    )

    return {
      root: rootPath,
      count: entries.length,
      entries,
      truncated: state.truncated,
      maxEntries
    }
  }
}