#!/usr/bin/env node

/**
 * CloudScribe CLI — compiles .csc source files to various output formats.
 * @module cli
 */

import * as fs from "node:fs/promises";
import stringify from "graph-stringify";
import compile from "./compiler.js";

const VERSION = "1.0.0";

const help = `CloudScribe v${VERSION} — A statically typed language for IT automation

Usage:
  cloudscribe <filename> <output> [--out <filename>]
  cloudscribe --help
  cloudscribe --version

Output types:
  parsed      Verify that the source is syntactically correct
  analyzed    Show the analyzed abstract syntax tree
  optimized   Show the optimized intermediate representation
  js          Compile to JavaScript

Examples:
  cloudscribe backup.csc parsed
  cloudscribe deploy.csc js
  cloudscribe deploy.csc js --out deploy.js
`;

async function compileFromFile(filename, outputType, outputFilename) {
  try {
    const buffer = await fs.readFile(filename);
    const compiled = compile(buffer.toString(), outputType);
    const output = stringify(compiled, "kind") || String(compiled);

    if (outputFilename) {
      await fs.writeFile(outputFilename, `${output}\n`, "utf8");
      console.log(`Wrote ${outputFilename}`);
    } else {
      console.log(output);
    }
  } catch (e) {
    console.error(`\u001b[31m${e}\u001b[39m`);
    process.exitCode = 1;
  }
}

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const outputFilename = outIndex >= 0 ? args[outIndex + 1] : undefined;
const positionalArgs = outIndex >= 0 ? args.filter((_, index) => index !== outIndex && index !== outIndex + 1) : args;

if (args.includes("--version") || args.includes("-v")) {
  console.log(VERSION);
} else if (
  positionalArgs.length !== 2 ||
  args.includes("--help") ||
  args.includes("-h") ||
  (outIndex >= 0 && !outputFilename)
) {
  console.log(help);
  if (outIndex >= 0 && !outputFilename) process.exitCode = 1;
} else {
  compileFromFile(positionalArgs[0], positionalArgs[1], outputFilename);
}
