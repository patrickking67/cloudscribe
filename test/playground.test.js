import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import vm from "node:vm"
import compile from "../src/compiler.js"

const playground = new URL("../docs/playground/", import.meta.url)
const examples = new URL("../examples/", import.meta.url)

describe("The browser playground build", () => {
  it("is up to date with the compiler sources", () => {
    const script = new URL("../scripts/build-playground.mjs", import.meta.url)
    const result = spawnSync(process.execPath, [script.pathname, "--check"], { encoding: "utf8" })
    assert.equal(result.status, 0, result.stderr)
  })

  it("compiles every example exactly like the Node compiler", async () => {
    // Load the vendored UMD build the way a classic script tag does.
    vm.runInThisContext(readFileSync(new URL("ohm.min.js", playground), "utf8"))
    assert.equal(typeof globalThis.ohm.grammar, "function")
    const { default: browserCompile } = await import(new URL("compiler.js", playground))
    for (const name of readdirSync(examples).filter(n => n.endsWith(".csc"))) {
      const source = readFileSync(new URL(name, examples), "utf8")
      assert.equal(browserCompile(source, "js"), compile(source, "js"), name)
    }
    assert.throws(() => browserCompile("let x = ;", "js"), /Line 1, col 9/)
  })
})
