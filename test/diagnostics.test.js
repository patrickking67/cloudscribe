import { describe, it } from "node:test"
import assert from "node:assert/strict"
import compile from "../src/compiler.js"
import { diagnosticsFromError, offsetOf, rangesForDiagnostics } from "../docs/diagnostics.js"

function errorFor(source) {
  try {
    compile(source, "js")
  } catch (error) {
    return error
  }
  assert.fail("Expected a compile error")
}

describe("Playground diagnostics", () => {
  it("lists every syntax error with its line and column", () => {
    const found = diagnosticsFromError(errorFor("let a = ;\nlet b = 2;\nlet c = 3 +;\n"))
    assert.deepEqual(found.map(({ line, column }) => [line, column]), [[1, 9], [3, 12]])
    assert.match(found[0].text, /^Expected /)
  })

  it("reads the position and reason of a type error", () => {
    const [found] = diagnosticsFromError(errorFor("let count = 1;\nprint(cuont);\n"))
    assert.equal(found.line, 2)
    assert.equal(found.column, 7)
    assert.equal(found.text, "Identifier cuont not declared. Did you mean count?")
  })

  it("returns nothing for an error without a position", () => {
    assert.deepEqual(diagnosticsFromError(new Error("Something else")), [])
    assert.deepEqual(diagnosticsFromError(undefined), [])
  })

  it("underlines the whole word at the position", () => {
    const source = "let count = 1;\nprint(cuont);\n"
    const ranges = rangesForDiagnostics(source, diagnosticsFromError(errorFor(source)))
    assert.deepEqual(ranges.map(r => source.slice(r.start, r.end)), ["cuont"])
  })

  it("underlines one character when the position is not on a word", () => {
    const source = "let a = ;\n"
    const ranges = rangesForDiagnostics(source, [{ line: 1, column: 9 }])
    assert.deepEqual(ranges, [{ start: 8, end: 9 }])
  })

  it("moves back from the end of a line, and skips lines that do not exist", () => {
    const source = "let x = 5"
    assert.deepEqual(rangesForDiagnostics(source, [{ line: 1, column: 10 }]), [{ start: 8, end: 9 }])
    assert.deepEqual(rangesForDiagnostics(source, [{ line: 9, column: 1 }, { line: 2, column: 1 }]), [])
  })

  it("keeps ranges sorted and drops overlaps", () => {
    const source = "foo bar\n"
    const ranges = rangesForDiagnostics(source, [{ line: 1, column: 5 }, { line: 1, column: 1 }, { line: 1, column: 2 }])
    assert.deepEqual(ranges, [{ start: 0, end: 3 }, { start: 4, end: 7 }])
  })

  it("finds the offset of a line and column", () => {
    const source = "ab\ncde\nf"
    assert.equal(offsetOf(source, 1, 1), 0)
    assert.equal(offsetOf(source, 2, 3), 5)
    assert.equal(offsetOf(source, 3, 1), 7)
    assert.equal(offsetOf(source, 99, 1), source.length)
  })
})
