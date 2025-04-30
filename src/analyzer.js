import * as core from "./core.js"

class Context {
  constructor({
    parent = null,
    locals = new Map(),
    inLoop = false,
    function: currentFunction = null,
    inTask = false
  }) {
    Object.assign(this, { parent, locals, inLoop, function: currentFunction, inTask })
  }

  add(name, entity) {
    this.locals.set(name, entity)
  }

  lookup(name) {
    return this.locals.get(name) || this.parent?.lookup(name)
  }

  static root() {
    return new Context({ locals: new Map(Object.entries(core.standardLibrary)) })
  }

  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() })
  }
}

export default function analyze(match) {
  let context = Context.root()

  function must(condition, message, errorLocation) {
    if (!condition) {
      const prefix = errorLocation.at.source.getLineAndColumnMessage()
      throw new Error(`${prefix}${message}`)
    }
  }

  function mustNotAlreadyBeDeclared(name, at) {
    must(!context.lookup(name), `Identifier ${name} already declared`, at)
  }

  function mustHaveBeenFound(entity, name, at) {
    must(entity, `Identifier ${name} not declared`, at)
  }

  function mustHaveBooleanType(e, at) {
    must(e.type === core.booleanType, "Expected a boolean", at)
  }

  function mustHaveIntType(e, at) {
    must(e.type === core.intType, "Expected an integer", at)
  }

  function mustBeMutable(e, at) {
    must(e.mutable !== false, "Cannot assign to immutable variable", at)
  }

  function mustBeInLoop(at) {
    must(context.inLoop, "Break can only appear in a loop", at)
  }

  function mustBeInFunctionOrTask(at) {
    must(context.function || context.inTask, "Return can only appear in a function or task", at)
  }

  function mustBeAnArray(e, at) {
    must(e.type?.kind === "ArrayType", "Expected an array", at)
  }

  function mustBeCallable(entity, at) {
    must(entity?.kind === "Function" || entity?.type?.kind === "FunctionType", 
      "Expected a function", at)
  }

  function mustHaveCorrectArgumentCount(callee, args, at) {
    const expected = callee.params?.length || callee.type?.paramTypes?.length || 0
    must(args.length === expected, 
      `Wrong number of arguments: expected ${expected}, got ${args.length}`, at)
  }

  const builder = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return core.program(statements.children.map(s => s.rep()))
    },

    Statement_increment(primary, _op, _semicolon) {
      const variable = primary.rep()
      mustHaveIntType(variable, { at: primary })
      return core.increment(variable)
    },

    Statement_decrement(primary, _op, _semicolon) {
      const variable = primary.rep()
      mustHaveIntType(variable, { at: primary })
      return core.decrement(variable)
    },

    Statement_assign(primary, _eq, exp, _semicolon) {
      const target = primary.rep()
      mustBeMutable(target, { at: primary })
      const source = exp.rep()
      return core.assignment(target, source)
    },

    Statement_exp(exp, _semicolon) {
      return exp.rep()
    },

    Statement_break(_break, _semicolon) {
      mustBeInLoop({ at: _break })
      return core.breakStatement()
    },

    Statement_return(_return, exp, _semicolon) {
      mustBeInFunctionOrTask({ at: _return })
      const value = exp.rep()
      return core.returnStatement(value)
    },

    Statement_shortreturn(_return, _semicolon) {
      mustBeInFunctionOrTask({ at: _return })
      return core.shortReturnStatement()
    },

    VarDecl(_keyword, id, _eq, exp, _semicolon) {
      const name = id.sourceString
      mustNotAlreadyBeDeclared(name, { at: id })
      const initializer = exp.rep()
      const mutable = _keyword.sourceString === "let"
      const variable = core.variable(name, mutable, initializer.type)
      context.add(name, variable)
      return core.variableDeclaration(variable, initializer)
    },

    FunDecl(_function, id, params, _colon, type, block) {
      const name = id.sourceString
      mustNotAlreadyBeDeclared(name, { at: id })
      const returnType = type.children?.[0]?.rep() || core.voidType
      const fun = core.fun(name, [], [], returnType)
      context.add(name, fun)
      
      context = context.newChildContext({ function: fun })
      fun.params = params.rep()
      const paramTypes = fun.params.map(p => p.type)
      fun.type = core.functionType(paramTypes, returnType)
      fun.body = block.rep()
      context = context.parent
      return core.functionDeclaration(fun)
    },

    TaskDecl(_task, id, block) {
      const name = id.sourceString
      mustNotAlreadyBeDeclared(name, { at: id })
      const task = core.task(name, [])
      context.add(name, task)
      
      context = context.newChildContext({ inTask: true })
      task.body = block.rep()
      context = context.parent
      return core.taskDeclaration(task)
    },

    Params(_open, paramList, _close) {
      return paramList.asIteration().children.map(p => p.rep())
    },

    Param(id, _colon, type) {
      const name = id.sourceString
      mustNotAlreadyBeDeclared(name, { at: id })
      const paramType = type.rep()
      const param = core.param(name, paramType)
      context.add(name, param)
      return param
    },

    Type_optional(baseType, _questionMark) {
      return core.optionalType(baseType.rep())
    },

    Type_array(_left, baseType, _right) {
      return core.arrayType(baseType.rep())
    },

    Type_function(_left, types, _right, _arrow, type) {
      const paramTypes = types.asIteration().children.map(t => t.rep())
      const returnType = type.rep()
      return core.functionType(paramTypes, returnType)
    },

    Type_id(id) {
      return id.sourceString
    },

    IfStmt_long(_if, exp, block1, _else, block2) {
      const test = exp.rep()
      mustHaveBooleanType(test, { at: exp })
      
      context = context.newChildContext()
      const consequent = block1.rep()
      context = context.parent
      
      context = context.newChildContext()
      const alternate = block2.rep()
      context = context.parent
      
      return core.ifStatement(test, consequent, alternate)
    },

    IfStmt_short(_if, exp, block) {
      const test = exp.rep()
      mustHaveBooleanType(test, { at: exp })
      
      context = context.newChildContext()
      const consequent = block.rep()
      context = context.parent
      
      return core.shortIfStatement(test, consequent)
    },

    LoopStmt_collection(_for, id, _in, exp, block) {
      const collection = exp.rep()
      mustBeAnArray(collection, { at: exp })
      
      context = context.newChildContext({ inLoop: true })
      const iterator = core.variable(id.sourceString, false, collection.type.baseType)
      context.add(id.sourceString, iterator)
      
      const body = block.rep()
      context = context.parent
      
      return core.forStatement(iterator, collection, body)
    },

    LoopStmt_while(_while, exp, block) {
      const test = exp.rep()
      mustHaveBooleanType(test, { at: exp })
      
      context = context.newChildContext({ inLoop: true })
      const body = block.rep()
      context = context.parent
      
      return core.whileStatement(test, body)
    },

    Block(_open, statements, _close) {
      return statements.children.map(s => s.rep())
    },

    Exp_conditional(exp1, _questionMark, exp2, _colon, exp3) {
      const test = exp1.rep()
      mustHaveBooleanType(test, { at: exp1 })
      
      const consequent = exp2.rep()
      const alternate = exp3.rep()
      
      return core.conditional(test, consequent, alternate, consequent.type)
    },

    Exp1_unwrapelse(exp1, _op, exp2) {
      const optional = exp1.rep()
      const alternate = exp2.rep()
      return core.binary("??", optional, alternate, alternate.type)
    },

    Exp2_or(exp1, _op, exp2) {
      const left = exp1.rep()
      mustHaveBooleanType(left, { at: exp1 })
      
      const right = exp2.rep()
      mustHaveBooleanType(right, { at: exp2 })
      
      return core.binary("||", left, right, core.booleanType)
    },

    Exp3_and(exp1, _op, exp2) {
      const left = exp1.rep()
      mustHaveBooleanType(left, { at: exp1 })
      
      const right = exp2.rep()
      mustHaveBooleanType(right, { at: exp2 })
      
      return core.binary("&&", left, right, core.booleanType)
    },

    Exp4_bitor(exp1, _op, exp2) {
      const left = exp1.rep()
      const right = exp2.rep()
      return core.binary("|", left, right, left.type)
    },

    Exp5_bitxor(exp1, _op, exp2) {
      const left = exp1.rep()
      const right = exp2.rep()
      return core.binary("^", left, right, left.type)
    },

    Exp6_bitand(exp1, _op, exp2) {
      const left = exp1.rep()
      const right = exp2.rep()
      return core.binary("&", left, right, left.type)
    },

    Exp7_compare(exp1, op, exp2) {
      const left = exp1.rep()
      const right = exp2.rep()
      return core.binary(op.sourceString, left, right, core.booleanType)
    },

    Exp8_add(exp1, op, exp2) {
      const left = exp1.rep()
      const right = exp2.rep()
      const operator = op.sourceString
      
      if (operator === "+") {
        if (left.type === core.stringType || right.type === core.stringType) {
          return core.binary(operator, left, right, core.stringType)
        } else if (left.type === core.intType && right.type === core.intType) {
          return core.binary(operator, left, right, core.intType)
        } else {
          must(false, 
            `Expected compatible types for '+' operation, got ${left.type} and ${right.type}`, 
            { at: exp2 }
          )
        }
      } else {
        must(
          left.type === core.intType && right.type === core.intType,
          `Expected ${core.intType} for '-' operation`,
          { at: exp2 }
        )
        return core.binary(operator, left, right, left.type)
      }
    },

    Exp9_multiply(exp1, op, exp2) {
      const left = exp1.rep()
      const right = exp2.rep()
      
      if (op.sourceString === "*") {
        must(
          left.type === core.intType && right.type === core.intType,
          `Expected ${core.intType} for '*' operation`,
          { at: exp2 }
        )
      } else if (op.sourceString === "/") {
        must(
          left.type === core.intType && right.type === core.intType,
          `Expected ${core.intType} for '/' operation`,
          { at: exp2 }
        )
      } else {
        must(
          left.type === core.intType && right.type === core.intType,
          `Expected ${core.intType} for '%' operation`,
          { at: exp2 }
        )
      }
      
      return core.binary(op.sourceString, left, right, left.type)
    },

    Exp10_power(exp1, _op, exp2) {
      const left = exp1.rep()
      const right = exp2.rep()
      
      must(
        left.type === core.intType && right.type === core.intType,
        `Expected ${core.intType} for '**' operation`,
        { at: exp2 }
      )
      
      return core.binary("**", left, right, left.type)
    },

    Exp11_unary(op, exp) {
      const operand = exp.rep()
      let type = operand.type;
      
      if (op.sourceString === '!') {
        must(operand.type === core.booleanType, "Expected a boolean for '!' operation", { at: exp })
        type = core.booleanType;
      } else if (op.sourceString === 'some') {
        type = core.optionalType(operand.type);
      } else if (op.sourceString === '-') {
        must(operand.type === core.intType, "Expected an integer for '-' operation", { at: exp })
        type = core.intType;
      }
      
      return core.unary(op.sourceString, operand, type)
    },

    Primary_call(primary, _open, args, _close) {
      const callee = primary.rep()
      mustBeCallable(callee, { at: primary })
      const argList = args.asIteration().children.map(a => a.rep())
      mustHaveCorrectArgumentCount(callee, argList, { at: args })
      return core.functionCall(callee, argList)
    },

    Primary_subscript(primary, _open, exp, _close) {
      const array = primary.rep()
      const index = exp.rep()
      mustBeAnArray(array, { at: primary })
      mustHaveIntType(index, { at: exp })
      return core.subscript(array, index)
    },

    Primary_member(primary, _dot, id) {
      const object = primary.rep();
      const fieldName = id.sourceString;
      return core.memberExpression(object, fieldName);
    },

    Primary_id(id) {
      const name = id.sourceString
      const entity = context.lookup(name)
      mustHaveBeenFound(entity, name, { at: id })
      return entity
    },

    Primary_arrayexp(_open, exps, _close) {
      const elements = exps.asIteration().children.map(e => e.rep())
      return core.arrayExpression(elements)
    },

    Primary_parens(_open, exp, _close) {
      return exp.rep()
    },

    intlit(_) {
      return Number(this.sourceString)
    },

    floatlit(_whole, _point, _fraction, _e, _sign, _exponent) {
      return Number(this.sourceString)
    },

    stringlit(_open, _chars, _close) {
      return this.sourceString
    },

    true(_) {
      return true
    },

    false(_) {
      return false
    },

    _iter(...children) {
      return children.map(child => child.rep())
    },

    NonemptyListOf(first, _sep, rest) {
      return [first.rep(), ...rest.children.map(r => r.rep())]
    },
  })

  return builder(match).rep()
}