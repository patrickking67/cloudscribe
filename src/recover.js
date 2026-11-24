/**
 * Syntax error recovery. The grammar stops at the first error, so this module
 * blanks out the broken statement and parses again, which finds later errors in
 * the same run. It takes the grammar as an argument so the Node parser and the
 * generated browser parser share it.
 * @module recover
 */

/** Most errors reported for one program. */
export const MAX_SYNTAX_ERRORS = 10

/**
 * Marks the offsets of the `;`, `{` and `}` characters that are code, so text
 * inside string literals and `${ }` interpolations is never taken for a
 * statement boundary. A string ends at its closing quote or at the end of the line.
 */
function findDelimiters(text) {
  const marks = new Array(text.length).fill(false)
  // Each entry is a string being read (true) or an interpolation inside one (false).
  const stack = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    // Strings cannot span lines, so a newline closes everything that is open.
    if (c === "\n") stack.length = 0
    const inString = stack.at(-1) === true
    if (inString) {
      if (c === "\\") i++
      else if (c === '"') stack.pop()
      else if (c === "$" && text[i + 1] === "{") {
        stack.push(false)
        i++
      }
    } else if (c === '"') stack.push(true)
    else if (stack.length > 0 && c === "}") stack.pop()
    else if (stack.length === 0 && (c === ";" || c === "{" || c === "}")) marks[i] = true
  }
  return marks
}

/** Replaces every character except newlines with a space, keeping offsets and line numbers. */
function blank(text, start, end) {
  return text.slice(0, start) + text.slice(start, end).replace(/[^\n]/g, " ") + text.slice(end)
}

/** Converts a character offset to a 1-based line and column. */
function locate(text, position) {
  const before = text.slice(0, position)
  const line = before.split("\n").length
  return { line, column: position - before.lastIndexOf("\n") }
}

/**
 * Formats an error the way Ohm does (line and column, the source line with its
 * neighbors, a caret, the expected tokens) but from the original source, so
 * context lines show what the user wrote and not what recovery blanked out.
 */
function describe(source, position, expected) {
  const { line, column } = locate(source, position)
  const lines = source.split("\n")
  const first = Math.max(1, line - 1)
  const last = Math.min(lines.length, line + 1)
  const width = String(last).length
  const rows = []
  for (let n = first; n <= last; n++) {
    rows.push(`${n === line ? ">" : " "} ${String(n).padStart(width)} | ${lines[n - 1]}`)
    if (n === line) rows.push(`${" ".repeat(width + 5 + column - 1)}^`)
  }
  return `Line ${line}, col ${column}:\n${rows.join("\n")}\nExpected ${expected}`
}

/**
 * Finds the statement that contains a failure: from the delimiter before it up
 * to and including the next semicolon, or up to a brace that cannot belong to it.
 */
function statementAround(text, position) {
  const delimiters = findDelimiters(text)
  let start = position
  while (start > 0 && !delimiters[start - 1]) start--
  let end = position
  while (end < text.length && !delimiters[end]) end++
  if (text[end] === ";") end++
  return [start, end]
}

/**
 * Parses source and keeps going after syntax errors.
 * @param {import("ohm-js").Grammar} grammar - The CloudScribe grammar.
 * @param {string} source - The program text.
 * @returns {{match: object|null, errors: {line: number, column: number, message: string}[]}}
 *   `match` is set only when there are no errors.
 */
export function parseAll(grammar, source) {
  const errors = []
  let text = source
  while (errors.length < MAX_SYNTAX_ERRORS) {
    const match = grammar.match(text)
    if (match.succeeded()) return { match: errors.length === 0 ? match : null, errors }

    const position = match.getRightmostFailurePosition()
    const [start, end] = statementAround(text, position)
    const strayBrace = text.slice(start, end).trim() === "" && position < text.length
    // A brace that was left behind by an earlier recovery is a knock-on error, not a new one.
    if (!(strayBrace && errors.length > 0)) {
      errors.push({ ...locate(source, position), message: describe(source, position, match.getExpectedText()) })
    }
    if (strayBrace) text = blank(text, position, position + 1)
    else if (text.slice(start, end).trim() === "") break
    else text = blank(text, start, end)
    // Nothing left to parse, and an empty program is not a second mistake.
    if (text.trim() === "") break
  }
  return { match: null, errors }
}

/** Builds one Error from the recovered syntax errors. `diagnostics` keeps them separate. */
export function syntaxError(errors) {
  const summary = errors.length > 1 ? `\n\n${errors.length} syntax errors` : ""
  const error = new Error(errors.map(e => e.message).join("\n\n") + summary)
  error.diagnostics = errors
  return error
}
