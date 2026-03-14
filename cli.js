#!/usr/bin/env node

const { loadTools } = require("./registry")
const { installPlugin } = require("./plugins")
const pkg = require("./package.json")

const tools = loadTools()
const args = process.argv.slice(2)
const command = args[0]

function showHelp() {
  console.log(`
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
`)
}

if (!command || command === "help") {
  showHelp()
  process.exit(0)
}

if (command === "--version" || command === "-v") {
  console.log(pkg.version)
  process.exit(0)
}

if (command === "tools") {
  const output = {}

  for (const name in tools) {
    output[name] = {
      description: tools[name].description,
      input: tools[name].input
    }
  }

  console.log(JSON.stringify(output, null, 2))
  process.exit(0)
}

if (command === "install") {
  const plugin = args[1]

  if (!plugin) {
    console.error("Please provide a plugin name")
    process.exit(1)
  }

  installPlugin(plugin)
  return
}

if (command === "serve") {
  require("./server")
  return
}

if (command === "run") {
  const toolName = args[1]
  const inputJson = args[2] || "{}"

  const tool = tools[toolName]

  if (!tool) {
    console.error("Tool not found:", toolName)
    process.exit(1)
  }

  const input = JSON.parse(inputJson)

  Promise.resolve(tool.run(input))
    .then(result => {
      console.log(JSON.stringify(result, null, 2))
    })
    .catch(err => console.error(err))

  return
}

/*
Direct tool execution
Example:
  tlbt repo.map .
  tlbt docs.headings README.md
*/

const tool = tools[command]

if (!tool) {
  console.error("Unknown command or tool:", command)
  process.exit(1)
}

const rawInput = args[1]
let input = {}

if (rawInput) {
  if (rawInput.startsWith("{")) {
    input = JSON.parse(rawInput)
  } else {
    input = {
      path: rawInput,
      file: rawInput
    }
  }
}

Promise.resolve(tool.run(input))
  .then(result => {
    console.log(JSON.stringify(result, null, 2))
  })
  .catch(err => console.error(err))