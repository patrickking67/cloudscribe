/**
 * Parser module: uses Ohm to produce a match object from CloudScribe source.
 * @module parser
 */

import * as fs from "node:fs"
import * as ohm from "ohm-js"
import { parseAll, syntaxError } from "./recover.js"

// Resolve the grammar next to this module so the CLI works from any directory.
const grammar = ohm.grammar(fs.readFileSync(new URL("./cloudscribe.ohm", import.meta.url), "utf8"))

/**
 * Parses CloudScribe source code and returns an Ohm match object.
 * @param {string} sourceCode - The CloudScribe source to parse.
 * @returns {ohm.MatchResult} The successful Ohm match result.
 * @throws {Error} If the source contains syntax errors. The message lists every
 *   error found, and `error.diagnostics` holds each one with its line and column.
 */
export default function parse(sourceCode) {
  const { match, errors } = parseAll(grammar, sourceCode)
  if (errors.length > 0) throw syntaxError(errors)
  return match
}