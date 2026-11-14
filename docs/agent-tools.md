# Agent tools: Graphify

An optional helper for coding agents (Claude Code, Codex) working on this repository. It is not part of the site:
nothing here runs in the server, the browser app or the proxies, and it reads no visitor data.

## Graphify (code knowledge graph)

- Package `graphifyy` 0.9.108 (PyPI), command `graphify`, source https://github.com/Graphify-Labs/graphify,
  licence Apache-2.0.
- Install per user with `uv tool install --python 3.12 graphifyy==0.9.108` (its own tool environment, not a project
  dependency). Where `uv` is not available, install the same PyPI package with the Python tool the environment
  offers.
- Optionally register the `/graphify` skill for Claude Code with `graphify install --platform claude` (macOS/Linux)
  or `graphify install --platform windows` (Windows). The Windows registration step is **unverified** for this repo;
  check with `Test-Path $HOME\.claude\skills\graphify\SKILL.md` after running it. The commands below do not need the
  skill.

### Every session (free, local)

```
graphify update .                      # build or refresh the map: tree-sitter AST extraction, no LLM, no API call
graphify query "location timestamp"    # one to three words from file, function or feature names
graphify explain "communityProxy()"    # one symbol and what it connects to
graphify affected "communityProxy()"   # what depends on a symbol, before changing it
```

- A fresh checkout or a cloud sandbox has no map, because `graphify-out/` is gitignored: the graph goes stale with
  every commit, so it is rebuilt, never committed. `graphify update .` builds it from nothing and later re-reads only
  the files that changed. `graphify-out/GRAPH_REPORT.md` names the commit the map was built from.
- `graphify query` matches words against file, function and class names. Short queries made of such names work;
  full sentences mostly do not.
- `.graphifyignore` adds to `.gitignore` (it can only exclude more): build output, env files, local QA output and
  the screenshot gallery, the field-guide photos and watercolour art (the field-guide code stays in the graph), the
  vendored MapLibre bundle and the translation review inventories. The last two hold no secrets. They are left out
  because their minified symbols and table headings made up most of the graph and buried the project's own code in
  query results. Secrets and personal data must never enter a graph; add any new local data folder there before
  running Graphify.
- Free commands: `update`, `query`, `explain`, `path`, `affected`, `god-nodes`. `update` names the communities after
  their most connected member without a model.
- Commands that call a model, and so need the owner's approval with the price first: `/graphify .` inside an agent
  (the full mode, which also reads docs and images through the agent's own model), `extract`, `label`, and
  `cluster-only` without `--no-label`. The last three auto-detect any API key or local model server in the
  environment and may make **paid** calls.
- Checked on 14 November 2026 in a Linux cloud sandbox with a fresh `uv` install: `update`, `query`, `explain`,
  `affected`, `path` and `god-nodes`.

### Optional: reminder hook for Claude Code (per device, not committed)

Graphify can remind Claude Code about the map just before it searches or reads code. The repository does not commit
that hook, because it cannot run on a device without the `graphify` command. To switch it on for one device, create
`.claude/settings.local.json` (gitignored) with the configuration Graphify itself writes. If the file already
exists, add the `hooks` key to it.

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Grep", "hooks": [{ "type": "command", "command": "graphify hook-guard search", "timeout": 10 }] },
      { "matcher": "Read|Glob", "hooks": [{ "type": "command", "command": "graphify hook-guard read", "timeout": 10 }] }
    ],
    "SessionStart": [
      { "matcher": "compact", "hooks": [{ "type": "command", "command": "graphify hook-guard compact", "timeout": 10 }] }
    ]
  }
}
```

`graphify hook-guard` prints a short hint when `graphify-out/graph.json` exists and prints nothing otherwise. In this
form (without `--strict`) it never blocks a tool call. Checked on Linux by piping a sample tool call into the
command; **not checked** inside a Claude Code session on Windows. Codex has no equivalent: Graphify's own Codex hook
is a deliberate no-op, so for Codex the AGENTS.md rules are the mechanism.

## Project skills: not installed

The React skills from `vercel-labs/agent-skills` (`vercel-react-best-practices`, `vercel-composition-patterns`) are
not added: this is a standalone static browser application in plain JavaScript with a small Node server, without
React or Next.js, so their rules do not apply. `web-design-guidelines` is not added either (no licence, and it fetches
its rules from a URL at every run), nor the Vercel deploy skills (the site deploys on Railway).

**Project rules win.** AGENTS.md and the documents in `docs/` come before any tool or skill rule.
