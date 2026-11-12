#!/usr/bin/env node
// Runs the test suite with Node's built-in coverage. Node 22.5 and later can
// limit the report to src/; older releases (Node 20) report every file
// touched, including subprocesses, so the filter is added only when supported.
//
// After a passing run it compares the number of tests that ran with the count
// printed in the README, the site and llms.txt, and fails if any is stale.
import { spawn } from "node:child_process"
import { readFileSync, readdirSync } from "node:fs"

const files = readdirSync("test").filter(name => name.endsWith(".test.js")).map(name => `test/${name}`)
const args = ["--test", "--experimental-test-coverage"]
if (process.allowedNodeEnvironmentFlags.has("--test-coverage-include")) args.push("--test-coverage-include=src/**")

// Output is passed through as it arrives and kept so the summary can be read.
const env = process.stdout.isTTY && !process.env.NO_COLOR ? { ...process.env, FORCE_COLOR: "1" } : process.env
const child = spawn(process.execPath, [...args, ...files], { stdio: ["inherit", "pipe", "inherit"], env })
let output = ""
child.stdout.on("data", chunk => {
  output += chunk
  process.stdout.write(chunk)
})

// Files that state the test count, and how each one writes it.
const DOCUMENTED_COUNTS = [
  ["README.md", /tests-(\d+)%20passing/g],
  ["README.md", /\b(\d+) tests\b/g],
  ["docs/index.html", /\b(\d+) tests\b/g],
  ["llms.txt", /\b(\d+) tests\b/g]
]

function staleCounts(actual) {
  const stale = []
  for (const [file, pattern] of DOCUMENTED_COUNTS) {
    for (const match of readFileSync(file, "utf8").matchAll(pattern)) {
      if (Number(match[1]) !== actual) stale.push(`${file} says ${match[1]}`)
    }
  }
  return stale
}

child.on("close", status => {
  if (status !== 0) process.exit(status ?? 1)
  // The summary line is "ℹ tests 271" (spec reporter) or "# tests 271" (TAP).
  const summary = output.replace(/\x1b\[[0-9;]*m/g, "").match(/^\S+ tests (\d+)$/m)
  if (!summary) {
    console.error("Could not find the test count in the runner output.")
    process.exit(1)
  }
  const stale = staleCounts(Number(summary[1]))
  if (stale.length > 0) {
    console.error(`${summary[1]} tests ran, but ${stale.join(", ")}. Update the documented count.`)
    process.exit(1)
  }
})
