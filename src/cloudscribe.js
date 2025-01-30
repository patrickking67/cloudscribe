import * as ohm from "ohm-js";
import fs from "fs";

// Load the CloudScribe grammar
const cloudScribeGrammar = ohm.grammar(fs.readFileSync("src/cloudscribe.ohm", "utf-8"));

// Memory storage for variable assignments
const memory = {};

// Define semantic operations for execution
const interpreter = cloudScribeGrammar.createSemantics().addOperation("exec", {
  Program(statements) {
    statements.children.forEach(stmt => stmt.exec());
  },
  
  // Variable assignment
  Assignment(id, _eq, exp, _semicolon) {
    memory[id.sourceString] = exp.exec();
  },
  
  // Command execution
  Command(id, _open, args, _close, _semicolon) {
    console.log(`Executing command: ${id.sourceString} with arguments`, args.exec());
  },
  
  // If-else statement handling
  IfStatement_ifElse(_if, condition, ifBlock, _else, elseBlock) {
    if (condition.exec()) {
      ifBlock.exec();
    } else {
      elseBlock.exec();
    }
  },
  
  // If-only statement handling
  IfStatement_ifOnly(_if, condition, ifBlock) {
    if (condition.exec()) {
      ifBlock.exec();
    }
  },
  
  // Loop handling
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
  
  // Print statement
  PrintStatement(_print, exp, _semicolon) {
    console.log(exp.exec());
  },
  
  // Arithmetic operations
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
  
  // Range expressions
  range_exp(_range, _open, start, _comma, end, _close) {
    return [start.exec(), end.exec()];
  },
  
  // List expressions
  list_exp(_open, first, _comma, rest, _close) {
    return [first.exec(), ...rest.children.map(item => item.exec())];
  },
  
  // Expression lists for commands
  ExpList(first, _comma, rest) {
    return [first.exec(), ...rest.children.map(item => item.exec())];
  },
  
  // String literals
  str_lit(_open, content, _close) {
    return content.sourceString;
  },
  
  // Numeric literals
  num_lit(_digits, _decimal, _rest) {
    return Number(this.sourceString);
  },
  
  // Block execution
  Block(_open, statements, _close) {
    statements.children.forEach(stmt => stmt.exec());
  },
  
  // Variable lookup
  id(_first, _rest) {
    return memory[this.sourceString] || 0;
  },
});

// Read input file from CLI
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