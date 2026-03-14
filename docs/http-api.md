# HTTP API Reference

TLBT can run as a local HTTP server for agent and script integration.

Start server:

```bash
tlbt serve
```

Default URL: `http://127.0.0.1:8787`

## `GET /tools`

Returns loaded tool metadata and plugin load errors.

Example:

```bash
curl -s http://127.0.0.1:8787/tools
```

Response:

```json
{
  "ok": true,
  "data": {
    "tools": {
      "repo.map": {
        "description": "Map repository structure",
        "input": {
          "type": "object",
          "properties": {
            "path": { "type": "string" }
          },
          "required": ["path"]
        },
      }
    },
    "loadErrors": []
  }
}
```

## `POST /run`

Executes a tool.

Request body:

```json
{
  "tool": "repo.map",
  "input": { "path": "." }
}
```

Example:

```bash
curl -s -X POST http://127.0.0.1:8787/run \
  -H 'content-type: application/json' \
  -d '{"tool":"repo.map","input":{"path":"."}}'
```

Another example (web status probe):

```bash
curl -s -X POST http://127.0.0.1:8787/run \
  -H 'content-type: application/json' \
  -d '{"tool":"web.checkStatus","input":{"url":"https://example.com"}}'
```

Typical success payload:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "invocationId": "uuid",
    "tool": "repo.map",
    "transport": "http"
  }
}
```

## Error responses

Common status codes:
- `400`: invalid request body or schema validation failure
- `404`: unknown tool
- `500`: tool execution error

Error shape:

```json
{
  "ok": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Tool not found",
    "details": {
      "tool": "missing.tool"
    }
  },
  "meta": {
    "invocationId": "uuid"
  }
}
```
