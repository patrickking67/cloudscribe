import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import compile from "../src/compiler.js"
import {
  MAX_SHARED_LENGTH,
  decodeProgram,
  encodeProgram,
  hashForProgram,
  programFromHash
} from "../docs/share.js"

const examples = new URL("../examples/", import.meta.url)

describe("Playground share links", () => {
  it("round-trips every example program unchanged", () => {
    for (const name of readdirSync(examples).filter(n => n.endsWith(".csc"))) {
      const source = readFileSync(new URL(name, examples), "utf8")
      const hash = hashForProgram(source)
      assert.match(hash, /^#code=[A-Za-z0-9_-]+$/, name)
      assert.equal(programFromHash(hash), source, name)
      assert.equal(compile(programFromHash(hash), "js"), compile(source, "js"), name)
    }
  })

  it("round-trips text outside ASCII and Latin-1", () => {
    for (const source of ['print("café");', 'print("日本語 \u{1F5A5}");', "\t\r\n ${} \\ \"", "a", "ab", "abc"]) {
      assert.equal(decodeProgram(encodeProgram(source)), source)
    }
  })

  it("emits only characters that are safe in a URL fragment", () => {
    // These inputs produce + and / in standard base64, and need padding.
    for (const source of ["~~~", "???", ">>>>", "ÿþ"]) {
      const encoded = encodeProgram(source)
      assert.match(encoded, /^[A-Za-z0-9_-]+$/)
      assert.equal(decodeProgram(encoded), source)
    }
    assert.equal(encodeProgram("~~~"), "fn5-")
    assert.equal(encodeProgram("???"), "Pz8_")
  })

  it("accepts a fragment with or without the leading #", () => {
    assert.equal(programFromHash("#code=bGV0IHggPSAxOw"), "let x = 1;")
    assert.equal(programFromHash("code=bGV0IHggPSAxOw"), "let x = 1;")
  })

  it("ignores fragments that are not share links", () => {
    for (const hash of ["", "#", "#playground", "#install", "#code", "#xcode=bGV0", null, undefined]) {
      assert.equal(programFromHash(hash), null, String(hash))
    }
  })

  it("returns null for damaged links instead of throwing", () => {
    const damaged = [
      "#code=",              // empty
      "#code=bGV0IHg=",      // padded: not what encodeProgram emits
      "#code=bGV0+IHg",      // standard base64 alphabet
      "#code=bGV0 IHg",      // whitespace
      "#code=%3Cscript%3E",  // percent-encoded text
      "#code=b",             // impossible base64 length
      "#code=_w",            // the byte 0xff, which is not valid UTF-8
      "#code=wyg"            // an overlong UTF-8 sequence
    ]
    for (const hash of damaged) assert.equal(programFromHash(hash), null, hash)
    assert.equal(decodeProgram(42), null)
  })

  it("refuses programs longer than the limit in both directions", () => {
    const atLimit = "x".repeat(MAX_SHARED_LENGTH)
    assert.equal(programFromHash(hashForProgram(atLimit)), atLimit)
    const tooLong = atLimit + "x"
    assert.equal(hashForProgram(tooLong), null)
    assert.equal(decodeProgram(encodeProgram(tooLong)), null)
    assert.equal(hashForProgram(""), null)
  })
})
