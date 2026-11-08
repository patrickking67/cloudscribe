# Contributing to CloudScribe

Thanks for helping. This is a small project, so the process is short.

## Setup

You need Node.js 20 or later.

```bash
git clone git@github.com:patrickking67/cloudscribe.git
cd cloudscribe
npm ci
npm run check
```

`npm run check` runs everything CI runs: repository convention checks, a check that the playground copy of the compiler is current, and the test suite with coverage.

## Branches

Branch from `main` and name the branch by the kind of change:

- `feat/` for new language features, built-ins or CLI options
- `fix/` for bug fixes
- `docs/` for documentation and site copy
- `chore/` for tooling, CI and housekeeping

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/), for example `fix(analyzer): reject assignment to a task`. Keep each commit to one logical change, and make sure each one passes `npm run check`.

## Making a change

- Read [AGENTS.md](AGENTS.md) for the layout, conventions and the definition of done.
- Add tests for new behavior. Analyzer errors need an analyzer test; optimizer changes need paired input and output tests.
- If you change anything in `src/`, run `npm run build:playground` and commit the updated `docs/playground/`.
- If you add an example, add its expected output under `test/fixtures/examples/`.
- Update the README, `docs/language-spec.md`, the site and `CHANGELOG.md` when behavior changes.

## Pull requests

Open the PR against `main` and fill in the template:

- [ ] `npm run check` passes locally
- [ ] New behavior has tests
- [ ] `docs/playground/` is rebuilt if `src/` changed
- [ ] Docs and changelog match the change

Report security problems privately, as described in [SECURITY.md](SECURITY.md).
