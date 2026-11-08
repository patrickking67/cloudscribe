#!/usr/bin/env node
// Runs the test suite with Node's built-in coverage. Node 22.5 and later can
// limit the report to src/; older releases (Node 20) report every file
// touched, including subprocesses, so the filter is added only when supported.
import { spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"

const files = readdirSync("test").filter(name => name.endsWith(".test.js")).map(name => `test/${name}`)
const args = ["--test", "--experimental-test-coverage"]
if (process.allowedNodeEnvironmentFlags.has("--test-coverage-include")) args.push("--test-coverage-include=src/**")
const result = spawnSync(process.execPath, [...args, ...files], { stdio: "inherit" })
process.exit(result.status ?? 1)
