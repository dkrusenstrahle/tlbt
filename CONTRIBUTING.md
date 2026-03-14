# Contributing to TLBT

Thanks for contributing to TLBT.

## Development setup

1. Install dependencies:

```bash
npm install
```

2. Run tests:

```bash
npm test
```

3. Run coverage gate:

```bash
npm run coverage
```

## Project principles

- Keep the runtime small.
- Keep tools composable and JSON-first.
- Prefer simple APIs and low dependency overhead.
- Add schema definitions for every tool input.

## Pull request guidelines

- Keep changes focused.
- Add or update tests for behavior changes.
- Update documentation for CLI/server/tool contract changes.
- Ensure `npm run coverage` passes before opening a PR.

## Commit style

- Use clear, imperative commit messages.
- Explain why the change is needed.
