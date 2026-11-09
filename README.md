<p align="center">
  <img src="docs/logo.svg" alt="CloudScribe Logo" width="160">
</p>

<h1 align="center">CloudScribe</h1>

<p align="center">
  A statically typed scripting language for IT automation that compiles to JavaScript.
</p>

<p align="center">
  <a href="https://github.com/patrickking67/cloudscribe/actions/workflows/ci.yml"><img src="https://github.com/patrickking67/cloudscribe/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="https://patrickking67.github.io/cloudscribe/"><strong>Try it in the browser playground</strong></a>
</p>

---

CloudScribe is a small language for the kind of scripts that check servers, loop over services and report results. It adds what shell and plain JavaScript scripts usually skip: declared types, scoped names and compile-time checks, so a typo or a string where a number belongs fails before anything runs. A `.csc` file goes through a five-stage compiler (Ohm grammar, parser, semantic analyzer, optimizer, code generator) and comes out as readable JavaScript that runs on Node.js. The whole compiler is about 1,600 lines with no build step, so each stage is easy to read on its own. It ships with a CLI that can type-check, compile or run a file, a few built-ins for environment variables, files and shell commands, and a [playground](https://patrickking67.github.io/cloudscribe/) that runs the same compiler in the browser.

## Example

`checks.csc`:

```csc
const MAX_FAILURES = 1;

function isHealthy(code: int): boolean {
  return code == 200;
}

task checkServers {
  let codes = [200, 503, 200];
  let failures = 0;
  for code in codes {
    if isHealthy(code) {
      print("OK ${code}");
    } else {
      failures++;
    }
  }
  if failures > MAX_FAILURES {
    print("Too many failures");
    return;
  }
  print("Failures: ${failures}");
}
```

`npx cloudscribe checks.csc` prints:

```js
const MAX_FAILURES_0 = 1;
function isHealthy_1(code_2) {
  return (code_2 == 200);
}
// task: checkServers
checkServers_5: {
  let codes_3 = [200, 503, 200];
  let failures_4 = 0;
  for (const code_2 of codes_3) {
    if (isHealthy_1(code_2)) {
      console.log(`OK ${code_2}`);
    } else {
      failures_4++;
    }
  }
  if ((failures_4 > MAX_FAILURES_0)) {
    console.log("Too many failures");
    break checkServers_5;
  }
  console.log(`Failures: ${failures_4}`);
}
```

Names get numeric suffixes so CloudScribe identifiers can never clash with JavaScript reserved words. A task becomes a block, `return` inside a task becomes a labeled `break`, and an interpolated string becomes a template literal. `npx cloudscribe checks.csc --run` compiles and runs it:

```text
OK 200
OK 200
Failures: 1
```

Type errors stop compilation with the source location and exit code 1:

```text
$ npx cloudscribe retry.csc --check
error: retry.csc: Line 2, col 11:
  1 | let retries = 3;
> 2 | retries = "three";
                ^~~~~~~
  3 |
Expected assignment of type int, got string
```

## Quick start

Requires [Node.js](https://nodejs.org/) 20 or later.

```bash
git clone https://github.com/patrickking67/cloudscribe.git
cd cloudscribe
npm ci

npx cloudscribe examples/config_check.csc --check    # type-check only
npx cloudscribe examples/config_check.csc            # print the JavaScript
npx cloudscribe examples/config_check.csc --run      # compile and run
npx cloudscribe examples/config_check.csc --out check.mjs
node check.mjs
```

Inside the repository `npx cloudscribe` runs the local CLI. To put `cloudscribe` on your path everywhere, run `npm link` (or `npm install -g .`) from the repository root. The package is not published to the npm registry.

## Command line

```text
cloudscribe <file.csc> [stage] [--out <file>]
cloudscribe <file.csc> --check
cloudscribe <file.csc> --run [--out <file>]
```

| Option or stage | Result |
|-----------------|--------|
| (none) or `js`  | Prints the generated JavaScript |
| `parsed`        | Prints `Syntax is ok` or the syntax error |
| `analyzed`      | Prints the typed AST |
| `optimized`     | Prints the AST after constant folding |
| `--check`       | Type-checks without generating code and prints `<file>: ok` |
| `--run`         | Compiles and runs the program with Node.js in the current directory |
| `--out <file>`  | Writes the output to a file instead of stdout (with `--run`, keeps the compiled file) |

Exit codes: `0` success, `1` syntax or type error, `2` bad arguments or a file that cannot be read or written. With `--run`, the exit code is the program's own. Errors go to stderr, in red only when stderr is a terminal.

## Language

- **Types:** `int`, `string`, `boolean`, arrays `[T]`, optionals `T?`, and function types `(T) -> R`. Variable types are inferred from the initializer; parameters and return types are declared.
- **Bindings:** `let` (mutable) and `const` (compiles to a JavaScript `const`).
- **Structure:** `task name { ... }` blocks for workflows and `function name(x: T): R { ... }` for reusable logic.
- **Control flow:** `if`/`else`, `while`, `for x in array`, `break`, `return`.
- **Operators:** arithmetic `+ - * / % **`, comparison `== != < <= > >=`, logical `&& || !`, bitwise `& | ^`, conditional `a ? b : c`, optionals `some x` and `x ?? fallback`, plus `++` and `--` statements.
- **Strings:** double-quoted, with `\n`, `\t`, `\"`, `\\`, `\$` and `\u{...}` escapes, and interpolation: `"host ${name} returned ${code + 1}"`. Each embedded expression is type-checked and must be an `int`, `string` or `boolean`; write `\${` for a literal `${`.
- **Members:** `length` on strings and arrays, typed `int`.
- **Built-ins:** see the next section.

The full rules are in the [language specification](docs/language-spec.md).

## Built-in functions

| Function | Type | Behavior |
|----------|------|----------|
| `print(value)` | `(any) -> void` | Writes a line to stdout |
| `env(name)` | `(string) -> string?` | Reads an environment variable, empty when unset |
| `readFile(path)` | `(string) -> string` | Reads a UTF-8 file |
| `writeFile(path, text)` | `(string, string) -> void` | Writes a UTF-8 file |
| `fileExists(path)` | `(string) -> boolean` | Checks that a path exists |
| `toInt(text)` | `(string) -> int?` | Parses a whole number, empty if the text is not one |
| `shell(command)` | `(string) -> string` | Runs a shell command and returns its stdout |
| `exit(code)` | `(int) -> void` | Stops the program with an exit code |

Built-ins that can come back empty return an optional, so the compiler makes you handle the empty case with `??`:

```csc
const configPath = env("CONFIG_PATH") ?? "config.json";
const retries = toInt(env("RETRIES") ?? "3") ?? 3;
```

The generated JavaScript only includes support code for the built-ins a program uses. Everything except `print` needs Node.js, so the playground compiles such programs but does not run them.

## Static checks

The analyzer rejects a program before code generation for:

- Undeclared, redeclared or unknown names, including unknown type names
- Type mismatches in assignments, arguments, returns, array elements, conditional branches and comparisons
- Interpolated values that are not an `int`, `string` or `boolean`, such as an array, a void call or an optional without a `??` fallback
- Non-boolean `if`, `while` and `?:` conditions, and `for ... in` over a non-array
- Invalid operands for arithmetic, bitwise, unary and `??` operators
- Calls to non-functions and calls with the wrong number of arguments
- Assignment, `++` or `--` on a `const` or a loop variable, and assignment to a task
- `break` outside a loop and `return` outside a function or task

## Compiler pipeline

```text
source.csc -> parser -> analyzer -> optimizer -> generator -> JavaScript
```

| Stage     | File                  | What it does                                                         |
|-----------|-----------------------|----------------------------------------------------------------------|
| Grammar   | `src/cloudscribe.ohm` | PEG grammar for [Ohm](https://ohmjs.org/), including operator precedence |
| Parser    | `src/parser.js`       | Matches source against the grammar and reports syntax errors         |
| Analyzer  | `src/analyzer.js`     | Resolves scopes, infers and checks types, builds the typed AST       |
| Optimizer | `src/optimizer.js`    | Folds constant numeric and boolean expressions and literal parts of interpolated strings, drops dead branches and `while false` loops |
| Generator | `src/generator.js`    | Emits indented JavaScript, renaming identifiers and lowering tasks to blocks |
| Core      | `src/core.js`         | AST node constructors, built-in types and the standard library       |
| Pipeline  | `src/compiler.js`     | Runs the stages up to the requested output                           |
| CLI       | `src/cloudscribe.js`  | Reads a file, then checks, compiles or runs it                       |

## Tests

```bash
npm run check        # everything CI runs: repo checks, playground freshness, tests
npm test             # 271 tests with Node's built-in coverage report for src/
npm run test:only    # same tests, no coverage
```

Tests use the built-in `node:test` runner: one file per compiler stage, plus the pipeline, CLI, built-ins, examples, playground and site. Every file in `examples/` is compiled, run in an empty directory and compared with its expected output in `test/fixtures/examples/`. Line coverage of `src/` is 99.2%.

## Playground and site

The site in `docs/` is static and deployed to GitHub Pages by `.github/workflows/pages.yml`. Its playground imports a browser copy of the compiler from `docs/playground/`, which `npm run build:playground` generates from `src/` and the vendored `ohm-js` build. A test fails if that copy is out of date, so rerun the script and commit the result after any change in `src/`.

Preview locally with `python3 -m http.server 4101 --directory docs` and open http://localhost:4101/.

## Project layout

```text
cloudscribe/
|-- src/                    compiler stages and CLI (see the pipeline table)
|-- test/                   node:test suites and expected example output
|-- examples/               sample .csc programs, all compiled and run in tests
|-- docs/
|   |-- index.html          project site with the playground (GitHub Pages)
|   |-- playground/         generated browser copy of the compiler
|   |-- language-spec.md    language rules and compatibility contract
|   `-- llms.txt            summary for LLM tools, also at the repo root
|-- scripts/
|   |-- build-playground.mjs  regenerates docs/playground/
|   `-- check-repo.sh         repository convention checks
`-- .github/workflows/      CI (Node 20, 22, 24) and Pages deploy
```

Runtime dependencies are [ohm-js](https://www.npmjs.com/package/ohm-js) for parsing and [graph-stringify](https://www.npmjs.com/package/graph-stringify) for printing ASTs.

## License

MIT, see [LICENSE](LICENSE). Written by [Patrick King](https://github.com/patrickking67).
