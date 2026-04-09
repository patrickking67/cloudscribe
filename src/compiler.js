/**
 * Compiler pipeline orchestrator — chains parse, analyze, optimize, and generate stages.
 * @module compiler
 */
import parse from "./parser.js"
import analyze from "./analyzer.js"
import optimize from "./optimizer.js"
import generate from "./generator.js"

/**
 * Compiles CloudScribe source code to the requested output stage.
 * @param {string} source - The CloudScribe source code.
 * @param {"parsed"|"analyzed"|"optimized"|"js"} outputType - The compilation stage to return.
 * @returns {string|object} The compilation result at the requested stage.
 * @throws {Error} On unknown output type or compilation errors.
 */
export default function compile(source, outputType) {
  if (!["parsed", "analyzed", "optimized", "js"].includes(outputType)) {
    throw new Error("Unknown output type")
  }
  const match = parse(source)
  if (outputType === "parsed") return "Syntax is ok"
  const analyzed = analyze(match)
  if (outputType === "analyzed") return analyzed
  const optimized = optimize(analyzed)
  if (outputType === "optimized") return optimized
  return generate(optimized)
}