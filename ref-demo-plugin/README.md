# Adobe Reference Demo — Plugin Marketplace

Official Reference Demo Framework skills for building Adobe demos with AI agents. This repo is a Claude Code plugin marketplace ([`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)); each plugin lives under `plugins/<plugin-name>/`.

## Plugins

| Plugin | Description |
|--------|-------------|
| [`rd-usecase-setup`](plugins/rd-usecase-setup) | Build and manage Adobe AEM content and Adobe Target activities through conversation — workspace setup, credentials, AEM content, and Target activities, orchestrated via a plan-driven skill gateway. |

## Install

### Claude Code

```bash
/plugin marketplace add Adobe-DemoPOC/rd-ai-plugin
/plugin install rd-usecase-setup@reference-demo
```

See [`plugins/rd-usecase-setup/README.md`](plugins/rd-usecase-setup/README.md) for available skills and [`ONBOARDING.md`](plugins/rd-usecase-setup/ONBOARDING.md) for architecture and getting started.

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.
