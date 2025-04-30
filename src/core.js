export function program(statements) {
  return { kind: "Program", statements }
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer }
}

export function variable(name, mutable, type) {
  return { kind: "Variable", name, mutable, type }
}

export function functionDeclaration(fun) {
  return { kind: "FunctionDeclaration", fun }
}

export function taskDeclaration(task) {
  return { kind: "TaskDeclaration", task }
}

export function task(name, body) {
  return { kind: "Task", name, body }
}

export function fun(name, params, body, type) {
  return { kind: "Function", name, params, body, type }
}

export function param(name, type) {
  return { kind: "Parameter", name, type }
}

export function functionType(paramTypes, returnType) {
  return { kind: "FunctionType", paramTypes, returnType }
}

export function arrayType(baseType) {
  return { kind: "ArrayType", baseType }
}

export function optionalType(baseType) {
  baseType = baseType || anyType;
  return { kind: "OptionalType", baseType }
}

export function conditional(test, consequent, alternate, type) {
  return { kind: "Conditional", test, consequent, alternate, type }
}

export function assignment(target, source) {
  return { kind: "Assignment", target, source }
}

export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type }
}

export function unary(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type }
}

export function increment(variable) {
  return { kind: "Increment", variable }
}

export function decrement(variable) {
  return { kind: "Decrement", variable }
}

export function printStatement(argument) {
  return { kind: "PrintStatement", argument }
}

export function ifStatement(test, consequent, alternate) {
  return { kind: "IfStatement", test, consequent, alternate }
}

export function shortIfStatement(test, consequent) {
  return { kind: "ShortIfStatement", test, consequent }
}

export function breakStatement() {
  const statement = { kind: "BreakStatement" };
  return statement;
}


export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression }
}

export function shortReturnStatement() {
  return { kind: "ShortReturnStatement" }
}

export function whileStatement(test, body) {
  return { kind: "WhileStatement", test, body }
}

export function forStatement(iterator, collection, body) {
  return { kind: "ForStatement", iterator, collection, body }
}

export function arrayExpression(elements) {
  const baseType = elements.length > 0 ? elements[0].type : anyType;
  return { 
    kind: "ArrayExpression", 
    elements, 
    type: arrayType(baseType)
  }
}

export function functionCall(callee, args) {
  return { 
    kind: "FunctionCall", 
    callee, 
    args, 
    type: callee.type?.returnType || voidType 
  }
}

export function subscript(array, index) {
  return { 
    kind: "SubscriptExpression", 
    array, 
    index, 
    type: array.type?.baseType || anyType 
  }
}

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