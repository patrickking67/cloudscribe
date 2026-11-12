import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import compile from "../src/compiler.js"

const docs = new URL("../docs/", import.meta.url)
const html = readFileSync(new URL("index.html", docs), "utf8")
const cli = new URL("../src/cloudscribe.js", import.meta.url).pathname
const decoded = html.replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&").replace(/<\/?span[^>]*>/g, "")

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
    assert.throws(() => compile(example("broken"), "js"), /Line 10, col 18:[\s\S]*Expected argument 1 of type int, got string/)
  })

  it("has an example for every option in the playground menu", () => {
    const options = [...html.matchAll(/<option value="([^"]+)">/g)].map(m => m[1])
    assert.deepEqual(options, ["health", "disk", "fold", "config", "broken"])
    for (const id of options) assert.ok(example(id).length > 0, id)
    for (const [, id] of html.matchAll(/data-open-example="([^"]+)"/g)) assert.ok(options.includes(id), id)
  })

  it("prints the real compiler error for the broken example", () => {
    let message
    try {
      compile(example("broken"), "js")
    } catch (error) {
      message = error.message
    }
    assert.ok(decoded.includes(`error: disk.csc: ${message}`), message)
  })

  it("traces one line through the stages with real compiler output", () => {
    const fold = example("fold")
    const file = new URL("../examples/constant_folding.csc", import.meta.url).pathname
    const stage = name => spawnSync(process.execPath, [cli, file, name], { encoding: "utf8" }).stdout
    const steps = [...html.matchAll(/<li><span class="step">[^<]+<\/span><pre><code>([^<]+)<\/code><\/pre><\/li>/g)].map(m => m[1])
    assert.equal(steps.length, 4)
    assert.ok(fold.includes(steps[0]), steps[0])
    assert.ok(stage("analyzed").includes(steps[1]), steps[1])
    assert.ok(stage("optimized").includes(steps[2]), steps[2])
    assert.ok(compile(fold, "js").split("\n").includes(steps[3]), steps[3])
    assert.doesNotMatch(compile(fold, "js"), /unreachable/)
  })

  it("states the number of examples that the tests run", () => {
    const count = readdirSync(new URL("../examples/", import.meta.url)).filter(n => n.endsWith(".csc")).length
    assert.match(html, new RegExp(`<dt>${count} examples executed</dt>`))
  })

  it("loads scripts and styles only from its own files, plus the font stylesheet", () => {
    const scripts = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1])
    assert.deepEqual(scripts, ["playground/ohm.min.js", "playground.js"])
    const sheets = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(m => m[0].match(/href="([^"]+)"/)[1])
    assert.deepEqual(sheets.filter(href => /^https?:/.test(href)).map(href => new URL(href).origin), ["https://fonts.googleapis.com"])
    assert.ok(sheets.includes("site.css"))
    assert.doesNotMatch(html, /\son[a-z]+="/, "inline event handler")
    assert.doesNotMatch(html, /\sstyle="/, "inline style")
  })

  it("has social card tags with absolute image URLs", () => {
    for (const name of ['property="og:image"', 'name="twitter:image"']) {
      const tag = html.match(new RegExp(`<meta ${name} content="([^"]+)">`))
      assert.ok(tag, name)
      assert.equal(tag[1], "https://patrickking67.github.io/cloudscribe/og.png")
    }
    assert.ok(existsSync(new URL("og.png", docs)))
  })

  it("shows the config, disk and folding examples exactly as they are in examples/", () => {
    for (const [id, name] of [["config", "config_check"], ["disk", "disk_report"], ["fold", "constant_folding"]]) {
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
