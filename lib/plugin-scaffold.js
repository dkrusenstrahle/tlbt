const fs = require("fs")
const path = require("path")

function normalizePluginName(rawName) {
  if (!rawName || typeof rawName !== "string") {
    throw new Error("Plugin name is required")
  }
  const cleaned = rawName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
  if (!cleaned) {
    throw new Error("Plugin name must contain at least one alphanumeric character")
  }
  return cleaned.startsWith("tlbt-tool-") ? cleaned : `tlbt-tool-${cleaned}`
}

function ensureDirectory(targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
    return
  }
  const entries = fs.readdirSync(targetDir)
  if (entries.length > 0) {
    throw new Error(`Target directory already exists and is not empty: ${targetDir}`)
  }
}

function writeFile(targetDir, relativePath, content) {
  const absolutePath = path.join(targetDir, relativePath)
  fs.writeFileSync(absolutePath, content, "utf8")
}

function createPluginScaffold(options = {}) {
  const pluginName = normalizePluginName(options.name)
  const targetDir = path.resolve(options.targetDir || path.join(process.cwd(), pluginName))
  const shortName = pluginName.replace(/^tlbt-tool-/, "")
  const toolName = `${shortName}.echo`

  ensureDirectory(targetDir)

  writeFile(
    targetDir,
    "package.json",
    JSON.stringify(
      {
        name: pluginName,
        version: "0.1.0",
        description: `TLBT plugin ${pluginName}`,
        main: "index.js",
        scripts: {
          test: "node --test tests/plugin.spec.js"
        },
        keywords: ["tlbt", "plugin"],
        license: "MIT"
      },
      null,
      2
    )
  )

  writeFile(
    targetDir,
    "index.js",
    `const { definePlugin, defineTool } = require("@tlbt/cli/lib/plugin-sdk")

module.exports = definePlugin({
  tools: [
    defineTool({
      name: "${toolName}",
      description: "Echo input value",
      input: {
        type: "object",
        properties: {
          value: { type: "string" }
        },
        required: ["value"]
      },
      async run({ value }) {
        return { value }
      }
    })
  ]
})
`
  )

  fs.mkdirSync(path.join(targetDir, "tests"), { recursive: true })
  writeFile(
    targetDir,
    "tests/plugin.spec.js",
    `const test = require("node:test")
const assert = require("node:assert/strict")
const plugin = require("../index.js")

test("plugin exports tools", async () => {
  assert.ok(Array.isArray(plugin.tools))
  assert.equal(plugin.tools.length, 1)
})

test("tool run path works", async () => {
  const result = await plugin.tools[0].run({ value: "hello" })
  assert.deepEqual(result, { value: "hello" })
})

test("schema has required field", () => {
  const schema = plugin.tools[0].input
  assert.ok(Array.isArray(schema.required))
  assert.ok(schema.required.includes("value"))
})
`
  )

  writeFile(
    targetDir,
    "README.md",
    `# ${pluginName}

Generated TLBT plugin scaffold.

## Run tests

\`\`\`bash
npm test
\`\`\`

## Validate plugin contract from TLBT

\`\`\`bash
tlbt plugin:test ${targetDir}
\`\`\`

## Example invocation

\`\`\`bash
tlbt run ${toolName} '{"value":"hello"}'
\`\`\`
`
  )

  return {
    ok: true,
    pluginName,
    targetDir,
    createdFiles: ["package.json", "index.js", "README.md", "tests/plugin.spec.js"]
  }
}

module.exports = {
  createPluginScaffold,
  normalizePluginName
}
