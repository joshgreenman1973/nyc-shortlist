#!/usr/bin/env python3
"""Look for signs that a listed tool has stopped updating.

The weekly link check catches dead pages. This catches quiet decay: for each
entry with a `repo` (owner/name on GitHub) it reads the last push date, and
for each entry with a `data_url` it reads the file's Last-Modified header.
How long silence is allowed depends on which signal we have, because the two
measure different things:

  data_modified  the data file's own Last-Modified -- a direct freshness
                 signal, so it is held to the tool's declared cadence.
  repo_pushed    the last commit, which measures code maintenance, not data.
                 A tool that queries an API at request time can sit without a
                 commit for a year and still be perfectly live, so a push date
                 only earns suspicion after MAINTENANCE_DAYS.

Judging a push date against a short cadence is what makes this test lie: it
would call a live tool dead for not having been edited. Tools that were never
going to update again ("historical", "one-time") are skipped outright.

Writes data/freshness.json and exits 1 if anything is stale, so the workflow
shows red. Silence is not proof of staleness: this is a review queue for the
editor, not a public flag.
"""
import json
import os
import sys
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIST = ROOT / "data" / "shortlist.json"
OUT = ROOT / "data" / "freshness.json"
# A data file held to its own cadence: roughly two missed cycles, so one late
# release is not an alarm but a stop is.
STALE_BY_CADENCE = {
    "live": 7, "daily": 14, "weekly": 45, "monthly": 90,
    "quarterly": 240, "semiannual": 420, "annual": 450,
    "periodic": 365, "irregular": 365,
}
STALE_DAYS = 180          # a data file whose cadence is missing or unrecognised
MAINTENANCE_DAYS = 365    # a commit date, whatever the cadence (see docstring)
NEVER_UPDATES = {"historical", "one-time"}
TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")


def get_json(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": "shortlist-freshness", **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def repo_pushed(repo):
    h = {"Accept": "application/vnd.github+json"}
    if TOKEN:
        h["Authorization"] = "Bearer " + TOKEN
    return get_json(f"https://api.github.com/repos/{repo}", h).get("pushed_at")


def last_modified(url):
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "shortlist-freshness"})
    with urllib.request.urlopen(req, timeout=30) as r:
        lm = r.headers.get("Last-Modified")
    if not lm:
        return None
    return datetime.strptime(lm, "%a, %d %b %Y %H:%M:%S %Z").replace(tzinfo=timezone.utc).isoformat()


def main():
    data = json.loads(LIST.read_text())
    today = datetime.now(timezone.utc)
    results, stale = {}, []
    for area in data["areas"]:
        for tier in ("picks", "bench", "official"):
            for e in area.get(tier, []):
                q = e.get("quality") or {}
                cadence = (q.get("cadence") or "").strip().lower()
                if cadence in NEVER_UPDATES:
                    continue
                signs = {}
                try:
                    if e.get("repo"):
                        signs["repo_pushed"] = repo_pushed(e["repo"])
                    if e.get("data_url"):
                        signs["data_modified"] = last_modified(e["data_url"])
                except Exception as ex:
                    signs["error"] = f"{type(ex).__name__}: {ex}"[:120]
                    print(f"  {e['id']}: {signs['error']}")
                dates = [v for k, v in signs.items() if k != "error" and v]
                if not dates:
                    continue
                newest = max(dates)
                age = (today - datetime.fromisoformat(newest.replace("Z", "+00:00"))).days
                if signs.get("data_modified") == newest:
                    basis = "data file"
                    limit = STALE_BY_CADENCE.get(cadence, STALE_DAYS)
                else:
                    basis = "last commit"
                    limit = MAINTENANCE_DAYS
                results[e["id"]] = {"newest": newest[:10], "age_days": age,
                                    "cadence": cadence or None, "basis": basis,
                                    "stale_after_days": limit, **signs}
                if age > limit:
                    stale.append(f"{e['id']}: no sign of an update since {newest[:10]} "
                                 f"({age} days; {basis}, {cadence or 'cadence unknown'}, "
                                 f"allows {limit})")
    OUT.write_text(json.dumps({"checked": date.today().isoformat(),
                               "stale_after_days_data_by_cadence": STALE_BY_CADENCE,
                               "stale_after_days_data_default": STALE_DAYS,
                               "stale_after_days_last_commit": MAINTENANCE_DAYS,
                               "results": results}, indent=1) + "\n")
    print(f"Checked {len(results)} tools with a repo or data file; {len(stale)} look stale.")
    print("\n".join(stale))
    return 1 if stale else 0


if __name__ == "__main__":
    sys.exit(main())
