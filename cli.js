#!/usr/bin/env node

const { loadTools } = require("./registry")
const { installPlugin } = require("./plugins")

const tools = loadTools()

const [, , command, arg1, arg2] = process.argv

if (!command) {
  console.log("TLBT — Agent Toolbelt\n")
  console.log("Commands:")
  console.log("  tlbt tools")
  console.log("  tlbt run <tool> <json>")
  console.log("  tlbt serve")
  console.log("  tlbt install <plugin>\n")
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

if (command === "run") {
  const tool = tools[arg1]

  if (!tool) {
    console.error("Tool not found:", arg1)
    process.exit(1)
  }

  const input = arg2 ? JSON.parse(arg2) : {}

  Promise.resolve(tool.run(input))
    .then(result => {
      console.log(JSON.stringify(result, null, 2))
    })
    .catch(err => console.error(err))

  return
}

if (command === "serve") {
  require("./server")
  return
}

if (command === "install") {
  installPlugin(arg1)
}