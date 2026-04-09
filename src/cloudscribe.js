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
  cloudscribe <filename> <output>
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
`;

async function compileFromFile(filename, outputType) {
  try {
    const buffer = await fs.readFile(filename);
    const compiled = compile(buffer.toString(), outputType);
    console.log(stringify(compiled, "kind") || compiled);
  } catch (e) {
    console.error(`\u001b[31m${e}\u001b[39m`);
    process.exitCode = 1;
  }
}

const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(VERSION);
} else if (args.length !== 2 || args.includes("--help") || args.includes("-h")) {
  console.log(help);
} else {
  compileFromFile(args[0], args[1]);
}
