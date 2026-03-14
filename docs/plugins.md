# Plugin Authoring Guide

Plugins let TLBT load additional tools from npm.

## Package naming

Plugin packages must be named:

- `tlbt-tool-*`

Examples:
- `tlbt-tool-github`
- `tlbt-tool-postgres`

## Plugin export format

A plugin must export an object with a `tools` array:

```js
module.exports = {
  tools: [
    {
      name: "example.echo",
      description: "Echo back value",
      input: {
        type: "object",
        properties: {
          value: { type: "string" }
        },
        required: ["value"]
      },
      async run({ value }) {
        return { value }
      }
    }
  ]
}
```

## Tool contract requirements

Each tool should provide:
- `name` (string, unique)
- `description` (string)
- `input` (JSON schema object)
- `run(input)` function returning JSON-compatible data

## Install and test

Install plugin into TLBT project:

```bash
tlbt install github
```

Then verify:

```bash
tlbt tools
```

## Best practices

- Keep tools focused and composable.
- Validate input through schema definitions.
- Return structured JSON only.
- Keep runtime dependencies lightweight.
- Prefer deterministic outputs for repeatable automation.
