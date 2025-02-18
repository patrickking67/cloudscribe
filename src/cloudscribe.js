import * as ohm from "ohm-js";
import fs from "fs";

// Load CloudScribe grammar
export const cloudScribeGrammar = ohm.grammar(fs.readFileSync("src/cloudscribe.ohm", "utf-8"));

// Memory storage for variables
const memory = {};

// Define execution semantics
const interpreter = cloudScribeGrammar.createSemantics().addOperation("exec", {
  Program(statements) {
    statements.children.forEach(stmt => stmt.exec());
  },

  Assignment(id, _eq, exp, _semicolon) {
    memory[id.sourceString] = exp.exec();
  },

  Command(id, _open, args, _close, _semicolon) {
    console.log(`Executing command: ${id.sourceString} with arguments`, args.exec());
  },

  IfStatement_ifElse(_if, condition, ifBlock, _else, elseBlock) {
    if (condition.exec()) {
      ifBlock.exec();
    } else {
      elseBlock.exec();
    }
  },

  IfStatement_ifOnly(_if, condition, ifBlock) {
    if (condition.exec()) {
      ifBlock.exec();
    }
  },

  LoopStatement(_for, id, _in, iterable, block) {
    let values;
    if (iterable.children.length === 1) {
      values = memory[iterable.sourceString] || [];
    } else if (iterable.ctorName === "range_exp") {
      const [start, end] = iterable.exec();
      values = [...Array(end - start + 1).keys()].map(i => i + start);
    } else {
      values = iterable.exec();
    }
    values.forEach(val => {
      memory[id.sourceString] = val;
      block.exec();
    });
  },

  PrintStatement(_print, exp, _semicolon) {
    console.log(exp.exec());
  },

  Exp_equality(left, _eq, right) {
    return left.exec() === right.exec();
  },
  Exp_addition(left, _plus, right) {
    return left.exec() + right.exec();
  },
  Exp_subtraction(left, _minus, right) {
    return left.exec() - right.exec();
  },
  Exp_multiplication(left, _times, right) {
    return left.exec() * right.exec();
  },
  Exp_division(left, _divide, right) {
    return left.exec() / right.exec();
  },

  range_exp(_range, _open, start, _comma, end, _close) {
    return [start.exec(), end.exec()];
  },

  list_exp(_open, first, _comma, rest, _close) {
    return [first.exec(), ...rest.children.map(item => item.exec())];
  },

  ExpList(first, _comma, rest) {
    return [first.exec(), ...rest.children.map(item => item.exec())];
  },

  str_lit(_open, content, _close) {
    return content.sourceString;
  },

  num_lit(_digits, _decimal, _rest) {
    return Number(this.sourceString);
  },

  Block(_open, statements, _close) {
    statements.children.forEach(stmt => stmt.exec());
  },

  id(_first, _rest) {
    return memory[this.sourceString] || 0;
  },
});

// Prevent CLI execution when running tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const scriptFile = process.argv[2];
  if (!scriptFile) {
    console.error("Error: No input file provided.");
    process.exit(1);
  }

  const script = fs.readFileSync(scriptFile, "utf-8");
  const match = cloudScribeGrammar.match(script);

  if (match.failed()) {
    console.error("Syntax Error:", match.message);
  } else {
    interpreter(match).exec();
  }
}
