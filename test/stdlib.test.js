import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import compile from "../src/compiler.js"

// Compiles a program and runs it as an ES module in a fresh directory, with
// only the environment variables the test passes in (plus PATH for shell).
function run(source, { env = {}, files = {} } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), "cloudscribe-stdlib-"))
  for (const [name, text] of Object.entries(files)) writeFileSync(join(cwd, name), text)
  const result = spawnSync(process.execPath, ["--input-type=module"], {
    input: compile(source, "js"),
    cwd,
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8"
  })
  return { ...result, cwd }
}

describe("The standard library", () => {
  it("env returns a variable or null, so ?? can supply a default", () => {
    const result = run(`
      print(env("REGION") ?? "unset");
      print(env("MISSING") ?? "unset");
    `, { env: { REGION: "west" } })
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "west\nunset\n")
  })

  it("writeFile, fileExists and readFile work on paths relative to the working directory", () => {
    const result = run(`
      print(fileExists("status.txt"));
      writeFile("status.txt", "ok");
      print(fileExists("status.txt"));
      print(readFile("status.txt"));
      print(readFile("input.txt").length);
    `, { files: { "input.txt": "12345" } })
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "false\ntrue\nok\n5\n")
    assert.equal(readFileSync(join(result.cwd, "status.txt"), "utf8"), "ok")
  })

  it("toInt parses whole numbers and returns null for anything else", () => {
    const result = run(`
      print(toInt("42") ?? 0);
      print(toInt(" -7 ") ?? 0);
      print(toInt("4.5") ?? -1);
      print(toInt("abc") ?? -1);
    `)
    assert.equal(result.stdout, "42\n-7\n-1\n-1\n")
  })

  it("shell returns the command output without the trailing newline", () => {
    const result = run(`let out = shell("echo hello"); print(out + "!");`)
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "hello!\n")
  })

  it("exit stops the program with the given status", () => {
    const result = run(`print("before"); exit(3); print("after");`)
    assert.equal(result.status, 3)
    assert.equal(result.stdout, "before\n")
  })

  it("emits only the runtime support a program uses", () => {
    const js = compile(`print(env("HOME") ?? "");`, "js")
    assert.match(js, /^const __cs_env = /)
    assert.doesNotMatch(js, /import/)
    const withFs = compile(`print(fileExists("a") && fileExists("b"));`, "js")
    assert.equal(withFs.match(/import \* as __cs_fs/g).length, 1)
    assert.equal(withFs.match(/const __cs_fileExists/g).length, 1)
    assert.doesNotMatch(compile(`print(1);`, "js"), /__cs_/)
  })

  it("lets a program declare its own binding with a built-in name", () => {
    const result = run(`let env = "prod"; function exit(code: int): int { return code; } print(env + exit(1));`)
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "prod1\n")
  })

  it("still reserves print", () => {
    assert.throws(() => compile("let print = 1;", "js"), /Identifier print already declared/)
  })

  it("type checks built-in calls", () => {
    assert.throws(() => compile("readFile(1);", "js"), /Expected argument 1 of type string, got int/)
    assert.throws(() => compile(`writeFile("a");`, "js"), /Wrong number of arguments: expected 2, got 1/)
    assert.throws(() => compile(`let n = toInt("1") * 2;`, "js"), /Expected int for '\*' operation/)
    assert.throws(() => compile(`let ok: int = 1;`, "parsed"))
  })
})
