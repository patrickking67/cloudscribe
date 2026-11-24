import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as ohm from "ohm-js"
import parse from "../src/parser.js"
import compile from "../src/compiler.js"
import { MAX_SYNTAX_ERRORS } from "../src/recover.js"

const grammar = ohm.grammar(readFileSync(new URL("../src/cloudscribe.ohm", import.meta.url), "utf8"))

function diagnosticsFor(source) {
  try {
    parse(source)
  } catch (error) {
    return error.diagnostics.map(({ line, column }) => `${line}:${column}`)
  }
  assert.fail("Expected a syntax error")
}

describe("Syntax error recovery", () => {
  it("reports an error on each broken statement", () => {
    const source = "let a = ;\nlet b = 2;\nlet c = 3 +;\nprint(b);\n"
    assert.deepEqual(diagnosticsFor(source), ["1:9", "3:12"])
  })

  it("names the count when there is more than one error", () => {
    assert.throws(() => parse("let a = ;\nlet c = 3 +;\n"), /Line 1, col 9[\s\S]*Line 2, col 12[\s\S]*2 syntax errors$/)
  })

  it("keeps the message of a single error exactly as the grammar prints it", () => {
    for (const source of ["let x = ;", "let x = 5", "function f {}", "if x", "let 1x = 1;", "x = 2 +;\nlet ok = 1;", ""]) {
      const expected = grammar.match(source).message
      assert.throws(() => parse(source), error => error.message === expected && error.diagnostics.length === 1, source)
    }
  })

  it("finds errors inside blocks and after them", () => {
    const source = "task t {\n  let a = ;\n  let b = 1\n  print(b);\n}\nlet z = ];\n"
    assert.deepEqual(diagnosticsFor(source), ["2:11", "4:3", "6:9"])
  })

  it("shows the source as written in every message, not the recovered text", () => {
    assert.throws(
      () => parse("function f( { return 1; }\nlet x = ;\n"),
      error => /1 \| function f\( \{ return 1; \}/.test(error.diagnostics[1].message)
    )
  })

  it("does not report a brace left behind by recovery as a second error", () => {
    assert.deepEqual(diagnosticsFor("function f( { return 1; }\n"), ["1:13"])
  })

  it("still reports a stray closing brace when it is the only problem", () => {
    assert.deepEqual(diagnosticsFor("let x = 1;\n}\n"), ["2:1"])
  })

  it("is not fooled by semicolons and braces inside strings", () => {
    assert.deepEqual(diagnosticsFor('let a = "x; y";\nlet b = ;\nlet c = "}{";\nlet d = ;\n'), ["2:9", "4:9"])
  })

  it("reports one error for an unclosed string or interpolation", () => {
    assert.deepEqual(diagnosticsFor('let x = "hello;'), ["1:16"])
    assert.deepEqual(diagnosticsFor('let x = "host ${name";\nlet y = 1;\n'), ["1:21"])
  })

  it("does not report an empty program as a second error", () => {
    assert.deepEqual(diagnosticsFor("let x = ;"), ["1:9"])
    assert.deepEqual(diagnosticsFor(""), ["1:1"])
  })

  it("stops after the maximum number of errors", () => {
    const source = "let a = ;\n".repeat(MAX_SYNTAX_ERRORS + 5)
    assert.equal(diagnosticsFor(source).length, MAX_SYNTAX_ERRORS)
  })

  it("leaves programs without syntax errors alone", () => {
    assert.equal(compile("let x = 1;\nprint(x);\n", "parsed"), "Syntax is ok")
  })

  it("reaches the compiler caller with the same diagnostics", () => {
    assert.throws(() => compile("let a = ;\nlet b = ;\n", "js"), error => error.diagnostics?.length === 2)
  })
})
