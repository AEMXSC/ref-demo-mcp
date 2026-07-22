---
name: auth-setup
description: >
  Load or confirm AEM/Target environment values in .env, then verify the
  installed Adobe Experience Manager and Adobe Target MCP connectors are
  authorized using those confirmed values.
  Triggers: auth, credentials, login, token, authenticate.
type: skill
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.4"
---

# Authentication Setup

AEM and Adobe Target operations mostly go through their installed MCP connectors, which manage their own OAuth. The dedicated `export_content_fragment_to_target` tool (see `aem-content`) makes its own direct HTTP call to AEM, but it authenticates using the caller's own IMS bearer token — forwarded by the Coworker/MCP gateway as the request's `Authorization` header and read server-side, never passed as a tool argument. This skill loads or collects `AEM_HOST` and `TARGET_ORG` in `.env`, gets explicit user confirmation, and only then proceeds — every later step in the flow reuses these confirmed values rather than re-asking.

## Critical Rules

1. **Never invent credentials** — always prompt for or confirm real values; never fabricate a placeholder and treat it as real
2. **Confirm before proceeding** — whether `.env` values are freshly entered or already present, the user must explicitly confirm them before anything else runs
3. **Reuse, don't re-ask** — once confirmed, `AEM_HOST`/`TARGET_ORG` are used for every subsequent call in the session; don't re-derive or re-prompt later
4. **Verify by calling a real tool** — "authorized" means a real MCP call succeeds, not just that the connector is listed
5. **Never prompt for AEM or IMS tokens** — the `export-cf-to-target` MCP reads the caller's IMS token from the request's `Authorization` header (gateway-injected); the only real credential this skill still handles is `GITHUB_TOKEN`, which must be masked in all output
6. **Mask real credentials in all output** — `GITHUB_TOKEN` is a real credential, unlike `AEM_HOST`/`TARGET_ORG`/`GITHUB_OWNER`

## Workflow

### Step 1: Load or collect `.env` values

Check `.env` for `AEM_HOST` and `TARGET_ORG`.

- **Not present / empty:** prompt the user for each value **one at a time** — `AEM_HOST` (the AEM author environment URL), then `TARGET_ORG` (the Target org/tenant identifier) — and write them to `.env`.
- **Already present:** show the user the current values and ask them to confirm they're still correct. If the user provides a correction, update `.env`.

**Do not proceed to Step 2 until the user has explicitly confirmed** — either by supplying fresh values or confirming the existing ones.

### Step 1b: Verify GitHub access (for `site-ops`) — connector first, PAT as backup

Only needed when the session will do site/git operations (`site-ops` domain). `github-mcp` is a normal OAuth connector (no static token wired into `plugin.json`) — prefer it, the same way `adobe-experience-manager`/`adobe-target-mcp` are handled in Steps 2/4.

1. Call a lightweight `github-mcp` tool (e.g. whichever "who am I" / list-repos equivalent it exposes). If it succeeds, that covers every `github-mcp`-backed operation — **do not** ask for a PAT on the strength of this alone.
2. Regardless of the connector's state, check whether the session will also need `git-operations`' REST fallback (`gh-site` — covers `generate`/`installations`/`attach`/`preview`, endpoints `github-mcp` does not expose as tools). That script makes raw `curl` calls and has no access to the connector's OAuth session, so it always needs a real classic PAT:
   - **`.env` already has `GITHUB_OWNER`/`GITHUB_TOKEN`:** show `GITHUB_OWNER` and a **masked** `GITHUB_TOKEN`, ask the user to confirm.
   - **Not present / empty:** prompt for `GITHUB_OWNER` (the org or user account; if the PAT sees multiple orgs, `create-eds-site` presents a picker) and `GITHUB_TOKEN` (a **classic** PAT with `repo` scope), write them to `.env`.
3. If the `github-mcp` connector call in step 1 fails, tell the user: *the "GitHub" connector needs to be authorized via claude.ai connector settings (or `/mcp` in an interactive session)* — same pattern as AEM/Target, no token prompt for this path. The PAT collected in step 2 still covers the `gh-site` fallback in the meantime, so site creation isn't blocked on the connector alone.

Never echo, log, or commit `GITHUB_TOKEN` (`.env` is git-ignored).

### Step 2: Verify the AEM MCP connector

Call `list-aem-environments` (no params). If it errors or returns nothing usable, tell the user: *the "Adobe Experience Manager" connector needs to be authorized via claude.ai connector settings (or `/mcp` in an interactive session)* — don't ask them for tokens directly. If it succeeds, check whether the confirmed `AEM_HOST` actually appears among the discovered environments — if not, tell the user about the mismatch and ask them to reconcile it (correct `.env`, or confirm that environment genuinely isn't reachable via this connector).

### Step 3: Confirm the AEM environment is awake (not hibernated)

AEM Cloud Service dev/stage tiers auto-hibernate after inactivity — appearing in `list-aem-environments` doesn't mean the instance is actually reachable right now. There's no dedicated hibernation-status tool, so probe it: run a lightweight `read-api` call against the confirmed `AEM_HOST`. If it fails or times out in a way that looks like the instance is asleep rather than a normal error, **stop and tell the user**: *the AEM environment may be hibernated — open it in a browser to wake it (can take a few minutes), then ask me to retry.* Don't retry silently in a loop.

### Step 4: Verify the Adobe Target MCP connector

Call a lightweight Target tool such as `list_target_mboxes` or `list_target_activities`. If it errors, tell the user: *the "Adobe Target MCP" connector needs to be authorized via claude.ai connector settings* — again, no token prompts. `TARGET_ORG` is reported for reference in Step 6 — none of the Target MCP tools take it as a call parameter, since the connector's own OAuth session is already scoped to an org.

### Step 5: For AEM + Target personalization journeys — confirm integration prerequisites up front

Before generating or executing any plan for a personalization journey (content-fragment-backed page/block personalization), **ask the user directly** — there's no API to check either of these:
1. **AEM and Adobe Target are already connected** ([click here for setup instructions](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/integrations/integrating-adobe-target)), and
2. **Target library (at.js) is already included in your AEM EDS project** ([click here for setup instructions](https://referencedemo.adobe.com/personalization/aem-sites-personalization)).

UX requirement for this confirmation step:
- Show both doc links in the **first** message where confirmation is requested (not only after the user selects "No / Don't know").
- Use plain-language labels for options:
  - `Yes, both are already set up`
  - `No / Not sure (show me setup steps)`
- Keep the technical details as secondary helper text only if needed:
  - "AEM and Adobe Target are already connected" corresponds to the AEM↔Target IMS integration prerequisite.
  - "Target library (at.js) is already included in your AEM EDS project" corresponds to replacing `/scripts/at-lsig.js` with the Target at.js library.

Both are one-time, manual, admin-console/repo steps outside this skill's reach. If either isn't confirmed, **stop the whole journey here** — don't let it surface three steps later inside `aem-content`'s fragment-creation workflow.

### Step 6: Report status

| Check | Status | Message |
|-------|--------|---------|
| `.env` values confirmed | ✅/❌ | `AEM_HOST` / `TARGET_ORG` as confirmed in Step 1 |
| GitHub MCP connector authorized (site-ops only) | ✅/❌ | Result of the Step 1b connector check |
| GitHub PAT confirmed — `gh-site` fallback (site-ops only) | ✅/❌ | `GITHUB_OWNER` and masked `GITHUB_TOKEN` as confirmed in Step 1b |
| AEM MCP connector authorized | ✅/❌ | Result of `list-aem-environments`, incl. any `AEM_HOST` mismatch |
| AEM environment awake | ✅/❌ | Result of the `read-api` probe |
| Target MCP connector authorized | ✅/❌ | Result of the lightweight list call |
| AEM↔Target IMS integration confirmed (personalization journeys only) | ✅/❌ | User confirmation |
| EDS at.js confirmed (personalization journeys only) | ✅/❌ | User confirmation |

## Notes

- This session cannot run an OAuth flow itself — if a connector isn't authorized, the fix happens outside this skill (claude.ai connector settings, or `claude mcp` / `/mcp` interactively). Don't ask the user for auth codes, tokens, or callback URLs — that flow is separate from `.env` and doesn't apply to `AEM_HOST`/`TARGET_ORG`.
- `AEM_HOST` and `TARGET_ORG` are non-secret targeting values, confirmed once per session in Step 1 and reused as-is (`AEM_HOST` as the `aemUrl` argument to every `list-aem-environments`/`lookup-api-spec`/`read-api`/`write-api` call, and as the `aem_host` argument to `export_content_fragment_to_target`).
- `export_content_fragment_to_target` (hosted by `export-cf-to-target`, see `aem-content`) makes its own direct HTTP call to AEM, authenticated with the caller's IMS bearer token forwarded by the gateway as the request's `Authorization` header — this plugin never sees or stores that token, and there is no `AEM_EXPORT_TOKEN` to configure.
