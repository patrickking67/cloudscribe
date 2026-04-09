/**
 * Code generator — transpiles the optimized CloudScribe IR into JavaScript.
 * @module generator
 */
import { voidType } from "./core.js"

/**
 * Generates JavaScript source code from an optimized CloudScribe program AST.
 * @param {object} program - The optimized program AST.
 * @returns {string} The generated JavaScript source code.
 */
export default function generate(program) {
  const out = []
  const map = new Map()

  function jsName(e) {
    if (!map.has(e.name)) map.set(e.name, map.size)
    return `${e.name}_${map.get(e.name)}`
  }

  function exp(e) {
    if (e == null) return ""
    if (typeof e === "number" || typeof e === "boolean") return String(e)
    if (typeof e === "string") return e
    if (e.name) return jsName(e)
    switch (e.kind) {
      case "BinaryExpression":
        return `(${exp(e.left)} ${e.op} ${exp(e.right)})`
      case "UnaryExpression":
        return `${e.op}(${exp(e.operand)})`
      case "Conditional":
        return `(${exp(e.test)} ? ${exp(e.consequent)} : ${exp(e.alternate)})`
      case "SubscriptExpression":
        return `${exp(e.array)}[${exp(e.index)}]`
      case "MemberExpression":
        return `${exp(e.object)}.${e.field}`
      case "ArrayExpression":
        return `[${e.elements.map(exp).join(", ")}]`
      case "FunctionCall":
        return `${exp(e.callee)}(${e.args.map(exp).join(", ")})`
      default:
        throw new Error(`generator exp: unhandled expression kind ${e.kind}`)
    }
  }

  function gen(node) {
    switch (node.kind) {
      case "Program":
        node.statements.forEach(gen)
        break
      case "VariableDeclaration": {
        const keyword = node.variable.mutable === false ? "const" : "let"
        out.push(`${keyword} ${jsName(node.variable)} = ${exp(node.initializer)};`)
        break
      }
      case "Assignment":
        out.push(`${exp(node.target)} = ${exp(node.source)};`)
        break
      case "PrintStatement":
        out.push(`console.log(${exp(node.argument)});`)
        break
      case "IfStatement":
        out.push(`if (${exp(node.test)}) {`)
        node.consequent.forEach(gen)
        out.push(`} else {`)
        node.alternate.forEach(gen)
        out.push(`}`)
        break
      case "ShortIfStatement":
        out.push(`if (${exp(node.test)}) {`)
        node.consequent.forEach(gen)
        out.push(`}`)
        break
      case "WhileStatement":
        out.push(`while (${exp(node.test)}) {`)
        node.body.forEach(gen)
        out.push(`}`)
        break
      case "ForStatement":
        out.push(`for (const ${jsName(node.iterator)} of ${exp(node.collection)}) {`)
        node.body.forEach(gen)
        out.push(`}`)
        break
      case "TaskDeclaration": {
        const t = node.task
        out.push(`// task: ${t.name}`)
        out.push(`{`)
        t.body.forEach(gen)
        out.push(`}`)
        break
      }
      case "FunctionDeclaration": {
        const f = node.fun
        out.push(`function ${jsName(f)}(${f.params.map(p => jsName(p)).join(", ")}) {`)
        f.body.forEach(gen)
        out.push(`}`)
        break
      }
      case "Increment":
        out.push(`${exp(node.variable)}++;`)
        break
      case "Decrement":
        out.push(`${exp(node.variable)}--;`)
        break
      case "FunctionCall": {
        if (node.callee.intrinsic && node.callee.name === "print") {
          out.push(`console.log(${node.args.map(exp).join(", ")});`)
        } else {
          out.push(`${exp(node.callee)}(${node.args.map(exp).join(", ")});`)
        }
        break
      }
      case "ReturnStatement":
        out.push(`return ${exp(node.expression)};`)
        break
      case "ShortReturnStatement":
        out.push("return;")
        break
      case "BreakStatement":
        out.push("break;")
        break
      default:
        throw new Error(`generator: unhandled node kind ${node.kind}`)
    }
  }

  gen(program)
  return out.join("\n")
}
