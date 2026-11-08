# CloudScribe agent guide

CloudScribe is a statically typed scripting language for IT automation. A five-stage compiler written in Node.js turns `.csc` files into JavaScript ES modules. The project name is written CloudScribe.

## Stack

- Node.js 20 or later, ES modules, no build step for the compiler.
- Runtime dependencies: `ohm-js` (grammar and parser), `graph-stringify` (AST printing). Respect `package-lock.json`; install with `npm ci`.
- Tests: the built-in `node:test` runner with native coverage. No linter or type checker is configured.
- Site: static `docs/index.html` with the Tailwind CDN script and `docs/playground.js`, deployed to GitHub Pages from `docs/`.

## Commands

| Task | Command |
|------|---------|
| Install | `npm ci` |
| Everything CI runs | `npm run check` |
| Tests with coverage of `src/` | `npm test` |
| Tests without coverage | `npm run test:only` |
| One test file | `node --test test/analyzer.test.js` |
| Repository conventions | `npm run check:repo` |
| Rebuild the playground copy | `npm run build:playground` |
| Type-check a file | `npx cloudscribe file.csc --check` |
| Compile to stdout | `npx cloudscribe file.csc` |
| Compile and run | `npx cloudscribe file.csc --run` |
| Preview the site | `python3 -m http.server 4101 --directory docs`, then open http://localhost:4101/ |

`.claude/launch.json` defines the same preview server as `cloudscribe-site` on port 4101.

`npm run check` runs `scripts/check-repo.sh`, `scripts/build-playground.mjs --check` and `npm test`. It must pass before you call any change done.

## Layout

| Path | Purpose |
|------|---------|
| `src/cloudscribe.ohm` | PEG grammar |
| `src/parser.js` | Matches source against the grammar, throws syntax errors |
| `src/analyzer.js` | Scopes, type inference and checks, builds the typed AST |
| `src/optimizer.js` | Constant folding and dead branch removal |
| `src/generator.js` | Emits JavaScript and the runtime support for built-ins |
| `src/core.js` | AST constructors, built-in types, the standard library table |
| `src/compiler.js` | Runs the stages up to the requested output |
| `src/cloudscribe.js` | CLI (`--check`, `--run`, `--out`, exit codes 0/1/2) |
| `test/*.test.js` | One suite per stage plus compiler, CLI, stdlib, examples, playground, site |
| `test/fixtures/examples/*.out` | Expected stdout for each file in `examples/` |
| `examples/*.csc` | Sample programs, all compiled and run by the tests |
| `docs/index.html`, `docs/playground.js` | Project site and playground |
| `docs/playground/` | Generated browser copy of the compiler. Do not edit by hand |
| `docs/language-spec.md` | Language contract |
| `scripts/` | `build-playground.mjs`, `check-repo.sh` |

## Conventions

- ES modules with `import`/`export`. Semicolon style is mixed (the CLI and optimizer use them, most other stages do not). Match the file you are editing.
- Every new diagnostic needs an analyzer test. Optimizer changes need paired input and output tests. Generated code is verified by running it, not only by matching strings.
- Adding a built-in: add it to `standardLibrary` in `src/core.js`, add its runtime support to `RUNTIME` in `src/generator.js`, test it in `test/stdlib.test.js`, and document it in the README, `docs/language-spec.md` and the site table.
- Adding an example: add `examples/<name>.csc` and its expected output in `test/fixtures/examples/<name>.out`. Examples run in an empty directory with only `PATH` set.
- After any change in `src/`, run `npm run build:playground` and commit `docs/playground/`. The playground test fails otherwise. A Dependabot bump of `ohm-js` needs the same rebuild.
- Keep README test counts and coverage in sync with an actual `npm test` run.
- Plain, short prose in docs and commits. No em dashes, no emojis. ISO dates.
- Conventional Commits, one logical change per commit, explicit paths when staging.

## Safety rules

- Do not change the license, repository settings, branch protection or the Pages configuration.
- No secrets, tokens or personal data in code, fixtures, docs or commits.
- No AI attribution in commits, PRs, code or docs. `scripts/check-repo.sh` rejects common attribution lines.
- No new runtime dependencies or frameworks without a clear reason. No build step for the site.
- Type-rule changes that reject previously valid programs need a major version, per `docs/language-spec.md`.
- Work on a branch, not `main`. Do not merge or force-push.

## Definition of done

1. `npm run check` passes.
2. New or changed behavior has tests, and examples still match their expected output.
3. `docs/playground/` is rebuilt if `src/` changed.
4. README, `docs/language-spec.md`, the site and `CHANGELOG.md` describe the change accurately.
5. Every command you documented was run.
