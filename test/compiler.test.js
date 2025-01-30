import assert from 'node:assert';
import test from 'node:test';
import * as ohm from 'ohm-js';
import fs from 'fs';

// Load the CloudScribe grammar from file
const grammar = ohm.grammar(fs.readFileSync('src/cloudscribe.ohm', 'utf8'));

// Create semantics for evaluating parsed statements
const semantics = grammar.createSemantics();
semantics.addOperation('eval', {
  // Evaluates a sequence of statements
  Program(statements) {
    return statements.children.map(stmt => stmt.eval()).join("\n");
  },
  
  // Handles assignment operations
  Assignment(id, _eq, exp, _semicolon) {
    return `${id.sourceString} = ${exp.eval()}`;
  },
  
  // Handles print statements
  PrintStatement(_print, exp, _semicolon) {
    return `PRINT ${exp.eval()}`;
  },
  
  // Handles addition expressions
  Exp_addition(left, _plus, right) {
    return `${left.eval()} + ${right.eval()}`;
  },
  
  // Evaluates numeric literals
  num_lit(_digits, _decimal, _rest) {
    return this.sourceString;
  },
  
  // Evaluates string literals
  str_lit(_open, content, _close) {
    return content.sourceString;
  }
});

// Test cases to verify correctness of parsing and evaluation

test('CloudScribe Compiler - Assignment Test', () => {
  const match = grammar.match('x = 5 + 3;');
  assert.ok(match.succeeded(), 'Parsing failed for assignment');
  const result = semantics(match).eval();
  assert.strictEqual(result.trim(), 'x = 5 + 3'); // Formatting consistency
});

test('CloudScribe Compiler - Print Test', () => {
  const match = grammar.match('print 42;');
  assert.ok(match.succeeded(), 'Parsing failed for print');
  const result = semantics(match).eval();
  assert.strictEqual(result.trim(), 'PRINT 42'); // Formatting consistency
});
