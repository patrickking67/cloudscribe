import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import compile from "../src/compiler.js"

// Runs generated JavaScript as an ES module, which is stricter than a script
// (for example, a top-level `return` is a SyntaxError).
function runAsModule(js) {
  return spawnSync(process.execPath, ["--input-type=module"], { input: js, encoding: "utf8" })
}

describe("The compiler pipeline", () => {
  it("returns syntax confirmation for parsed output", () => {
    assert.equal(compile("let x = 1;", "parsed"), "Syntax is ok")
  })

  it("returns an AST object for analyzed output", () => {
    const result = compile("let x = 42;", "analyzed")
    assert.equal(result.kind, "Program")
    assert.equal(result.statements.length, 1)
    assert.equal(result.statements[0].kind, "VariableDeclaration")
  })

  it("returns an optimized AST for optimized output", () => {
    const result = compile("let x = 2 + 3;", "optimized")
    assert.equal(result.kind, "Program")
    assert.equal(result.statements[0].initializer, 5)
  })

  it("returns JavaScript string for js output", () => {
    const js = compile("let x = 10;", "js")
    assert.equal(typeof js, "string")
    assert.match(js, /let x_0 = 10;/)
  })

  it("compiles a function to valid JavaScript", () => {
    const js = compile(`
      function add(a: int, b: int): int {
        return a + b;
      }
    `, "js")
    assert.match(js, /function add_0\(a_1, b_2\)/)
    assert.match(js, /return/)
  })

  it("compiles a task with control flow", () => {
    const js = compile(`
      task deploy {
        let servers = ["web", "db"];
        for s in servers {
          print(s);
        }
      }
    `, "js")
    assert.match(js, /\/\/ task: deploy/)
    assert.match(js, /for \(const/)
    assert.match(js, /console\.log/)
  })

  it("constant-folds through the full pipeline", () => {
    const js = compile("let x = 2 + 3 * 4;", "js")
    assert.match(js, /14/)
  })

  it("compiles bitwise expressions to valid JavaScript", () => {
    const js = compile("let x = (1 & 3) | 4 ^ 2;", "js")
    assert.match(js, /let x_0 = /)
    assert.match(js, /[&|^]/)
  })

  it("compiles identifiers that contain underscores", () => {
    const js = compile("const MAX_RETRIES = 3; let retry_count = MAX_RETRIES;", "js")
    assert.match(js, /const MAX_RETRIES_0 = 3;/)
    assert.match(js, /let retry_count_1 = MAX_RETRIES_0;/)
  })

  it("uses const for immutable variables in generated JS", () => {
    const js = compile("const MAX = 99;", "js")
    assert.match(js, /const MAX_0 = 99;/)
  })

  it("produces runnable JavaScript for edge cases the optimizer and generator rewrite", () => {
    const source = `
      let greeting = "hello, " + "world";
      let label = "n=" + 1;
      let x = 3;
      let square = -x ** 2;
      let n = 2;
      let negBase = -5 ** n;
      let maybe = some x;
      if true { print(greeting); } else { print("unreachable"); }
      print(label);
      print(square);
      print(negBase);
      print(maybe ?? 0);
      task early {
        print("before");
        if x > 1 { return; }
        print("after");
      }
    `
    const result = runAsModule(compile(source, "js"))
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "hello, world\nn=1\n9\n25\n3\nbefore\n")
  })

  it("does not leak declarations from a folded if branch into the outer scope", () => {
    const source = `
      if true { let y = 2; print(y); } else { print(0); }
      let y = 3;
      print(y);
    `
    const result = runAsModule(compile(source, "js"))
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "2\n3\n")
  })

  it("compiles print used as a value or inside an expression", () => {
    const source = `
      let say = print;
      say("first");
      let ignored = print("second");
    `
    const result = runAsModule(compile(source, "js"))
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "first\nsecond\n")
  })

  it("types length on strings and arrays as an int", () => {
    const source = `
      let servers = ["web", "db"];
      let name = "cache";
      print(servers.length + 1);
      print(name.length * 2);
    `
    const analyzed = compile(source, "analyzed")
    assert.equal(analyzed.statements[2].args[0].left.type, "int")
    const result = runAsModule(compile(source, "js"))
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, "3\n10\n")
  })

  it("runs interpolated strings with escapes, nesting and folded parts", () => {
    const source = [
      'let host = "web-01";',
      "let code = 503;",
      "let ports = [80, 443];",
      'print("host ${host} returned ${code}");',
      'print("healthy: ${code == 200}, next ${code + 1}, ${ports.length} ports, ${2 * 3} fixed");',
      'print("${code >= 500 ? "server error" : "ok"} from ${"node ${host}"}");',
      'print("literal \\${host}, $5, ${"$"}{x}, a `tick` and \\"quotes\\" \\\\ \\u{41}");',
      'print("home: ${env("CLOUDSCRIBE_UNSET_FOR_TEST") ?? "unset"}");'
    ].join("\n")
    const js = compile(source, "js")
    assert.match(js, /console\.log\(`host \$\{host_0\} returned \$\{code_1\}`\);/)
    const result = runAsModule(js)
    assert.equal(result.stderr, "")
    assert.equal(result.stdout, [
      "host web-01 returned 503",
      "healthy: false, next 504, 2 ports, 6 fixed",
      "server error from node web-01",
      'literal ${host}, $5, ${x}, a `tick` and "quotes" \\ A',
      "home: unset",
      ""
    ].join("\n"))
  })

  it("compiles every example to JavaScript that runs as an ES module", () => {
    const dir = new URL("../examples/", import.meta.url)
    const files = readdirSync(dir).filter(name => name.endsWith(".csc"))
    assert.ok(files.length > 0)
    for (const name of files) {
      const js = compile(readFileSync(new URL(name, dir), "utf8"), "js")
      const result = runAsModule(js)
      assert.equal(result.status, 0, `${name}: ${result.stderr}`)
    }
  })

  it("throws on unknown output type", () => {
    assert.throws(() => compile("let x = 1;", "wat"), /Unknown output type "wat"\. Expected one of: parsed, analyzed, optimized, js/)
  })

  it("throws on syntax errors", () => {
    assert.throws(() => compile("let = ;", "parsed"))
  })

  it("throws on semantic errors", () => {
    assert.throws(() => compile("print(x);", "js"), /not declared/)
  })

  it("compiles the full data_backup example", () => {
    const source = `
      function backupFile(filename: string): boolean {
        print("Backing up: " + filename);
        return true;
      }
      task backupData {
        let files = ["config.json", "users.db", "logs.txt"];
        let failedCount = 0;
        print("Starting backup process");
        for file in files {
          if backupFile(file) {
            print("Successfully backed up " + file);
          } else {
            print("Failed to backup " + file);
            failedCount++;
          }
        }
        if failedCount > 0 {
          print("Backup completed with " + failedCount + " failures");
        } else {
          print("Backup completed successfully");
        }
      }
    `
    const js = compile(source, "js")
    assert.match(js, /function backupFile_0/)
    assert.match(js, /console\.log/)
    assert.match(js, /for \(const file_/)
  })
})
