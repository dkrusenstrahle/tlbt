# Transport Compatibility

TLBT keeps a single tool execution contract across CLI, HTTP, and MCP.

## Compatibility matrix

| Capability | CLI | HTTP | MCP |
|---|---|---|---|
| list tools | `tlbt tools` | `GET /tools` | `tools/list` |
| run tool | `tlbt run` / `tlbt <tool>` | `POST /run` | `tools/call` |
| stable error codes | yes | yes | yes |
| invocation metadata | yes | yes | yes |

## MCP compatibility guarantees

- Supports `initialize`, `ping`, `tools/list`, `tools/call`.
- Returns tool envelopes in `structuredContent`.
- Supports `notifications/tools/list_changed` emission.
- Accepts client-supplied `protocolVersion` during initialization.

## Known limitations

- Tool list changes are eventable, but dynamic tool reload orchestration is caller-managed.
- Tool execution is request/response only; streaming tool output is not yet implemented.

## Regression gates

Protocol compatibility is gated by:

- `tests/mcp.spec.js`
- `tests/mcp-compat-matrix.spec.js`
- `tests/interoperability.spec.js`

Run all transport gates:

```bash
npm run test:interop
```
