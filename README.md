<p align="center">
  <img src="docs/logo.svg" alt="CloudScribe Logo" width="200">
</p>

<h1 align="center">CloudScribe</h1>

<p align="center">
  <strong>A statically typed scripting language for IT automation</strong>
</p>

<p align="center">
  <a href="https://github.com/patrickking67/cloudscribe/actions"><img src="https://img.shields.io/badge/tests-passing-brightgreen" alt="Tests"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node"></a>
  <a href="https://patrickking67.github.io/cloudscribe/"><img src="https://img.shields.io/badge/docs-website-purple" alt="Website"></a>
</p>

---

CloudScribe combines Python's readability with PowerShell's utility for infrastructure scripting. It compiles to JavaScript with full compile-time type safety, a task-based execution model, and first-class functions.

## Quick Start

```bash
# Clone and install
git clone https://github.com/patrickking67/cloudscribe.git
cd cloudscribe
npm install

# Compile a script to JavaScript
node src/cloudscribe.js examples/data_backup.csc js

# Run the test suite
npm test
```

## Language Overview

### Tasks — First-Class Automation Units

Tasks are CloudScribe's primary abstraction for automation workflows:

```csc
task deployService {
  let services = ["web", "database", "cache"];

  print("Starting deployment");

  for service in services {
    print("Deploying: " + service);
  }

  print("Deployment complete");
}
```

### Static Typing

CloudScribe catches errors at compile time with a rich type system:

```csc
let count = 42;              // int
let name = "server-01";      // string
let active = true;           // boolean
let ports = [80, 443, 22];   // [int]
const MAX_RETRIES = 3;       // immutable
```

### Functions with Type Annotations

```csc
function backupFile(filename: string): boolean {
  print("Backing up: " + filename);
  return true;
}
```

### Control Flow

```csc
// Conditionals
if diskUsage > 90 {
  print("Warning: disk almost full");
} else {
  print("Disk usage normal");
}

// Loops
while retries > 0 {
  print("Attempting connection...");
  retries--;
}

for server in servers {
  print("Pinging: " + server);
}
```

### Expressions

```csc
// Ternary
let status = healthy ? "OK" : "CRITICAL";

// Null coalescence
let timeout = configTimeout ?? 30;

// Arithmetic, boolean logic, bitwise, comparison, power
let result = (base ** exponent) % modulus;
let allowed = isAdmin || (isUser && hasPermission);
```

## Type System

| Type | Syntax | Example |
|------|--------|---------|
| Integer | `int` | `42` |
| String | `string` | `"hello"` |
| Boolean | `boolean` | `true` |
| Array | `[T]` | `[1, 2, 3]` |
| Optional | `T?` | `int?` |
| Function | `(T) -> R` | `(int, int) -> boolean` |

## Example Programs

### Security Scan

```csc
function scanPort(port: int): boolean {
  return true;
}

task securityScan {
  let ports = [80, 443, 22];
  let threats = 0;

  print("Starting security scan");

  for port in ports {
    if scanPort(port) {
      print("Port " + port + " is secure");
    } else {
      threats++;
    }
  }
}
```

### Data Backup

```csc
function backupFile(filename: string): boolean {
  print("Backing up: " + filename);
  return true;
}

task backupData {
  let files = ["config.json", "users.db", "logs.txt"];
  let failedCount = 0;

  print("Starting backup process");

  for file in files {
    if backupFile(file) {
      print("Successfully backed up " + file);
    } else {
      print("Failed to backup " + file);
      failedCount++;
    }
  }

  if failedCount > 0 {
    print("Backup completed with " + failedCount + " failures");
  } else {
    print("Backup completed successfully");
  }
}
```

### System Update

```csc
task updateSystem {
  let components = ["OS", "Drivers", "Apps"];
  let updateCount = 0;

  print("System Update Starting");

  for component in components {
    print("Updating: " + component);
    updateCount++;
  }

  print("Updated " + updateCount + " components");
}
```

> More examples in the [`examples/`](examples/) directory.

## Compiler Architecture

CloudScribe uses a traditional multi-pass compilation pipeline:

```
Source (.csc) → Parser → Analyzer → Optimizer → Generator → JavaScript
```

| Stage | File | Description |
|-------|------|-------------|
| **Grammar** | `src/cloudscribe.ohm` | PEG grammar definition using [Ohm](https://ohmjs.org/) |
| **Parser** | `src/parser.js` | Produces a concrete syntax tree from source code |
| **Analyzer** | `src/analyzer.js` | Semantic analysis: type checking, scope resolution, validation |
| **Optimizer** | `src/optimizer.js` | Constant folding, dead code elimination, branch simplification |
| **Generator** | `src/generator.js` | Transpiles the optimized IR to JavaScript |

## CLI Usage

```
cloudscribe <filename> <output>

Output types:
  parsed      Verify syntax correctness
  analyzed    Show the analyzed AST
  optimized   Show the optimized IR
  js          Compile to JavaScript

Options:
  --version   Show version number
  --help      Show help
```

```bash
# Check syntax
node src/cloudscribe.js script.csc parsed

# View analyzed AST
node src/cloudscribe.js script.csc analyzed

# View optimized IR
node src/cloudscribe.js script.csc optimized

# Compile to JavaScript
node src/cloudscribe.js script.csc js
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0

### Setup

```bash
git clone https://github.com/patrickking67/cloudscribe.git
cd cloudscribe
npm install
```

### Testing

```bash
# Run tests with coverage
npm test

# Run tests without coverage
npm run test:only
```

The test suite includes:
- **Parser tests** — Syntax validation and error detection
- **Analyzer tests** — Semantic analysis and type checking
- **Optimizer tests** — Constant folding and dead code elimination
- **Generator tests** — JavaScript code generation

### Project Structure

```
cloudscribe/
├── src/
│   ├── cloudscribe.ohm      # Language grammar
│   ├── cloudscribe.js        # CLI entry point
│   ├── compiler.js           # Compilation pipeline orchestrator
│   ├── parser.js             # Ohm-based parser
│   ├── analyzer.js           # Static semantic analysis
│   ├── optimizer.js          # IR optimizations
│   ├── core.js               # AST node constructors and type system
│   └── generator.js          # JavaScript code generator
├── test/                     # Test suite
├── examples/                 # Example CloudScribe programs
├── docs/                     # Project website
├── package.json
└── LICENSE
```

## Authors

- **Patrick King** — [GitHub](https://github.com/patrickking67)
- **Thomas Powell**

Built at **Loyola Marymount University** for CMSI 3802 — Languages & Automata II, taught by Professor Ray Toal.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
