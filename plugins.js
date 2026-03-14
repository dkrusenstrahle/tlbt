const { execSync } = require("child_process")

function installPlugin(name) {
  const pkg = `tlbt-tool-${name}`

  console.log("Installing", pkg)

  try {
    execSync(`npm install ${pkg}`, { stdio: "inherit" })
  } catch (err) {
    console.error("Failed to install plugin")
  }
}

module.exports = { installPlugin }