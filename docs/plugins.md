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

Plugin authors do not need to implement transport-specific logic. The same tool works across:

- CLI (`tlbt run`)
- HTTP (`POST /run`)
- MCP (`tools/call`)

TLBT wraps tool results in a transport envelope (`ok`, `data` or `error`, `meta`) at runtime.

## Scaffold a new plugin

Generate a plugin with implementation, tests, and docs:

```bash
tlbt create plugin github ./plugins/tlbt-tool-github
```

Generated scaffold includes:

- `index.js` with one sample tool
- `tests/plugin.spec.js` with run-path and schema checks
- `README.md` with usage and conformance guidance

## Typed SDK

TLBT ships a lightweight typed SDK entrypoint:

- `@tlbt/cli/lib/plugin-sdk`
- type declarations: `@tlbt/cli/lib/plugin-sdk.d.ts`

Example:

```js
const { definePlugin, defineTool } = require("@tlbt/cli/lib/plugin-sdk")
```

## Plugin conformance checks

Validate plugin contract compatibility:

```bash
tlbt plugin:test ./plugins/tlbt-tool-github
```

Checks include:

- required tool shape fields
- schema compile validity
- optional sample run and JSON serializability checks

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
