# The Shortlist

The best independent tools for understanding New York City and how its government is doing: 144 tools in 15 areas, chosen from 542 reviewed on Sept. 28 to Oct. 1, 2026. Every tool passed two tests, current and objectively well made (see METHODOLOGY.md). Each entry says what is in the tool, why it made the list, what to watch out for and which quality checks it passed.

Live: https://joshgreenman1973.github.io/nyc-shortlist/

## Put it on another site

Paste this into an HTML card (Ghost or anywhere else):

```html
<div data-shortlist data-sticky-offset="auto"></div>
<script src="https://joshgreenman1973.github.io/nyc-shortlist/shortlist.js" defer></script>
```

The page renders inside a shadow root, so the host site's styles cannot change it and its styles cannot leak out. It sizes itself to the width it is given. Optional attributes on the `div`:

- `data-sticky-offset="auto"`: measures the host page's fixed or sticky header so the search bar sticks below it instead of under it. Use this on vitalcitynyc.org, whose header is 72 pixels on a computer and 62 on a phone. A number (`"72"`) sets the height by hand.
- `data-hide-title`: leaves out the page's own title and dek, for a host page (such as a Ghost page) that already shows a title and excerpt.
- `data-standalone`: lets the page write searches (`?q=`) and anchors into the address bar, and shows the orange footer. Leave it off when embedding, since the host site has its own footer.

## Design

The page is built to read as a page of vitalcitynyc.org, with values taken from the live site's computed styles (Oct. 5, 2026): the theme's page hero (Gascogne title, gray dek, black rule), the /data/ page's ruled rail with a vertical Gascogne label, post-card tag lines (orange upper-case tag, gray details), the home page's section headings, the lime highlight box and black buttons, and the orange footer. On vitalcitynyc.org the script finds the site's own fonts and uses Halyard Display for headings, as the site does; elsewhere it loads the shared Halyard Text kit and sets headings in its bold.

## Edit the list

Everything on the page comes from `data/shortlist.json`. Each area has `picks` (the two to four best), `bench` ("Also worth knowing") and `official` ("From the government," which includes watchdog offices). Every entry needs `id`, `name`, `url`, `maker`, `maker_type`, `summary` (what is in it) and `why` (why it is on the list). Picks also need `questions`, `caveat`, `data`, `freshness` and `index` (the questions that appear in "Start with a question").

`maker_type` sets the orange label above each tool's name: `nonprofit` (Nonprofit), `academic` (University), `newsroom`, `advocacy`, `independent-developer`, `civic-tech`, `journalist`, `commercial`, `watchdog` (Government watchdog), `official` (Government agency), `state` and `federal`. The labels are in `TYPE` in `shortlist.js`.

`agencies` lists the parts of government a tool is about (the "Browse by agency" chips are built from these). `repo` (GitHub owner/name) and `data_url` feed the weekly staleness check; leave them off when the code repository is not where the tool's data updates. `quality` holds the card's checks: `cadence`, `updated` (YYYY-MM) and `signals` (any of `method`, `open`, `maintained`, `cited`). `own` adds a disclosure line (`vc`, `jg`, `tr`, `trt`, `ta`; texts in `shortlist.js`).

Optional fields: `shot: false` shows a typeset placeholder when a site blocks screenshots; `shot_url` and `shot_wait` capture a different page or wait longer; `check_url` gives the link checker a page that returns a clean status when the linked page reports an error code but renders fine.

## Screenshots

`shots/<id>.webp`, 800 by 500. To capture new or changed entries (needs Playwright and Google Chrome):

```bash
SHOT_CHANNEL=chrome node scripts/shoot.cjs <id> [<id> ...]
```

With no ids it captures every entry that has no screenshot yet. It hides cookie banners and pop-ups with CSS; it does not click "accept" on anything.

## Page sections

Besides the areas, the page has `start` (ten entries with a one-line `line` each), `gaps` (questions no tool answers well: `q` and `note`), `held` (tools that would make the list with one fix: `name`, `url`, `maker`, `fix`) and `changelog` (`date`, `note`). All live in `data/shortlist.json` and are assembled by `research/build_v2.py`.

## Nominations

The page links to info@vitalcitynyc.org with "Civic tech tool shortlist" in the subject line and a short form in the body.

## Weekly checks

`.github/workflows/check-links.yml` runs every Monday. `scripts/check_links.py` checks every link and commits `data/linkcheck.json`. `scripts/check_freshness.py` reads each tool's GitHub repository push date or data file's Last-Modified header and writes `data/freshness.json`; a tool with no sign of an update turns the workflow red so the editor can look. How long counts as too long depends on which signal is available, because the two measure different things: a `data_url`'s Last-Modified is real data freshness, so it is held to the entry's `cadence` (a live or daily file goes red within a fortnight), while a repository push date only measures code maintenance and so allows a full year. Judging a commit date against a short cadence would call a live tool dead merely for not having been edited. Tools whose `cadence` is `historical` or `one-time` are skipped, because they were never going to update again. That is a review queue, not a public flag, because a tool can pull live data without any push. A tool that fails two runs in a row gets a "Not responding" note on the page, and the workflow shows red. A 401, 403, 405, 406 or 429 counts as reachable, because it usually means a bot wall in front of a working site.

See `METHODOLOGY.md` for how the list was made.
