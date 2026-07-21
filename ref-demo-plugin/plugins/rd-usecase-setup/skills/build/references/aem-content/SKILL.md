---
name: aem-content
description: >
  Create and manage AEM content using the installed Adobe Experience Manager
  MCP connector. Handles page creation, component/block configuration, content
  fragments, and asset management.
  Triggers: aem, content, page, component, asset, publish, content fragment.
type: skill
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.2"
---

# AEM Content Manager

Create and manage AEM content using the installed **Adobe Experience Manager** MCP connector.

## Critical Rules

1. **Verify workspace first** — check setup is complete
2. **Use the AEM MCP connector** — always `lookup-api-spec` before `read-api`/`write-api`; never guess an endpoint path
3. **Writes are dry-run unless confirmed** — `write-api` simulates by default; only pass `confirmed: true` once you've verified the discovered recipe/endpoint is correct
4. **Validate before publish** — always validate content structure

## AEM MCP Tools

The connector doesn't expose fragment/page-specific verbs — it's a generic, spec-driven API executor. The pattern is always:

1. **`aemUrl`** — use the `AEM_HOST` value confirmed by `auth-setup` (Step 1). Don't call `list-aem-environments` again here — that discovery and confirmation already happened once, up front.
2. **`lookup-api-spec`** — `{ code, aemUrl? }`, `code` is JS like `return await spec.search('create content fragment');` or `return await recipes.search('update page component');`. **Always call this before `read-api`/`write-api`** — never guess an endpoint.
3. **`read-api`** — `{ code, aemUrl }`, GET/HEAD only, e.g. `return await aem.get('/api/assets/...');`
4. **`write-api`** — `{ code, aemUrl, confirmed? }`, mutations. `confirmed` defaults to `false` — writes are **simulated (dry-run)** unless you pass `confirmed: true` (or the client handles inline elicitation). Always dry-run first, inspect the simulated result, then re-run with `confirmed: true`.

| Operation | Tool sequence |
|-----------|----------|
| Discover AEM environment | `list-aem-environments` |
| Find the right endpoint/recipe | `lookup-api-spec` |
| Read/check existing content | `read-api` |
| Create/update/publish content | `write-api` (dry-run → `confirmed: true`) |

Exporting a fragment to Target is **not** manual/UI-only — AEM exposes a dedicated `.cfm.targetexport` endpoint for it. See "Exporting Content Fragments to Target" below.

## Content Types

| Type | Description | Local Path |
|------|-------------|------------|
| Page | AEM content page | `content/aem/pages/<name>/` |
| Component / Block | Page component or EDS block instance | `content/aem/components/<name>/` |
| Asset | DAM asset | `content/aem/assets/<name>/` |
| Content Fragment | Structured content instance authored against a Content Fragment Model (e.g. `CTA`) | `content/aem/fragments/<fragment-name>/` |

## Project Structure

```
content/aem/
├── pages/
│   └── <page-name>/
│       ├── content.json
│       └── metadata.json
├── components/
│   └── <component-name>/
│       └── config.json
├── assets/
│   └── <asset-name>/
│       └── metadata.json
└── fragments/
    └── <fragment-name>/
        ├── fragment.json          # field values
        └── metadata.json          # model reference, folder, publish state
```

## Workflow

### Creating or Updating a Page

1. **Verify setup** — check the AEM MCP connector is authorized and `AEM_HOST` is confirmed (see `auth-setup`)
2. **`lookup-api-spec`** — search for the create/update page recipe
3. **`write-api`** — dry-run first, then `confirmed: true`
4. **Validate** — `read-api` to confirm the result
5. **Capture one full user-facing page URL for final summary** — include a single fully-qualified URL (scheme + host + full content path + `.html`) in the final summary table automatically (do not wait for the user to ask for it).
6. **Verify the page URL exists before reporting it** — run a lightweight `read-api` check against that exact URL path and only report it if it resolves (non-404). If the check returns 404, do not present the link as final; reconcile the path first.

Page URL construction rules for summaries:
- Always preserve the exact full AEM repository path returned/validated by AEM (for example including `language-masters` when present).
- Do not split host and path into separate table cells/phrases.
- Do not synthesize or shorten paths based on assumptions (locale shortcuts, inferred sections, etc.).
- Preferred example shape: `https://author-<id>.adobeaemcloud.com/content/<site>/language-masters/en/<page>.html`

### Promotion Fragments — AEM Sites + Target (multi-variant blocks)

Used for AEM Sites/EDS personalization demos where a page block (e.g. a "Promotion" block) is authored with the path to a single Content Fragment — the **Block Content Fragment** — directly in the block's own properties, and renders whatever that path resolves to. Path convention: `/content/dam/<site>/cf/<block-name>/<fragment-name>` — e.g. the block's authored path `/content/dam/wknd-universal/cf/promotions/promo-default`, alongside sibling **variant** fragments like `promo-painting` that the block itself never references.

> **Prerequisite already confirmed by `auth-setup`'s Step 5** (AEM↔Target IMS integration, EDS `at.js`) before this journey's plan even started — don't re-ask here.

1. **`lookup-api-spec`** — search for the content fragment creation recipe (e.g. `spec.search('create content fragment')`).
2. **Find a matching image for each variant fragment** — for each audience variant (e.g. `promo-painting`), search the AEM DAM for an asset matching that audience's interest keyword (e.g. "painting"): `lookup-api-spec` to find the asset-search recipe (`spec.search('search dam assets')` / `spec.search('query assets by metadata')`), then `read-api` to run the query against asset name/title/tags/metadata containing the keyword. **If the search returns more than one plausible match, or none, ask the user to pick/confirm** — don't author a wrong or missing image silently. Capture the chosen asset's path.
3. **`write-api`** (dry-run → `confirmed: true`) — create the Block Content Fragment (e.g. `promo-default`) plus one sibling variant fragment per audience (e.g. `promo-painting`), **against the `CTA` Content Fragment Model** (fixed — not "or equivalent"). Fields: title, subtitle, description, **banner image (the DAM asset path found/confirmed in the previous step)**, CTA label, CTA URL.
4. **Publish each fragment** — `lookup-api-spec` for the publish/activate recipe, then `write-api` (dry-run → `confirmed: true`).
5. **Export fragments to Target** — call the dedicated `export_content_fragment_to_target` MCP tool (see "Exporting Content Fragments to Target" below) — **not** the generic AEM connector's `write-api`. Capture each fragment's `targetOfferID` from the response and store it in that fragment's `metadata.json` so `target-activities` doesn't need to look it up separately.
6. **Confirm the block is authored correctly** — `read-api` to check the target page's Promotion (or equivalent) block already has its Content Fragment property pointing at the Block Content Fragment (e.g. `promo-default`) and a Target Mbox Name configured (see `target-activities` for the activity side). At runtime, Target swaps a variant fragment's content into that mbox for matched audiences — **the block's own authored path never changes**. If the block isn't on the page yet, placing/configuring it is a Universal Editor authoring action — hand off to the user.

### Exporting Content Fragments to Target — `export_content_fragment_to_target`

**Do not use the generic AEM connector's `lookup-api-spec`/`write-api` for this.** That discovery path is ambiguous enough to silently do the wrong thing — observed in practice, it created the offer via Target's own API instead of AEM's actual export endpoint, which shows up in Target as offer source **"Adobe Target API"** instead of **"Adobe Experience Manager"**. Use the dedicated `export_content_fragment_to_target` MCP tool instead — it's hosted by the `export-cf-to-target` server (see this plugin's `.claude-plugin/plugin.json`, backed by the `rd-adobeio-mcp` project deployed on Adobe I/O Runtime) and always makes the same known-correct HTTP call: `POST {AEM_HOST}{export_path}.cfm.targetexport` with `paths` (repeated) and `action=export`.

**Tool:** `export_content_fragment_to_target(export_path, fragment_paths, aem_host)`
- `export_path` — path to append `.cfm.targetexport` to: the fragment's own path for a single export, or a common parent folder for several at once
- `fragment_paths` — full DAM paths of the fragments to export
- `aem_host` — passed on every call, read from `.env` (confirmed by `auth-setup`). This tool runs on a shared hosted MCP endpoint, not a locally-spawned process, so it can't read per-user env vars itself — the calling assistant must supply it as an argument each time. There is no token argument: the tool authenticates the outbound call to AEM with the caller's own IMS bearer token, forwarded by the Coworker/MCP gateway as the request's `Authorization` header and never exposed to the chat or the calling assistant.

**Response:** a JSON array, one entry per fragment path:
- Success: `{"path": "/content/dam/promotions/surfing-lovers", "targetOfferID": 317492}`
- Failure: `{"path": "/content/dam/promotions/team-alpha", "error": "Unable to connect to Target"}`

1. Call `export_content_fragment_to_target` with the block's fragment folder as `export_path`, all variant fragment paths as `fragment_paths`, and `AEM_HOST` from `.env` as `aem_host`.
2. **Check every entry in the response array individually** — a successful call can still contain per-fragment `error` entries; don't assume every fragment exported just because the call succeeded.
3. **Store each successful `targetOfferID`** in that fragment's local `metadata.json` — this is the `offer_id` `target-activities` needs, with no separate `list_target_offers` lookup required.
4. **Verify the resulting offer's source in Target reads "Adobe Experience Manager"** — if it reads "Adobe Target API" instead, something bypassed this tool; don't proceed to build the activity on a wrongly-sourced offer.

**Requires** `AEM_HOST` in `.env` (confirmed by `auth-setup`). Authentication for the actual AEM call is handled entirely by the gateway-forwarded IMS token — nothing to configure here.

### Updating a Page Block's Authored Content Fragment

This is an **authoring-time** change — e.g. wiring a new/different Block Content Fragment into a Promotion block, or fixing a wrong reference. It is *not* how runtime personalization works (that's entirely inside Target — see `target-activities` — and never touches the block's authored property).

1. **`lookup-api-spec`** — search for the update-page/update-component-properties recipe.
2. **`read-api`** — fetch the block's current properties first, to confirm what you're about to change and avoid clobbering unrelated fields.
3. **`write-api`** (dry-run → `confirmed: true`) — update the block's content-fragment-path property to the new value.
4. **Publish the page** — `lookup-api-spec` + `write-api` for the publish/activate recipe.
5. **Validate** — `read-api` to confirm the new path is live.

## Example — `write-api` usage

```js
// 1. find a matching image for the audience — confirm the exact query shape via lookup-api-spec first
await spec.search('search dam assets')
// read-api, once the recipe is confirmed — illustrative only:
return await aem.get('/api/assets.json?fulltext=painting&path=/content/dam/wknd-universal');
// -> pick the asset path from the results; if ambiguous or empty, ask the user

// 2. discover the fragment creation recipe
await spec.search('create content fragment')

// 3. dry-run (confirmed defaults to false) — model is always CTA for promotion fragments
return await aem.post('/api/assets/wknd-universal/cf/promotions/promo-painting.json', {
  class: 'assetFragment',
  properties: {
    title: 'Painting Promo',
    fragmentModel: '/conf/wknd-universal/settings/dam/cfm/models/cta',
    elements: {
      title: { value: '...' },
      bannerImage: { value: '/content/dam/wknd-universal/assets/<matched-image>.jpg' },
      ctaLabel: { value: '...' }
    }
  }
});

// 4. once verified, re-run the same write-api call with confirmed: true
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 / connector not authorized | Run `auth-setup` — the AEM MCP connector needs to be authorized via claude.ai connector settings |
| 404 Not Found | Check content path via `read-api`; re-run `lookup-api-spec` if the endpoint shape is wrong |
| Write had no effect | Check whether `confirmed: true` was actually passed — default is dry-run |
