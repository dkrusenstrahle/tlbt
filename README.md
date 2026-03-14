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
npm install @tlbt/cli -g
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

### Repo/Codebase

- `repo.map`: map repository structure with traversal controls.
- `repo.findFiles`: list files by include/exclude patterns.
- `repo.searchText`: search workspace text with match limits.
- `repo.readFile`: read file content with optional line ranges.
- `repo.writeFile`: write or create files in the workspace.
- `repo.patchFile`: apply string-based file patches with dry-run support.
- `repo.listSymbols`: extract likely symbols from source files.

### Docs/Knowledge

- `docs.headings`: extract markdown headings with level and line number.
- `docs.extractLinks`: collect markdown links with context.
- `docs.summarizeMarkdown`: summarize markdown by heading sections.
- `docs.diffHeadings`: compare heading structures across two files.
- `docs.frontmatter`: parse and validate markdown frontmatter fields.

### Web/Research

- `web.fetch`: fetch URL content with timeout and max-byte guardrails.
- `web.extractText`: extract readable text from HTML or URL input.
- `web.extractMetadata`: extract title/description/canonical/OpenGraph metadata.
- `web.checkStatus`: inspect status code, headers, and redirect behavior.

### Data/Transform

- `data.jsonQuery`: query nested JSON by path expressions.
- `data.csvToJson`: convert CSV (inline or file) into JSON rows.
- `data.jsonSchemaValidate`: validate JSON payloads against a schema.

### System/Ops

- `sys.exec`: run allowlisted commands with strict timeout/output caps.
- `sys.processList`: inspect running processes with optional filtering.
- `sys.envInspect`: expose selected environment and runtime metadata.

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
