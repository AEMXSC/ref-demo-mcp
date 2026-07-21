---
name: target-activities
description: >
  Create and manage Adobe Target activities using the installed Adobe Target
  MCP connector. Handles A/B tests, experience targeting, audiences, and offers.
  Triggers: target, activity, test, experiment, personalization, audience.
type: skill
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.2"
---

# Adobe Target Activity Manager

Create and manage Adobe Target activities using the installed **Adobe Target MCP** connector.

## Critical Rules

1. **Verify workspace first** — check setup is complete
2. **Use the Adobe Target MCP tools directly** — they build the full valid payload (options, experiences, locations, metrics) from simple inputs; don't hand-construct raw activity JSON
3. **Define audiences first** — audiences must exist before activities reference them
4. **Validate before activate** — `update_activity_state` itself checks completeness (location, experience, goal, traffic split) before allowing `approved`, but confirm the mbox name matches the page block before activating

## Audience Definition Patterns

Two ways audiences get built in these demos — pick based on what the requirement actually says, don't assume:

**Rule-based Audience** (`target_rule` source `page`, `referring`, or `landingPage`) — for page/promotion personalization where there's no profile record, just an interest/segment keyword (e.g. "audience interested in `<interest>`"):

> `<interest>` below is always the actual interest/segment keyword supplied in the conversation — normalize it (trimmed, lowercase) and substitute it into every branch. Never hardcode a literal keyword from these examples.

**Option A — Single condition (default).** Use this unless the requirement specifically calls for the fallback below. Previous page URL contains the interest keyword:
- In the Target UI: **Site Pages → Previous Page → URL → Contains** (Case Sensitive off)
- `target_rule`:

```json
{
  "referring": {
    "url": {
      "containsIgnoreCase": ["<interest>"]
    }
  }
}
```

**Option B — OR / cid-query fallback.** Use when the previous-page referrer may not be reliably present (direct traffic, dark social, no-referrer navigation) or the interest is also signaled via a tracked campaign query param — pairs the previous-page condition with a current-page `cid=<interest>` query match so either signal qualifies:
- Logical `or` with exactly two branches:
  - Previous page URL contains the interest keyword (`referring.url.containsIgnoreCase`)
  - Current page query contains `cid=<interest>` (`page.query.containsIgnoreCase`)
- In the Target UI this maps to:
  - **Site Pages → Previous Page → URL → Contains**
  - **OR**
  - **Site Pages → Current Page → Query → Contains `cid=<interest>`**
- `target_rule`:

```json
{
  "or": [
    {
      "referring": {
        "url": {
          "containsIgnoreCase": ["<interest>"]
        }
      }
    },
    {
      "page": {
        "query": {
          "containsIgnoreCase": ["cid=<interest>"]
        }
      }
    }
  ]
}
```

- Interpretation:
  - Any URL containing `<interest>` as the **previous page** qualifies.
  - Any **current page** URL with `?cid=<interest>` qualifies.
  - Visitors matching either branch are in the audience.
- Use the exact same normalized interest value in both branches (trimmed, lowercase) to avoid mismatches.

For either option, after creating the audience, verify with `get_target_audience` that the expression resolves to the expected UI wording.

**Profile Attribute Audience** (`target_rule` source `profile`) — when the interest/segment signal is a Target profile attribute rather than a URL/referrer signal:
- Operator: typically `equals`
- Example `target_rule`: `{"profile": {"interest": {"equals": ["painting"]}}}`

If the requirement doesn't say how the interest signal is captured, ask before picking one — don't guess.

## Target MCP Tools

| Operation | Tool | Notes |
|-----------|------|-------|
| Create audience | `create_target_audience` | `target_rule` is required — the API rejects rule-less audiences |
| Update audience | `update_target_audience` | GET-merge-PUT — only pass fields you're changing |
| Create HTML offer | `create_target_offer` | `name`, `content` (HTML string) |
| Create JSON offer | `create_target_json_offer` | `name`, `content` (dict/list) |
| Create A/B activity | `create_ab_activity` | `variants` (each with `offer_id` or inline `offer_content`), `traffic_split`, `mbox_name`, `goal` |
| Create XT activity | `create_xt_activity` | `experiences` (each with `audience_id` + `offer_id`/`offer_content`), `mbox_name`, `goal` — one call builds the full audience↔offer↔experience mapping |
| Add a variant/experience to an existing activity | `add_activity_variant` | works for both form-based and VEC activities |
| Change an existing variant's offer | `update_variant_offer` | |
| Update other activity fields (goal, audiences) | `update_activity` | read-modify-write; **array fields are replaced wholesale**, not merged — include the full array |
| Activate / pause / deactivate | `update_activity_state` | `state`: `"approved"` (live), `"paused"`, `"deactivated"`, `"saved"` (draft) — refuses `"approved"` if the activity is incomplete |
| Inspect / verify | `list_target_activities`, `get_activity`, `list_target_audiences`, `get_target_audience`, `list_target_offers`, `get_target_offer`, `list_target_mboxes` | use before/after any mutation to confirm state |

## Workflow

### Creating an A/B Test

1. **Verify setup** — check the Target MCP connector is authorized (see `auth-setup`)
2. **Create audience(s)** if needed — `create_target_audience`
3. **`create_ab_activity`** — pass `variants` (name + `offer_id` or inline `offer_content`), `traffic_split`, `mbox_name`, and `goal`
4. **`update_activity_state`** — activate when ready
5. **Validate** — `get_activity`

### Creating an XT Activity — Content-Fragment-backed Personalization

Used when personalizing an AEM Sites page block (e.g. a Promotion block) backed by content fragments (see `aem-content`'s "Promotion Fragments" workflow) — each experience's offer *is* an already-published, already-exported content fragment offer, not inline HTML:

1. **Verify setup** — check credentials/connector authorization
2. **Create audience(s)** — `create_target_audience`, per the Rule-based or Profile Attribute pattern above (one per variant fragment / interest segment)
3. **Confirm fragments are already exported to Target** — via `aem-content`'s `.cfm.targetexport` export step; if not yet exported, route back to that skill first. That step returns each fragment's `targetOfferID` directly in its response and stores it in the fragment's `metadata.json` — use it as `offer_id` below with no separate lookup. Only fall back to `list_target_offers`/`get_target_offer` if the ID wasn't captured at export time.
4. **`create_xt_activity`** — `experiences: [{ name, audience_id, offer_id }, ...]`, one per audience/variant. **`mbox_name` must match the page block's configured Target Mbox Name exactly** (default `target-global-mbox`) — mismatched mbox names are the most common reason a working activity never fires. **Don't add an "All Visitors" fallback experience** — visitors who match no audience simply see the page's native Block Content Fragment, since Target only intervenes for matched audiences.
5. **`update_activity_state`** — activate (`state: "approved"`); the tool itself verifies the activity is complete before allowing this
6. **Validate** — `get_activity` to confirm state, and `list_target_mboxes` to confirm the mbox name matches the block's configuration exactly

To add more audience/offer pairs to an existing activity later, use `add_activity_variant` rather than recreating it. To change one variant's offer, use `update_variant_offer`.

## Activity States

`saved` (draft) → `approved` (live) → `paused` / `deactivated`

## Final User Summary Contract (Personalization Journeys)

For AEM + Target personalization journeys, the final assistant response must always include a compact summary table and must not wait for the user to ask for links explicitly.

Required rows in that final table:
- `AEM Page` — include one fully-qualified authored/published page URL (not split host + path).
- `Target Activity` — include activity name plus canonical URL.

`AEM Page` row requirements:
- Use the exact validated AEM path (including segments such as `language-masters` when present).
- Include the full URL in one value, e.g. `https://author-<id>.adobeaemcloud.com/content/<site>/language-masters/en/<page>.html`.
- Verify it resolves before reporting (non-404 check via AEM connector flow in `aem-content`).

### Canonical Target Activity URL (required)

Use the Experience Cloud canonical URL format based on org + activity id:

`https://experience.adobe.com/#/@<TARGET_ORG>/target/activities/activity-details/<activity-type>/<activity-id>/overview`

- XT activity type segment: `experience_targeting`
- A/B activity type segment: `ab`
- Use `activity-id` from `create_xt_activity` / `create_ab_activity` response, or fetch via `get_activity` if only name is available.
- Do **not** output legacy/non-canonical authoring URLs such as `https://<org>.experiencecloud.adobe.com/content/mac/.../activities.html#edit/...`.

If `TARGET_ORG` is not present in context, report the activity id and name and ask for org once; then render the canonical URL in the same turn when provided.

## Example — `create_xt_activity` call shape

```json
{
  "name": "WKND Painting Promo",
  "experiences": [
    { "name": "Painting audience", "audience_id": 123, "offer_id": 456 }
  ],
  "mbox_name": "target-global-mbox",
  "goal": { "type": "conversion", "success_event": "mbox_clicked" }
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 / connector not authorized | Run `auth-setup` — the Target MCP connector needs to be authorized via claude.ai connector settings |
| Audience not found | Create the audience first with `create_target_audience` |
| Activation refused | `update_activity_state` checks completeness — inspect via `get_activity` for the missing piece (location, experience, goal, traffic split) |
| Activity never fires | Check `mbox_name` matches the page block's configured Target Mbox Name exactly via `list_target_mboxes` |
