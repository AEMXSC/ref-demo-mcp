#!/usr/bin/env python3
"""Send an SMS via Twilio's REST API.

Credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER) are
read from the environment -- source .env before running this script.
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

TWILIO_API_BASE = "https://api.twilio.com/2010-04-01"


def send_sms(to: str, body: str) -> dict:
    account_sid = os.environ["TWILIO_ACCOUNT_SID"]
    auth_token = os.environ["TWILIO_AUTH_TOKEN"]
    from_number = os.environ["TWILIO_FROM_NUMBER"]

    url = f"{TWILIO_API_BASE}/Accounts/{account_sid}/Messages.json"
    data = urllib.parse.urlencode({"To": to, "From": from_number, "Body": body}).encode()
    credentials = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()

    request = urllib.request.Request(url, data=data, method="POST")
    request.add_header("Authorization", f"Basic {credentials}")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(request) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Twilio API error {error.code}: {error.read().decode()}") from error


def main() -> int:
    parser = argparse.ArgumentParser(description="Send an SMS via Twilio")
    parser.add_argument("--to", required=True, help="Destination number, E.164 format (e.g. +14155552671)")
    parser.add_argument("--message", required=True, help="SMS body text")
    args = parser.parse_args()

    try:
        result = send_sms(args.to, args.message)
    except KeyError as error:
        print(f"Missing required environment variable: {error}", file=sys.stderr)
        return 1
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        return 1

    print(json.dumps({"sid": result.get("sid"), "status": result.get("status")}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
