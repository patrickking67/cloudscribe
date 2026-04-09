<p align="center">
  <img src="docs/logo.svg" alt="CloudScribe Logo" width="200">
</p>

# CloudScribe

A statically typed scripting language for IT automation that compiles to JavaScript.

## Overview

CloudScribe combines Python's readability with PowerShell's utility for infrastructure scripting. It features a task-based execution model, compile-time type safety, and first-class functions, all compiling down to clean JavaScript through a multi-pass compiler built with [Ohm](https://ohmjs.org/). Built at Loyola Marymount University for CMSI 3802 — Languages & Automata II.

## Quick Start

**Prerequisites:** [Node.js](https://nodejs.org/) >= 18.0.0

```bash
git clone https://github.com/patrickking67/cloudscribe.git
cd cloudscribe
npm install

# Compile a script to JavaScript
node src/cloudscribe.js examples/data_backup.csc js

# Run the test suite
npm test
```

## Usage

### CLI

```
cloudscribe <filename> <output>
```

| Output type  | Description                            |
|-------------|----------------------------------------|
| `parsed`    | Verify syntax correctness              |
| `analyzed`  | Show the analyzed abstract syntax tree |
| `optimized` | Show the optimized IR                  |
| `js`        | Compile to JavaScript                  |

```bash
node src/cloudscribe.js script.csc parsed      # syntax check
node src/cloudscribe.js script.csc analyzed     # view AST
node src/cloudscribe.js script.csc optimized    # view optimized IR
node src/cloudscribe.js script.csc js           # compile to JS
```

### Language Features

**Tasks** — first-class automation units:

```csc
task deployService {
  let services = ["web", "database", "cache"];
  for service in services {
    print("Deploying: " + service);
  }
}
```

**Static typing** with type inference:

```csc
let count = 42;              // int
let name = "server-01";      // string
let active = true;           // boolean
let ports = [80, 443, 22];   // [int]
const MAX_RETRIES = 3;       // immutable
```

**Functions with type annotations:**

```csc
function backupFile(filename: string): boolean {
  print("Backing up: " + filename);
  return true;
}
```

**Type system:** `int`, `string`, `boolean`, `[T]` (arrays), `T?` (optionals), `(T) -> R` (function types)

**Expressions:** ternary (`a ? b : c`), null coalescence (`x ?? default`), arithmetic, boolean logic, bitwise, comparison, power (`**`)

## Project Structure

```
cloudscribe/
├── src/
│   ├── cloudscribe.ohm      # PEG grammar definition (Ohm)
│   ├── cloudscribe.js        # CLI entry point
│   ├── compiler.js           # Pipeline orchestrator
│   ├── parser.js             # Ohm-based parser
│   ├── analyzer.js           # Semantic analysis & type checking
│   ├── optimizer.js          # Constant folding & dead code elimination
│   ├── generator.js          # JavaScript code generator
│   └── core.js               # AST node constructors & type system
├── test/                     # 143 tests across all compiler stages
├── examples/                 # Example .csc programs
├── docs/                     # Project website
├── package.json
└── LICENSE
```

**Compiler pipeline:**

```
Source (.csc) → Parser → Analyzer → Optimizer → Generator → JavaScript
```

## Tech Stack

- **Language:** JavaScript (ES modules)
- **Runtime:** Node.js >= 18
- **Parser generator:** [Ohm](https://ohmjs.org/) (PEG grammar)
- **AST visualization:** [graph-stringify](https://www.npmjs.com/package/graph-stringify)
- **Testing:** Node.js built-in test runner + [c8](https://github.com/bcoe/c8) (coverage)

## Authors

- **Patrick King** — [GitHub](https://github.com/patrickking67)
- **Thomas Powell**

## License

MIT — see [LICENSE](LICENSE) for details.
