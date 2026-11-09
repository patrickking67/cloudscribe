import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import compile from "../src/compiler.js"

const docs = new URL("../docs/", import.meta.url)
const html = readFileSync(new URL("index.html", docs), "utf8")

function example(id) {
  const match = html.match(new RegExp(`<script type="text/plain" id="example-${id}">([\\s\\S]*?)</script>`))
  assert.ok(match, `missing example ${id}`)
  return match[1]
}

describe("The docs site", () => {
  it("has playground examples that compile, except the broken one", () => {
    assert.match(compile(example("health"), "js"), /checkServers_\d+: \{/)
    assert.match(compile(example("health"), "js"), /console\.log\(`OK \$\{code_\d+\}`\);/)
    assert.match(compile(example("disk"), "js"), /diskReport/)
    assert.match(compile(example("config"), "js"), /__cs_env/)
    assert.throws(() => compile(example("broken"), "js"), /Line 9, col 11:[\s\S]*Expected assignment of type int, got string/)
  })

  it("shows the config and disk examples exactly as they are in examples/", () => {
    for (const [id, name] of [["config", "config_check"], ["disk", "disk_report"]]) {
      const file = readFileSync(new URL(`../examples/${name}.csc`, import.meta.url), "utf8")
      assert.equal(example(id), file, name)
    }
  })

  it("links only to local files that exist", () => {
    const local = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]).filter(p => p !== "./")
    assert.ok(local.length > 0)
    for (const path of local) assert.ok(existsSync(new URL(path, docs)), `docs/${path} is missing`)
  })

  it("serves the same llms.txt as the repository root", () => {
    const root = readFileSync(new URL("../llms.txt", import.meta.url), "utf8")
    assert.equal(readFileSync(new URL("llms.txt", docs), "utf8"), root)
    assert.match(root, /^# CloudScribe\n\n> /)
  })
})
