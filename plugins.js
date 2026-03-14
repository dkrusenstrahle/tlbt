const { spawnSync } = require("child_process")

const SAFE_PLUGIN_NAME = /^[a-z0-9-]+$/

function installPlugin(name, options = {}) {
  if (!SAFE_PLUGIN_NAME.test(name || "")) {
    return {
      ok: false,
      error: "Plugin name must contain only lowercase letters, numbers, and dashes"
    }
  }

  const pkg = `tlbt-tool-${name}`
  const commandRunner = options.commandRunner || spawnSync

  const result = commandRunner("npm", ["install", pkg], {
    stdio: "inherit",
    shell: false
  })

  if (result.error || result.status !== 0) {
    return {
      ok: false,
      plugin: pkg,
      error: (result.error && result.error.message) || "Failed to install plugin"
    }
  }

  return { ok: true, plugin: pkg }
}

module.exports = { installPlugin }