# CLI Reference

## Command summary

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

## `tlbt tools`

Returns metadata for all loaded tools and plugin load warnings.

Example:

```bash
tlbt tools
```

Response shape:

```json
{
  "ok": true,
  "data": {
    "tools": {
      "repo.map": {
        "description": "Map repository structure",
        "input": { "type": "object" }
      }
    }
  }
}
```

## `tlbt run <tool> <json>`

Executes a tool with explicit JSON input.

Example:

```bash
tlbt run repo.map '{"path":".","maxDepth":1}'
tlbt run repo.searchText '{"path":".","query":"TODO","maxMatches":20}'
tlbt run web.fetch '{"url":"https://example.com"}'
```

## `tlbt <tool> [input]`

Direct execution shorthand:
- if input starts with `{`, it is parsed as JSON
- otherwise, TLBT maps positional input to both `path` and `file`

Examples:

```bash
tlbt repo.map .
tlbt docs.headings README.md
```

## Tool output shape

All tool execution paths return a shared transport envelope:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "invocationId": "uuid",
    "tool": "repo.map",
    "transport": "cli",
    "startedAt": "2026-01-01T00:00:00.000Z",
    "durationMs": 12
  }
}
```

Tool-specific fields are included in `data`.

## `tlbt install <plugin>`

Installs a plugin package named `tlbt-tool-<plugin>`.

Example:

```bash
tlbt install github
```

Result:

```json
{
  "ok": true,
  "data": {
    "ok": true,
    "plugin": "tlbt-tool-github"
  }
}
```

## `tlbt create plugin <name> [dir]`

Creates a plugin scaffold including implementation, tests, and README.

Example:

```bash
tlbt create plugin github ./plugins/tlbt-tool-github
```

## `tlbt plugin:test <path>`

Runs plugin conformance checks against a plugin entry path.

Example:

```bash
tlbt plugin:test ./plugins/tlbt-tool-github
```

## `tlbt serve`

Starts local HTTP tool server.

Environment:
- `HOST` (default: `127.0.0.1`)
- `PORT` (default: `8787`)

## `tlbt mcp`

Starts an MCP stdio server using the same tool registry and execution contract.

Use this mode when integrating TLBT with MCP-compatible agent runtimes.

## Policy and structured logs

Optional environment variables:

- `TLBT_POLICY_FILE`: path to a JSON policy file
- `TLBT_POLICY_PRESET`: one of `dev`, `balanced`, `strict`
- `TLBT_LOG_JSON=1`: emit structured invocation logs to stderr

## Error format

Command and tool errors are returned with stable codes:

```json
{
  "ok": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Tool not found",
    "details": { "tool": "missing.tool" }
  },
  "meta": {
    "invocationId": "uuid"
  }
}
```
