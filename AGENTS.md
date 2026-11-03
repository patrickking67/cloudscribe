# CloudScribe

A statically typed scripting language for IT automation that compiles to JavaScript.

## Build & Run

```bash
npm ci                   # install dependencies from the lockfile
npm test                 # run tests with coverage (node:test, --experimental-test-coverage)
npm run test:only        # run tests without coverage
npm run check:repo       # repo convention checks (also run in CI)
node src/cloudscribe.js <file.csc> <output> [--out <file>]  # compile a script
```

Output types: `parsed`, `analyzed`, `optimized`, `js`. Sample scripts live in `examples/`.

Node 20+. CI runs `npm ci`, `npm test` and `npm run check:repo` on Node 20, 22 and 24.

## Architecture

Five-stage CloudScribe compilation pipeline using Ohm.js:

```
Source (.csc) → Parser → Analyzer → Optimizer → Generator → JavaScript
```

- `src/cloudscribe.ohm`: PEG grammar
- `src/parser.js`: Ohm-based parser
- `src/analyzer.js`: Semantic analysis (types, scopes, validation)
- `src/optimizer.js`: Constant folding, dead code elimination
- `src/generator.js`: JavaScript code generation
- `src/core.js`: AST node constructors and type system
- `src/compiler.js`: Pipeline orchestrator
- `src/cloudscribe.js`: CLI entry point

## Code Conventions

- ES modules (`import`/`export`)
- Node.js built-in test runner (`node:test`)
- Semicolon style is mixed: `src/cloudscribe.js` and `src/optimizer.js` use them, the rest mostly do not. Match the file you are editing
- Tests in `test/` mirror source file names
- The project name is "CloudScribe" (capital C, capital S)
- `CLAUDE.md` must stay exactly `@AGENTS.md`; `scripts/check-repo.sh` fails otherwise

## Deploys

- Every push to `main` deploys `docs/` to GitHub Pages (`.github/workflows/pages.yml`). Edits to `docs/` go live on merge.
- Nothing is published to npm from this repo.
