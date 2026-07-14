# Reference Demo Use Case Setup — Onboarding Guide

> Turn natural language into AEM content and Adobe Target activities.

---

## How It Works

The plugin is a **Plan-Driven Skill Gateway** — a layered routing architecture that maps user intents to the right skill automatically.

```
User Intent → reference-demo-orchestrator → Planner / Domain Registry → Domain Router → Skill → MCP Tools
```

### Architecture

```
User Intent
     │
     ▼
┌───────────────────────────────────┐
│  reference-demo-orchestrator       │  ← entry point router
│  SKILL.md                          │
└───────────────┬─────────────────────┘
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
┌──────────┐    ┌──────────────────┐
│  Planner │    │  Domain Registry │
│ generates│    │ catalogs domains │
│  plans   │    │   and skills     │
└────┬─────┘    └────────┬─────────┘
     │                   │
     ▼                   ▼
plans/<journey>/    Domain Routers
NN-<title>.md       └── setup, build
```

### Routing Algorithm

Every user prompt is evaluated against a 6-step decision sequence (full detail in `skills/reference-demo-orchestrator/assets/routing-table.md`):

| Step | Condition | Action |
|------|-----------|--------|
| 1 | No workspace (`REFERENCE_DEMO_WORKSPACE` unset, no `.env`) | Hard gate → `setup` › `workspace-init` |
| 2 | 🔵 Active plan in `.agent/handover.md` | Resume it |
| 3 | Pending plans exist in `plans/<journey>/` | Activate the next one, execute |
| 4 | No plans but user gave requirements | Planner generates plans → back to Step 3 |
| 5 | Single, isolated task | Route directly to the matching domain |
| 6 | Nothing matches | Ask the user to clarify |

### Domains

| Domain | Purpose | Skills |
|--------|---------|--------|
| `setup` | Workspace, credentials, environment | `workspace-init`, `auth-setup`, `env-config` |
| `build` | AEM content and Target activity creation | `aem-content`, `target-activities` |

### Plan Conventions

The Planner decomposes a journey into a small number of ordered plans, following the default strategy in `skills/reference-demo-orchestrator/references/planner/references/default-strategy.md`:

```
Setup → Build → Integration → Validation
```

| Rule | Description |
|------|-------------|
| **File path** | `plans/<journey>/NN-<short-title>.md` |
| **Numbering** | Zero-padded two digits: `01`, `02`, ... |
| **Max per journey** | 10 — if more are needed, split the journey |
| **Statuses** | ✅ Done — 🔵 Active — ⬚ Pending — ⏸️ Blocked — ❌ Failed |

---

## System Requirements

| Requirement | Why |
|-------------|-----|
| `git` on PATH | Version control for workspace files |
| AEM MCP server | `aem-content` — create/update AEM pages, components, assets |
| Adobe Target MCP server | `target-activities` — create/manage Target activities and audiences |

Both skills document a direct-API fallback for when the corresponding MCP tool isn't available.

---

## Install

### Claude Code

```bash
/plugin marketplace add Adobe-DemoPOC/rd-ai-plugin
/plugin install rd-usecase-setup@reference-demo
```

---

## Get Started

After installation, tell your agent:

> _"Set up a new workspace for my project."_

The orchestrator checks the workspace gate first — no `.env` or `REFERENCE_DEMO_WORKSPACE`, so it routes to `workspace-init` to create the directory structure and `.env` template, then `auth-setup` to configure AEM and Target credentials.

Once your workspace is ready:

> _"I want to set up a personalization demo combining AEM content with a Target A/B test."_

The orchestrator reads `.agent/handover.md` for journey state, invokes the Planner to generate ordered plans if none exist, then executes each plan by routing to the appropriate domain and skill. For single-task requests ("create an AEM page", "create a Target activity") it routes directly to the matching domain.

---

## Resources

- [README](README.md) — skills reference and configuration
- [Developer Guide](DEVELOPER.md) — repo structure, adding skills and domains
