# Tool Contract v1

This document defines TLBT's transport-agnostic execution contract for CLI, HTTP, and MCP.

## Goal

Guarantee interoperable behavior regardless of transport by standardizing:

- success payload shape
- error payload shape and codes
- invocation metadata

## Success envelope

All successful tool executions return:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "invocationId": "uuid",
    "tool": "repo.map",
    "transport": "cli|http|mcp",
    "startedAt": "2026-01-01T00:00:00.000Z",
    "durationMs": 12
  }
}
```

`data` contains the raw result from `tool.run(input)`.

## Error envelope

All failed executions return:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "must have required property 'path' at /",
    "details": {
      "tool": "repo.map"
    }
  },
  "meta": {
    "invocationId": "uuid",
    "tool": "repo.map",
    "transport": "cli|http|mcp",
    "startedAt": "2026-01-01T00:00:00.000Z",
    "durationMs": 3
  }
}
```

## Stable error codes

- `INVALID_REQUEST`: malformed request or command input
- `TOOL_NOT_FOUND`: unknown tool name
- `VALIDATION_ERROR`: input schema validation failed
- `POLICY_VIOLATION`: blocked by configured policy
- `TOOL_TIMEOUT`: execution exceeded configured timeout
- `TOOL_EXECUTION_FAILED`: tool threw during execution
- `INTERNAL_ERROR`: unhandled transport/runtime error

## Transport mapping

- CLI:
  - tool and command outputs are JSON envelopes
  - non-zero exit code when `ok: false`
- HTTP:
  - same envelope payload
  - status code by error code:
    - `INVALID_REQUEST`, `VALIDATION_ERROR` -> `400`
    - `TOOL_NOT_FOUND` -> `404`
    - `POLICY_VIOLATION` -> `403`
    - `TOOL_TIMEOUT` -> `504`
    - other failures -> `500`
- MCP:
  - `tools/call` result includes envelope in `structuredContent`
  - `isError` mirrors `!ok`

## Compatibility policy

- Fields in this contract are additive-only in minor versions.
- Existing keys and error code meanings are stable within major version `v1`.
- Breaking changes require a major version bump and migration notes.
