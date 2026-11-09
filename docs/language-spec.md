# CloudScribe Language Specification

This document defines the supported CloudScribe 1.x language contract. The compiler implementation and test suite are authoritative when this document and executable behavior disagree.

## Compilation pipeline

```text
source.csc -> parse -> analyze -> optimize -> generate -> JavaScript
```

Parsing produces a concrete match, analysis resolves names and types into a typed AST, optimization performs semantics-preserving rewrites, and generation emits readable JavaScript.

## Lexical structure

- Identifiers are case-sensitive.
- Line comments begin with `//`.
- Statements end with semicolons.
- Blocks use braces.
- String literals use double quotes. The escapes are `\n`, `\t`, `\"`, `\\`, `\$` and `\u{X}` with one to six hex digits.
- Integer literals are base-10 whole numbers.

## Types

| Type | Meaning | Example |
|---|---|---|
| `int` | Integer number | `42` |
| `string` | Text | `"server-01"` |
| `boolean` | Logical value | `true` |
| `[T]` | Homogeneous array | `[int]` |
| `T?` | Optional value | `string?` |
| `(T) -> R` | Function | `(string) -> boolean` |

Array elements must share a compatible type. An optional value is made with `some x` or returned by a built-in such as `env`, and is either a value of its base type or empty. `a ?? b` gives the value of `a`, or `b` when `a` is empty. Function types encode parameter and return types.

Strings and arrays have a `length` member of type `int`.

## String interpolation

A string literal can embed expressions between `${` and `}`:

```csc
let host = "web-01";
let code = 503;
print("host ${host} returned ${code}, retry ${code >= 500}");
```

- Each embedded expression is analyzed in the surrounding scope and must have type `int`, `string` or `boolean`. An array, a function, a task, a `void` call or an optional is a compile error; give an optional a fallback with `??`, as in `"${env("HOME") ?? "unset"}"`.
- Spaces inside the braces are ignored. Text outside the braces, including spaces, is kept as written.
- Embedded expressions can contain string literals and further interpolated strings.
- `\${` writes a literal `${`. A `$` not followed by `{` needs no escape. An unclosed `${` is a syntax error.
- An interpolated string has type `string`. Values are converted with JavaScript string conversion, so `true` becomes `true` and `3.5` becomes `3.5`.

Numbers follow JavaScript at runtime: `/` on two `int` values can produce a fraction, for example `7 / 2` is `3.5`.

## Bindings

```csc
let retries = 3;
const region = "west";
let ports = [80, 443];
```

`let` creates a mutable binding. `const` creates a binding that cannot be reassigned. Types may be inferred from the initializer or declared explicitly where the grammar permits.

## Tasks and functions

Tasks group operational statements and compile to executable JavaScript blocks. A bare `return;` inside a task exits the task; it compiles to a `break` out of a labeled block.

```csc
task deployService {
  print("deploying");
}
```

Functions declare typed parameters and a return type.

```csc
function healthy(code: int): boolean {
  return code == 200;
}
```

Every reachable function return must match its declared return type. Calls must target functions and provide the correct number and type of arguments.

## Control flow

CloudScribe supports `if`/`else`, `while`, and `for...in`. Conditions must be boolean. `for...in` requires an array and binds each element at the array’s element type. `break` is valid only inside a loop.

## Built-in functions

| Function | Type | Behavior |
|---|---|---|
| `print(value)` | `(any) -> void` | Writes the value and a newline to stdout |
| `env(name)` | `(string) -> string?` | Reads an environment variable; empty when it is not set |
| `readFile(path)` | `(string) -> string` | Reads a UTF-8 file; a missing file stops the program with an error |
| `writeFile(path, text)` | `(string, string) -> void` | Writes a UTF-8 file, replacing any existing content |
| `fileExists(path)` | `(string) -> boolean` | True when the path exists |
| `toInt(text)` | `(string) -> int?` | Parses a base-10 whole number, allowing surrounding spaces; empty otherwise |
| `shell(command)` | `(string) -> string` | Runs the command in the system shell and returns stdout without the final newline; a non-zero exit stops the program with an error |
| `exit(code)` | `(int) -> void` | Stops the program with the exit code |

Relative paths resolve against the working directory of the running program. `print` is reserved. The other built-in names may be redeclared by a program, which then shadows the built-in in that scope. The generated JavaScript includes support code only for the built-ins a program uses. Built-ins other than `print` need Node.js.

## Operators

| Family | Operators | Rule |
|---|---|---|
| Arithmetic | `+ - * / % **` | Numeric operands, except supported string concatenation with `+` |
| Comparison | `== != < <= > >=` | Compatible operand types |
| Logical | `&& || !` | Boolean operands |
| Bitwise | `& \| ^` | Integer operands |
| Conditional | `condition ? a : b` | Boolean condition and compatible branch types |
| Null coalescing | `a ?? b` | Optional left operand and compatible fallback |

Operator precedence is encoded in `src/cloudscribe.ohm` and covered by parser and analyzer tests.

## Static diagnostics

Compilation stops before code generation for undeclared or redeclared names, unknown type names, invalid assignment (including `++` and `--` on a `const` or loop variable, and assignment to a task), incompatible operands, invalid conditions, incorrect calls, invalid returns, heterogeneous arrays, interpolated values that are not `int`, `string` or `boolean`, `break` outside a loop, or reassignment to `const`.

Diagnostics should identify the violated rule without changing runtime behavior. New diagnostics require analyzer tests.

## Optimization contract

The optimizer may fold constants and remove unreachable or redundant work only when the generated program remains observably equivalent. Literal parts of an interpolated string move into its text, and a string with only literal parts becomes a plain string literal. When it folds an `if` with a constant condition, the surviving branch keeps its own block scope if it declares names. Optimizer changes require paired input and expected-AST tests.

## JavaScript generation contract

Generated JavaScript is intended to be readable and executable on supported Node.js releases. The generator preserves declaration mutability, control flow, function boundaries, and evaluation order. It emits one statement per line, indented two spaces per block level. An interpolated string compiles to a JavaScript template literal.

## Command line

```text
cloudscribe <file.csc> [parsed|analyzed|optimized|js] [--out <file>]
cloudscribe <file.csc> --check
cloudscribe <file.csc> --run [--out <file>]
```

The default output is `js`. `--check` type-checks without generating code. `--run` compiles and runs the program with Node.js in the current working directory. Exit codes are 0 for success, 1 for a syntax or type error, 2 for bad arguments or a file that cannot be read or written, and with `--run` the program's own exit code.

## Compatibility

CloudScribe follows semantic versioning. Additive syntax and diagnostics may ship in minor releases. Since 1.2.0, `${` inside a string literal starts an interpolation, so an older program that meant a literal `${` must write `\${`. Syntax removal, type-rule changes that reject previously valid programs, and output contract breaks require a major release.
