#!/usr/bin/env node

/**
 * CloudScribe CLI: compiles .csc source files to JavaScript, type-checks them,
 * or compiles and runs them.
 * @module cli
 */

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import stringify from "graph-stringify";
import compile from "./compiler.js";

const VERSION = "1.1.0";

const STAGES = ["parsed", "analyzed", "optimized", "js"];

/** Exit codes. A program started with --run exits with its own code. */
const EXIT = { ok: 0, compileError: 1, usage: 2 };

const help = `CloudScribe v${VERSION}, a statically typed language for IT automation

Usage:
  cloudscribe <file.csc> [stage] [--out <file>]
  cloudscribe <file.csc> --check
  cloudscribe <file.csc> --run
  cloudscribe --help | --version

Stages (default js):
  parsed      Check the syntax only
  analyzed    Print the typed abstract syntax tree
  optimized   Print the tree after constant folding
  js          Print the generated JavaScript

Options:
  --check       Type-check without generating code
  --run         Compile and run the program with Node.js
  --out <file>  Write the output to a file instead of stdout

Exit codes:
  0  success
  1  syntax or type error in the source
  2  bad arguments or a file that cannot be read or written
  With --run, the exit code of the program.

Examples:
  cloudscribe deploy.csc
  cloudscribe deploy.csc --check
  cloudscribe deploy.csc --out deploy.mjs
  cloudscribe deploy.csc --run
`;

class UsageError extends Error {}

// Color errors only on a terminal so piped output and logs stay plain text.
function printError(message) {
  console.error(process.stderr.isTTY ? `\u001b[31m${message}\u001b[39m` : message);
}

function parseArgs(argv) {
  const options = { positionals: [], check: false, run: false, out: undefined, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--version" || arg === "-v") options.version = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--run") options.run = true;
    else if (arg === "--out") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new UsageError("--out needs a filename");
      options.out = value;
    } else if (arg.startsWith("-")) throw new UsageError(`Unknown option ${arg}`);
    else options.positionals.push(arg);
  }
  if (options.help || options.version) return options;
  const [filename, stage = "js", ...extra] = options.positionals;
  if (!filename) throw new UsageError("Missing source file");
  if (extra.length > 0) throw new UsageError(`Unexpected argument ${extra[0]}`);
  if (!STAGES.includes(stage)) {
    throw new UsageError(`Unknown output type "${stage}". Expected one of: ${STAGES.join(", ")}`);
  }
  if (options.check && options.run) throw new UsageError("Use either --check or --run, not both");
  if ((options.check || options.run) && options.positionals.length > 1) {
    throw new UsageError(`--${options.check ? "check" : "run"} does not take an output stage`);
  }
  if (options.check && options.out) throw new UsageError("--check does not write output");
  return { ...options, filename, stage };
}

function readSource(filename) {
  try {
    return fs.readFileSync(filename, "utf8");
  } catch (e) {
    const reason = e.code === "ENOENT" ? "file not found" : e.code === "EISDIR" ? "is a directory" : e.message;
    throw new UsageError(`Cannot read ${filename}: ${reason}`);
  }
}

function writeOutput(filename, text) {
  try {
    fs.writeFileSync(filename, text, "utf8");
  } catch (e) {
    throw new UsageError(`Cannot write ${filename}: ${e.message}`);
  }
}

// Runs generated JavaScript as an ES module with the caller's stdin, stdout,
// stderr and working directory, and returns the program's exit code.
function runProgram(js, outFilename) {
  const directory = outFilename ? null : fs.mkdtempSync(join(tmpdir(), "cloudscribe-run-"));
  const file = outFilename ?? join(directory, "program.mjs");
  try {
    writeOutput(file, `${js}\n`);
    const result = spawnSync(process.execPath, [file], { stdio: "inherit" });
    if (result.error) throw new UsageError(`Cannot start Node.js: ${result.error.message}`);
    return result.status ?? 1;
  } finally {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  }
}

function main(argv) {
  const options = parseArgs(argv);
  if (options.version) {
    console.log(VERSION);
    return EXIT.ok;
  }
  if (options.help) {
    console.log(help);
    return EXIT.ok;
  }

  const source = readSource(options.filename);
  let compiled;
  try {
    compiled = compile(source, options.check ? "analyzed" : options.run ? "js" : options.stage);
  } catch (e) {
    printError(`error: ${options.filename}: ${e.message}`);
    return EXIT.compileError;
  }

  if (options.check) {
    console.log(`${options.filename}: ok`);
    return EXIT.ok;
  }
  if (options.run) return runProgram(compiled, options.out);

  const output = typeof compiled === "string" ? compiled : stringify(compiled, "kind");
  if (options.out) {
    writeOutput(options.out, `${output}\n`);
    console.log(`Wrote ${options.out}`);
  } else {
    console.log(output);
  }
  return EXIT.ok;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  if (!(e instanceof UsageError)) throw e;
  printError(`error: ${e.message}`);
  if (/Missing source file|Unknown option|Unexpected argument|--/.test(e.message)) {
    console.error("Run cloudscribe --help for usage.");
  }
  process.exitCode = EXIT.usage;
}
