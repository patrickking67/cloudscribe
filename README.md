<p align="center">
  <img src="docs/logo.svg" alt="CloudScribe Logo" width="160">
</p>

<h1 align="center">CloudScribe</h1>

<p align="center">
  A statically typed scripting language for IT automation that compiles to JavaScript.
</p>

<p align="center">
  <a href="https://github.com/patrickking67/CloudScribe/actions"><img src="https://img.shields.io/badge/tests-171_passing-brightgreen" alt="Tests"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node"></a>
  <a href="https://patrickking67.github.io/CloudScribe/"><img src="https://img.shields.io/badge/docs-website-purple" alt="Website"></a>
</p>

---

## Overview

CloudScribe is a small typed automation language for people who want scripts to stay readable without giving up static checks. It has task blocks for operational workflows, functions with type annotations, arrays, optionals, conditionals, loops, and a compiler pipeline that lowers `.csc` files to readable JavaScript.

The compiler is intentionally easy to inspect: parse with [Ohm](https://ohmjs.org/), analyze types and scopes, optimize the typed AST, then generate JavaScript.

## Quick Start

**Prerequisites:** [Node.js](https://nodejs.org/) >= 18

```bash
git clone https://github.com/patrickking67/CloudScribe.git
cd CloudScribe
npm install

# Compile a script to JavaScript
node src/cloudscribe.js examples/data_backup.csc js

# Run the test suite with coverage
npm test
```

## Usage

```
cloudscribe <filename> <output>
```

| Output     | Description                        |
|------------|------------------------------------|
| `parsed`   | Verify syntax correctness          |
| `analyzed` | Show the typed abstract syntax tree|
| `optimized`| Show the optimized IR              |
| `js`       | Compile to JavaScript              |

## Language at a Glance

```csc
// Tasks group operational workflows
task deployService {
  let services = ["web", "database", "cache"];
  for service in services {
    print("Deploying: " + service);
  }
}

// Functions with type annotations
function backupFile(filename: string): boolean {
  print("Backing up: " + filename);
  return true;
}

// Static typing with inference
let count = 42;              // int
let name = "server-01";      // string
const MAX_RETRIES = 3;       // immutable (compiles to const)
let ports = [80, 443, 22];   // [int]

// Rich expressions
let status = healthy ? "OK" : "CRITICAL";
let timeout = configTimeout ?? 30;
let result = (base ** exponent) % modulus;
```

**Type system:** `int`, `string`, `boolean`, `[T]` (arrays), `T?` (optionals), `(T) -> R` (function types)

## Static Checks

CloudScribe validates scripts before JavaScript generation. The analyzer catches:

- Redeclared or undeclared identifiers
- Assignment, argument, return, array element, conditional branch, and comparison type mismatches
- Non-boolean `if` and `while` conditions
- Non-array `for...in` collections
- Invalid arithmetic, bitwise, unary, and null-coalescing operands
- Calls to non-functions and calls with the wrong number of arguments
- `break` outside loops and invalid assignment to `const`

## Compiler Architecture

```
Source (.csc) -> Parser -> Analyzer -> Optimizer -> Generator -> JavaScript
```

| Stage         | File               | Description                                   |
|---------------|--------------------|-----------------------------------------------|
| **Grammar**   | `cloudscribe.ohm`  | PEG grammar definition ([Ohm](https://ohmjs.org/))      |
| **Parser**    | `parser.js`        | Produces an Ohm match result from source      |
| **Analyzer**  | `analyzer.js`      | Type checking, scope resolution, validation   |
| **Optimizer** | `optimizer.js`     | Constant folding, dead code elimination       |
| **Generator** | `generator.js`     | Transpiles optimized IR to clean JavaScript   |
| **Core**      | `core.js`          | AST node constructors and type system         |

## Project Structure

```
cloudscribe/
|-- src/
|   |-- cloudscribe.ohm       # PEG grammar
|   |-- cloudscribe.js        # CLI entry point
|   |-- compiler.js           # Pipeline orchestrator
|   |-- parser.js             # Ohm-based parser
|   |-- analyzer.js           # Semantic analysis & type checking
|   |-- optimizer.js          # Constant folding & dead code elimination
|   |-- generator.js          # JavaScript code generator
|   `-- core.js               # AST nodes & type system
|-- test/                     # Tests across all compiler stages
|-- examples/                 # Example .csc programs
|-- docs/                     # Project website (Tailwind CSS)
|-- package.json
`-- LICENSE
```

## Tech Stack

- **JavaScript** (ES modules) on **Node.js** >= 18
- **[Ohm](https://ohmjs.org/)** - PEG parser generator
- **[graph-stringify](https://www.npmjs.com/package/graph-stringify)** - AST visualization
- **Node.js test runner** + **[c8](https://github.com/bcoe/c8)** - testing & coverage
- **[Tailwind CSS](https://tailwindcss.com/)** - project website

## Development

```bash
npm install
npm run test:only
npm test
node src/cloudscribe.js examples/security_scan.csc js
```

`npm test` runs the full suite with coverage. `npm run test:only` is faster when you only need the Node.js test runner.

## Author

**Patrick King** - [GitHub](https://github.com/patrickking67)

## License

MIT - see [LICENSE](LICENSE) for details.
