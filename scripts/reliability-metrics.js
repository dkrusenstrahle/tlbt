const { spawnSync } = require("child_process")

function runCommand(command, args) {
  const startedAt = Date.now()
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe"
  })
  return {
    command: [command, ...args].join(" "),
    exitCode: result.status === null ? 1 : result.status,
    durationMs: Date.now() - startedAt,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  }
}

function parsePlaywrightSummary(output) {
  const lines = output.split("\n")
  const passedLine = lines.find(line => line.includes(" passed "))
  const failedLine = lines.find(line => line.includes(" failed"))
  return {
    passedSummary: passedLine || null,
    failedSummary: failedLine || null
  }
}

function main() {
  const checks = [
    runCommand("npm", ["run", "test:interop"]),
    runCommand("npm", ["run", "test:framework-kits"])
  ]
  const success = checks.every(check => check.exitCode === 0)

  const report = {
    ok: success,
    generatedAt: new Date().toISOString(),
    checks: checks.map(item => ({
      command: item.command,
      exitCode: item.exitCode,
      durationMs: item.durationMs,
      summary: parsePlaywrightSummary(`${item.stdout}\n${item.stderr}`)
    }))
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  process.exitCode = success ? 0 : 1
}

if (require.main === module) {
  main()
}
