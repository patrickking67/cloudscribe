import { describe, it } from "node:test"
import assert from "assert"
import * as ohm from "ohm-js"

const grammars = {
  canadianPostalCode: String.raw`
    canadianPostalCode
      = Letter Digit Letter " " Digit Letter Digit

    
    Letter
      = "A" | "B" | "C" | "E" | "G" | "H"
      | "J" | "K" | "L" | "M" | "N" | "P"
      | "R" | "S" | "T" | "V" | "W" | "X" | "Y" | "Z"

    Digit
      = "0".."9"
  `,

  visa: String.raw`
    visa
      = "4" Digit{12}         --13Total
      | "4" Digit{15}         --16Total

    Digit
      = "0".."9"
  `,

  masterCard: String.raw`
    masterCard
      = ("5" ("1".."5") Digit{14})
      | (FourDigits2221To2720 Digit{12})

    FourDigits2221To2720
      = "2"
        (
          "2"
          (
            "2" ("1".."9")
            | ("3".."9" Digit)
          )
          | ("3".."6" Digit Digit)
          | "7"
            (
              ("0".."1" Digit)
              | ("2" "0")
            )
        )

    Digit
      = "0".."9"
  `,

  notThreeEndingInOO: String.raw`
    notThreeEndingInOO
      = ~(
          # Exactly three letters, ending in 'o' or 'O' twice, then end of string
          Letter (("o"|"O") ("o"|"O")) $
        )
        Letter*

    Letter
      = "a".."z"
      | "A".."Z"

    # Ohm's builtin  matches the end of input
  `,

  divisibleBy16: String.raw`
    divisibleBy16
      = ZerosOnly
      | BinaryNonAllZero "0000"

    ZerosOnly
      = "0"+

    BinaryNonAllZero
      = (("0"|"1")* "1" ("0"|"1")*)
  `,

  eightThroughThirtyTwo: String.raw`
    eightThroughThirtyTwo
      = "8"
      | "9"
      | "1" Digit     -- covers 10..19
      | "2" Digit     -- covers 20..29
      | "30"
      | "31"
      | "32"

    Digit
      = "0".."9"
  `,

  notPythonPycharmPyc: String.raw`
    notPythonPycharmPyc
      = ~("python" | "pycharm" | "pyc") Letters

    Letters
      = Letter*

    # The tests only show ASCII letters; we'll keep it simple:
    Letter
      = "a".."z"
      | "A".."Z"
  `,

  restrictedFloats: String.raw`
    restrictedFloats
      = (Int ("." Fraction)?)
        ExponentPart      -- exponent is required

    Int
      = Digit+

    Fraction
      = Digit*

    ExponentPart
      = ("e" | "E") Sign? ExpDigits

    Sign
      = "+" | "-"

    ExpDigits
      = Digit{1,3}

    Digit
      = "0".."9"
  `,

  palindromes2358: String.raw`
    palindromes2358
      = Length2
      | Length3
      | Length5
      | Length8

    Letter
      = "a" | "b" | "c"

    # Palindrome of length 2
    Length2
      = "aa" | "bb" | "cc"

    # Palindrome of length 3 => x y x
    Length3
      = ("a" Letter "a")
      | ("b" Letter "b")
      | ("c" Letter "c")

    # Palindrome of length 5 => x (pal3) x
    Length5
      = ("a" Length3 "a")
      | ("b" Length3 "b")
      | ("c" Length3 "c")

    # Palindrome of length 8 => x (pal6) x
    Length8
      = ("a" Length6 "a")
      | ("b" Length6 "b")
      | ("c" Length6 "c")

    # length6 => x (pal4) x
    Length6
      = ("a" Length4 "a")
      | ("b" Length4 "b")
      | ("c" Length4 "c")

    # length4 => x (pal2) x
    Length4
      = ("a" Length2 "a")
      | ("b" Length2 "b")
      | ("c" Length2 "c")
  `,

  pythonStringLiterals: String.raw`
    pythonStringLiterals
      = (StringPrefix? ShortString)
      | (StringPrefix? LongString)

   
    StringPrefix
      = "f"

    
    ShortString
      = SingleQuoted
      | DoubleQuoted

    SingleQuoted
      = "'" ShortStringChars? "'"

    DoubleQuoted
      = '"' ShortStringChars? '"'

    ShortStringChars
      = ShortStringChar+

    
    ShortStringChar
      = ~("'"|"\\") any
      | EscapeSeq

    # Minimal approach: backslash + *any* char
    EscapeSeq
      = "\\" any

   
    LongString
      = TripleSingleQuoted
      | TripleDoubleQuoted

    TripleSingleQuoted
      = "'''" LongStringChars? "'''"

    TripleDoubleQuoted
      = "\"\"\"" LongStringChars? "\"\"\""

    LongStringChars
      = LongStringChar*

    
    LongStringChar
      = ~( "'''" | "\"\"\"" | "\\" ) any
      | EscapeSeq
  `,
}

//------------------------------------------------------------------------------

function matches(name, string) {
  // Wrap the snippet in 'G { ... }', parse with ohm.
  const grammarSource = `G {
${grammars[name]}
}`
  const g = ohm.grammar(grammarSource)
  return g.match(string).succeeded()
}

// Tests

const testFixture = {
  canadianPostalCode: {
    good: ["A7X 2P8", "P8E 4R2", "K1V 9P2", "Y3J 5C0"],
    bad: [
      "A7X   9B2",
      "C7E 9U2",
      "",
      "Dog",
      "K1V\t9P2",
      " A7X 2P8",
      "A7X 2P8 ",
    ],
  },
  visa: {
    good: ["4128976567772613", "4089655522138888", "4098562516243"],
    bad: [
      "43333",
      "42346238746283746823",
      "7687777777263211",
      "foo",
      "π",
      "4128976567772613 ",
    ],
  },
  masterCard: {
    good: [
      "5100000000000000",
      "5294837679998888",
      "5309888182838282",
      "5599999999999999",
      "2221000000000000",
      "2720999999999999",
      "2578930481258783",
      "2230000000000000",
    ],
    bad: [
      "5763777373890002",
      "513988843211541",
      "51398884321108541",
      "",
      "OH",
      "5432333xxxxxxxxx",
    ],
  },
  notThreeEndingInOO: {
    good: ["", "fog", "Tho", "one", "a", "ab", "food"],
    bad: ["fOo", "gOO", "HoO", "zoo", "MOO", "123", "A15"],
  },
  divisibleBy16: {
    good: [
      "0",
      "00",
      "000",
      "00000",
      "00000",
      "000000",
      "00000000",
      "1101000000",
    ],
    bad: ["1", "00000000100", "1000000001", "dog0000000"],
  },
  eightThroughThirtyTwo: {
    good: Array(25)
      .fill(0)
      .map((x, i) => (i + 8).toString()), // strings "8","9","10","11",...
    bad: ["1", "0", "00003", "dog", "", "361", "90", "7", "-11"],
  },
  notPythonPycharmPyc: {
    good: [
      "",
      "pythons",
      "pycs",
      "PYC",
      "apycharm",
      "zpyc",
      "dog",
      "pythonpyc",
    ],
    bad: ["python", "pycharm", "pyc"],
  },
  restrictedFloats: {
    good: ["1e0", "235e9", "1.0e1", "1.0e+122", "55e20"],
    bad: ["3.5E9999", "2.355e-9991", "1e2210"],
  },
  palindromes2358: {
    good: [
      "aa",
      "bb",
      "cc",
      "aaa",
      "aba",
      "aca",
      "bab",
      "bbb",
      "ababa",
      "abcba",
      "aaaaaaaa",
      "abaaaaba",
      "cbcbbcbc",
      "caaaaaac",
    ],
    bad: ["", "a", "ab", "abc", "abbbb", "cbcbcbcb"],
  },
  pythonStringLiterals: {
    good: String.raw`''
      ""
      'hello'
      "world"
      'a\'b'
      "a\"b"
      '\n'
      "a\tb"
      f'\u'
      """abc"""
      '''a''"''"'''
      """abc\xdef"""
      '''abc\$def'''
      '''abc\''''`
      .split("\n")
      .map((s) => s.trim()),
    bad: String.raw`
      'hello"
      "world'
      'a'b'
      "a"b"
      'a''
      "x""
      """"""""
      frr"abc"
      'a\'
      '''abc''''
      """`
      .split("\n")
      .map((s) => s.trim()),
  },
}


for (let name of Object.keys(testFixture)) {
  describe(`when matching ${name}`, () => {
    for (let s of testFixture[name].good) {
      it(`accepts ${JSON.stringify(s)}`, () => {
        assert.ok(matches(name, s))
      })
    }
    for (let s of testFixture[name].bad) {
      it(`rejects ${JSON.stringify(s)}`, () => {
        assert.ok(!matches(name, s))
      })
    }
  })
}
