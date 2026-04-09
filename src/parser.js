/**
 * Parser module — uses Ohm to produce a match object from CloudScribe source.
 * @module parser
 */

import * as fs from "node:fs"
import * as ohm from "ohm-js"

const grammar = ohm.grammar(fs.readFileSync("src/cloudscribe.ohm"))

/**
 * Parses CloudScribe source code and returns an Ohm match object.
 * @param {string} sourceCode - The CloudScribe source to parse.
 * @returns {ohm.MatchResult} The successful Ohm match result.
 * @throws {Error} If the source contains syntax errors.
 */
export default function parse(sourceCode) {
  const match = grammar.match(sourceCode)
  if (!match.succeeded()) throw new Error(match.message)
  return match
}