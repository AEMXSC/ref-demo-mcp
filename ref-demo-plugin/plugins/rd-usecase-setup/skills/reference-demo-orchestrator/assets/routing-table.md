# Routing Table

The orchestrator's routing algorithm. Determines how user intents are classified and routed to plans or domains.

---

## Architecture

```
User Intent
     │
     ▼
┌────────────────────────────────────────┐
│  Step 1: Workspace Gate                 │──→ no workspace? → setup › workspace-init
└──────────────────┬─────────────────────┘
                   │ workspace exists
                   ▼
┌────────────────────────────────────────┐
│  Step 2: Active Plan Check              │──→ 🔵 Active plan? → resume → execute steps
└──────────────────┬─────────────────────┘
                   │ no active plan
                   ▼
┌────────────────────────────────────────┐
│  Step 3: Plans Check                    │
│  plans/<journey>/                       │──→ pending plans exist? → activate next → execute
└──────────────────┬─────────────────────┘
                   │ no plans exist
                   ▼
┌────────────────────────────────────────┐
│  Step 4: Generate Plans                 │
│  references/planner/SKILL.md            │──→ user has requirements? → generate plans → Step 3
└──────────────────┬─────────────────────┘
                   │ no requirements / single task
                   ▼
┌────────────────────────────────────────┐
│  Step 5: Domain Fallback                │
│  references/domain-registry/SKILL.md    │──→ intent matches a domain? → execute skill
└──────────────────┬─────────────────────┘
                   │ no domain matched
                   ▼
              Ask user to clarify
```

---

## Step 1 — Check Workspace Gate

**Priority:** Highest — runs before anything else.

| Condition | Action |
|-----------|--------|
| `REFERENCE_DEMO_WORKSPACE` not set AND no `.env` found | Route to `setup` › `workspace-init`. Halt all other routing until setup completes. |
| Workspace exists | Proceed to Step 2 |

> This gate ensures no skill ever runs without a configured workspace. It is non-negotiable.

---

## Step 2 — Check Active Plan

**Priority:** Second — resume in-progress work before starting anything new.

| Condition | Action |
|-----------|--------|
| `.agent/handover.md` exists AND contains a 🔵 Active plan | Read the plan file. Identify the current step. Execute via **Plan Execution Flow**. |
| No `.agent/handover.md` OR no active plan | Proceed to Step 3 |

---

## Step 3 — Check for Existing Plans

**Priority:** Third — execute existing plans before trying to generate new ones.

| Outcome | Action |
|---------|--------|
| ✅ Pending plans exist (⬚ status) | Pick the next pending plan, mark it 🔵 Active, execute. |
| ✅ All plans are ✅ Done | Journey is complete. Archive and report. |
| ❌ No plan files exist | Proceed to **Step 4** |

---

## Step 4 — Generate Plans

**Priority:** Fourth — user has requirements but no plans yet.

| Outcome | Action |
|---------|--------|
| ✅ Planner generates plans | Return to **Step 3** to begin execution. |
| ❌ Insufficient requirements | Ask the user for more context. |
| ❌ Intent is a single isolated task | Fall through to **Step 5** |

---

## Step 5 — Match Intent to Domain (Fallback)

**Priority:** Fifth — handles one-off tasks that don't need plans.

| Outcome | Action |
|---------|--------|
| ✅ Single domain matches | Route to that domain's router. |
| ✅ Multiple domains match | Present options to the user |
| ❌ No domain matches | Proceed to **Step 6** |

---

## Step 6 — No Match

| Action |
|--------|
| Ask the user to clarify their intent. Do not guess. |

---

## Decision Summary

```
User Intent
     │
     ├─ No workspace?           → Step 1 → workspace-init (hard gate)
     │
     ├─ Active plan exists?     → Step 2 → resume plan → execute steps
     │
     ├─ Pending plans exist?    → Step 3 → activate next plan → execute steps
     │
     ├─ Has requirements?       → Step 4 → generate plans → Step 3
     │
     ├─ Matches a domain?       → Step 5 → route to domain → execute skill
     │
     └─ Nothing matches?        → Step 6 → ask user to clarify
```
