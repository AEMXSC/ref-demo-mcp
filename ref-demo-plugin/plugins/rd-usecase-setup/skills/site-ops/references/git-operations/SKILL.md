---
name: git-operations
description: >
  Git/GitHub mechanics for EDS UE site creation — create a repo from a template,
  check/list repos, read and commit UE config files, install (manual) and attach
  the aem-code-sync GitHub App to a repo, and check a site's preview URL. Primary
  path is github-mcp's own github_login device-flow tool (this server owns the
  GitHub OAuth handshake itself). Falls back to the classic-PAT gh-site helper
  for accounts that can't complete device-flow login.
  Triggers: git, github, repo, clone, commit, push, create repo, template,
  aem-code-sync, code sync, installation, attach repo, preview url.
type: skill
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.2"
---

# Git Operations

The git/GitHub layer for `site-ops`. Called by [`create-eds-site`](../create-eds-site/SKILL.md).

## Critical Rules

1. **Never log, echo, or commit a PAT.** If the `gh-site` fallback is used, read `GITHUB_TOKEN` only from git-ignored `.env`; the helper never prints it.
2. **Confirm the owner** — all repo/preview URLs use `GITHUB_OWNER` from `.env`.
3. **Idempotent** — check state before mutating (repo exists? file already correct? repo already attached?).
4. **App install is manual** — the GitHub App consent flow has no third-party API; prompt the user and wait.
5. **Carry `session_id` for the whole flow** — `github_login` returns a `session_id`; pass the same value to every subsequent `github_*` tool call in this session. Losing it means logging in again.

## Backend

**Default: `github-mcp`'s own tools** (registered in this plugin's `.claude-plugin/plugin.json`,
pointed at the same hosted `rd-mcp`/`mcp-server` endpoint as `export-cf-to-target`). This server
owns the GitHub OAuth handshake itself via the device-authorization flow, so no PAT is needed
for anything it covers:

1. **`github_login`** — starts the device flow. Show the user the returned `verification_uri` +
   `user_code` and ask them to open it and enter the code. Keep the returned `session_id`.
2. **`github_login_status`** — call with that `session_id` once the user confirms they entered
   the code. If it reports still-pending, call it again after a short pause — don't loop it
   rapidly.
3. Once logged in, use `github_list_repos`, `github_generate_repo`, `github_installation`,
   `github_attach`, `github_preview` — all take the same `session_id`.

**PAT-backed fallback: `scripts/gh-site`** — a POSIX `sh` + `curl` helper (no npm
deps) reading `GITHUB_TOKEN`/`GITHUB_OWNER` from `.env`. Use this only if `github_login`
can't be completed (e.g. the account can't reach github.com/login/device, or the user
prefers to keep using a PAT) — collected/confirmed by `auth-setup` Step 1b as the backup
credential, not the primary auth path.

**Reuse alternative:** where the **aem-forms** plugin is installed and the user
prefers a sandboxed clone for committing `fstab.yaml`/`paths.json`, its
`git-sandbox` CLI can substitute for the commit/push step (config `sandbox.json`
with `repo`, `branch: main`, `allowed_paths: ["fstab.yaml","paths.json"]`). Not a
hard dependency — the default path above needs nothing outside this plugin.

## Operations

| Op | Primary (OAuth tool) | PAT fallback | Endpoint |
|----|----------------------|--------------|----------|
| Log in | `github_login` → `github_login_status` | *(n/a — replaces the PAT prompt)* | `POST /login/device/code`, `POST /login/oauth/access_token` |
| Create repo from template | `github_generate_repo` | `gh-site generate <tmpl_owner> <tmpl_repo> <new_repo>` | `POST /repos/{tmpl_owner}/{tmpl_repo}/generate` |
| Repo exists? / repo id | (part of `github_attach`) | `gh-site repo-id <repo>` | `GET /repos/{owner}/{repo}` |
| List owner repos (site filter) | `github_list_repos` | `gh-site list-repos` | `GET /user/repos` or `/orgs/{org}/repos` |
| List orgs (owner picker) | `github_list_repos`'s own `/user/orgs` check | `gh-site orgs` | `GET /user` + `GET /user/orgs` |
| Read/commit `fstab.yaml`,`paths.json` | github-mcp contents API (or git-sandbox reuse) | — | `PUT /repos/{owner}/{repo}/contents/{path}` |
| Find aem-code-sync installation | `github_installation` | `gh-site installation` | `GET /user/installations` (filter `app_slug=aem-code-sync`) |
| Attach repo to installation | `github_attach` | `gh-site attach <installation_id> <repo>` | `PUT /user/installations/{id}/repositories/{repo_id}` |
| Preview 200 check | `github_preview` | `gh-site preview <url>` | `curl -o /dev/null -w %{http_code}` (or plain `fetch`) |

Run the PAT-fallback helper as:

```
"${CLAUDE_PLUGIN_ROOT}/skills/site-ops/references/git-operations/scripts/gh-site" <subcommand> [args]
```

## Capability gaps & MCP guidance (A8)

| Capability | Automatable? | Approach |
|------------|--------------|----------|
| **Login** to GitHub | ✅ Yes, via `github_login` device flow | User opens a link and enters a code — no PAT, no redirect URI to host. |
| **Install** `aem-code-sync` on the account | ❌ No public API (browser consent) | Prompt the user to install & confirm — `github_installation` can only detect the result, never perform the consent. |
| **Attach** the repo to the installation | ✅ Yes | `github_attach` (or `gh-site attach` as fallback), `PUT /user/installations/{installation_id}/repositories/{repository_id}`. |
| Any capability with **no API at all** | — | Guide the user to build/host a small MCP (spec the tools), otherwise instruct a manual step and continue. |

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `github_login_status` stuck on pending | User hasn't opened the link/entered the code yet | Re-prompt the user, then call `github_login_status` again with the same `session_id` |
| "No GitHub login found for session_id" | `session_id` lost/expired, or never completed `github_login_status` | Call `github_login` again — sessions aren't shared across a fresh login |
| `401/403` from `gh-site` (PAT fallback) | Bad/missing PAT or scope | Ensure `GITHUB_TOKEN` is a classic PAT with `repo` scope (repo admin for attach) in `.env` |
| `generate` 404 / 422 | Template repo not a GitHub template, or no access | Confirm the template row in `create-eds-site/assets/site-templates.md`; the source must be a template repo |
| `attach` fails | Wrong installation id or repo not visible to the app | Re-run `github_installation`/`gh-site installation`; else prompt manual add via the app's Repository-access dropdown |
| Preview ≠ 200 | Code sync not finished / app not attached / DNS warm-up | Wait and re-check; verify the repo is attached and pushed to `main` |
