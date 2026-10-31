"""Bounded HTTP readiness check; no authentication or service lifecycle changes."""
import argparse
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import urlopen


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    parser.add_argument("--status", type=int, default=200)
    parser.add_argument("--timeout", type=float, default=10)
    args = parser.parse_args()
    target = urlsplit(args.url)
    if target.scheme not in ("http", "https") or not target.hostname or target.username or target.password:
        parser.error("Use an HTTP(S) URL without credentials")
    if not 0 < args.timeout <= 30:
        parser.error("Timeout must be greater than zero and at most 30 seconds")
    try:
        with urlopen(args.url, timeout=args.timeout) as response:
            status = response.status
    except HTTPError as error:
        status = error.code
    except (URLError, TimeoutError, OSError):
        print(json.dumps({"ready": False, "error": "unreachable"}))
        return 1
    print(json.dumps({"ready": status == args.status, "status": status}))
    return 0 if status == args.status else 1


if __name__ == "__main__":
    raise SystemExit(main())
