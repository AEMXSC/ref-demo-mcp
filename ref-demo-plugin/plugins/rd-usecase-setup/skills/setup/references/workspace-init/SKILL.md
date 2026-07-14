---
name: workspace-init
description: >
  Initialize the Reference Demo workspace directory structure, create
  configuration files, and verify system requirements.
  Triggers: init, setup, workspace, new project, initialize.
type: skill
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.1"
---

# Workspace Initializer

Initialize and configure the Reference Demo workspace environment.

## Critical Rules

1. **Never store credentials in code** — credentials go in `.env` only
2. **Act autonomously** — create the structure, don't ask permission
3. **Idempotent** — running twice should not break anything

## Project Structure

```
<workspace>/
├── .env                    # Environment variables (gitignored)
├── .gitignore              # Git ignore patterns
├── config/
│   ├── aem.json            # AEM configuration
│   └── target.json         # Target configuration
├── content/
│   ├── aem/                # AEM content definitions
│   └── target/             # Target activity definitions
├── .agent/
│   ├── handover.md         # Current state
│   └── history.md          # Completed work
└── plans/                  # Generated plans
```

## Workflow

### Step 1: Check if workspace exists

```bash
if [ -f ".env" ] || [ -n "$REFERENCE_DEMO_WORKSPACE" ]; then
  echo "Workspace already initialized"
  exit 0
fi
```

### Step 2: Create directory structure

Create: `config/`, `content/aem/`, `content/target/`, `.agent/`, `plans/`

### Step 3: Create .env template

```env
REFERENCE_DEMO_WORKSPACE=/path/to/workspace
AEM_HOST=
TARGET_ORG=
AEM_EXPORT_TOKEN=
GITHUB_OWNER=
GITHUB_TOKEN=
```

Leave these blank here — `auth-setup` is what prompts the user for these values (or confirms them if already set) before any AEM/Target/site operation runs. `AEM_HOST`/`TARGET_ORG`/`GITHUB_OWNER` are non-secret; `AEM_EXPORT_TOKEN` and `GITHUB_TOKEN` are real credentials. `AEM_EXPORT_TOKEN` is a technical/service-account bearer token, needed only because the `export_content_fragment_to_target` MCP tool (hosted by `export-cf-to-target`, see `aem-content`) makes its own direct HTTP call to AEM rather than going through the installed AEM connector's OAuth. `GITHUB_TOKEN` is a classic GitHub PAT (`repo` scope) used by the `site-ops` domain — it is wired into the `github-mcp` config (`Authorization: Bearer ${GITHUB_TOKEN}`) and read by the `gh-site` helper for repo/app operations.

### Step 4: Create .gitignore

```gitignore
.env
*.local
.idea/
.vscode/
.DS_Store
```

### Step 5: Create config files

- `config/aem.json`
- `config/target.json`

### Step 6: Initialize .agent/handover.md

### Step 7: Report completion

## Validation

- [ ] All directories exist
- [ ] `.env` file exists
- [ ] `.gitignore` exists
- [ ] Config files are valid JSON
