# How the first cut was made

Sept. 28, 2026.

## Search

The list was split into nine research areas: crime and policing; jails and courts; money; government and elections; housing; transportation; quality of life and environment; schools, health and services; and the economy and neighborhoods. For each, a researcher started from a seed list of known tools and then searched news coverage, the NYC Open Data project gallery, BetaNYC, Open Data Week and Data Through Design showcases, GitHub, university research centers, civic groups and watchdog offices.

The shared web-search allowance ran out partway through several areas, so later candidates in those areas came from following links on sites already checked and from GitHub. Newsroom-built tools, Reddit threads and the older NYC Open Data gallery (which the city has replaced with a 10-item version) got less coverage than planned. A second pass on those sources is the most useful next step.

## Verification

Every tool on the page was loaded on Sept. 28, 2026, by a script (`curl`) and, for JavaScript apps and sites that block scripts, in a browser. For each one the researcher read its about or methodology page, recorded the datasets it uses, looked for evidence of when its data was last updated (a "data through" date on the page, a data file's latest record, a code repository's last change) and copied a short quote from its own description. No tool was listed from memory.

In all, 273 tools were reviewed: the 115 on the page plus 158 that were left off. Tools were left off for being dead or moved, badly out of date, behind a login or paywall, anonymous with no stated method, built on data that could not be traced, or duplicating a better tool.

## Selection

A pick had to be built mostly on public data about New York City, name its maker and sources, have current data or say plainly when its data stops, be free with no account, give a non-expert an answer in a few minutes, and do something the city's own version does not.

Picks lean toward independent makers: nonprofits, universities, newsrooms, civic technologists and independent developers. Tools from watchdog offices that are part of government but independent of the agencies they track (the city and state comptrollers, the Independent Budget Office, the City Council's data team, the public advocate, the Board of Correction, the Campaign Finance Board) could also be picks, and are marked. Agency-built tools appear only under "From the city itself."

Advocacy groups' tools were included when the data is presented straight, with the group's stance noted under "Keep in mind."

## Known limits

- Two picks (FloodNet and NYC Water Check) run on sensor readings and volunteer water sampling rather than agency records. They are included because they show conditions no agency tool shows.
- Three tools do not name their makers: 50-a.org and NYC-SIFT (picks) and 311 Wrapped (bench). Each says so on the page.
- The city's open crash data has not updated since June 11, 2026, so the independent crash tools are missing recent months. The page says so.
- Several areas have no good independent tool: prosecution data from the district attorneys, 911 and ambulance response times, police overtime, tax breaks, city debt, pension costs, storefront vacancy, overdoses and mental health.
- Checkbook NYC and MuckRock block automated browsers, so their entries show a placeholder instead of a screenshot.

## Files

`research/` (kept out of the public repository) holds the nine research files with every candidate, rejection, quote and source URL, and the script that assembled the first version of `data/shortlist.json`. Since then, `data/shortlist.json` has been edited directly and is the file of record.
