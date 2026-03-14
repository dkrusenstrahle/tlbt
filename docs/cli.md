# CLI Reference

## Command summary

```bash
tlbt tools
tlbt <tool> [input]
tlbt run <tool> <json>
tlbt install <plugin>
tlbt serve
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
  "tools": {
    "repo.map": {
      "description": "Map repository structure",
      "input": { "type": "object" }
    }
  },
  "loadErrors": []
}
```

## `tlbt run <tool> <json>`

Executes a tool with explicit JSON input.

Example:

```bash
tlbt run repo.map '{"path":".","maxDepth":1}'
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

## `tlbt install <plugin>`

Installs a plugin package named `tlbt-tool-<plugin>`.

Example:

```bash
tlbt install github
```

Result:

```json
{ "ok": true, "plugin": "tlbt-tool-github" }
```

## `tlbt serve`

Starts local HTTP tool server.

Environment:
- `HOST` (default: `127.0.0.1`)
- `PORT` (default: `8787`)

## Error format

Command errors are returned as JSON:

```json
{
  "error": "Tool not found",
  "details": { "tool": "missing.tool" }
}
```
