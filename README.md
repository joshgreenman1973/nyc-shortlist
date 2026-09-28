# The Shortlist

The best independent tools for understanding New York City and how its government is doing: 115 tools in 13 areas, chosen from 273 reviewed on Sept. 28, 2026. Each entry says what is in the tool, why it made the list and what to watch out for.

Live: https://joshgreenman1973.github.io/nyc-shortlist/

## Put it on another site

Paste this into an HTML card (Ghost or anywhere else):

```html
<div data-shortlist></div>
<script src="https://joshgreenman1973.github.io/nyc-shortlist/shortlist.js" defer></script>
```

The page renders inside a shadow root, so the host site's styles cannot change it and its styles cannot leak out. It sizes itself to the width it is given. Optional attributes on the `div`:

- `data-sticky-offset="64"`: the height of a fixed site header, so the search bar sticks below it instead of under it.
- `data-standalone`: lets the page write searches (`?q=`) and anchors into the address bar. Leave it off when embedding.

## Edit the list

Everything on the page comes from `data/shortlist.json`. Each area has `picks` (the two to four best), `bench` ("Also worth knowing") and `official` ("From the city itself"). Every entry needs `id`, `name`, `url`, `maker`, `maker_type`, `summary` (what is in it) and `why` (why it is on the list). Picks also need `questions`, `caveat`, `data`, `freshness` and `index` (the questions that appear in "Start with a question").

`maker_type` sets the colored square: `nonprofit`, `academic`, `newsroom`, `advocacy`, `independent-developer`, `civic-tech` and `commercial` are orange (independent); `watchdog` is blue; `official`, `state` and `federal` are gray.

Optional fields: `shot: false` shows a typeset placeholder when a site blocks screenshots; `shot_url` and `shot_wait` capture a different page or wait longer; `check_url` gives the link checker a page that returns a clean status when the linked page reports an error code but renders fine.

## Screenshots

`shots/<id>.webp`, 800 by 500. To capture new or changed entries (needs Playwright and Google Chrome):

```bash
SHOT_CHANNEL=chrome node scripts/shoot.cjs <id> [<id> ...]
```

With no ids it captures every entry that has no screenshot yet. It hides cookie banners and pop-ups with CSS; it does not click "accept" on anything.

## Link check

`.github/workflows/check-links.yml` runs `scripts/check_links.py` every Monday and commits `data/linkcheck.json`. A tool that fails two runs in a row gets a "Not responding" note on the page, and the workflow shows red. A 401, 403, 405, 406 or 429 counts as reachable, because it usually means a bot wall in front of a working site.

See `METHODOLOGY.md` for how the list was made.
