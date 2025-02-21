import { describe, it } from "node:test";
import assert from "node:assert/strict";
import parse from "../src/parser.js";

const syntaxChecks = [
  ["simple variable declaration", "let x = 10;"],
  ["constant declaration", "const pi = 3.14;"],
  ["arithmetic expression", "let x = (5 + 3) * 2;"],
  ["function declaration", "function add(x: int, y: int): int { return x + y; }"],
  ["task declaration", "task backup { let x = 1; }"],
  ["if statement", "if x { let y = 1; }"],
  ["if-else statement", "if x { let y = 1; } else { let y = 2; }"],
  ["while loop", "while true { let x = 1; }"],
  ["for loop", "for i in x { let y = 1; }"],
  ["array literal", "let a = [1, 2, 3];"],
  ["function call", "foo(a, b);"],
  ["return statement", "return x;"],
  ["empty return", "return;"],
  ["increment", "x++;"],
  ["decrement", "x--;"],
  ["nested array access", "x[y[z]];"],
  ["chained member access", "x.y.z;"],
  ["complex expression", "let x = (a + b) * (c - d) / 2;"],
  ["boolean operations", "let x = true && !false || true;"],
  ["nested function calls", "f(g(h(x)));"]
];

const syntaxErrors = [
  ["empty program", "", /Expected/],
  ["missing semicolon", "let x = 5", /Expected ";"/],
  ["bad number", "x = 2..3;", /Expected/],
  ["missing right operand", "x = 2 +;", /Expected/],
  ["missing left operand", "x = + 2;", /Expected/],
  ["missing identifier", "let = 5;", /Expected a letter/],
  ["missing parameters", "function f {}", /Expected "\("/],
  ["bad parameter", "function f(x y) {}", /Expected ":"/],
  ["missing body", "if x", /Expected "{"/],
  ["malformed string", 'let x = "hello;', /Expected "\\""$/],
  ["invalid character", "let #x = 1;", /Expected a letter/],
  ["missing closing bracket", "let x = [1, 2, 3;", /Expected/],
  ["invalid task syntax", "task { return; }", /Expected a letter/],
  ["missing function name", "function() {}", /Expected a letter/],
  ["invalid array access", "x[];", /Expected/],
  ["invalid member access", "x.;", /Expected a letter/],
  ["double operator", "x + + y;", /Expected/],
  ["missing operand between operators", "x + * y;", /Expected/],
  ["unclosed function call", "f(x;", /Expected/],
  ["invalid type declaration", "function f(x: ?) {}", /Expected a letter/]
];

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`accepts ${scenario}`, () => {
      assert.ok(parse(source).succeeded());
    });
  }
  for (const [scenario, source, errorPattern] of syntaxErrors) {
    it(`rejects ${scenario}`, () => {
      assert.throws(() => parse(source), errorPattern);
    });
  }
});