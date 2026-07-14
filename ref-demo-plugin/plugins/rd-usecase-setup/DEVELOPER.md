# Reference Demo Use Case Setup — Developer Guide

Everything needed to work on the plugin — add skills, add domains, validate structure.

---

## Prerequisites

- `git` on PATH
- Node.js 18+ (only needed if you add bundled scripts to a skill)

---

## 1. Clone and Set Up

```bash
git clone https://github.com/Adobe-DemoPOC/rd-ai-plugin
cd rd-ai-plugin
```

No install step required unless you add dependencies to a skill.

---

## 2. Validate Plugin Structure

From the repo root:

```bash
npm run validate
```

Checks that every skill path declared in `plugin.json` has a corresponding `SKILL.md` with valid `name` and `description` frontmatter.

---

## Repository Structure

```
plugins/rd-usecase-setup/
├── .claude-plugin/
│   └── plugin.json                      # Plugin metadata and skill registry
├── README.md                            # User documentation
├── DEVELOPER.md                         # This file
├── ONBOARDING.md                        # Architecture & getting started
└── skills/
    ├── reference-demo-orchestrator/     # Entry point router
    │   ├── SKILL.md
    │   ├── assets/
    │   │   ├── routing-table.md         # Routing algorithm
    │   │   └── guidelines.md            # Constraints & conventions
    │   └── references/
    │       ├── planner/                 # Plan generator
    │       │   ├── SKILL.md
    │       │   ├── assets/
    │       │   │   └── plan-template.md
    │       │   └── references/
    │       │       └── default-strategy.md
    │       └── domain-registry/         # Domain & skill catalog
    │           └── SKILL.md
    ├── setup/                           # Setup domain
    │   ├── SKILL.md                     # Domain router
    │   └── references/
    │       ├── workspace-init/SKILL.md
    │       ├── auth-setup/SKILL.md
    │       └── env-config/SKILL.md
    ├── build/                           # Build domain
    │   ├── SKILL.md                     # Domain router
    │   └── references/
    │       ├── aem-content/SKILL.md
    │       └── target-activities/SKILL.md
    └── site-ops/                        # Site + git operations domain
        ├── SKILL.md                     # Domain router
        └── references/
            ├── create-eds-site/         # New/existing EDS UE site lifecycle
            │   ├── SKILL.md
            │   └── assets/
            │       ├── site-templates.md
            │       └── create-new-eds-site-plan.md
            └── git-operations/          # Repo/template/app/preview git mechanics
                ├── SKILL.md
                └── scripts/
                    └── gh-site          # dependency-free GitHub REST helper
```

---

## Adding a New Skill

1. Decide which domain it belongs to — see `skills/reference-demo-orchestrator/references/domain-registry/SKILL.md`
2. Create `skills/<domain>/references/<skill-name>/SKILL.md`
3. Add frontmatter:
   ```yaml
   ---
   name: skill-name
   description: >
     One-line description with trigger keywords.
   type: skill
   license: Apache-2.0
   metadata:
     author: Adobe
     version: "0.1"
   ---
   ```
4. If the skill needs CLI tools, add `scripts/` inside the skill directory
5. Register in the domain's `SKILL.md` — add to its routing table and skills table
6. Register in `skills/reference-demo-orchestrator/references/domain-registry/SKILL.md` — Registry, Skills Catalog, and Skill Resolution tables
7. Register in `.claude-plugin/plugin.json` — add the path to the `skills` array
8. Run `npm run validate` from the repo root

---

## Adding a New Domain

1. Create `skills/<domain-name>/SKILL.md` — use `skills/setup/SKILL.md` or `skills/build/SKILL.md` as a template
2. Create skill subdirectories under `skills/<domain-name>/references/`
3. Register the domain in `skills/reference-demo-orchestrator/references/domain-registry/SKILL.md`
4. Add all its skills to `.claude-plugin/plugin.json`

---

## SKILL.md Frontmatter Reference

| Field | Required | Description |
|-------|----------|--------------|
| `name` | Yes | Skill identifier (kebab-case) |
| `description` | Yes | One-line description, include trigger keywords |
| `type` | No | `skill`, `router`, or `domain` |
| `license` | No | License identifier (e.g., `Apache-2.0`) |
| `metadata.author` | No | Author name or organization |
| `metadata.version` | No | Skill version |

---

## Routing Algorithm

The orchestrator follows this decision tree:

```
User Intent
     │
     ├─ No workspace?           → setup › workspace-init (hard gate)
     │
     ├─ Active plan exists?     → resume plan → execute steps
     │
     ├─ Pending plans exist?    → activate next plan → execute steps
     │
     ├─ Has requirements?       → generate plans → execute
     │
     ├─ Matches a domain?       → route to domain → execute skill
     │
     └─ Nothing matches?        → ask user to clarify
```

See `skills/reference-demo-orchestrator/assets/routing-table.md` for full details.

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE) for details.
