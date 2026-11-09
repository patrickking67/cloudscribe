// optimizer.test.js 
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import optimize from "../src/optimizer.js";

function opt(src) {
  return optimize(analyze(parse(src)));
}

describe("The optimizer", () => {
  const val = src => opt(src).statements[0].initializer;

  it("constant‑folds numeric addition", () => {
    const ir = opt("let x = 2 + 3;");
    assert.equal(ir.statements[0].initializer, 5);
  });

  it("simplifies boolean && and || for all short‑circuit branches", () => {
    const ir = opt(`
      let a = true && false;
      let b = false && true;
      let c = true || false;
      let d = false || true;
    `);
    const [a, b, c, d] = ir.statements.map(s => s.initializer);
    assert.equal(a, false);
    assert.equal(b, false);
    assert.equal(c, true);
    assert.equal(d, true);
  });

  it("folds constant conditional expressions for true/false", () => {
    const ir = opt("let y = true ? 1 : 2; let z = false ? 3 : 4;");
    assert.equal(ir.statements[0].initializer, 1);
    assert.equal(ir.statements[1].initializer, 4);
  });

  it("folds unary operations on literals", () => {
    const ir = opt("let n = -5; let b = !false; let o = some 7;");
    const [n, b, o] = ir.statements.map(s => s.initializer);
    assert.equal(n, -5);
    assert.equal(b, true);
    assert.equal(o, 7);
  });

  it("removes while false {...} as dead code", () => {
    const ir = opt("while false { let z = 1; }");
    assert.deepEqual(ir.statements, []);
  });

  
  it("constant‑folds arithmetic * / % and **", () => {
    assert.equal(val("let x = 4 * 2;"), 8);
    assert.equal(val("let x = 9 / 3;"), 3);
    assert.equal(val("let x = 10 % 4;"), 2);
    assert.equal(val("let x = 2 ** 3;"), 8);
  });

  it("folds comparison operators", () => {
    assert.equal(val("let x = 3 < 5;"), true);
    assert.equal(val("let x = 5 >= 8;"), false);
    assert.equal(val("let x = 4 == 4;"), true);
    assert.equal(val("let x = 4 != 4;"), false);
  });

  it("handles null‑coalesce (??) constant folding", () => {
    assert.equal(val("let x = some 7 ?? 10;"), 7);
    
  });

  it("does not fold string literals into invalid source text", () => {
    const init = val('let s = "a" + "b";');
    assert.equal(init.kind, "BinaryExpression");
    assert.equal(init.left, '"a"');
    assert.equal(init.right, '"b"');
    assert.equal(val('let s = "n=" + 1;').kind, "BinaryExpression");
  });

  it("splices a constant if branch into the enclosing block", () => {
    const ir = opt('if true { print(1); print(2); } else { print(3); } print(4);');
    assert.equal(ir.statements.length, 3);
    assert.ok(ir.statements.every(s => s.kind === "FunctionCall"));
    assert.deepEqual(ir.statements.map(s => s.args[0]), [1, 2, 4]);
  });

  it("splices the else branch of a constant false if", () => {
    const ir = opt('task t { if false { print(1); } else { print(2); } }');
    const body = ir.statements[0].task.body;
    assert.equal(body.length, 1);
    assert.equal(body[0].args[0], 2);
  });

  it("keeps a folded branch in its own block when it declares names", () => {
    const ir = opt('if true { let y = 2; print(y); } else { print(0); } let y = 3;');
    assert.equal(ir.statements.length, 2);
    assert.equal(ir.statements[0].kind, "Block");
    assert.equal(ir.statements[0].statements[0].kind, "VariableDeclaration");
    assert.equal(ir.statements[1].kind, "VariableDeclaration");
  });

  it("moves literal parts of an interpolated string into its text", () => {
    const ir = opt('let n = 3; let s = "a ${1 + 2} b ${n} c ${true} d ${"e"} f";');
    const s = ir.statements[1].initializer;
    assert.equal(s.kind, "InterpolatedString");
    assert.deepEqual(s.strings, ["a 3 b ", " c true d e f"]);
    assert.deepEqual(s.expressions, [ir.statements[0].variable]);
  });

  it("folds an interpolated string with only literal parts to a string literal", () => {
    assert.equal(val('let s = "x=${2 * 3}, ${"in ${!false}"}\\n";'), '"x=6, in true\\n"');
  });

  it("keeps the whole text when nothing in an interpolated string folds", () => {
    const ir = opt('let a = "x"; let b = "y"; let s = "${a}-${b}";');
    const s = ir.statements[2].initializer;
    assert.deepEqual(s.strings, ["", "-", ""]);
    assert.equal(s.expressions.length, 2);
  });

  it("visits for‑loops, functions and tasks without mutation", () => {
    const src = `
      function add(a: int, b: int): int { return a + b; }
      task noop { let nums = [1,2]; for n in nums { print(n); } }
    `;
    const ir = opt(src);
    assert.equal(ir.statements.length, 2);
 
  })
});
