import assert from 'node:assert';
import test from 'node:test';
import { cloudScribeGrammar } from '../src/cloudscribe.js'; // ✅ Importing grammar

// Create semantics for evaluation
const semantics = cloudScribeGrammar.createSemantics();
semantics.addOperation('eval', {
  Program(statements) {
    return statements.children.map(stmt => stmt.eval()).join("\n");
  },
  
  Assignment(id, _eq, exp, _semicolon) {
    return `${id.sourceString} = ${exp.eval()}`;
  },
  
  PrintStatement(_print, exp, _semicolon) {
    return `PRINT ${exp.eval()}`;
  },
  
  Exp_addition(left, _plus, right) {
    return `${left.eval()} + ${right.eval()}`;
  },
  
  num_lit(_digits, _decimal, _rest) {
    return this.sourceString;
  },
  
  str_lit(_open, content, _close) {
    return content.sourceString;
  }
});

// ✅ Test Cases
test('CloudScribe Compiler - Assignment Test', () => {
  const match = cloudScribeGrammar.match('x = 5 + 3;');
  assert.ok(match.succeeded(), 'Parsing failed for assignment');
  const result = semantics(match).eval();
  assert.strictEqual(result.trim(), 'x = 5 + 3');
});

test('CloudScribe Compiler - Print Test', () => {
  const match = cloudScribeGrammar.match('print 42;');
  assert.ok(match.succeeded(), 'Parsing failed for print');
  const result = semantics(match).eval();
  assert.strictEqual(result.trim(), 'PRINT 42');
});
