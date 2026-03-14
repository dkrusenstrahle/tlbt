# TLBT - Agent Toolbelt

TLBT is a lightweight CLI runtime for tools designed to be called by humans, scripts, and AI agents.

It provides a small, composable toolbelt of non-AI primitives that agents frequently need, such as:

- repository analysis
- documentation extraction
- web scraping primitives
- data transformation utilities

## Philosophy

- **Small tools**: each tool does one thing well.
- **Machine-friendly**: tools return JSON.
- **Schema-based**: each tool defines a JSON input schema.
- **Composable**: tools can be chained by scripts and agents.
- **Extensible**: new tools can be published as plugins.

## Project Structure

```text
tlbt/
  cli.js
  registry.js
  server.js
  plugins.js
  runtime.js
  tools/
    repo/
      map.js
    docs/
      headings.js
```

## Tool Format

Each tool exports:

- `name`
- `description`
- `input` (JSON schema)
- `run(input)` (async/sync function that returns JSON)

Example:

```js
module.exports = {
  name: "repo.map",
  description: "Map repository structure",
  input: {
    type: "object",
    properties: {
      path: { type: "string" }
    },
    required: ["path"]
  },
  async run({ path }) {
    return { path }
  }
}
```

## CLI Usage

```bash
tlbt tools
tlbt repo.map .
tlbt run repo.map '{"path":"."}'
tlbt install github
tlbt serve
```

## Tool Server

Start:

```bash
tlbt serve
```

Endpoints:

- `GET /tools`: list tools and schemas plus plugin load warnings
- `POST /run`: run a tool with JSON body

Example request body:

```json
{
  "tool": "repo.map",
  "input": { "path": "." }
}
```

## Plugins

Plugins are npm packages named `tlbt-tool-*`.

A plugin exports:

```js
module.exports = {
  tools: [
    {
      name: "example.echo",
      description: "Echo input",
      input: {
        type: "object",
        properties: { value: { type: "string" } },
        required: ["value"]
      },
      async run({ value }) {
        return { value }
      }
    }
  ]
}
```

TLBT auto-loads installed plugins from `node_modules`.

## Development

```bash
npm install
npm test
npm run coverage
```
