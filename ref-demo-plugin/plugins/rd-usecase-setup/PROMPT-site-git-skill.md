# Task: Add a "Site + Git Operations" skill to my Reference Demo plugin

## Context
- This is my existing plugin that runs use cases for "Reference Demo" (my own framework).
  It is partially built and working; I am incrementally adding features.
- Before writing anything, READ the existing plugin to match its conventions:
  SKILL.md format, domain-registry registration, trigger patterns, planner/plan
  format, and the handover.md conventions used by the existing context skill.
  Reuse existing skills rather than re-implementing them — specifically
  `infra:sync-eds-code`, `git-sandbox`, and `setup-workspace` for clone/commit/git work.
- Deliverable: ONE new skill «or: a new domain with two skills — DECIDE and state which»
  covering AEM EDS UE site creation + the git operations it needs. Register it in the
  domain-registry with appropriate triggers, and add plans for it like we already do.

---

## PART A — Authoring requirements (instructions to you, the skill builder)

1. Source of truth for the steps: the process at
   https://referencedemo.adobe.com/create-new-site/git-setup is INTERNAL and may not be
   fetchable. Do NOT depend on fetching it at runtime. I will paste the step content
   below «PASTE THE ACTUAL STEPS HERE»; embed those steps in the skill itself.
2. Produce/update: the SKILL.md, its plan(s) in our existing plan format, and
   handover.md entries — consistent with how the current plugin does both.
3. Identifiers — use these exact terms throughout and honor this mapping:
   - GitHub org = «TODO org»
   - repo name  = «TODO: is site name == repo name? state the rule»
   - site name  = user-facing name
   - content source for a UE site = AEM Author «confirm»
   - preview/live URL pattern = https://<branch>--<repo>--<org>.aem.page
4. Template source: the list of "EDS UE site templates" comes from «TODO: hardcoded list /
   config file / API — specify exactly». Do not invent templates.
5. A complete UE site is NOT just a repo. After repo creation, the skill must also produce
   the UE config artifacts: «list them, e.g. fstab.yaml, paths.json, head.html, Universal
   Editor / AEM content-source wiring». State the done-check (see A7).
6. Credentials & secrets:
   - Required: GitHub classic PAT with `repo` scope (needed so the GitHub MCP can read/write
     the repo AND to attach the repo to the app installation via API).
   - Prompt the user for any missing values; store in `.env`.
   - `.env` MUST be git-ignored. NEVER log, echo, or commit the token. Wire the token into
     the GitHub MCP config, not only `.env`.
7. Robustness:
   - Steps must be idempotent — safe to re-run without creating duplicates.
   - On mid-flow failure, report which step failed and how to resume; state whether a
     partially created repo should be rolled back «TODO: your preference».
   - Success criteria: the site is "done" only when «e.g. the preview URL returns 200».
8. Capability gaps / MCP guidance:
   - Installing the `aem-code-sync` GitHub App CANNOT be automated (browser consent flow) —
     the skill must prompt the user to install and confirm, then continue.
   - Attaching the created repo to the installed app IS automatable via the GitHub API and
     needs NO custom MCP:
       PUT /user/installations/{installation_id}/repositories/{repository_id}
     (classic PAT with `repo` scope + repo admin). Use this directly.
   - Only if a needed capability has NO API: guide me to build/host a small MCP for it
     (spec the tools), and otherwise instruct the user to do that step manually and continue.

---

## PART B — Runtime flow the skill must implement (user-facing behavior)

### B1. Entry decision
```
Does the user want to work on a NEW site or an EXISTING site?
- If site name/intent not given → present a choice: "select an existing site" OR "create a new site".
```

### B2. Existing site
- Skip all repo/app-creation steps entirely. Proceed to operate on the chosen site.

### B3. New site (only when the user explicitly wants a new site)
```
1. Name?         If not provided → ask for the site name.
2. Name exists?  If a site with that name already exists → confirm:
                    (a) reuse the existing one  → go to B2, OR
                    (b) create new → require a UNIQUE name, confirm it.
3. Template      → show the list of available EDS UE site templates (source per A4);
                    user picks one.
4. Create repo   → from the chosen template (reuse existing git/EDS skills).
5. UE config     → generate/commit the UE config artifacts (per A5).
6. Install app   → this is the LAST repo-creation step:
                    prompt user to install https://github.com/apps/aem-code-sync
                    on the repo, and wait for confirmation.
7. Configure app→repo (separate follow-up phase, AFTER install):
                    attach the repo to the installation via the API in A8.
                    If it cannot be done automatically → prompt user to add the repo
                    to the app manually, then continue.
8. Validate      → run the success check (A7). Report preview/live URLs.
```

### B4. Throughout
- Validate all inputs; ask the user for anything missing (never assume).
- Record progress and decisions in handover.md as we go, and follow the existing plan format.
