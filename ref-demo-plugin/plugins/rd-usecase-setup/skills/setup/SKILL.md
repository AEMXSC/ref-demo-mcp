---
name: setup
description: >
  Domain router for setup & configuration skills. Routes setup intents to
  workspace-init, auth-setup, or env-config.
  Triggers: setup, init, workspace, credentials, auth, config, environment.
type: domain
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.1"
---

# Setup — Domain Router

| | |
|---|---|
| **ID** | `setup` |
| **Description** | Routes setup and configuration intents to the correct skill. |

---

## Routing Table

> **First match wins.**

| Intent Pattern | Skill |
|---|---|
| Initialize workspace, new project, setup project | `workspace-init` |
| Configure credentials, authentication, tokens | `auth-setup` |
| Environment settings, configuration, .env | `env-config` |

---

## Skills

| # | Skill | Purpose | Triggers |
|---|---|---|---|
| 1 | `workspace-init` | Initialize workspace and project structure | init, setup, workspace |
| 2 | `auth-setup` | Configure authentication and credentials | auth, credentials, token |
| 3 | `env-config` | Manage environment configuration | env, config, settings |

### Skill Locations

| Skill | Path |
|---|---|
| `workspace-init` | [`references/workspace-init/SKILL.md`](references/workspace-init/SKILL.md) |
| `auth-setup` | [`references/auth-setup/SKILL.md`](references/auth-setup/SKILL.md) |
| `env-config` | [`references/env-config/SKILL.md`](references/env-config/SKILL.md) |

---

## Guard Policies

> **Setup before build:** Always ensure workspace is initialized before any build operations.
>
> **Credentials never in code:** Never store credentials in code files.

---

## Dependencies

| Domain | Relationship |
|---|---|
| `build` | `build` depends on `setup` — workspace must exist before content creation |
