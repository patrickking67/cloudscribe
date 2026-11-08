# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

Planned as 1.1.0. `package.json` is already at 1.1.0.

### Added

- Built-in functions `env`, `readFile`, `writeFile`, `fileExists`, `toInt`, `shell` and `exit`. The generated JavaScript includes support code only for the built-ins a program uses.
- CLI `--check` (type-check only) and `--run` (compile and run with Node.js). The output stage now defaults to `js`.
- Browser playground on the project site, using a generated copy of the compiler in `docs/playground/` (`npm run build:playground`).
- `examples/config_check.csc`, and a test that runs every example and compares its output.
- `npm run check`, the single command CI runs.
- `CONTRIBUTING.md`, `CHANGELOG.md`, `llms.txt`, `.editorconfig`, `.gitattributes`, `CODEOWNERS`, Dependabot config, issue forms and `.claude/launch.json`.

### Changed

- CLI exit codes: 1 for syntax or type errors, 2 for bad arguments or unreadable and unwritable files. Errors name the file and are colored only on a terminal.
- `length` on strings and arrays is typed `int`.
- Rebuilt the landing page around the playground, with Open Graph tags and an image, visible focus styles, reduced-motion support and a layout that fits a 375px screen.
- CI runs `npm run check` with read-only permissions, and the coverage report covers `src/` only.

### Fixed

- Folding an `if` with a constant condition no longer moves the branch's declarations into the outer scope, which produced a JavaScript `SyntaxError` when a later declaration used the same name.
- Using `print` as a value or inside an expression compiles to `console.log` instead of an undefined name.
- Assigning to a task reports `Cannot assign to task <name>` instead of a type error about `undefined`.
- Missing source files and unknown output types give a one-line message instead of a raw Node.js error.

## [1.0.0] - 2026-11-07

Summary of the history before this changelog existed. There were no tags.

### Added

- 2026-07-13: language specification, security policy, CLI `--out`, native test coverage and an explicit Pages deployment.
- 2026-05-13: structural type checking in the analyzer, GitHub Actions CI, agent guides and a refreshed site.
- 2026-04-09: compiler rewrite with a five-stage pipeline (Ohm grammar, parser, analyzer, optimizer, generator), new logo and site.
- 2025-01-29 to 2025-05-13: first versions of the language, grammar and optimizer.

### Fixed

- 2026-11-07: valid JavaScript for `return` inside tasks, string concatenation of literals and unary operators before `**`, plus stricter checks for unknown types, const and loop variable mutation, and `return` outside a function or task.

[Unreleased]: https://github.com/patrickking67/cloudscribe/compare/5685d18...HEAD
[1.0.0]: https://github.com/patrickking67/cloudscribe/tree/5685d18
