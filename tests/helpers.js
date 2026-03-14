const path = require("path")
const { spawn } = require("child_process")

const rootDir = path.resolve(__dirname, "..")
const cliPath = path.join(rootDir, "cli.js")

function runNode(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: options.cwd || rootDir,
      env: { ...process.env, ...(options.env || {}) }
    })

    let stdout = ""
    let stderr = ""
    child.stdout.on("data", data => {
      stdout += String(data)
    })
    child.stderr.on("data", data => {
      stderr += String(data)
    })
    child.on("error", reject)
    child.on("close", code => {
      resolve({ code, stdout, stderr })
    })
  })
}

function runCli(args, options = {}) {
  return runNode([cliPath, ...args], options)
}

function parseJson(stdout) {
  return JSON.parse(stdout.trim())
}

module.exports = {
  rootDir,
  cliPath,
  runCli,
  runNode,
  parseJson
}
