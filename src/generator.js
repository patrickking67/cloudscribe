import { voidType } from "./core.js";

export default function generate(program) {
  const out = [];
  const map = new Map();
  const jsName = e => {
    const nm = e.name;
    if (!map.has(nm)) map.set(nm, map.size);
    return `${nm}_${map.get(nm)}`;
  };

  // expressions
  function exp(e) {
    if (e == null) return "";
    if (typeof e === "number" || typeof e === "boolean") return e.toString();
    if (typeof e === "string") return e;
    if (e.name) return jsName(e);

    switch (e.kind) {
      case "BinaryExpression":
        return `${exp(e.left)} ${e.op} ${exp(e.right)}`;
      case "UnaryExpression":
        return `${e.op}${exp(e.operand)}`;
      case "Conditional":
        return `${exp(e.test)}?${exp(e.consequent)}:${exp(e.alternate)}`;
      case "SubscriptExpression":
        return `${exp(e.array)}[${exp(e.index)}]`;
      case "MemberExpression":
        return `${exp(e.object)}.${e.field}`;
      case "ArrayExpression":
        return `[${e.elements.map(exp).join(", ")}]`;
      default:
        throw new Error(`generator exp: unhandled expression kind ${e.kind}`);
    }
  }

  // statements
  function gen(node) {
    switch (node.kind) {
      case "Program":
        node.statements.forEach(gen);
        break;

      case "VariableDeclaration":
        const initCode = exp(node.initializer);
        const varName = jsName(node.variable);
        out.push(`let ${varName} = ${initCode};`);
        break;

      case "Assignment":
        out.push(`${exp(node.target)} = ${exp(node.source)};`);
        break;

      case "PrintStatement":
        out.push(`console.log(${exp(node.argument)});`);
        break;

      case "IfStatement":
        out.push(`if (${exp(node.test)}) {`);
        node.consequent.forEach(gen);
        out.push(`} else {`);
        node.alternate.forEach(gen);
        out.push(`}`);
        break;

      case "ShortIfStatement":
        out.push(`if (${exp(node.test)}) {`);
        node.consequent.forEach(gen);
        out.push(`}`);
        break;

      case "WhileStatement":
        out.push(`while (${exp(node.test)}) {`);
        node.body.forEach(gen);
        out.push(`}`);
        break;

      case "ForStatement":
        out.push(
          `for (const ${jsName(node.iterator)} of ${exp(node.collection)}) {`
        );
        node.body.forEach(gen);
        out.push(`}`);
        break;

      case "FunctionDeclaration": {
        const f = node.fun;
        const fnName = jsName(f);
        const params = f.params.map(p => jsName(p));
        out.push(`function ${fnName}(${params.join(", ")}) {`);
        f.body.forEach(gen);
        out.push(`}`);
        break;
      }

      case "FunctionCall": {
        const callCode = `${exp(node.callee)}(${node.args.map(exp).join(",")})`;
        if (node.callee.type.returnType === voidType) {
          out.push(`console.log(${node.args.map(exp).join(",")});`);
        } else {
          out.push(callCode + ";");
        }
        break;
      }

      case "ReturnStatement":
        out.push(`return ${exp(node.expression)};`);
        break;

      case "ShortReturnStatement":
        out.push("return;");
        break;

      case "BreakStatement":
        out.push("break;");
        break;

      default:
        throw new Error(`generator: unhandled node kind ${node.kind}`);
    }
  }

  gen(program);
  return out.join("\n");
}
