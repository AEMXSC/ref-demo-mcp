# Reference Demo Use Case Setup

Build and manage Adobe AEM content and Adobe Target activities through conversation. This plugin provides a suite of skills for workspace setup, credential management, AEM content creation, and Adobe Target activity management — all orchestrated through a central router that translates requirements into actionable plans.

## Install

### Claude Code

```bash
/plugin marketplace add Adobe-DemoPOC/rd-ai-plugin
/plugin install rd-usecase-setup@reference-demo
```

## Available Skills

### Reference Demo Orchestrator

Turn natural language into AEM content and Target activities. A plan-driven skill gateway across 2 domains.

**Quick Start:**
```bash
# Say: "Set up a new workspace for my project."
# Then: "Create an AEM content page for my homepage."
# Or: "Create an A/B test in Target for the hero section."
```

The **reference-demo-orchestrator** routes intents through a 6-step algorithm — it generates plans from requirements via a Planner, resolves skills via a Domain Registry, and executes them. For single tasks it routes directly to the matching domain.

#### Domains

| Domain | Skills | Description |
|--------|--------|-------------|
| `setup` | `workspace-init`, `auth-setup`, `env-config` | Workspace initialization and configuration |
| `build` | `aem-content`, `target-activities` | Content creation and activity management |

#### Skills Reference

| Skill | Domain | Purpose |
|-------|--------|---------|
| `workspace-init` | setup | Initialize workspace and project structure |
| `auth-setup` | setup | Configure AEM and Target credentials |
| `env-config` | setup | Manage environment configuration |
| `aem-content` | build | Create and manage AEM content via MCP |
| `target-activities` | build | Create and manage Adobe Target activities via MCP |

**Requirements:** `git` on PATH. AEM and Adobe Target MCP servers configured for full functionality (skills fall back to direct API calls when MCP tools aren't available).

## Repository Structure

```
rd-usecase-setup/
├── .claude-plugin/plugin.json          ← plugin identity and skill registry
└── skills/
    ├── reference-demo-orchestrator/    ← entry point router
    │   ├── assets/                     ← routing-table.md, guidelines.md
    │   └── references/
    │       ├── planner/                ← plan generator
    │       └── domain-registry/        ← domain & skill catalog
    ├── setup/                          ← setup domain
    │   └── references/
    │       ├── workspace-init/
    │       ├── auth-setup/
    │       └── env-config/
    └── build/                          ← build domain
        └── references/
            ├── aem-content/
            └── target-activities/
```

## Configuration

The plugin uses environment variables for credentials, created by `workspace-init`:

```env
REFERENCE_DEMO_WORKSPACE=/path/to/workspace
AEM_HOST=https://author-xxx.adobeaemcloud.com
AEM_TOKEN=your-bearer-token
TARGET_TENANT=your-tenant
TARGET_CLIENT_ID=your-client-id
TARGET_CLIENT_SECRET=your-client-secret
```

## Guides

- [Onboarding Guide](ONBOARDING.md) — architecture, routing algorithm, plan conventions, getting started
- [Developer Guide](DEVELOPER.md) — repo structure, adding skills and domains

## License

Apache 2.0 - see [LICENSE](../../LICENSE) for details.
