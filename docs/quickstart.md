# TLBT Quickstart

This guide gets you from install to first successful tool calls.

## Prerequisites

- Node.js 18+
- npm

## Install

From source:

```bash
npm install
```

Run via node:

```bash
node cli.js tools
```

Optional global install:

```bash
npm install -g .
tlbt tools
```

## First commands

List available tools:

```bash
tlbt tools
```

Run a tool with shorthand positional input:

```bash
tlbt repo.map .
```

Run a tool with explicit JSON:

```bash
tlbt run repo.map '{"path":".","maxDepth":2}'
```

Extract document headings:

```bash
tlbt run docs.headings '{"file":"README.md"}'
```

Find files and search text:

```bash
tlbt run repo.findFiles '{"path":".","include":["*.md"],"maxDepth":3}'
tlbt run repo.searchText '{"path":".","query":"tool","maxMatches":10}'
```

Use web/data/system tools:

```bash
tlbt run web.checkStatus '{"url":"https://example.com"}'
tlbt run data.csvToJson '{"file":"tests/fixtures/data/sample.csv"}'
tlbt run sys.envInspect '{"keys":["SHELL","PATH"]}'
```

## Start the HTTP server

```bash
tlbt serve
```

By default this listens on `127.0.0.1:8787`.

Override host and port:

```bash
HOST=0.0.0.0 PORT=3000 tlbt serve
```

## Start MCP mode

```bash
tlbt mcp
```

This starts an MCP stdio server for agent runtimes that speak MCP.

## Validate output

TLBT commands return JSON. Pipe to jq if needed:

```bash
tlbt run repo.map '{"path":"."}' | jq
```

All transports (CLI, HTTP, MCP) return the same result envelope with `ok`, `data` or `error`, and `meta`.
