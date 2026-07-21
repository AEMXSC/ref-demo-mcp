# Default Plan Generation Strategy

The default strategy for decomposing user requirements into ordered plans.

---

## Overview

This strategy produces 3-5 plans per journey:

```
Setup → Build → Integration → Validation
```

---

## Decomposition Rules

### 1. Journey Types

| Journey Pattern | Primary Plans |
|-----------------|---------------|
| New project setup | `01-workspace-setup`, `02-credentials`, `03-initial-config` |
| AEM content creation | `01-setup-check`, `02-content-structure`, `03-content-build` |
| Target activity creation | `01-setup-check`, `02-audience-setup`, `03-activity-build` |
| Multi-system integration | `01-setup-check`, `02-aem-setup`, `03-target-setup`, `04-integration` |
| New EDS UE site | `01-site-decision`, `02-create-repo`, `03-ue-config`, `04-code-sync-app`, `05-validate` |
| AEM + Target personalization by page content fragment (AEM Sites Personalization style) | `01-setup-check`, `02-fragment-variants`, `03-export-to-target`, `04-audience-setup`, `05-activity-build`, `06-validate` |

For the personalization journey above, Plan `06-validate` must end with a final user summary table that includes:
- `AEM Page` full URL (single value, not host/path split), validated as non-404
- `Target Activity` canonical Experience Cloud URL (org + activity-type + activity-id)

Do not defer these links to follow-up questions.

### 1a. Recognizing a Personalization Journey from Free Text

A prompt like *"Setup personalization demo using AEM and Adobe Target for audience who are interested in \<X\> by modifying the \<fragment\> content fragment on \<page\> of the AEM Site named \<site\>"* is the page-content-fragment journey. Extract these parameters before generating plans — if any are missing or ambiguous, ask rather than guess:

| Parameter | Extracted from | Populates |
|-----------|-----------------|-----------|
| Site name | "...AEM Site named \<site\>" | Fragment path `/content/dam/<site>/cf/...`, page path root |
| Page / locale | "...on \<page\> ... " (e.g. homepage, "en") | Which page's block gets wired to the activity |
| Block-authored Content Fragment | "...modifying the \<fragment\> content fragment..." | The fragment path already authored into the page's block properties — the Block Content Fragment in `aem-content`'s Promotion Fragments workflow |
| Audience interest keyword | "...interested in \<X\>..." | Rule-based audience definition in `target-activities` |

If a prompt is missing site/page/fragment language entirely, ask for it rather than guessing — there's no other supported journey pattern to fall back to.

### 2. Ordering Principles

1. **Setup always comes first**
2. **Dependencies flow forward**
3. **Build after setup**
4. **Integration last**

### 3. Skill Mapping

| Requirement Type | Skill | Domain |
|------------------|-------|--------|
| Workspace initialization | `workspace-init` | `setup` |
| Credential configuration | `auth-setup` | `setup` |
| Environment settings | `env-config` | `setup` |
| AEM content operations | `aem-content` | `build` |
| Target activity operations | `target-activities` | `build` |
| EDS UE site creation / selection | `create-eds-site` | `site-ops` |
| Repo/template/commit/push, aem-code-sync install/attach, preview check | `git-operations` | `site-ops` |
| SMS / notification sending | `send-sms` | `notify` |

---

## Plan Boundaries

### When to Split

- Different target systems → separate plans
- Different credential scopes → separate plans
- Independent features → separate plans

### When to Merge

- Tightly coupled steps → single plan
- Small operations → merge with related plan
