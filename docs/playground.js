// Playground for the docs site. Compiles CloudScribe in the page with the
// browser copy of the compiler (docs/playground/, built by
// scripts/build-playground.mjs) and runs the output in a worker.
import compile from "./playground/compiler.js"

const source = document.getElementById("source")
const output = document.getElementById("output")
const status = document.getElementById("status")
const consoleOut = document.getElementById("console")
const example = document.getElementById("example")
const runButton = document.getElementById("run")
const stageButtons = [...document.querySelectorAll(".stage")]

let stage = "js"
let lastJs = null

function loadExample(name) {
  source.value = document.getElementById(`example-${name}`).textContent
  consoleOut.hidden = true
  compileNow()
}

// Prints an AST without the circular references the analyzer creates.
function printTree(tree) {
  const seen = new WeakSet()
  return JSON.stringify(tree, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return value.name ? `<${value.kind} ${value.name}>` : "<cycle>"
      seen.add(value)
    }
    return value
  }, 2)
}

function compileNow() {
  const text = source.value
  const started = performance.now()
  try {
    lastJs = compile(text, "js")
    const shown = stage === "js" ? lastJs : printTree(compile(text, "optimized"))
    output.textContent = shown
    output.classList.remove("status-fault")
    const ms = Math.max(1, Math.round(performance.now() - started))
    status.textContent = `Compiled in ${ms} ms`
    status.className = "mono status-ok"
    runButton.disabled = false
  } catch (error) {
    lastJs = null
    output.textContent = error.message
    output.classList.add("status-fault")
    status.textContent = "Not compiled: fix the error to see the output"
    status.className = "mono status-fault"
    runButton.disabled = true
  }
}

// Runs generated JavaScript in a throwaway worker with a captured console.
// The worker is stopped after two seconds so an endless loop cannot hang the page.
const workerSource = `
onmessage = (event) => {
  const lines = []
  const console = { log: (...values) => lines.push(values.map(String).join(" ")) }
  try {
    new Function("console", event.data)(console)
    postMessage({ lines })
  } catch (error) {
    postMessage({ lines, error: String(error) })
  }
}`
const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }))

function showConsole(text, isError = false) {
  consoleOut.hidden = false
  consoleOut.textContent = text
  consoleOut.classList.toggle("status-fault", isError)
}

function runNow() {
  if (!lastJs) return
  if (/__cs_/.test(lastJs)) {
    showConsole("This program uses env, files, the shell or exit, which need Node.js.\nRun it with: cloudscribe file.csc --run", true)
    return
  }
  const worker = new Worker(workerUrl)
  const timer = setTimeout(() => {
    worker.terminate()
    showConsole("Stopped after 2 seconds. Is there a loop that never ends?", true)
  }, 2000)
  worker.onmessage = ({ data }) => {
    clearTimeout(timer)
    worker.terminate()
    const text = data.lines.join("\n") || "(no output)"
    showConsole(data.error ? `${text}\n${data.error}`.trim() : text, Boolean(data.error))
  }
  worker.postMessage(lastJs)
}

let pending
source.addEventListener("input", () => {
  clearTimeout(pending)
  pending = setTimeout(compileNow, 150)
})
source.addEventListener("keydown", (event) => {
  // Tab indents inside the editor. Escape then Tab moves focus on, as usual.
  if (event.key === "Tab" && !event.shiftKey && !source.dataset.escaped) {
    event.preventDefault()
    source.setRangeText("  ", source.selectionStart, source.selectionEnd, "end")
    source.dispatchEvent(new Event("input"))
  }
  if (event.key === "Escape") source.dataset.escaped = "1"
  else if (event.key !== "Tab") delete source.dataset.escaped
})
source.addEventListener("blur", () => delete source.dataset.escaped)
example.addEventListener("change", () => loadExample(example.value))
runButton.addEventListener("click", runNow)
for (const button of stageButtons) {
  button.addEventListener("click", () => {
    stage = button.dataset.stage
    for (const other of stageButtons) other.setAttribute("aria-pressed", String(other === button))
    compileNow()
  })
}

loadExample(example.value)
