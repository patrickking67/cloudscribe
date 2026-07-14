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
- String literals use double quotes.
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

Array elements must share a compatible type. Optional values accept their base type or `null`. Function types encode parameter and return types.

## Bindings

```csc
let retries = 3;
const region = "west";
let ports = [80, 443];
```

`let` creates a mutable binding. `const` creates a binding that cannot be reassigned. Types may be inferred from the initializer or declared explicitly where the grammar permits.

## Tasks and functions

Tasks group operational statements and compile to executable JavaScript blocks.

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

## Operators

| Family | Operators | Rule |
|---|---|---|
| Arithmetic | `+ - * / % **` | Numeric operands, except supported string concatenation with `+` |
| Comparison | `== != < <= > >=` | Compatible operand types |
| Logical | `&& || !` | Boolean operands |
| Bitwise | `& \| ^ ~ << >>` | Integer operands |
| Conditional | `condition ? a : b` | Boolean condition and compatible branch types |
| Null coalescing | `a ?? b` | Optional left operand and compatible fallback |

Operator precedence is encoded in `src/cloudscribe.ohm` and covered by parser and analyzer tests.

## Static diagnostics

Compilation stops before code generation for undeclared or redeclared names, invalid assignment, incompatible operands, invalid conditions, incorrect calls, invalid returns, heterogeneous arrays, `break` outside a loop, or reassignment to `const`.

Diagnostics should identify the violated rule without changing runtime behavior. New diagnostics require analyzer tests.

## Optimization contract

The optimizer may fold constants and remove unreachable or redundant work only when the generated program remains observably equivalent. Optimizer changes require paired input and expected-AST tests.

## JavaScript generation contract

Generated JavaScript is intended to be readable and executable on supported Node.js releases. The generator preserves declaration mutability, control flow, function boundaries, and evaluation order.

## Compatibility

CloudScribe follows semantic versioning. Additive syntax and diagnostics may ship in minor releases. Syntax removal, type-rule changes that reject previously valid programs, and output contract breaks require a major release.
