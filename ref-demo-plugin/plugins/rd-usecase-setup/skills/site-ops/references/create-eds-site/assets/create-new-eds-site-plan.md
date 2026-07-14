# Journey: create-new-eds-site — Plan Set

Materialize these into the workspace as `plans/create-new-eds-site/NN-<title>.md`
(one file per plan), following the plugin plan template. Numbering is
zero-padded. Every plan ends with a validate step. Skip creation plans entirely
when the user chose an **existing** site.

---

## Plan 01: Site Decision

**Source:** user intent (`create-eds-site` B1/B2/B3.1–3.2)
**Skills:** `create-eds-site`, `git-operations`
**Depends on:** Nothing (first plan)

### Objective
Decide new-vs-existing, resolve `GITHUB_OWNER`, and lock a unique site name.

### Steps to Execute
1. **Ask new-vs-existing** using `create-eds-site` (B1) if intent is unclear.
2. **Resolve owner** using `git-operations` — list user + `GET /user/orgs`; if multiple, user picks; store `GITHUB_OWNER`.
3. **Existing path:** `git-operations list-repos` → user picks a site repo → jump to the existing-site journey (skip Plans 02–04).
4. **New path:** get site name (ask if missing); `git-operations` `GET /repos/{owner}/{name}`; if it exists, confirm reuse or require a new unique name.
5. **Validate:** owner set and a unique, confirmed site name is in hand (or an existing site is selected).

### Acceptance Criteria
- [ ] `GITHUB_OWNER` confirmed
- [ ] Unique site name confirmed, OR existing site selected

---

## Plan 02: Create Repo

**Source:** `create-eds-site` B3.3–3.4
**Skills:** `create-eds-site`, `git-operations`
**Depends on:** Plan 01 (owner + unique name)

### Objective
Create the site repo from the chosen template.

### Steps to Execute
1. **Pick template** using `create-eds-site` from `assets/site-templates.md`.
2. **Generate repo** using `git-operations generate` → `POST /repos/<template_owner>/<template_repo>/generate` into `GITHUB_OWNER/<site>`.
3. **Validate:** `git-operations` `GET /repos/{owner}/{site}` returns 200.

### Acceptance Criteria
- [ ] Repo `GITHUB_OWNER/<site>` exists, generated from the chosen template

---

## Plan 03: UE Config

**Source:** `create-eds-site` B3.5 (embedded git-setup steps)
**Skills:** `create-eds-site`, `git-operations`
**Depends on:** Plan 02 (repo exists)

### Objective
Wire the UE config so the repo is a complete UE site (not just a repo).

### Steps to Execute
1. **fstab.yaml** — set mountpoint `https://<AEM_HOST>/bin/franklin.delivery/<GITHUB_OWNER>/<repo>/main` (commit via `git-operations`; skip if already correct).
2. **paths.json** — replace all `wknd-universal` with the site name.
3. **Placeholders sheet** — update hostname value to the site host.
4. **Validate:** re-read each artifact; no `wknd-universal` remains; fstab points at the right AEM/owner/repo.

### Acceptance Criteria
- [ ] `fstab.yaml`, `paths.json`, placeholders updated and committed

---

## Plan 04: Code Sync App

**Source:** `create-eds-site` B3.6–3.7 (A8)
**Skills:** `create-eds-site`, `git-operations`
**Depends on:** Plan 03 (UE config committed)

### Objective
Install `aem-code-sync` (last creation step) and attach the repo to it.

### Steps to Execute
1. **Install (manual)** — prompt the user to install https://github.com/apps/aem-code-sync for `<GITHUB_OWNER>/<repo>` (no third-party API); wait for confirmation.
2. **Attach (API)** — `git-operations installation` (find `aem-code-sync` installation id) → `git-operations attach` (`PUT /user/installations/{id}/repositories/{repo_id}`). On failure, prompt manual add via the app's Repository-access dropdown, then continue.
3. **Validate:** the installation lists the repo.

### Acceptance Criteria
- [ ] `aem-code-sync` installed and repo attached to the installation

---

## Plan 05: Validate

**Source:** `create-eds-site` B3.8 (A7 success check)
**Skills:** `create-eds-site`, `git-operations`
**Depends on:** Plan 04 (app attached)

### Objective
Confirm the site is live and report URLs.

### Steps to Execute
1. **Preview check** — `git-operations preview` on `https://main--<repo>--<GITHUB_OWNER>.aem.page`.
2. **Validate:** HTTP status is **200**.
3. **Report** preview/live URLs and update `.agent/handover.md`.

### Acceptance Criteria
- [ ] `https://main--<repo>--<owner>.aem.page` returns 200
- [ ] Preview/live URLs reported; handover updated
