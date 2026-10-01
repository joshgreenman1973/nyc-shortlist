# How the list was made

Sept. 28 to Oct. 1, 2026. 144 tools listed, from 542 reviewed.

## Search

Two rounds. The first split the city into nine research areas (crime and policing; jails and courts; money; government and elections; housing; transportation; quality of life and environment; schools, health and services; the economy and neighborhoods) and started from seed lists, news coverage, civic tech showcases, university centers and watchdog offices.

Because independent developers were thin after that round, a second round searched where they publish: GitHub (repository and topic searches, keeping projects with a live site), Hacker News, Reddit and Bluesky, and civic tech showcases and the portfolios of known New York City civic developers. That round reviewed about 200 more tools. A third round on Sept. 30 covered newsroom data desks (nearly empty: newsrooms build story graphics, not standing tools), research institutions and advocacy groups, and subjects with no tools yet, which added two areas, immigration and health. Fewer than one in 50 New York City repositories with a live site turned out to be a maintained public tool; most were class projects, hackathon entries or one-day demos.

The same tests were then applied to tools by Vital City, its editor Josh Greenman and contributor Tal Roded.

## The two tests

Every tool on the page was tested against both on Sept. 28, 2026. The full rubric is `research/RUBRIC.md` in the working files. Fourteen tools failed one test and are listed anyway by the editor's decision (Sept. 30, 2026); each says what it is missing under "Keep in mind." One Vital City tool that failed, the Assault Tracker, stays off because Vital City has not published it.

**Current.** One of:
- Live or automated, with evidence of an update in the past 30 days.
- Periodic: the newest edition came out in the past 12 months and uses the newest release of its source data. A tool one release behind still passes if the newest release came out less than three months ago.
- Historical by nature (archival photographs), labeled that way.

**Quality, by objective signals.** Required: a named maker (person or organization) and named data sources. Plus at least two of: a published method; open code or downloadable data; an update to code, data or content in the past 90 days; and either the standards of a university, newsroom, watchdog office or established research nonprofit, or citation as a source by a news organization or government body. Each card lists the signals the tool showed.

A tool also had to load and work. One tool that passed on paper, SweepTracker, was left off because its map tiles fail to load.

## Who made what

Picks and "Also worth knowing" are outside government. Government tools, including watchdog offices that are independent of the agencies they track (the city and state comptrollers, the Independent Budget Office, the City Council, the public advocate, the Board of Correction, the Campaign Finance Board), are listed under "From the government," with watchdogs marked in blue.

Tools by Vital City, Josh Greenman, Tal Roded and Ted Alcorn (who worked at Vital City until September 2026) carry a disclosure. We reviewed more than 40 tools from these makers. Five of Josh Greenman's are listed after he added a byline to each on Sept. 30, 2026 (Every Building by his judgment, since its building data is one release behind); six others that would qualify he keeps off as work in progress. Vital City's own dashboards are left off (Oct. 1, 2026), because this list may live on Vital City's site, where they are already linked. One more, Vital City's New York City calendar, passed but is left off until an internal staff menu is removed from its public page.

## What failed, and why

The most common reasons: no named maker (50-a.org, NYC-SIFT, 311 Wrapped, CrashCount and many of Josh Greenman's own projects), data a release or more behind the source (DATA2GO.NYC, the property tax map, the Urban Heat Portal, Jehiah Czebotar's bus speeds), one-time reports older than a year, and sources that are never named (the Criminal Justice Agency's pretrial dashboards, Vital City's Historical Crime Explorer). The research files keep every rejected tool with its reason.

## Finding tools

Four ways in, all built from the same list: "Start here" (ten tools chosen to cover the questions people ask most), the question index, the thirteen areas, and "Browse by agency," where every tool is tagged with the parts of government it is about. Within an area, only the picks show in full; the "Also worth knowing" and "From the government" shelves open on request.

## Gaps

"Where no good tool exists" lists questions nothing we found answers well, with a nomination link. It is not a recommendation.

## The question box

It matches the words in a question against each tool's questions, description and data sources, using BM25 ranking and a vocabulary of everyday words ("cops" finds police tools). It does not use AI, read the tools' data or answer questions itself, and nothing typed leaves the page.

## Known limits

- Web search ran out partway through the first round, and Reddit and Bluesky blocked many automated searches in the second, so some tools will have been missed. Nominations go to info@vitalcitynyc.org with "Civic tech tool shortlist" in the subject line.
- Several areas have no current independent tool: prosecution data from the district attorneys, 911 response times, police overtime, tax breaks, city debt, overdoses and mental health, building carbon compliance, transit beyond the subway and buses, and libraries and culture. The page lists these under "Where no good tool exists." Health has no independent pick at all and says so.
- The city's open crash data has not updated since June 11, 2026, so the independent crash map is missing recent months.
- Currency is a snapshot. The weekly check catches dead links and, for tools with a public code repository or data file, long silences (180 days), but not every kind of staleness; the rubric should be rerun every few months.

## Files

`data/shortlist.json` is the list. `research/` (kept out of the public repository) holds the research and audit files with every candidate, rejection, quote and source URL, `RUBRIC.md`, and `build_v2.py`, which assembles the list from the first cut plus the audit verdicts.
