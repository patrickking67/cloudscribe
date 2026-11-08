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
  // Innermost function or task boundary, used to lower `return` inside a task.
  const returnTargets = []

  function jsName(e) {
    if (!map.has(e.name)) map.set(e.name, map.size)
    return `${e.name}_${map.get(e.name)}`
  }

  function exp(e) {
    if (e == null) return ""
    if (typeof e === "number" || typeof e === "boolean") return String(e)
    if (typeof e === "string") return e
    // The built-in print has no JavaScript binding of its own, so a reference
    // to it (as a value or inside an expression) must point at console.log.
    if (e.intrinsic && e.name === "print") return "console.log"
    if (e.name) return jsName(e)
    switch (e.kind) {
      case "BinaryExpression": {
        // JavaScript rejects a unary operator directly before `**`, so wrap it.
        const needsParens = e.op === "**" &&
          (e.left?.kind === "UnaryExpression" || (typeof e.left === "number" && e.left < 0))
        const left = needsParens ? `(${exp(e.left)})` : exp(e.left)
        return `(${left} ${e.op} ${exp(e.right)})`
      }
      case "UnaryExpression":
        // An optional is the plain value at runtime, so `some x` is just `x`.
        if (e.op === "some") return exp(e.operand)
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
    // The optimizer can fold an expression statement down to a literal.
    if (typeof node !== "object" || node === null) {
      out.push(`${exp(node)};`)
      return
    }
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
      case "Block":
        out.push(`{`)
        node.statements.forEach(gen)
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
        const open = out.push(`{`) - 1
        // A task compiles to a block, where `return` is illegal. Returns in the
        // task become `break` to a label that is only added when needed.
        const target = { task: t, label: null }
        returnTargets.push(target)
        t.body.forEach(gen)
        returnTargets.pop()
        if (target.label) out[open] = `${target.label}: {`
        out.push(`}`)
        break
      }
      case "FunctionDeclaration": {
        const f = node.fun
        out.push(`function ${jsName(f)}(${f.params.map(p => jsName(p)).join(", ")}) {`)
        returnTargets.push({ task: null })
        f.body.forEach(gen)
        returnTargets.pop()
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
      case "ReturnStatement": {
        const label = taskLabel()
        if (label) {
          out.push(`${exp(node.expression)};`)
          out.push(`break ${label};`)
        } else {
          out.push(`return ${exp(node.expression)};`)
        }
        break
      }
      case "ShortReturnStatement": {
        const label = taskLabel()
        out.push(label ? `break ${label};` : "return;")
        break
      }
      case "BreakStatement":
        out.push("break;")
        break
      case "BinaryExpression":
      case "UnaryExpression":
      case "Conditional":
      case "SubscriptExpression":
      case "MemberExpression":
      case "ArrayExpression":
      case "Variable":
      case "Parameter":
        // A bare expression used as a statement, such as `x + 1;`.
        out.push(`${exp(node)};`)
        break
      default:
        throw new Error(`generator: unhandled node kind ${node.kind}`)
    }
  }

  function taskLabel() {
    const target = returnTargets.at(-1)
    if (!target?.task) return null
    target.label ??= jsName(target.task)
    return target.label
  }

  gen(program)
  return out.join("\n")
}
