const Ajv = require("ajv")

const ajv = new Ajv({
  allErrors: true,
  strict: false
})
const compiledSchemas = new WeakMap()

function getToolsMetadata(tools) {
  const output = {}

  for (const name in tools) {
    output[name] = {
      description: tools[name].description,
      input: tools[name].input
    }
  }

  return output
}

function parseJsonInput(value) {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: {} }
  }

  if (typeof value !== "string") {
    return { ok: false, error: "Input JSON must be a string" }
  }

  try {
    return { ok: true, value: JSON.parse(value) }
  } catch (err) {
    return { ok: false, error: `Invalid JSON input: ${err.message}` }
  }
}

function validateInput(schema, input) {
  if (!schema) {
    return { ok: true }
  }

  let validate = compiledSchemas.get(schema)
  if (!validate) {
    validate = ajv.compile(schema)
    compiledSchemas.set(schema, validate)
  }

  const payload = input === undefined ? {} : input
  const valid = validate(payload)
  if (valid) {
    return { ok: true }
  }

  const [firstError] = validate.errors || []
  if (!firstError) {
    return { ok: false, error: "Invalid input payload" }
  }

  const atPath = firstError.instancePath || "/"
  return {
    ok: false,
    error: `${firstError.message} at ${atPath}`
  }
}

module.exports = {
  getToolsMetadata,
  parseJsonInput,
  validateInput
}
