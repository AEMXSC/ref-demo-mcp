# Orchestrator Guidelines

Constraints, conventions, and reference tables for the Reference Demo Orchestrator.

---

## Workspace Gate

Before any routing occurs, verify the workspace exists.

**Check:** `REFERENCE_DEMO_WORKSPACE` environment variable is set, or `.env` file exists in cwd.

| Condition | Action |
|-----------|--------|
| Workspace exists | Proceed to routing |
| Workspace missing | Route to `setup` › `workspace-init` immediately. **Block all other routing until complete.** |

---

## Plan Conventions

| Rule | Description |
|------|-------------|
| **File path** | `plans/<journey>/NN-<short-title>.md` |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10` |
| **Execution order** | Sequential — each plan declares its dependencies explicitly |
| **Max per journey** | 10 — if more are needed, the journey is too complex |

### Plan Status Tracking

**Statuses:** ✅ Done — 🔵 Active — ⬚ Pending — ⏸️ Blocked — ❌ Failed

---

## General Routing Rules

1. **The orchestrator does not implement** — it only selects and routes.
2. **Plans first, domain fallback** — always try to find or generate plans before falling through to direct domain routing.
3. **Active plan takes priority** — if a 🔵 Active plan exists, resume it before considering new intents.
4. **One active plan at a time** — complete or pause the current plan before starting a new one.
5. **Domains own skills** — the orchestrator never invokes a skill directly.
6. **Ambiguity requires user input** — if multiple options match, present them. Never guess.

---

## Config Files

| File | Managed By | Purpose |
|------|------------|---------|
| `.env` | `workspace-init` | Workspace path + credentials — never commit |
| `config/aem.json` | `env-config` | AEM-specific configuration |
| `config/target.json` | `env-config` | Target-specific configuration |

---

## File Locations

| What | Where |
|------|-------|
| Orchestrator | `skills/reference-demo-orchestrator/SKILL.md` |
| Routing table | `skills/reference-demo-orchestrator/assets/routing-table.md` |
| Planner | `skills/reference-demo-orchestrator/references/planner/SKILL.md` |
| Domain registry | `skills/reference-demo-orchestrator/references/domain-registry/SKILL.md` |
| Setup domain | `skills/setup/SKILL.md` |
| Build domain | `skills/build/SKILL.md` |
