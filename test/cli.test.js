import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cli = new URL("../src/cloudscribe.js", import.meta.url);
const example = new URL("../examples/data_backup.csc", import.meta.url);

function run(args) {
  return spawnSync(process.execPath, [cli.pathname, ...args], { encoding: "utf8" });
}

test("CLI reports its version", () => {
  const result = run(["--version"]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "1.0.0");
});

test("CLI compiles JavaScript to stdout", () => {
  const result = run([example.pathname, "js"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /console\.log|function/);
});

test("CLI writes compiled JavaScript to a file", () => {
  const directory = mkdtempSync(join(tmpdir(), "cloudscribe-"));
  const output = join(directory, "backup.js");
  const result = run([example.pathname, "js", "--out", output]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), `Wrote ${output}`);
  assert.match(readFileSync(output, "utf8"), /console\.log|function/);
});

test("CLI works when run from outside the repository", () => {
  const directory = mkdtempSync(join(tmpdir(), "cloudscribe-cwd-"));
  const result = spawnSync(process.execPath, [cli.pathname, example.pathname, "parsed"], {
    cwd: directory,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "Syntax is ok");
});

test("CLI rejects an output flag without a filename", () => {
  const result = run([example.pathname, "js", "--out"]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Usage:/);
});

test("CLI reports a missing source file without a stack trace", () => {
  const result = run(["does-not-exist.csc", "js"]);
  assert.equal(result.status, 1);
  assert.equal(result.stderr.trim(), "Error: Cannot read does-not-exist.csc: file not found");
});

test("CLI reports a directory passed as the source file", () => {
  const result = run([tmpdir(), "js"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cannot read .*: is a directory/);
});

test("CLI lists the valid output types for an unknown one", () => {
  const result = run([example.pathname, "wasm"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown output type "wasm"\. Expected one of: parsed, analyzed, optimized, js/);
});

test("CLI prints compile errors without color codes when stderr is not a terminal", () => {
  const directory = mkdtempSync(join(tmpdir(), "cloudscribe-err-"));
  const source = join(directory, "bad.csc");
  writeFileSync(source, "print(missing);\n");
  const result = run([source, "js"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Identifier missing not declared/);
  assert.doesNotMatch(result.stderr, /\u001b\[/);
});
