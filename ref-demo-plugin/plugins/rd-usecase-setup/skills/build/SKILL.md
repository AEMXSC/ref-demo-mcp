---
name: build
description: >
  Domain router for content creation & management skills. Routes build intents
  to aem-content or target-activities.
  Triggers: create, build, content, aem, target, activity, page, component.
type: domain
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.1"
---

# Build — Domain Router

| | |
|---|---|
| **ID** | `build` |
| **Description** | Routes content creation intents to the correct skill. |

---

## Routing Table

> **First match wins.**

| Intent Pattern | Skill |
|---|---|
| Create AEM content, page, component, asset | `aem-content` |
| Create Target activity, A/B test, experiment | `target-activities` |

---

## Skills

| # | Skill | Purpose | Triggers |
|---|---|---|---|
| 1 | `aem-content` | Create and manage AEM content | aem, content, page, component |
| 2 | `target-activities` | Create and manage Target activities | target, activity, test, experiment |

### Skill Locations

| Skill | Path |
|---|---|
| `aem-content` | [`references/aem-content/SKILL.md`](references/aem-content/SKILL.md) |
| `target-activities` | [`references/target-activities/SKILL.md`](references/target-activities/SKILL.md) |

---

## Guard Policies

> **Setup required:** Always verify workspace is initialized before build operations.
>
> **Validate before deploy:** Always validate content before pushing.

---

## Dependencies

| Domain | Relationship |
|---|---|
| `setup` | `build` depends on `setup` — workspace and credentials must exist |
