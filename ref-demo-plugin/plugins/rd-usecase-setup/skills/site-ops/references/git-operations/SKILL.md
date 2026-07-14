---
name: git-operations
description: >
  Git/GitHub mechanics for EDS UE site creation — create a repo from a template,
  check/list repos, read and commit UE config files, install (manual) and attach
  the aem-code-sync GitHub App to a repo, and check a site's preview URL. Uses
  the classic PAT in .env (wired into github-mcp). Ships a dependency-free
  gh-site helper for the REST endpoints no MCP exposes.
  Triggers: git, github, repo, clone, commit, push, create repo, template,
  aem-code-sync, code sync, installation, attach repo, preview url.
type: skill
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Git Operations

The git/GitHub layer for `site-ops`. Called by [`create-eds-site`](../create-eds-site/SKILL.md).

## Critical Rules

1. **Never log, echo, or commit the PAT.** Read `GITHUB_TOKEN` only from git-ignored `.env`; the bundled `gh-site` helper never prints it.
2. **Confirm the owner** — all repo/preview URLs use `GITHUB_OWNER` from `.env`.
3. **Idempotent** — check state before mutating (repo exists? file already correct? repo already attached?).
4. **App install is manual** — the GitHub App consent flow has no third-party API; prompt the user and wait.

## Backend

**Default: `github-mcp`** (already registered in this plugin's `.claude-plugin/plugin.json`,
authorized with `${GITHUB_TOKEN}` via its `Authorization` header). Use its tools for
repo/contents operations when available.

**REST-only fallback: `scripts/gh-site`** — a POSIX `sh` + `curl` helper (no npm
deps) for the endpoints `github-mcp` does not expose (template generate,
installations, attach, preview). It reads `GITHUB_TOKEN`/`GITHUB_OWNER` from `.env`.

**Reuse alternative:** where the **aem-forms** plugin is installed and the user
prefers a sandboxed clone for committing `fstab.yaml`/`paths.json`, its
`git-sandbox` CLI can substitute for the commit/push step (config `sandbox.json`
with `repo`, `branch: main`, `allowed_paths: ["fstab.yaml","paths.json"]`). Not a
hard dependency — the default path above needs nothing outside this plugin.

## Operations

| Op | How | Endpoint |
|----|-----|----------|
| Create repo from template | `gh-site generate <tmpl_owner> <tmpl_repo> <new_repo>` | `POST /repos/{tmpl_owner}/{tmpl_repo}/generate` |
| Repo exists? / repo id | `gh-site repo-id <repo>` | `GET /repos/{owner}/{repo}` |
| List owner repos (site filter) | `gh-site list-repos` | `GET /user/repos` or `/orgs/{org}/repos` |
| List orgs (owner picker) | `gh-site orgs` | `GET /user` + `GET /user/orgs` |
| Read/commit `fstab.yaml`,`paths.json` | github-mcp contents API (or git-sandbox reuse) | `PUT /repos/{owner}/{repo}/contents/{path}` |
| Find aem-code-sync installation | `gh-site installation` | `GET /user/installations` (filter `app_slug=aem-code-sync`) |
| Attach repo to installation | `gh-site attach <installation_id> <repo>` | `PUT /user/installations/{id}/repositories/{repo_id}` |
| Preview 200 check | `gh-site preview <url>` | `curl -o /dev/null -w %{http_code}` |

Run the helper as:

```
"${CLAUDE_PLUGIN_ROOT}/skills/site-ops/references/git-operations/scripts/gh-site" <subcommand> [args]
```

## Capability gaps & MCP guidance (A8)

| Capability | Automatable? | Approach |
|------------|--------------|----------|
| **Install** `aem-code-sync` on the account | ❌ No public API (browser consent) | Prompt the user to install & confirm. *Future:* a small MCP could poll `GET /user/installations` (see https://docs.github.com/en/rest/apps/installations) to confirm install status — spec it later; it still cannot perform the consent. |
| **Attach** the repo to the installation | ✅ Yes | `PUT /user/installations/{installation_id}/repositories/{repository_id}` with the classic PAT (`repo` scope + repo admin). **No custom MCP needed** — `gh-site attach`. |
| Any capability with **no API at all** | — | Guide the user to build/host a small MCP (spec the tools), otherwise instruct a manual step and continue. |

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `401/403` from `gh-site` | Bad/missing PAT or scope | Ensure `GITHUB_TOKEN` is a classic PAT with `repo` scope (repo admin for attach) in `.env` |
| `generate` 404 | Template repo not a GitHub template, or no access | Confirm the template row in `create-eds-site/assets/site-templates.md`; the source must be a template repo |
| `attach` fails | Wrong installation id or repo not visible to the app | Re-run `gh-site installation`; else prompt manual add via the app's Repository-access dropdown |
| Preview ≠ 200 | Code sync not finished / app not attached / DNS warm-up | Wait and re-check; verify the repo is attached and pushed to `main` |
