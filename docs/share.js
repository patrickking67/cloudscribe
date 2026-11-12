// Shareable playground links. A program is stored in the URL fragment as
// "#code=<base64url of the UTF-8 source>", so it never reaches a server and
// the link works on a static host. These functions are pure and run in both
// the browser and Node (test/share.test.js).

const PREFIX = "code="

// Longest program a link may carry. A link past a few thousand characters
// stops being something you can paste, and the cap bounds the work done on a
// fragment that arrives from somewhere else.
export const MAX_SHARED_LENGTH = 8000

/** Encodes program text as unpadded base64url. */
export function encodeProgram(source) {
  let binary = ""
  for (const byte of new TextEncoder().encode(source)) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
}

/**
 * Decodes text made by encodeProgram. Returns null instead of throwing for
 * anything that is not valid base64url or not valid UTF-8, because the input
 * comes straight from a URL.
 */
export function decodeProgram(encoded) {
  if (typeof encoded !== "string" || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null
  if (encoded.length % 4 === 1) return null
  try {
    const binary = atob(encoded.replaceAll("-", "+").replaceAll("_", "/"))
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    return source.length <= MAX_SHARED_LENGTH ? source : null
  } catch {
    return null
  }
}

/** Returns the URL fragment for a program, or null when it is too long to share. */
export function hashForProgram(source) {
  if (source.length === 0 || source.length > MAX_SHARED_LENGTH) return null
  return `#${PREFIX}${encodeProgram(source)}`
}

/** Returns the program stored in a URL fragment, or null when there is none. */
export function programFromHash(hash) {
  const fragment = String(hash ?? "").replace(/^#/, "")
  if (!fragment.startsWith(PREFIX)) return null
  return decodeProgram(fragment.slice(PREFIX.length))
}
