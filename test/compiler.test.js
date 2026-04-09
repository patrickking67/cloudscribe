import { describe, it } from "node:test"
import assert from "node:assert/strict"
import compile from "../src/compiler.js"

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

  it("uses const for immutable variables in generated JS", () => {
    const js = compile("const MAX = 99;", "js")
    assert.match(js, /const MAX_0 = 99;/)
  })

  it("throws on unknown output type", () => {
    assert.throws(() => compile("let x = 1;", "wat"), /Unknown output type/)
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
