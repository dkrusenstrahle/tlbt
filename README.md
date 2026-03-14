# TLBT - Agent Toolbelt

TLBT is a lightweight CLI runtime for tools designed to be called by humans, scripts, and AI agents.

The runtime stays intentionally small and focuses on:
- tool discovery
- tool execution
- plugin loading

All tool behavior lives in tools.

## Why TLBT

TLBT provides small, composable non-AI primitives that agents frequently need:
- repository analysis
- documentation extraction
- web scraping primitives
- data transformation utilities

Core philosophy:
- **Small tools**: each tool does one thing well.
- **Machine-friendly**: tools return JSON.
- **Schema-based**: each tool declares JSON-schema input.
- **Composable**: tools chain well in scripts and agents.
- **Extensible**: plugin ecosystem via npm packages.

## Quick Start

```bash
npm install
node cli.js tools
node cli.js run repo.map '{"path":"."}'
node cli.js serve
```

When installed globally:

```bash
tlbt tools
tlbt run repo.map '{"path":"."}'
```

## Runtime Commands

```bash
tlbt tools
tlbt <tool> [input]
tlbt run <tool> <json>
tlbt install <plugin>
tlbt serve
tlbt --version
```

## Built-in Tools

- `repo.map`: maps repository structure with traversal controls.
- `docs.headings`: extracts Markdown headings with level and line number.

## Documentation

- [Quickstart](./docs/quickstart.md)
- [CLI Reference](./docs/cli.md)
- [HTTP API Reference](./docs/http-api.md)
- [Plugin Authoring](./docs/plugins.md)

## Tool Format

Each tool exports:
- `name`
- `description`
- `input` (JSON schema)
- `run(input)` (sync or async, returns JSON)

Example:

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
