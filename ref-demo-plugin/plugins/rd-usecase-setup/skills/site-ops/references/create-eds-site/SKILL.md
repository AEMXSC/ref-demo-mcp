---
name: create-eds-site
description: >
  Create a new AEM EDS Universal-Editor site or operate on an existing one.
  Decides new-vs-existing, validates and de-duplicates the site name, picks a
  template, creates the repo from that template, wires the UE config
  (fstab.yaml, paths.json, placeholders hostname), prompts for the aem-code-sync
  app install (last creation step), attaches the repo to the installation, then
  validates the preview URL. Delegates all git/GitHub mechanics to
  git-operations. Records progress in .agent/handover.md.
  Triggers: create site, new site, new eds site, ue site, universal editor site,
  existing site, site template, brand site.
type: skill
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Create EDS UE Site

Stand up a new AEM EDS Universal-Editor (UE) site, or select an existing one to
operate on. All git/GitHub calls go through [`git-operations`](../git-operations/SKILL.md).

## Terminology (fixed mapping)

| Term | Meaning |
|------|---------|
| **GitHub org** (`GITHUB_OWNER`) | Selectable — if the PAT sees multiple orgs, the user picks one |
| **repo name** | Always **equal to the site name** |
| **site name** | Provided by the user (asked if missing) |
| **content source** | AEM Author (`AEM_HOST`) |
| **preview/live URL** | `https://<branch>--<repo>--<org>.aem.page` |

## Critical Rules

1. **Validate every input; never assume** — ask the user for anything missing.
2. **New repo only on explicit "new site" intent** — existing-site work skips all repo/app-creation steps.
3. **Idempotent** — every step checks current state first and skips if already satisfied; safe to re-run.
4. **Never echo, log, or commit the PAT** — it lives only in git-ignored `.env`.
5. **Steps are embedded here** — do NOT fetch `referencedemo.adobe.com` at runtime (internal, may be unreachable).
6. **Templates come only from [`assets/site-templates.md`](assets/site-templates.md)** — never invent a template.
7. **Record progress in `.agent/handover.md`** after each phase (no secrets).

## Prerequisites

Workspace initialized, the `github-mcp` connector authorized (preferred path), `AEM_HOST`
confirmed, and — as backup for `git-operations`' `gh-site` fallback — `.env` has confirmed
`GITHUB_TOKEN` (classic PAT, `repo` scope) and `GITHUB_OWNER` — see `setup` › `auth-setup`.
If missing, route there first.

---

## Runtime Flow

### B1 — Entry decision

If the user did not give a site name or a clear new-vs-existing intent, ask:

> Do you want to **create a new site** or **work on an existing site**?

### B2 — Existing site

1. Resolve `GITHUB_OWNER` (see *Owner selection* below).
2. `git-operations` → `list-repos` for that owner; present repos that look like EDS sites (contain `fstab.yaml`).
3. User picks one. **Skip all repo/app-creation steps** — proceed to operate on the chosen site.

### B3 — New site (only when the user explicitly wants a new site)

1. **Name** — if not provided, ask for the site name. `repo name = site name`.
2. **Name exists?** — `git-operations` → `GET /repos/{owner}/{repo}`. If it exists, confirm:
   - **(a) reuse** the existing one → go to **B2**, or
   - **(b) create new** → require a **unique** name and confirm it (re-check until free).
3. **Template** — show the list from [`assets/site-templates.md`](assets/site-templates.md); user picks one.
4. **Create repo** — `git-operations` → `generate` (repo from the chosen template into `GITHUB_OWNER/<site>`).
5. **UE config** — commit via `git-operations`:
   - `fstab.yaml` → set the mountpoint URL `https://<AEM_HOST>/bin/franklin.delivery/<GITHUB_OWNER>/<repo>/main`
     (XXX = `AEM_HOST`, YYY = `GITHUB_OWNER`, ZZZ = `repo`).
   - `paths.json` → replace **all** occurrences of `wknd-universal` with the site name.
   - **Placeholders sheet** → update the site's hostname value to the site's host.
   - Skip any file already correct (idempotent).
6. **Install app** — *last creation step*. Installing the GitHub App is a browser consent flow with **no third-party API** (see `git-operations` capability gaps). Prompt:
   > Install **aem-code-sync** at https://github.com/apps/aem-code-sync and grant it access to `<GITHUB_OWNER>/<repo>`. Tell me when done.

   Wait for confirmation.
7. **Configure app → repo** (separate phase, **after** install) — `git-operations` → `installation` (find `aem-code-sync` installation id) then `attach` (PUT repo into it). If it cannot be done automatically, prompt the user to add the repo under the app's **Repository access** dropdown and save, then continue.
8. **Validate** — `git-operations` → `preview` on `https://main--<repo>--<GITHUB_OWNER>.aem.page`. **Done only when it returns 200.** Report the preview/live URLs.

### B4 — Throughout

- Validate all inputs; ask for anything missing (never assume).
- After each phase, update `.agent/handover.md` (see *Handover* below).

---

## Owner selection (`GITHUB_OWNER`)

If `GITHUB_OWNER` is already confirmed in `.env`, use it. Otherwise `git-operations`
lists the authenticated user plus `GET /user/orgs`; if more than one, present a
picker; store the choice as `GITHUB_OWNER` in `.env`.

## Idempotency & resume (A7)

| Step | State check before acting |
|------|---------------------------|
| Create repo | `GET /repos/{owner}/{repo}` — reuse if present |
| fstab/paths | read current content — skip commit if already correct |
| Attach repo | `PUT` is idempotent — re-running is safe |

On mid-flow failure, **report the exact step that failed and how to resume**. A
partially created repo is **left in place** (no auto-delete) — re-running resumes
cleanly from the first unsatisfied step.

## Handover

After each phase, write `.agent/handover.md` following the plugin's handover
template: **Journey Status** and **Plan Execution Status** tables, ≤ 60 lines,
`✅ Done — 🔵 Active — ⬚ Pending — ⏸️ Blocked — ❌ Failed`. Never write the PAT
or any secret to `.agent/`. The plan set for this journey is materialized from
[`assets/create-new-eds-site-plan.md`](assets/create-new-eds-site-plan.md) into
`plans/create-new-eds-site/NN-*.md`.

## Validation checklist

- [ ] Repo exists at `GITHUB_OWNER/<site>` (generated from the chosen template)
- [ ] `fstab.yaml` mountpoint points at `AEM_HOST` / owner / repo
- [ ] `paths.json` has no remaining `wknd-universal`
- [ ] Placeholders sheet hostname updated
- [ ] `aem-code-sync` installed and repo attached to the installation
- [ ] `https://main--<repo>--<owner>.aem.page` returns **200**
