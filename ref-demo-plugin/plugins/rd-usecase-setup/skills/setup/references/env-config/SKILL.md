---
name: env-config
description: >
  Manage environment configuration settings. Handles .env updates, config
  file management, and environment switching.
  Triggers: env, config, settings, environment, configure.
type: skill
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.1"
---

# Environment Configuration

Manage environment settings and configuration files.

## Critical Rules

1. **Preserve existing values** — don't overwrite unless requested
2. **Validate JSON** — always validate config files after editing
3. **Backup before modify** — create `.bak` files for significant changes

## Configuration Files

| File | Purpose | Format |
|------|---------|--------|
| `.env` | Environment variables | KEY=value |
| `config/aem.json` | AEM settings | JSON |
| `config/target.json` | Target settings | JSON |

## Operations

### Read Configuration

```bash
cat .env
cat config/aem.json
```

### Update Configuration

```bash
# Update .env
sed -i '' "s|^AEM_HOST=.*|AEM_HOST=$new_value|" .env

# Update JSON
jq '.host = "new-value"' config/aem.json > tmp && mv tmp config/aem.json
```

### Environment Switching

Support multiple environments:
```
config/
├── aem.json              # Current
├── aem.dev.json          # Development
├── aem.stage.json        # Staging
└── aem.prod.json         # Production
```

## Validation

1. Validate JSON syntax
2. Check required fields
3. Report status
