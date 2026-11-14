# Venice Sideways maintenance rules

- Standalone static browser application; Node server is a deployment option, not a data backend.
- Do not embed personal gallery data, database credentials or upstream Git history. Anonymous Sideways aggregate statistics (on by default; a stored "no" turns them off on that device) use a fixed server endpoint only.
- Canonical domain: https://venicesideways.com/. Server-side calls to the owned Sideways API are authorized; do not forward browser credentials or expose private archive data.
- Preserve all route IDs/order, five prompts per stop, eight locales, transit split and light basemap when changing presentation.
- Own-device location remains opt-in and local to the browser. Never send device coordinates to admins or a server. Denial must not block browsing.
- Validate start/stop/race/visibility, language changes and phone layout before deploying.
- Do not redirect the old site until custom-domain HTTPS and smoke tests pass. Do not claim DNS, deployment or repository creation without successful evidence.

- Public Main-only visibility belongs to the explicit presentation setting. Keep all route records when saving progress; private Full previews and saved Full progress must remain intact.
- Bundled stop photos have explicit gallery relations and source/license metadata. Never fill administrator-empty or revoked galleries automatically from a static catalog.
- Keep README and CURRENT-STATE free of verification counts, commit SHAs and deployment IDs; record those in `docs/history/`.

Agent tools (docs/agent-tools.md). The code map is local and never committed, so a fresh checkout or a cloud sandbox starts without one.

- Start of every session: run `graphify update .` (free, local, no model call, takes seconds here). If the command is missing, install it first with `uv tool install --python 3.12 graphifyy==0.9.108`.
- Before searching or reading widely, ask the map and open only the files it points to: `graphify query "<one to three words from file, function or feature names>"` (full sentences match poorly) or `graphify explain "<name>"`.
- Before changing a function, check what depends on it with `graphify affected "<name>"`.
- Run `graphify update .` again after your own code changes and after every merge to main.
- Use only free Graphify commands (update, query, explain, path, affected, god-nodes). Anything that calls a model (`/graphify`, extract, label, cluster-only without `--no-label`) needs the owner's approval with the price first.
- If the map and the code disagree, the code wins: refresh the map.
- In every pull request, add a "Code map" line with the commit the map was built from and the queries you ran, or the reason the map was not used.
