import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import compile from "../src/compiler.js"

const examples = new URL("../examples/", import.meta.url)
const fixtures = new URL("./fixtures/examples/", import.meta.url)
const names = readdirSync(examples).filter(name => name.endsWith(".csc")).map(name => name.slice(0, -4))

// Each example runs in an empty directory with a minimal environment, so
// examples that read env vars or files see their defaults.
describe("The examples", () => {
  it("each have an expected output file", () => {
    assert.ok(names.length > 0)
    const outputs = readdirSync(fixtures).filter(name => name.endsWith(".out")).map(name => name.slice(0, -4))
    assert.deepEqual(outputs.sort(), [...names].sort())
  })

  for (const name of names) {
    it(`${name}.csc compiles, runs and prints the expected output`, () => {
      const js = compile(readFileSync(new URL(`${name}.csc`, examples), "utf8"), "js")
      const result = spawnSync(process.execPath, ["--input-type=module"], {
        input: js,
        cwd: mkdtempSync(join(tmpdir(), "cloudscribe-example-")),
        env: { PATH: process.env.PATH },
        encoding: "utf8"
      })
      assert.equal(result.stderr, "")
      assert.equal(result.status, 0)
      assert.equal(result.stdout, readFileSync(new URL(`${name}.out`, fixtures), "utf8"))
    })
  }
})
