/** Creates a program node containing top-level statements. */
export function program(statements) {
  return { kind: "Program", statements }
}

/** Creates a variable declaration binding a variable to an initializer expression. */
export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer }
}

/** Creates a variable entity with a name, mutability flag, and type. */
export function variable(name, mutable, type) {
  return { kind: "Variable", name, mutable, type }
}

/** Creates a function declaration wrapping a function entity. */
export function functionDeclaration(fun) {
  return { kind: "FunctionDeclaration", fun }
}

/** Creates a task declaration wrapping a task entity. */
export function taskDeclaration(task) {
  return { kind: "TaskDeclaration", task }
}

/** Creates a task entity — the primary automation abstraction. */
export function task(name, body) {
  return { kind: "Task", name, body }
}

/** Creates a function entity with parameters, body, and return type. */
export function fun(name, params, body, type) {
  return { kind: "Function", name, params, body, type }
}

/** Creates a function parameter with a name and type. */
export function param(name, type) {
  return { kind: "Parameter", name, type }
}

/** Creates a function type signature: (paramTypes) -> returnType. */
export function functionType(paramTypes, returnType) {
  return { kind: "FunctionType", paramTypes, returnType }
}

/** Creates an array type wrapping a base element type. */
export function arrayType(baseType) {
  return { kind: "ArrayType", baseType }
}

/** Creates an optional type (T?) wrapping a base type. */
export function optionalType(baseType) {
  baseType = baseType || anyType;
  return { kind: "OptionalType", baseType }
}

/** Creates a ternary conditional expression: test ? consequent : alternate. */
export function conditional(test, consequent, alternate, type) {
  return { kind: "Conditional", test, consequent, alternate, type }
}

/** Creates an assignment statement: target = source. */
export function assignment(target, source) {
  return { kind: "Assignment", target, source }
}

/** Creates a binary expression node (arithmetic, logical, comparison, etc.). */
export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type }
}

/** Creates a unary expression node (negation, logical not, some). */
export function unary(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type }
}

/** Creates a post-increment statement: variable++. */
export function increment(variable) {
  return { kind: "Increment", variable }
}

/** Creates a post-decrement statement: variable--. */
export function decrement(variable) {
  return { kind: "Decrement", variable }
}

/** Creates a print statement node. */
export function printStatement(argument) {
  return { kind: "PrintStatement", argument }
}

/** Creates an if-else statement with consequent and alternate blocks. */
export function ifStatement(test, consequent, alternate) {
  return { kind: "IfStatement", test, consequent, alternate }
}

/** Creates an if statement without an else branch. */
export function shortIfStatement(test, consequent) {
  return { kind: "ShortIfStatement", test, consequent }
}

/** Creates a break statement for exiting loops. */
export function breakStatement() {
  return { kind: "BreakStatement" }
}

/** Creates a return statement with an expression value. */
export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression }
}

/** Creates a return statement with no value. */
export function shortReturnStatement() {
  return { kind: "ShortReturnStatement" }
}

/** Creates a while loop with a boolean test and body. */
export function whileStatement(test, body) {
  return { kind: "WhileStatement", test, body }
}

/** Creates a for-in loop iterating over a collection. */
export function forStatement(iterator, collection, body) {
  return { kind: "ForStatement", iterator, collection, body }
}

/** Creates an array literal expression, inferring the element type. */
export function arrayExpression(elements) {
  const baseType = elements.length > 0 ? elements[0].type : anyType;
  return { 
    kind: "ArrayExpression", 
    elements, 
    type: arrayType(baseType)
  }
}

/** Creates a function call expression with a callee and arguments. */
export function functionCall(callee, args) {
  return { 
    kind: "FunctionCall", 
    callee, 
    args, 
    type: callee.type?.returnType || voidType 
  }
}

/** Creates an array subscript expression: array[index]. */
export function subscript(array, index) {
  return { 
    kind: "SubscriptExpression", 
    array, 
    index, 
    type: array.type?.baseType || anyType 
  }
}

/** Creates a member access expression: object.field. */
export function memberExpression(object, field) {
  return { kind: "MemberExpression", object, field, type: object.type || anyType }
}

export const intType = "int"
export const stringType = "string"
export const booleanType = "boolean"
export const voidType = "void"
export const anyType = "any"

export const standardLibrary = Object.freeze({
  print: {
    kind: "Function",
    name: "print",
    type: { kind: "FunctionType", paramTypes: [anyType], returnType: voidType },
    intrinsic: true
  }
})

Number.prototype.type = intType
String.prototype.type = stringType
Boolean.prototype.type = booleanType