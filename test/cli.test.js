import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cli = new URL("../src/cloudscribe.js", import.meta.url);
const example = new URL("../examples/data_backup.csc", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

function run(args, options = {}) {
  return spawnSync(process.execPath, [cli.pathname, ...args], { encoding: "utf8", ...options });
}

function sourceFile(text) {
  const directory = mkdtempSync(join(tmpdir(), "cloudscribe-cli-"));
  const file = join(directory, "program.csc");
  writeFileSync(file, text);
  return { directory, file };
}

test("CLI reports the package version", () => {
  const result = run(["--version"]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), pkg.version);
});

test("CLI prints help with exit code 0", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--check/);
});

test("CLI compiles to JavaScript on stdout by default", () => {
  const result = run([example.pathname]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /function backupFile_0/);
});

test("CLI still accepts an explicit output stage", () => {
  assert.equal(run([example.pathname, "parsed"]).stdout.trim(), "Syntax is ok");
  assert.match(run([example.pathname, "analyzed"]).stdout, /Program/);
  assert.match(run([example.pathname, "js"]).stdout, /console\.log/);
});

test("CLI writes compiled JavaScript to a file", () => {
  const directory = mkdtempSync(join(tmpdir(), "cloudscribe-"));
  const output = join(directory, "backup.mjs");
  const result = run([example.pathname, "--out", output]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), `Wrote ${output}`);
  assert.equal(spawnSync(process.execPath, [output], { encoding: "utf8" }).status, 0);
});

test("CLI works when run from outside the repository", () => {
  const directory = mkdtempSync(join(tmpdir(), "cloudscribe-cwd-"));
  const result = run([example.pathname, "parsed"], { cwd: directory });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "Syntax is ok");
});

test("CLI --check type-checks without printing code", () => {
  const { file } = sourceFile("let x = 1;\nprint(x);\n");
  const result = run([file, "--check"]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), `${file}: ok`);
});

test("CLI --check reports a type error with location and exit code 1", () => {
  const { file } = sourceFile('let retries = 3;\nretries = "three";\n');
  const result = run([file, "--check"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, new RegExp(`^error: ${file}: Line 2, col 11:`));
  assert.match(result.stderr, /> 2 \| retries = "three";\n {16}\^~~~~~~/);
  assert.match(result.stderr, /Expected assignment of type int, got string/);
});

test("CLI reports a syntax error with exit code 1", () => {
  const { file } = sourceFile("let = 3;\n");
  const result = run([file]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Line 1, col 5:/);
});

test("CLI --run compiles and runs the program in the current directory", () => {
  const { directory, file } = sourceFile('writeFile("done.txt", "yes");\nprint("ran");\n');
  const result = run([file, "--run"], { cwd: directory });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "ran\n");
  assert.equal(readFileSync(join(directory, "done.txt"), "utf8"), "yes");
});

test("CLI --run passes through the program's exit code", () => {
  const { file } = sourceFile('print("stopping");\nexit(4);\n');
  const result = run([file, "--run"]);
  assert.equal(result.status, 4);
  assert.equal(result.stdout, "stopping\n");
});

test("CLI --run with --out keeps the compiled file", () => {
  const { directory, file } = sourceFile('print("kept");\n');
  const output = join(directory, "kept.mjs");
  const result = run([file, "--run", "--out", output]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "kept\n");
  assert.match(readFileSync(output, "utf8"), /console\.log\("kept"\)/);
});

test("CLI does not run a program that fails to compile", () => {
  const { file } = sourceFile("print(missing);\n");
  const result = run([file, "--run"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Identifier missing not declared/);
});

test("CLI prints errors without color codes when stderr is not a terminal", () => {
  const { file } = sourceFile("print(missing);\n");
  assert.doesNotMatch(run([file]).stderr, /\u001b\[/);
});

test("CLI reports a missing source file with exit code 2", () => {
  const result = run(["does-not-exist.csc"]);
  assert.equal(result.status, 2);
  assert.equal(result.stderr.trim(), "error: Cannot read does-not-exist.csc: file not found");
});

test("CLI reports a directory passed as the source file", () => {
  const result = run([tmpdir()]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Cannot read .*: is a directory/);
});

test("CLI reports a file it cannot write", () => {
  const result = run([example.pathname, "--out", join(tmpdir(), "no-such-dir-cloudscribe", "x.mjs")]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /error: Cannot write /);
});

test("CLI rejects bad arguments with exit code 2", () => {
  const cases = [
    [[], /Missing source file/],
    [[example.pathname, "wasm"], /Unknown output type "wasm"\. Expected one of: parsed, analyzed, optimized, js/],
    [[example.pathname, "js", "extra"], /Unexpected argument extra/],
    [[example.pathname, "--out"], /--out needs a filename/],
    [[example.pathname, "--fast"], /Unknown option --fast/],
    [[example.pathname, "--check", "--run"], /either --check or --run/],
    [[example.pathname, "parsed", "--run"], /--run does not take an output stage/],
    [[example.pathname, "--check", "--out", "x.js"], /--check does not write output/]
  ];
  for (const [args, message] of cases) {
    const result = run(args);
    assert.equal(result.status, 2, args.join(" "));
    assert.match(result.stderr, message);
  }
});
