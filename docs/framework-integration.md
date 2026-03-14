# Framework Integration Guide

This guide targets framework builders who want TLBT as a default tool runtime.

## Integration kit: MCP stdio

Use MCP when your framework already supports MCP tool servers.

Reference runnable example:

- `examples/framework-mcp-client.js`

Flow:

1. Start TLBT with `tlbt mcp` (or embed `createMcpHandler()` in-process).
2. Send `initialize`.
3. Call `tools/list` to discover capabilities.
4. Call `tools/call` with schema-valid arguments.

The tool result envelope is returned in `structuredContent`.

## Integration kit: HTTP fallback

Use HTTP fallback for environments that cannot host stdio MCP.

Reference runnable example:

- `examples/framework-http-fallback-client.js`

Flow:

1. Start TLBT with `tlbt serve`.
2. Call `GET /tools` for discovery.
3. Call `POST /run` for execution.
4. Map TLBT error codes to your framework retry policy.

## Capability discovery and retry pattern

- Discover tools at startup and cache schemas.
- On `VALIDATION_ERROR`, do not retry unchanged inputs.
- On `TOOL_TIMEOUT`, retry with bounded attempts.
- On `TOOL_NOT_FOUND`, trigger a discovery refresh and fail fast.

## CI validation

TLBT includes runnable kit tests:

- `tests/framework-kits.spec.js`

Run:

```bash
npm run test:framework-kits
```
