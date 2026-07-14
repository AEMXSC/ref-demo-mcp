---
name: planner
description: >
  Plan generator. Decomposes user requirements into ordered, executable plans
  using a configurable strategy. The orchestrator routes here when no plans
  exist for a journey and requirements need to be broken down into plans.
  Triggers: plan, plans, journey, build, start, generate plans, create plans.
type: skill
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.1"
---

# Planner

Generates ordered, executable plans from user requirements.

---

## What the Planner Does

```
Requirements (user requests, specifications)
     │
     ▼
┌────────────────────────────────┐
│  Resolve strategy              │
│  (custom or default)           │
└─────────────┬──────────────────┘
              │
              ▼
┌────────────────────────────────┐
│  Analyze requirements          │
└─────────────┬──────────────────┘
              │
              ▼
┌────────────────────────────────┐
│  Decompose into ordered plans  │
│  Write to plans/<journey>/     │
└────────────────────────────────┘
```

---

## Strategies

| Priority | Location | Description |
|----------|----------|-------------|
| 1 (highest) | `plans/custom-strategy.md` | User-provided override |
| 2 (default) | [`references/default-strategy.md`](references/default-strategy.md) | Default workflow-focused decomposition |

---

## Output

Plan files at `plans/<journey>/NN-<title>.md`, numbered sequentially.

---

## Plan Conventions

| Property | Convention |
|----------|-----------|
| **Path** | `plans/<journey>/NN-<short-title>.md` |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10` |
| **Max per journey** | 10 plans |
| **Template** | [`assets/plan-template.md`](assets/plan-template.md) |

---

## Quick Reference

| What | Where |
|------|-------|
| Default strategy | `references/default-strategy.md` |
| Plan template | `assets/plan-template.md` |
