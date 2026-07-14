---
name: notify
description: >
  Domain router for notification skills. Routes notify intents to send-sms.
  Triggers: notify, notification, sms, text message, alert.
type: domain
license: Apache-2.0
metadata:
  author: Your Organization
  version: "0.1"
---

# Notify — Domain Router

| | |
|---|---|
| **ID** | `notify` |
| **Description** | Routes notification intents to the correct skill. |

---

## Routing Table

> **First match wins.**

| Intent Pattern | Skill |
|---|---|
| Send SMS, text message, notify by SMS | `send-sms` |

---

## Skills

| # | Skill | Purpose | Triggers |
|---|---|---|---|
| 1 | `send-sms` | Send an SMS notification via Twilio | sms, text, notify, alert |

### Skill Locations

| Skill | Path |
|---|---|
| `send-sms` | [`references/send-sms/SKILL.md`](references/send-sms/SKILL.md) |

---

## Guard Policies

> **Credentials confirmed first:** `send-sms` confirms Twilio credentials in `.env` before sending — never send with unconfirmed or guessed credentials.

---

## Dependencies

| Domain | Relationship |
|---|---|
| `setup` | `notify` depends on `setup` — workspace must exist before any notification is sent |
