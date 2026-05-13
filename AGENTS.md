# CloudScribe

A statically typed scripting language for IT automation that compiles to JavaScript.

## Build & Run

```bash
npm install              # install dependencies
npm test                 # run tests with coverage (c8 + node:test)
npm run test:only        # run tests without coverage
node src/cloudscribe.js <file.csc> <output>  # compile a script
```

Output types: `parsed`, `analyzed`, `optimized`, `js`

## Architecture

Five-stage CloudScribe compilation pipeline using Ohm.js:

```
Source (.csc) → Parser → Analyzer → Optimizer → Generator → JavaScript
```

- `src/cloudscribe.ohm` — PEG grammar
- `src/parser.js` — Ohm-based parser
- `src/analyzer.js` — Semantic analysis (types, scopes, validation)
- `src/optimizer.js` — Constant folding, dead code elimination
- `src/generator.js` — JavaScript code generation
- `src/core.js` — AST node constructors and type system
- `src/compiler.js` — Pipeline orchestrator
- `src/cloudscribe.js` — CLI entry point

## Code Conventions

- ES modules (`import`/`export`)
- Node.js built-in test runner (`node:test`)
- No semicolons in most source files (mixed style — CLI and parser use them)
- Tests in `test/` mirror source file names
- The project name is "CloudScribe" (capital C, capital S)
