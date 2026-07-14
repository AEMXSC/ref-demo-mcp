---
name: domain-registry
description: >
  Domain registry and router for Reference Demo skills. Catalogs all domains
  and their skills. Routes user intents to the correct domain based on trigger
  patterns. Triggers: which domain, which skill, what can you do, list skills.
type: router
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.1"
---

# Domain Registry

Domains are skill containers. This registry catalogs all domains and provides intent-based routing.

---

## Registry

| Domain | Router | Description |
|--------|--------|-------------|
| `setup` | [`../../../setup/SKILL.md`](../../../setup/SKILL.md) | Setup & configuration — workspace, credentials, environment |
| `build` | [`../../../build/SKILL.md`](../../../build/SKILL.md) | Content creation — AEM content, Target activities |
| `site-ops` | [`../../../site-ops/SKILL.md`](../../../site-ops/SKILL.md) | EDS UE site creation + git operations |
| `notify` | [`../../../notify/SKILL.md`](../../../notify/SKILL.md) | Notifications — SMS |

---

## Skills Catalog

| # | Domain | Skill | Purpose | Triggers |
|---|--------|-------|---------|----------|
| 1 | `setup` | `workspace-init` | Initialize workspace and project structure | init, setup, workspace |
| 2 | `setup` | `auth-setup` | Configure authentication and credentials | auth, credentials, token |
| 3 | `setup` | `env-config` | Manage environment configuration | env, config, settings |
| 4 | `build` | `aem-content` | Create and manage AEM content | aem, content, page |
| 5 | `build` | `target-activities` | Create and manage Target activities | target, activity, test |
| 6 | `site-ops` | `create-eds-site` | Create a new EDS UE site or select an existing one | site, new site, eds site, ue site, template |
| 7 | `site-ops` | `git-operations` | Repo-from-template, commit/push, aem-code-sync install/attach, preview check | git, repo, clone, commit, push, aem-code-sync |
| 8 | `notify` | `send-sms` | Send an SMS notification via a bundled script | sms, notify, text, alert |

---

## Intent → Domain Routing

| User Intent Pattern | Domain | Skills |
|---------------------|--------|--------|
| Setup, initialize, workspace, credentials, auth, config | `setup` | `workspace-init`, `auth-setup`, `env-config` |
| Create AEM content, page, component | `build` | `aem-content` |
| Create Target activity, A/B test, experiment | `build` | `target-activities` |
| Create a new EDS/UE site, use an existing site, pick a site template | `site-ops` | `create-eds-site` |
| Create repo from template, commit/push, install/attach aem-code-sync, check preview | `site-ops` | `git-operations` |
| Send SMS, notify, text message, alert | `notify` | `send-sms` |

---

## Skill Resolution

| Domain | Skill | Path |
|--------|-------|------|
| `setup` | `workspace-init` | `skills/setup/references/workspace-init/SKILL.md` |
| `setup` | `auth-setup` | `skills/setup/references/auth-setup/SKILL.md` |
| `setup` | `env-config` | `skills/setup/references/env-config/SKILL.md` |
| `build` | `aem-content` | `skills/build/references/aem-content/SKILL.md` |
| `build` | `target-activities` | `skills/build/references/target-activities/SKILL.md` |
| `site-ops` | `create-eds-site` | `skills/site-ops/references/create-eds-site/SKILL.md` |
| `site-ops` | `git-operations` | `skills/site-ops/references/git-operations/SKILL.md` |
| `notify` | `send-sms` | `skills/notify/references/send-sms/SKILL.md` |
