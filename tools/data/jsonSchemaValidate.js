const Ajv = require("ajv")
const { createTool, ok } = require("../../lib/tooling")

const ajv = new Ajv({ allErrors: true, strict: false })

module.exports = createTool({
  name: "data.jsonSchemaValidate",
  description: "Validate JSON data against provided JSON schema",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      schema: { type: "object" },
      data: {}
    },
    required: ["schema", "data"]
  },
  async run({ schema, data }) {
    const validate = ajv.compile(schema)
    const valid = validate(data)
    const errors = (validate.errors || []).map(entry => ({
      path: entry.instancePath || "/",
      message: entry.message || "invalid"
    }))

    return ok({
      valid: Boolean(valid),
      errors
    })
  }
})
