#!/usr/bin/env python3
"""Check every link in data/shortlist.json and write data/linkcheck.json.

A link counts as failing on a 404/410, a 5xx, a DNS error or a timeout.
403 and 429 usually mean a bot wall in front of a working site, so they
count as reachable. The page flags a tool only after two failed runs in a
row, so one bad night does not mark a working site as broken.

Exit status is 1 if any link has failed twice in a row, so the weekly
workflow shows red when something needs attention.
"""
import json
import subprocess
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIST = ROOT / "data" / "shortlist.json"
OUT = ROOT / "data" / "linkcheck.json"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
REACHABLE_BLOCKS = {401, 403, 406, 429}


def entries(data):
    for area in data["areas"]:
        for tier in ("picks", "bench", "official"):
            for e in area.get(tier, []):
                # check_url: a page on the same site that returns a clean status
                # when the linked page renders fine but reports an error code.
                yield e["id"], e.get("check_url") or e["url"]


def probe(url):
    last = None
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method, headers={
            "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, None
        except urllib.error.HTTPError as e:
            last = (e.code, None)
            if e.code in (405, 400, 403, 404, 501) and method == "HEAD":
                continue
            return last
        except Exception as e:  # DNS, TLS, timeout
            last = (None, type(e).__name__)
            if method == "HEAD":
                continue
    # Some older Python builds cannot negotiate a site's TLS version; ask curl.
    try:
        out = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-L",
                              "-A", UA, "--max-time", "30", url], capture_output=True, text=True, timeout=40)
        code = int(out.stdout.strip() or 0)
        if code:
            return code, None
    except Exception:
        pass
    return last


def main():
    data = json.loads(LIST.read_text())
    prev = {}
    if OUT.exists():
        prev = json.loads(OUT.read_text()).get("results", {})
    today = date.today().isoformat()
    items = list(entries(data))
    with ThreadPoolExecutor(max_workers=12) as pool:
        outcomes = list(pool.map(lambda it: (it[0], it[1], probe(it[1])), items))

    results, broken = {}, []
    for tid, url, (code, err) in outcomes:
        ok = code is not None and (code < 400 or code in REACHABLE_BLOCKS)
        fails = 0 if ok else prev.get(tid, {}).get("fails", 0) + 1
        results[tid] = {"url": url, "code": code, "error": err, "ok": ok,
                        "fails": fails, "last": today}
        if fails >= 2:
            broken.append(f"{tid}: {url} ({code or err})")
        if not ok:
            print(f"FAIL {tid} {url} -> {code or err} (run {fails})")

    OUT.write_text(json.dumps({"checked": today, "count": len(items),
                               "results": results}, indent=1) + "\n")
    print(f"Checked {len(items)} links; {sum(1 for r in results.values() if not r['ok'])} failing now; "
          f"{len(broken)} failing twice in a row.")
    if broken:
        print("\n".join(broken))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
