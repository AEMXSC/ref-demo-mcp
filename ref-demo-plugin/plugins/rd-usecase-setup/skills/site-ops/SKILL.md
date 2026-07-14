---
name: site-ops
description: >
  Domain router for AEM EDS Universal-Editor site operations and the git
  operations they need. Routes site intents to create-eds-site (new/existing
  site lifecycle) or git-operations (repo, template, commit, push, aem-code-sync
  app install/attach, preview check).
  Triggers: site, new site, create site, eds site, ue site, universal editor
  site, git, repo, clone, commit, push, aem-code-sync, code sync, template.
type: domain
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Site Ops — Domain Router

| | |
|---|---|
| **ID** | `site-ops` |
| **Description** | Routes AEM EDS UE site creation and its git/GitHub operations to the correct skill. |

---

## Routing Table

> **First match wins.**

| Intent Pattern | Skill |
|---|---|
| Create a new site, new EDS/UE site, select/use an existing site, site lifecycle | `create-eds-site` |
| Create repo from template, clone, commit, push, list repos, install/attach `aem-code-sync`, check preview URL | `git-operations` |

---

## Skills

| # | Skill | Purpose | Triggers |
|---|---|---|---|
| 1 | `create-eds-site` | New-vs-existing site decision, naming, template pick, UE config, validation | site, new site, eds site, ue site, template |
| 2 | `git-operations` | Repo-from-template, commit/push, aem-code-sync install/attach, preview check | git, repo, clone, commit, push, aem-code-sync |

### Skill Locations

| Skill | Path |
|---|---|
| `create-eds-site` | [`references/create-eds-site/SKILL.md`](references/create-eds-site/SKILL.md) |
| `git-operations` | [`references/git-operations/SKILL.md`](references/git-operations/SKILL.md) |

---

## Guard Policies

> **Setup required:** workspace must be initialized and `GITHUB_TOKEN` (classic PAT, `repo` scope) + `GITHUB_OWNER` must be present/confirmed in `.env` (see `setup` › `auth-setup`) before any site or git operation.
>
> **Never echo or commit the PAT.** `.env` is git-ignored; the token is masked in all output and wired into the `github-mcp` config.
>
> **New repo only on explicit intent.** Existing-site work skips all repo/app-creation steps.

---

## Dependencies

| Domain | Relationship |
|---|---|
| `setup` | `site-ops` depends on `setup` — workspace + `GITHUB_TOKEN`/`GITHUB_OWNER` must exist |
