#!/usr/bin/env bash
set -euo pipefail

test -f AGENTS.md
test "$(cat CLAUDE.md)" = "@AGENTS.md"
test -f .github/copilot-instructions.md
test -f docs/language-spec.md
test -f docs/architecture.md
test -f SECURITY.md
test -f CONTRIBUTING.md
test -f CHANGELOG.md
test -f .claude/launch.json
cmp -s llms.txt docs/llms.txt

# git grep is used instead of rg because it is on every CI runner and only
# looks at tracked files. Exit status 0 means a match was found.

# Committed prose and code comments use plain punctuation. The vendored
# ohm-js build is third-party code and is skipped.
EM_DASH="$(printf '\342\200\224')"
if git grep -n -I -F "$EM_DASH" -- . ':!docs/playground/ohm.min.js' ':!scripts/check-repo.sh'; then
  echo "Em dash found; use a colon, comma or parentheses instead." >&2
  exit 1
fi

if git grep -n -I -i -E 'Co-Authored-By|Signed-off-by|generated (by|with) (AI|ChatGPT|Claude|Codex)' \
  -- . ':!scripts/check-repo.sh'; then
  echo "Prohibited authorship attribution found." >&2
  exit 1
fi

echo "Repository checks passed."
