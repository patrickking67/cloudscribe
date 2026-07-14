import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
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

test("CLI rejects an output flag without a filename", () => {
  const result = run([example.pathname, "js", "--out"]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Usage:/);
});
