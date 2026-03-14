# Contributing to TLBT

Thanks for contributing to TLBT.

## Development setup

1. Install dependencies:

```bash
npm install
```

1. Run tests:

```bash
npm test
```

1. Run coverage gate:

```bash
npm run coverage
```

## Project principles

- Keep the runtime small.
- Keep tools composable and JSON-first.
- Prefer simple APIs and low dependency overhead.
- Add schema definitions for every tool input.
- Follow the tool template in `docs/tool-spec-template.md`.
- Add explicit guardrails (timeouts, size limits, max results) for new tools.

## Pull request guidelines

- Keep changes focused.
- Add or update tests for behavior changes.
- Update documentation for CLI/server/tool contract changes.
- Ensure `npm run coverage` passes before opening a PR.

## Release-quality gates

Before cutting a release tag:

- Run interoperability gates: `npm run test:interop`
- Run framework kit gates: `npm run test:framework-kits`
- Run reliability report: `npm run reliability:metrics`
- Confirm docs coverage for new commands/protocol behavior:
  - `docs/quickstart.md`
  - `docs/framework-integration.md`
  - `docs/transport-compatibility.md`
  - `docs/spec-tool-contract.md`

## Commit style

- Use clear, imperative commit messages.
- Explain why the change is needed.
