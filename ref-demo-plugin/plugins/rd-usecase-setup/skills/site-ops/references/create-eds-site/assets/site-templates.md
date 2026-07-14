# EDS UE Site Templates

The authoritative, **hardcoded** list of EDS Universal-Editor site templates a
new site can be created from. `create-eds-site` shows this list in step B3.3.

> **Do not invent templates.** The authoritative list is published in the
> internal `create-new-site/git-setup` document and is TBD there. Add rows to
> this table only as templates are officially published. If the user asks for a
> template not listed here, tell them it isn't available yet — never fabricate a
> repo URL.

| # | Template | Source repo | Notes |
|---|----------|-------------|-------|
| 1 | `RefDemoEDS` | https://github.com/AEMXSC/RefDemoEDS | Reference Demo EDS UE starter (default) |

## How it is used

- `create-eds-site` presents this table; the user picks a template by name.
- The chosen `Source repo`'s `owner/repo` is passed to `git-operations` →
  `generate` (`POST /repos/{template_owner}/{template_repo}/generate`) to create
  the new repo at `GITHUB_OWNER/<site-name>`.
