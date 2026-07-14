---
name: reference-demo-orchestrator
description: >
  Skill Gateway for Adobe AEM and Target MCP operations. Pure router with two
  registries — Planner (references/planner/SKILL.md) and Domain Registry
  (references/domain-registry/SKILL.md). Routes user intents to plans (sequences
  of skill invocations), resolves each plan step to a domain/skill, and executes
  accordingly. When no plans exist, generates them from user requirements.
  Triggers: plan, workflow, how to build, orchestrate, what skill, which skill,
  next step, getting started, AEM, Target, setup, configure.
type: router
license: Apache-2.0
metadata:
  author: Your Organization
  version: "1.0"
---

# Reference Demo Orchestrator — Skill Gateway

Pure router. Two registries. No implementation logic.

```
User Intent
     │
     ▼
┌────────────────────────────────────────┐
│  Plans                                 │
│  plans/<journey>/NN-<title>.md         │──→ ordered steps, each declaring skill(s)
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│  Domain Registry                       │
│  references/domain-registry/SKILL.md   │──→ resolves domain/skill to implementation
└──────────────────┬─────────────────────┘
                   │
                   ▼
              Skill executes
```

> This gateway **selects** and **routes**. It does not implement.
> Plans define the step sequence. Domains own the skills. The orchestrator connects them.

---

## Routing

When a user prompt arrives, follow the routing algorithm in [`assets/routing-table.md`](assets/routing-table.md):

1. **Workspace gate** — no workspace? → `setup` › `workspace-init` (hard block)
2. **Active plan** — 🔵 Active plan in `.agent/handover.md`? → resume it
3. **Plans exist** — plans in `plans/<journey>/`? → pick next pending → execute
4. **Generate plans** — user has requirements but no plans? → Planner generates them → execute
5. **Domain fallback** — intent is a single task? → route to domain directly
6. **No match** — ask user to clarify

Full step-by-step logic, decision tables, and precedence rules: **[`assets/routing-table.md`](assets/routing-table.md)**

---

## Registries

| Registry | File | What It Does |
|----------|------|-------------|
| **Planner** | [`references/planner/SKILL.md`](references/planner/SKILL.md) | Generates plans from user requirements using a default or custom strategy |
| **Domain Registry** | [`references/domain-registry/SKILL.md`](references/domain-registry/SKILL.md) | Catalogs domains and skills, matches intents to domains, resolves plan step targets to executable skills |

Plan files live in `plans/<journey>/`. Domain skill trees live in `references/domain-registry/references/`.

---

## Guidelines & Constraints

All orchestrator constraints, conventions, file locations, workspace resolution, plan conventions, and general routing rules: **[`assets/guidelines.md`](assets/guidelines.md)**

---

## Quick Reference

| What | Where |
|------|-------|
| Routing algorithm | `assets/routing-table.md` |
| Constraints & conventions | `assets/guidelines.md` |
| Plan template | `references/planner/assets/plan-template.md` |
| Planner | `references/planner/SKILL.md` |
| Plan files | `plans/<journey>/NN-<title>.md` |
| Domain registry | `references/domain-registry/SKILL.md` |
| Setup domain | `../../setup/SKILL.md` |
| Build domain | `../../build/SKILL.md` |
