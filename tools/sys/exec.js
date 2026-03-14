const { spawn } = require("child_process")
const { createTool, ok, normalizeLimit, resolveWorkspacePath } = require("../../lib/tooling")

const DEFAULT_ALLOWLIST = ["node", "npm", "npx", "git", "ls", "pwd", "echo"]

module.exports = createTool({
  name: "sys.exec",
  description: "Execute an allowlisted system command with timeout",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      command: { type: "string" },
      args: { type: "array", items: { type: "string" } },
      cwd: { type: "string" },
      timeoutMs: { type: "number", minimum: 100, maximum: 120000 },
      maxOutputBytes: { type: "number", minimum: 1, maximum: 5000000 },
      allowlist: { type: "array", items: { type: "string" } }
    },
    required: ["command"]
  },
  async run({
    command,
    args = [],
    cwd = ".",
    timeoutMs = 5000,
    maxOutputBytes = 200000,
    allowlist = DEFAULT_ALLOWLIST
  }) {
    if (!allowlist.includes(command)) {
      throw new Error(`Command is not allowlisted: ${command}`)
    }
    const boundedTimeout = normalizeLimit(timeoutMs, 5000, 100, 120000, "timeoutMs")
    const boundedOutput = normalizeLimit(maxOutputBytes, 200000, 1, 5000000, "maxOutputBytes")
    const workingDir = resolveWorkspacePath(cwd).absolutePath

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd: workingDir })
      let stdout = ""
      let stderr = ""
      let timedOut = false
      let outputTruncated = false

      const timer = setTimeout(() => {
        timedOut = true
        child.kill("SIGTERM")
      }, boundedTimeout)

      child.stdout.on("data", chunk => {
        if (stdout.length >= boundedOutput) {
          outputTruncated = true
          return
        }
        stdout += String(chunk).slice(0, boundedOutput - stdout.length)
      })
      child.stderr.on("data", chunk => {
        if (stderr.length >= boundedOutput) {
          outputTruncated = true
          return
        }
        stderr += String(chunk).slice(0, boundedOutput - stderr.length)
      })
      child.on("error", err => {
        clearTimeout(timer)
        reject(err)
      })
      child.on("close", code => {
        clearTimeout(timer)
        resolve(ok({
          command,
          args,
          cwd: workingDir,
          code,
          timedOut,
          outputTruncated,
          stdout,
          stderr
        }))
      })
    })
  }
})
