// Playground for the docs site. Compiles CloudScribe in the page with the
// browser copy of the compiler (docs/playground/, built by
// scripts/build-playground.mjs) and runs the output in a worker.
import compile from "./playground/compiler.js"
import { MAX_SHARED_LENGTH, hashForProgram, programFromHash } from "./share.js"

const source = document.getElementById("source")
const output = document.getElementById("output")
const status = document.getElementById("status")
const consoleOut = document.getElementById("console")
const example = document.getElementById("example")
const runButton = document.getElementById("run")
const shareButton = document.getElementById("share")
const shareStatus = document.getElementById("share-status")
const stageButtons = [...document.querySelectorAll(".stage")]

let stage = "js"
let lastJs = null

function loadSource(text) {
  source.value = text
  consoleOut.hidden = true
  shareStatus.textContent = ""
  compileNow()
}

function loadExample(name) {
  // Picking an example leaves a shared program behind, so drop its fragment.
  if (programFromHash(location.hash) !== null) history.replaceState(null, "", location.pathname + location.search)
  loadSource(document.getElementById(`example-${name}`).textContent)
}

// Loads the program from a share link, if the URL has one. The text only goes
// into the editor and the compiler. It is never run until someone presses Run.
function loadShared() {
  const shared = programFromHash(location.hash)
  if (shared === null) return false
  let option = example.querySelector('option[value="shared"]')
  if (!option) {
    option = new Option("Shared link", "shared")
    option.disabled = true
    example.append(option)
  }
  example.value = "shared"
  loadSource(shared)
  return true
}

function setStage(name) {
  stage = name
  for (const button of stageButtons) button.setAttribute("aria-pressed", String(button.dataset.stage === name))
  compileNow()
}

async function copyLink() {
  const hash = hashForProgram(source.value)
  if (hash === null) {
    shareStatus.textContent = source.value.length === 0
      ? "Nothing to share yet"
      : `Too long for a link (limit ${MAX_SHARED_LENGTH} characters)`
    return
  }
  history.replaceState(null, "", hash)
  try {
    await navigator.clipboard.writeText(location.href)
    shareStatus.textContent = "Link copied"
  } catch {
    shareStatus.textContent = "Link is in the address bar"
  }
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
    const shown = stage === "js" ? lastJs : printTree(compile(text, stage))
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
  shareStatus.textContent = ""
  pending = setTimeout(compileNow, 150)
})
source.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    clearTimeout(pending)
    compileNow()
    runNow()
    return
  }
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
shareButton.addEventListener("click", copyLink)
for (const button of stageButtons) button.addEventListener("click", () => setStage(button.dataset.stage))

// Buttons elsewhere on the page that open an example at a given stage.
for (const button of document.querySelectorAll("[data-open-example]")) {
  button.addEventListener("click", () => {
    example.value = button.dataset.openExample
    loadExample(example.value)
    setStage(button.dataset.openStage ?? "js")
    document.getElementById("playground").scrollIntoView()
    source.focus({ preventScroll: true })
  })
}

window.addEventListener("hashchange", loadShared)
if (!loadShared()) loadExample(example.value)
