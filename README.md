# TLBT - Toolbelt for Agent Builders

TLBT helps you ship agent tooling that is reliable, composable, and easy to extend.

![Interop Gate](https://img.shields.io/badge/interop-gated-blue)
![MCP Compatibility](https://img.shields.io/badge/mcp-compatible-green)
![Extension DX](https://img.shields.io/badge/extensions-scaffolded-purple)

Build once, run everywhere:

- as a CLI for humans and scripts
- as an HTTP service for workflows and apps
- as an MCP server for agent frameworks

All transports share one execution contract, so behavior stays predictable.

## Why teams pick TLBT

- **Interoperable by default**: same tools over CLI, HTTP, and MCP.
- **Built for automation**: JSON-first outputs, schema-validated inputs.
- **Extension-friendly**: scaffold plugins in minutes, validate with conformance checks.
- **Production-minded**: policy guardrails, stable error codes, structured metadata.

## Start in 60 seconds

From source:

```bash
npm install
node cli.js tools
node cli.js run repo.map '{"path":"."}'
node cli.js serve
node cli.js mcp
```

Global install:

```bash
npm install -g @tlbt/cli
tlbt tools
tlbt run repo.map '{"path":"."}'
```

Local install tip (without global install):

```bash
npx tlbt tools
```

## Core commands

```bash
tlbt tools
tlbt <tool> [input]
tlbt run <tool> <json>
tlbt install <plugin>
tlbt create plugin <name> [dir]
tlbt plugin:test <path>
tlbt serve
tlbt mcp
tlbt --version
```

## Interoperability

TLBT supports three transports with one contract:

- CLI (`tlbt run ...`)
- HTTP (`tlbt serve` then `POST /run`)
- MCP stdio (`tlbt mcp`)

| Capability | CLI | HTTP | MCP |
|---|---|---|---|
| list tools | `tlbt tools` | `GET /tools` | `tools/list` |
| run tool | `tlbt run` or `tlbt <tool>` | `POST /run` | `tools/call` |
| same envelope shape | yes | yes | yes |
| stable error codes | yes | yes | yes |

Canonical contract: [Tool Contract v1](./docs/spec-tool-contract.md)

## Build your own plugin quickly

Create a plugin scaffold with implementation, tests, and docs:

```bash
tlbt create plugin github ./plugins/tlbt-tool-github
```

Validate compatibility:

```bash
tlbt plugin:test ./plugins/tlbt-tool-github
```

Every scaffold includes:

- `index.js` sample tool
- `tests/plugin.spec.js` run-path + schema checks
- `README.md` with usage examples

## Safety and trust

Use policy guardrails without changing plugin code:

- `TLBT_POLICY_FILE=/path/to/policy.json`
- `TLBT_POLICY_PRESET=dev|balanced|strict`
- `TLBT_LOG_JSON=1` for structured logs

Preset behavior:

- `dev`: no path enforcement, no denylist
- `balanced`: enforce workspace path boundaries
- `strict`: enforce workspace paths and block `sys.*` by default

Example policy:

```json
{
  "denyToolPrefixes": ["sys."],
  "enforceWorkspacePaths": true,
  "workspaceRoot": "."
}
```

Reliability report:

```bash
npm run reliability:metrics
```

## Built-in tool families

- **Repo/Codebase**: mapping, search, read/write, patch, symbols.
- **Docs/Knowledge**: headings, links, summaries, frontmatter.
- **Web/Research**: fetch, extract text, metadata, status.
- **Data/Transform**: JSON query, CSV to JSON, schema validation.
- **System/Ops**: guarded exec, process inspection, env inspection.

## Documentation map

- Getting started:
  - [Quickstart](./docs/quickstart.md)
- Framework builders:
  - [Framework Integration Guide](./docs/framework-integration.md)
  - [Transport Compatibility](./docs/transport-compatibility.md)
- References:
  - [CLI Reference](./docs/cli.md)
  - [HTTP API Reference](./docs/http-api.md)
  - [Plugin Authoring](./docs/plugins.md)
  - [Tool Contract v1](./docs/spec-tool-contract.md)

## Minimal tool format

Each tool exports:

- `name`
- `description`
- `input` (JSON Schema)
- `run(input)` (sync or async, returns JSON-compatible data)

```js
module.exports = {
  name: "repo.map",
  description: "Map repository structure",
  input: {
    type: "object",
    properties: { path: { type: "string" } },
    required: ["path"]
  },
  async run({ path }) {
    return { path }
  }
}
```

## Development

```bash
npm install
npm test
npm run coverage
```
