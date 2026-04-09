import { describe, it } from "node:test"
import assert from "node:assert/strict"
import generate from "../src/generator.js"
import { voidType } from "../src/core.js"

describe("The generator", () => {
  // — Expression coverage —

  it("exp: null/undefined produces empty string", () => {
    const prog = {
      kind: "Program",
      statements: [
        { kind: "VariableDeclaration", variable: { name: "x" }, initializer: undefined }
      ]
    }
    assert.equal(generate(prog).trim(), "let x_0 = ;")
  })

  it("exp: number, boolean, and string literals", () => {
    const prog = {
      kind: "Program",
      statements: [
        { kind: "VariableDeclaration", variable: { name: "a" }, initializer: 123 },
        { kind: "VariableDeclaration", variable: { name: "b" }, initializer: true },
        { kind: "VariableDeclaration", variable: { name: "c" }, initializer: '"hi"' }
      ]
    }
    const lines = generate(prog).split("\n")
    assert.equal(lines[0], "let a_0 = 123;")
    assert.equal(lines[1], "let b_1 = true;")
    assert.equal(lines[2], 'let c_2 = "hi";')
  })

  it("exp: named entities use mangled names", () => {
    const e = { name: "y", type: { returnType: {} } }
    const prog = {
      kind: "Program",
      statements: [{ kind: "VariableDeclaration", variable: e, initializer: e }]
    }
    assert.match(generate(prog), /let y_0 = y_0;/)
  })

  it("exp: BinaryExpression with parentheses", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "x" },
        initializer: { kind: "BinaryExpression", left: 1, op: "+", right: 2 }
      }]
    }
    assert.match(generate(prog), /\(1 \+ 2\)/)
  })

  it("exp: UnaryExpression", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "u" },
        initializer: { kind: "UnaryExpression", op: "-", operand: 5 }
      }]
    }
    assert.match(generate(prog), /-\(5\)/)
  })

  it("exp: Conditional with spacing", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "c" },
        initializer: { kind: "Conditional", test: true, consequent: 1, alternate: 0 }
      }]
    }
    assert.match(generate(prog), /\(true \? 1 : 0\)/)
  })

  it("exp: SubscriptExpression", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "s" },
        initializer: { kind: "SubscriptExpression", array: { name: "arr" }, index: 4 }
      }]
    }
    assert.match(generate(prog), /arr_\d+\[4\]/)
  })

  it("exp: MemberExpression", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "m" },
        initializer: { kind: "MemberExpression", object: { name: "o" }, field: "f" }
      }]
    }
    assert.match(generate(prog), /o_\d+\.f/)
  })

  it("exp: ArrayExpression", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "a" },
        initializer: { kind: "ArrayExpression", elements: [1, 2, 3] }
      }]
    }
    assert.match(generate(prog), /\[1, 2, 3\]/)
  })

  it("exp: FunctionCall expression", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "r" },
        initializer: {
          kind: "FunctionCall",
          callee: { name: "fn" },
          args: [1, 2]
        }
      }]
    }
    assert.match(generate(prog), /fn_\d+\(1, 2\)/)
  })

  it("exp: unknown kind throws", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "z" },
        initializer: { kind: "FooBar" }
      }]
    }
    assert.throws(() => generate(prog), /generator exp: unhandled expression kind FooBar/)
  })

  // — Statement coverage —

  it("VariableDeclaration uses const for immutable variables", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "MAX", mutable: false },
        initializer: 100
      }]
    }
    assert.match(generate(prog), /^const MAX_0 = 100;/)
  })

  it("VariableDeclaration uses let for mutable variables", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "VariableDeclaration",
        variable: { name: "x", mutable: true },
        initializer: 0
      }]
    }
    assert.match(generate(prog), /^let x_0 = 0;/)
  })

  it("Assignment", () => {
    const prog = {
      kind: "Program",
      statements: [{ kind: "Assignment", target: { name: "x" }, source: { name: "y" } }]
    }
    assert.equal(generate(prog).trim(), "x_0 = y_1;")
  })

  it("PrintStatement", () => {
    const prog = {
      kind: "Program",
      statements: [{ kind: "PrintStatement", argument: '"hey"' }]
    }
    assert.equal(generate(prog).trim(), 'console.log("hey");')
  })

  it("IfStatement with else", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "IfStatement",
        test: { name: "t" },
        consequent: [],
        alternate: []
      }]
    }
    const out = generate(prog)
    assert.match(out, /^if \(t_0\) {/m)
    assert.match(out, /} else {/m)
  })

  it("ShortIfStatement", () => {
    const prog = {
      kind: "Program",
      statements: [{ kind: "ShortIfStatement", test: { name: "s" }, consequent: [] }]
    }
    assert.match(generate(prog), /if \(s_0\) {/)
  })

  it("WhileStatement", () => {
    const prog = {
      kind: "Program",
      statements: [{ kind: "WhileStatement", test: false, body: [] }]
    }
    assert.match(generate(prog), /while \(false\) {/)
  })

  it("ForStatement", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "ForStatement",
        iterator: { name: "i" },
        collection: { kind: "ArrayExpression", elements: [1] },
        body: []
      }]
    }
    assert.match(generate(prog), /for \(const i_0 of \[1\]\) {/)
  })

  it("TaskDeclaration wraps body in a block", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "TaskDeclaration",
        task: {
          name: "deploy",
          body: [{ kind: "PrintStatement", argument: '"go"' }]
        }
      }]
    }
    const out = generate(prog)
    assert.match(out, /\/\/ task: deploy/)
    assert.match(out, /{/)
    assert.match(out, /console\.log\("go"\);/)
  })

  it("FunctionDeclaration", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "FunctionDeclaration",
        fun: {
          name: "f",
          params: [{ name: "p" }],
          body: [{ kind: "ReturnStatement", expression: { name: "p" } }]
        }
      }]
    }
    const lines = generate(prog).split("\n")
    assert.match(lines[0], /function f_0\(p_1\) {/)
    assert.match(lines[1], /return p_1;/)
    assert.equal(lines[2], "}")
  })

  it("Increment and Decrement", () => {
    const prog = {
      kind: "Program",
      statements: [
        { kind: "Increment", variable: { name: "n" } },
        { kind: "Decrement", variable: { name: "n" } }
      ]
    }
    const lines = generate(prog).split("\n")
    assert.equal(lines[0], "n_0++;")
    assert.equal(lines[1], "n_0--;")
  })

  it("BreakStatement", () => {
    const prog = { kind: "Program", statements: [{ kind: "BreakStatement" }] }
    assert.equal(generate(prog).trim(), "break;")
  })

  it("ReturnStatement", () => {
    const prog = {
      kind: "Program",
      statements: [{ kind: "ReturnStatement", expression: 42 }]
    }
    assert.equal(generate(prog).trim(), "return 42;")
  })

  it("ShortReturnStatement", () => {
    const prog = { kind: "Program", statements: [{ kind: "ShortReturnStatement" }] }
    assert.equal(generate(prog).trim(), "return;")
  })

  it("FunctionCall: print intrinsic compiles to console.log", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "FunctionCall",
        callee: { name: "print", intrinsic: true, type: { returnType: voidType } },
        args: ['"ok"']
      }]
    }
    assert.equal(generate(prog).trim(), 'console.log("ok");')
  })

  it("FunctionCall: non-intrinsic void function calls normally", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "FunctionCall",
        callee: { name: "g", type: { returnType: voidType } },
        args: ['"ok"']
      }]
    }
    assert.equal(generate(prog).trim(), 'g_0("ok");')
  })

  it("FunctionCall: non-void function calls normally", () => {
    const prog = {
      kind: "Program",
      statements: [{
        kind: "FunctionCall",
        callee: { name: "h", type: { returnType: {} } },
        args: [7]
      }]
    }
    assert.equal(generate(prog).trim(), "h_0(7);")
  })

  it("unknown node kind throws", () => {
    const bad = { kind: "Program", statements: [{ kind: "NoSuch" }] }
    assert.throws(() => generate(bad), /generator: unhandled node kind NoSuch/)
  })
})
