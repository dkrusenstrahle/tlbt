# Tool Spec Template

All built-in tools should follow this shape:

- Export `name`, `description`, `input`, and `run(input)`.
- Validate all public inputs through JSON schema in `input`.
- Return machine-friendly JSON with a consistent success envelope:
  - `{ ok: true, ...payload }`
- Enforce explicit guardrails in each tool:
  - max bytes for content reads
  - max items/matches for list outputs
  - hard timeouts for network and command execution

Recommended implementation pattern:

```js
const { createTool, ok, normalizeLimit } = require("../../lib/tooling")

module.exports = createTool({
  name: "category.toolName",
  description: "One-sentence behavior",
  input: {
    type: "object",
    additionalProperties: false,
    properties: {
      field: { type: "string" },
      limit: { type: "number", minimum: 1, maximum: 1000 }
    },
    required: ["field"]
  },
  async run({ field, limit = 100 }) {
    const bounded = normalizeLimit(limit, 100, 1, 1000, "limit")
    return ok({ field, bounded })
  }
})
```
