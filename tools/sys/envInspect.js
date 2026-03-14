const os = require("os")
const { createTool, ok, normalizeLimit } = require("../../lib/tooling")

const DEFAULT_KEYS = ["HOME", "SHELL", "PATH", "NODE_ENV", "CI"]

module.exports = createTool({
  name: "sys.envInspect",
  description: "Inspect selected environment and runtime metadata",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      keys: { type: "array", items: { type: "string" } },
      maxKeys: { type: "number", minimum: 1, maximum: 200 }
    }
  },
  async run({ keys = DEFAULT_KEYS, maxKeys = 25 }) {
    const boundedKeys = normalizeLimit(maxKeys, 25, 1, 200, "maxKeys")
    const selectedKeys = keys.slice(0, boundedKeys)
    const env = {}
    selectedKeys.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(process.env, key)) {
        env[key] = process.env[key]
      }
    })

    return ok({
      env,
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        hostname: os.hostname(),
        cwd: process.cwd()
      }
    })
  }
})
