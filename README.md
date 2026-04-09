# Adibilis CLI

Scan websites for WCAG 2.2 AA accessibility violations.

## Quick Start

```bash
# Scan any URL
npx adibilis scan https://your-site.com

# Scan with auto-fix suggestions
npx adibilis scan https://your-site.com --fix

# Fail CI if serious violations found
npx adibilis scan https://your-site.com --threshold serious --json

# Generate a full report
npx adibilis scan https://your-site.com --report
```

## Install

```bash
npm install -g adibilis
```

## Commands

### `adibilis scan <url>`

Scan a URL for accessibility violations.

| Option | Description |
|--------|-------------|
| `--fix` | Show generated fix patches |
| `--report` | Generate HTML report and open in browser |
| `--json` | Output results as JSON (for CI integration) |
| `--threshold <level>` | Exit code 1 if violations exceed level (`critical`/`serious`/`moderate`/`minor`) |
| `--api-key <key>` | Adibilis API key (or `ADIBILIS_API_KEY` env var) |
| `--pages <n>` | Max pages to scan (default 1 for free, up to plan limit) |
| `--ignore <rules>` | Comma-separated rule IDs to ignore |
| `--config <path>` | Path to `.adibilis.yml` config file |

### `adibilis login`

Authenticate with your Adibilis API key. The key is saved to `~/.adibilis/config.json`.

### `adibilis init`

Create a `.adibilis.yml` config file in the current directory.

## Configuration

Create `.adibilis.yml` in your project root:

```yaml
url: https://your-site.com
threshold: serious
ignore_rules:
  - color-contrast
pages: 5
```

## CI/CD Integration

### GitHub Actions

```yaml
- run: npx adibilis scan $DEPLOY_URL --threshold serious --json
  env:
    ADIBILIS_API_KEY: ${{ secrets.ADIBILIS_API_KEY }}
```

### GitLab CI

```yaml
accessibility:
  script:
    - npx adibilis scan $DEPLOY_URL --threshold serious --json
  variables:
    ADIBILIS_API_KEY: $ADIBILIS_API_KEY
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ADIBILIS_API_KEY` | API key for authenticated scans |
| `ADIBILIS_API_URL` | Custom API base URL (default: production) |

## API Key Priority

1. `--api-key` flag
2. `ADIBILIS_API_KEY` environment variable
3. `~/.adibilis/config.json` (saved via `adibilis login`)

## License

MIT
