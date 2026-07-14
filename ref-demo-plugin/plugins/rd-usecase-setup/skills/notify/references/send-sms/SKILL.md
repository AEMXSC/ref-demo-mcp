---
name: send-sms
description: >
  Send an SMS notification via Twilio's REST API, using a bundled Python
  script rather than an MCP tool. Confirms Twilio credentials in .env
  before sending.
  Triggers: sms, text message, notify, send sms, alert.
type: skill
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.1"
---

# Send SMS

Send an SMS notification via Twilio, using a bundled script (`scripts/send_sms.py`) instead of an MCP tool — there's no installed MCP connector for SMS, so this is a code-based custom skill invoked directly via Bash.

## Critical Rules

1. **Never store credentials in code** — Twilio credentials go in `.env` only
2. **Confirm before sending** — never send with unconfirmed credentials or an unconfirmed recipient/message
3. **This is a real send** — there's no dry-run mode; confirm recipient and message with the user before running the script

## Credentials

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Sending number, E.164 format (e.g. `+14155550100`) |

## Workflow

### Step 1: Confirm credentials

Check `.env` for `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- **Not present:** prompt the user for each one at a time, then append them to `.env`.
- **Already present:** show the user which variables are set (mask `TWILIO_AUTH_TOKEN`) and ask them to confirm before proceeding.

**Do not proceed to Step 2 until confirmed** — same pattern `auth-setup` uses for `AEM_HOST`/`TARGET_ORG`.

### Step 2: Confirm the message

Confirm the destination number (E.164 format) and exact message body with the user before sending — there's no dry-run/undo for a real SMS send.

### Step 3: Run the script

```bash
set -a; source .env; set +a
python3 skills/notify/references/send-sms/scripts/send_sms.py --to "+14155552671" --message "Your activity is live"
```

The script reads `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` from the environment — `.env` must be sourced first.

### Step 4: Validate

On success the script prints `{"sid": "...", "status": "..."}` to stdout. On failure it exits non-zero with an error on stderr. Report the result to the user.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Missing required environment variable` | Re-run Step 1 — a credential wasn't actually in `.env` |
| Twilio API error 401 | `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` are wrong — reconfirm in Step 1 |
| Twilio API error 21211 | Invalid `--to` number — must be E.164 format |
