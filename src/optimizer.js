// optimizer.js – CloudScribe IR optimizations
import * as core from "./core.js";

export default function optimize(root) {
  return visit(root);
}


const BIN_OP = {
  "+":  (a, b) => a + b,
  "-":  (a, b) => a - b,
  "*":  (a, b) => a * b,
  "/":  (a, b) => a / b,
  "%":  (a, b) => a % b,
  "**": (a, b) => a ** b,
  "&&": (a, b) => a && b,
  "||": (a, b) => a || b,
  "??": (a, b) => (a ?? b),
  "==": (a, b) => a === b,
  "!=": (a, b) => a !== b,
  "<":  (a, b) => a < b,
  "<=": (a, b) => a <= b,
  ">":  (a, b) => a > b,
  ">=": (a, b) => a >= b,
};

function isLiteral(x) {
  return (
    typeof x === "number" ||
    typeof x === "string" ||
    typeof x === "boolean"
  );
}

function visit(node) {
  if (node == null || typeof node !== "object") return node;
  const fn = visitors[node.kind];
  return fn ? fn(node) : node;
}

function visitBlock(stmts) {
  const optim = stmts.flatMap(s => {
    const r = visit(s);
    return r == null ? [] : [r];
  });
  return optim === stmts ? stmts : optim;
}


function foldBinary(node) {
  const left = visit(node.left);
  const right = visit(node.right);
  const op = node.op;

  if (isLiteral(left) && isLiteral(right) && BIN_OP[op]) {
    return BIN_OP[op](left, right);
  }
  
}

const visitors = {
  Program(p) {
    const stmts = visitBlock(p.statements);
    return core.program(stmts);
  },

  VariableDeclaration(v) {
    const init = visit(v.initializer);
    return core.variableDeclaration(v.variable, init);
  },

 

  WhileStatement(w) {
    const test = visit(w.test);
    const body = visitBlock(w.body);
    if (test === false) return null;
  },

  ForStatement(f) {
    const coll = visit(f.collection);
    const body = visitBlock(f.body);
    return core.forStatement(f.iterator, coll, body);
  },

  FunctionDeclaration(fd) {
    const fn = fd.fun;
    const body = visitBlock(fn.body);
    const newFn = { ...fn, body };
    return core.functionDeclaration(newFn);
  },

  TaskDeclaration(td) {
    const t = td.task;
    const body = visitBlock(t.body);
    const newT = { ...t, body };
    return core.taskDeclaration(newT);
  },

  BinaryExpression: foldBinary,

  UnaryExpression(u) {
    const operand = visit(u.operand);
    const op = u.op;
    if (isLiteral(operand)) {
      switch (op) {
        case "-": return -operand;
        case "!": return !operand;
        case "some": return operand;
      }
    }
    
  },

  Conditional(c) {
    const test = visit(c.test);
    const cons = visit(c.consequent);
    const alt  = visit(c.alternate);
    if (isLiteral(test)) return test ? cons : alt;
  },



  ArrayExpression(ae) {
    const elems = ae.elements.map(visit);
    return core.arrayExpression(elems);
  },

  FunctionCall(fc) {
    const callee = visit(fc.callee);
    const args = fc.args.map(visit);
    return core.functionCall(callee, args);
  },

  ReturnStatement(r) {
    return core.returnStatement(visit(r.expression));
  },

  
};
