# Agent tools: Graphify

An optional helper for coding agents (Claude Code, Codex) working on this repository. It is not part of the site:
nothing here runs in the server, the browser app or the proxies, and it reads no visitor data.

## Graphify (code knowledge graph)

- Package `graphifyy` 0.9.108 (PyPI), command `graphify`, source https://github.com/Graphify-Labs/graphify,
  licence Apache-2.0.
- Install per user with `uv tool install --python 3.12 graphifyy` (its own tool environment, not a project
  dependency), then register it for Claude Code with `graphify install --platform claude` (macOS/Linux) or
  `graphify install --platform windows` (Windows). The Windows registration step is **unverified** for this repo;
  check with `Test-Path $HOME\.claude\skills\graphify\SKILL.md` after running it.

### Building the graph (free, local)

```
graphify update . --no-cluster        # AST extraction of code with tree-sitter, no LLM, no API call
graphify cluster-only . --no-label    # communities + GRAPH_REPORT.md + graph.html, still no LLM
graphify query "how does the server proxy community requests"
```

- Output goes to `graphify-out/` at the repo root, which is gitignored. The graph goes stale with every commit, so it
  is rebuilt, never committed.
- `.graphifyignore` adds to `.gitignore` (it can only exclude more): build output, env files, local QA output and
  the screenshot gallery, and the field-guide photos and watercolour art (the field-guide code stays in the graph).
  Secrets and personal data must never enter a graph; add any new local data folder there before running Graphify.
- `/graphify .` inside an agent (the full mode) also reads docs and images through the agent's own model. That spends
  agent tokens; the code-only commands above do not. `--no-label` skips the LLM community naming; without it,
  `graphify` auto-detects any API key or local model server in the environment and may make **paid** calls. Keep
  `--no-label` (and `--no-cluster` on `update`) unless the owner agreed to the cost.

## Project skills: not installed

The React skills from `vercel-labs/agent-skills` (`vercel-react-best-practices`, `vercel-composition-patterns`) are
not added: this is a standalone static browser application in plain JavaScript with a small Node server, without
React or Next.js, so their rules do not apply. `web-design-guidelines` is not added either (no licence, and it fetches
its rules from a URL at every run), nor the Vercel deploy skills (the site deploys on Railway).

**Project rules win.** AGENTS.md and the documents in `docs/` come before any tool or skill rule.
