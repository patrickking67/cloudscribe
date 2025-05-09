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

  it("visits for‑loops, functions and tasks without mutation", () => {
    const src = `
      function add(a: int, b: int): int { return a + b; }
      task noop { let nums = [1,2]; for n in nums { print(n); } }
    `;
    const ir = opt(src);
    assert.equal(ir.statements.length, 2);
 
  })
});
