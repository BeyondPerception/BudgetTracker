
import os
import sys
import base64
import json
from datetime import datetime, timezone
from urllib.parse import urljoin
import requests


def _claim_access_url(token: str) -> str:
    """Turn a Setup Token into an Access URL (one‑time step)."""
    claim_url = base64.b64decode(token).decode("utf‑8")
    resp = requests.post(claim_url, headers={
                         "Content-Length": "0",
                         "Origin": "http://localhost:5173",
                         "Referer": "http://localhost:5173",
                         "Sec-Fetch-Dest": "empty",
                         "Sec-Fetch-Mode": "no-cors",
                         "Sec-Fetch-Site": "cross-site",
                         }, timeout=30)
    resp.raise_for_status()
    return resp.text.strip()


def main() -> None:
    token = "aHR0cHM6Ly9iZXRhLWJyaWRnZS5zaW1wbGVmaW4ub3JnL3NpbXBsZWZpbi9jbGFpbS9GMkJFOUFFNzM1MDg0QTc5QTIwMzFEQUNCNUFBQkU0RkE2MDRCNDZBQkVCNTJDRDY4OEE1N0YwQzkzOTEzMkRCMzExRUJEMkE4MDJFMDYxQ0RGQTMxRDJGMUEyRDhCNjNEMzlENDgzQjhBQURGRkQ5OTMwODU1QUFBQkY0NzhEQg=="
    access_url = _claim_access_url(token)
    print("Access URL:", access_url)


if __name__ == "__main__":
    main()
