// ESLint flat config. It checks for bugs, not style: this repo has no formatter
// and mixes semicolon styles on purpose (see AGENTS.md). The rules are listed
// here instead of coming from a shared preset so the only dev dependency is eslint.
const correctness = {
  "constructor-super": "error",
  "for-direction": "error",
  "getter-return": "error",
  "no-async-promise-executor": "error",
  "no-case-declarations": "error",
  "no-class-assign": "error",
  "no-compare-neg-zero": "error",
  "no-cond-assign": "error",
  "no-const-assign": "error",
  "no-constant-condition": ["error", { checkLoops: false }],
  "no-debugger": "error",
  "no-dupe-args": "error",
  "no-dupe-class-members": "error",
  "no-dupe-else-if": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty": ["error", { allowEmptyCatch: true }],
  "no-empty-character-class": "error",
  "no-ex-assign": "error",
  "no-fallthrough": "error",
  "no-func-assign": "error",
  "no-import-assign": "error",
  "no-invalid-regexp": "error",
  "no-loss-of-precision": "error",
  "no-misleading-character-class": "error",
  "no-new-native-nonconstructor": "error",
  "no-obj-calls": "error",
  "no-prototype-builtins": "error",
  "no-redeclare": "error",
  "no-self-assign": "error",
  "no-setter-return": "error",
  "no-shadow-restricted-names": "error",
  "no-sparse-arrays": "error",
  "no-this-before-super": "error",
  "no-undef": "error",
  "no-unexpected-multiline": "error",
  "no-unreachable": "error",
  "no-unsafe-finally": "error",
  "no-unsafe-negation": "error",
  "no-unused-labels": "error",
  "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
  "no-useless-backreference": "error",
  "require-yield": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
  eqeqeq: ["error", "always", { null: "ignore" }]
}

const node = {
  console: "readonly", process: "readonly", URL: "readonly", TextEncoder: "readonly",
  TextDecoder: "readonly", Buffer: "readonly", setTimeout: "readonly", clearTimeout: "readonly",
  setInterval: "readonly", clearInterval: "readonly", btoa: "readonly", atob: "readonly"
}

const browser = {
  document: "readonly", window: "readonly", location: "readonly", history: "readonly",
  navigator: "readonly", performance: "readonly", Worker: "readonly", Blob: "readonly",
  Event: "readonly", Option: "readonly", URL: "readonly", TextEncoder: "readonly",
  TextDecoder: "readonly", console: "readonly", setTimeout: "readonly", clearTimeout: "readonly",
  btoa: "readonly", atob: "readonly", onmessage: "writable", postMessage: "readonly"
}

export default [
  { ignores: ["docs/playground/**", "node_modules/**", ".worktrees/**", ".claude/worktrees/**", "coverage/**"] },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: { ecmaVersion: 2024, sourceType: "module", globals: node },
    rules: correctness
  },
  {
    files: ["docs/*.js"],
    languageOptions: { globals: browser }
  }
]
