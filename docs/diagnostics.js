// Turns a compiler error into positions the playground can mark in the editor.
// Pure functions that run in the browser and in Node (test/diagnostics.test.js).

const LOCATION = /^Line (\d+), col (\d+):/

/**
 * Lists the problems in a compile error as { line, column, text }, with 1-based
 * positions. Syntax errors carry one entry per error in error.diagnostics.
 * Type errors carry one, with the position at the start of the message.
 * An error with no position gives an empty list.
 */
export function diagnosticsFromError(error) {
  const entries = Array.isArray(error?.diagnostics) ? error.diagnostics : [error]
  const found = []
  for (const entry of entries) {
    const message = String(entry?.message ?? "")
    const where = LOCATION.exec(message)
    if (!where) continue
    // The reason is the last line of the message, after the quoted source lines.
    const text = message.trimEnd().split("\n").at(-1)
    found.push({ line: Number(where[1]), column: Number(where[2]), text })
  }
  return found
}

/**
 * Converts diagnostics to character ranges in the source to underline. A range
 * covers the word at the position, or one character if it is not on a word. A
 * position at the end of a line moves back one character so something is marked.
 * Ranges are sorted and never overlap.
 */
export function rangesForDiagnostics(source, diagnostics) {
  const lines = source.split("\n")
  const starts = []
  let offset = 0
  for (const line of lines) {
    starts.push(offset)
    offset += line.length + 1
  }
  const ranges = []
  for (const { line, column } of diagnostics) {
    const text = lines[line - 1]
    if (text === undefined || text.length === 0) continue
    let index = Math.min(column - 1, text.length - 1)
    if (index < 0) continue
    const word = /[A-Za-z0-9_]/
    let end = index + 1
    if (word.test(text[index])) {
      while (index > 0 && word.test(text[index - 1])) index--
      while (end < text.length && word.test(text[end])) end++
    }
    ranges.push({ start: starts[line - 1] + index, end: starts[line - 1] + end })
  }
  ranges.sort((a, b) => a.start - b.start)
  return ranges.filter((range, i) => i === 0 || range.start >= ranges[i - 1].end)
}

/** Character offset of a 1-based line and column, for moving the cursor to a problem. */
export function offsetOf(source, line, column) {
  const lines = source.split("\n")
  let offset = 0
  for (let i = 0; i < Math.min(line - 1, lines.length); i++) offset += lines[i].length + 1
  return Math.min(offset + Math.max(column - 1, 0), source.length)
}
