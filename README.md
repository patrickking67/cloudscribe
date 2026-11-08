<p align="center">
  <img src="docs/logo.svg" alt="CloudScribe Logo" width="160">
</p>

<h1 align="center">CloudScribe</h1>

<p align="center">
  A statically typed scripting language for IT automation that compiles to JavaScript.
</p>

<p align="center">
  <a href="https://github.com/patrickking67/cloudscribe/actions/workflows/ci.yml"><img src="https://github.com/patrickking67/cloudscribe/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20-green.svg" alt="Node"></a>
  <a href="https://patrickking67.github.io/cloudscribe/"><img src="https://img.shields.io/badge/docs-website-purple" alt="Website"></a>
</p>

---

CloudScribe is a small language for the kind of scripts that check servers, loop over services and report results. It adds what shell and plain JavaScript scripts usually skip: declared types, scoped names and compile-time checks, so a typo or a string where a number belongs fails before anything runs. A `.csc` file goes through a five-stage compiler (Ohm grammar, parser, semantic analyzer, optimizer, code generator) and comes out as readable JavaScript that runs on Node.js. The whole compiler is about 1,300 lines with no build step, so each stage is easy to read on its own.

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
      print("OK " + code);
    } else {
      failures++;
    }
  }
  if failures > MAX_FAILURES {
    print("Too many failures");
    return;
  }
  print("Failures: " + failures);
}
```

`node src/cloudscribe.js checks.csc js` prints:

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
console.log(("OK " + code_2));
} else {
failures_4++;
}
}
if ((failures_4 > MAX_FAILURES_0)) {
console.log("Too many failures");
break checkServers_5;
}
console.log(("Failures: " + failures_4));
}
```

Names get numeric suffixes so CloudScribe identifiers can never clash with JavaScript reserved words. A task becomes a block, and `return` inside a task becomes a labeled `break`. Type errors stop compilation with the source location:

```text
Error: Line 2, col 11:
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

# Compile an example and print the JavaScript
node src/cloudscribe.js examples/data_backup.csc js

# Compile to a file and run it
node src/cloudscribe.js examples/data_backup.csc js --out backup.mjs
node backup.mjs
```

The CLI takes a source file and an output stage:

```text
cloudscribe <filename> <output> [--out <filename>]
```

| Output      | Result                                         |
|-------------|------------------------------------------------|
| `parsed`    | Prints `Syntax is ok` or the syntax error      |
| `analyzed`  | Prints the typed AST                           |
| `optimized` | Prints the AST after constant folding          |
| `js`        | Prints the generated JavaScript                |

`npm run compile -- <filename> <output>` runs the same CLI.

## Language

- **Types:** `int`, `string`, `boolean`, arrays `[T]`, optionals `T?`, and function types `(T) -> R`. Variable types are inferred from the initializer; parameters and return types are declared.
- **Bindings:** `let` (mutable) and `const` (compiles to a JavaScript `const`).
- **Structure:** `task name { ... }` blocks for workflows and `function name(x: T): R { ... }` for reusable logic.
- **Control flow:** `if`/`else`, `while`, `for x in array`, `break`, `return`.
- **Operators:** arithmetic `+ - * / % **`, comparison `== != < <= > >=`, logical `&& || !`, bitwise `& | ^`, conditional `a ? b : c`, optionals `some x` and `x ?? fallback`, plus `++` and `--` statements.
- **Built-in:** `print(value)`, compiled to `console.log`.

The full rules are in the [language specification](docs/language-spec.md).

## Static checks

The analyzer rejects a program before code generation for:

- Undeclared, redeclared or unknown names, including unknown type names
- Type mismatches in assignments, arguments, returns, array elements, conditional branches and comparisons
- Non-boolean `if`, `while` and `?:` conditions, and `for ... in` over a non-array
- Invalid operands for arithmetic, bitwise, unary and `??` operators
- Calls to non-functions and calls with the wrong number of arguments
- Assignment, `++` or `--` on a `const` or a loop variable
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
| Optimizer | `src/optimizer.js`    | Folds constant numeric and boolean expressions, drops dead branches and `while false` loops |
| Generator | `src/generator.js`    | Emits JavaScript, renaming identifiers and lowering tasks to blocks  |
| Core      | `src/core.js`         | AST node constructors, built-in types and the standard library       |
| Pipeline  | `src/compiler.js`     | Runs the stages up to the requested output                           |
| CLI       | `src/cloudscribe.js`  | Reads a file, compiles it, writes to stdout or `--out`               |

## Tests

```bash
npm test             # 199 tests with Node's built-in coverage report
npm run test:only    # same tests, no coverage
npm run check:repo   # repository convention checks
```

Tests use the built-in `node:test` runner, with one file per compiler stage plus pipeline and CLI tests. The pipeline tests compile every file in `examples/` and run the output as an ES module, so generated code is checked by running it, not by matching strings. Line coverage is about 98%.

## Project layout

```text
cloudscribe/
|-- src/                  compiler stages and CLI (see the pipeline table)
|-- test/                 node:test suites, one per stage plus compiler and CLI
|-- examples/             sample .csc programs, all compiled and run in tests
|-- docs/
|   |-- language-spec.md  language rules and compatibility contract
|   `-- index.html        project website (GitHub Pages)
|-- scripts/check-repo.sh repository convention checks used in CI
`-- .github/workflows/    CI (tests on Node 20, 22, 24) and Pages deploy
```

Runtime dependencies are [ohm-js](https://www.npmjs.com/package/ohm-js) for parsing and [graph-stringify](https://www.npmjs.com/package/graph-stringify) for printing ASTs.

## License

MIT, see [LICENSE](LICENSE). Written by [Patrick King](https://github.com/patrickking67).
