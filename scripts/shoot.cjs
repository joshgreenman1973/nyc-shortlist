// Capture a 1280x800 screenshot of each tool, then shrink to 800x500 WebP.
// Usage: node scripts/shoot.cjs [id ...]   (no ids = every entry without a shot)
// Needs Playwright; this Mac has it under ~/Experiments/nyc-foil-tracker/node_modules.
const path = require("path"), fs = require("fs"), { execFileSync } = require("child_process");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require(path.join(process.env.HOME, "Experiments/nyc-foil-tracker/node_modules/playwright")); }
const ROOT = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/shortlist.json"), "utf8"));
const only = process.argv.slice(2);
const items = [];
for (const a of data.areas) for (const t of ["picks", "bench", "official"]) for (const e of (a[t] || [])) items.push(e);
const todo = items.filter(e => only.length ? only.includes(e.id) : !fs.existsSync(path.join(ROOT, "shots", e.id + ".webp")));
// Hide cookie and consent banners with CSS instead of clicking anything.
const HIDE = `#onetrust-banner-sdk,#onetrust-consent-sdk,.cc-window,.cc-banner,#CybotCookiebotDialog,.cookie-banner,.cookie-notice,#cookie-notice,#cookie-banner,.cookies-banner,[aria-label*="cookie" i],[id*="cookie-consent" i],[class*="cookie-consent" i],[class*="CookieConsent" i],.fc-consent-root,#usercentrics-root,.truste_box_overlay,#truste-consent-track{display:none!important}`;
(async () => {
  // Real Chrome with software WebGL, so map apps render and bot walls see a normal browser.
  const browser = await pw.chromium.launch({ channel: process.env.SHOT_CHANNEL || undefined, headless: !process.env.SHOT_HEADED,
    args: [...(process.env.SHOT_HEADED ? ["--window-position=-4000,-4000"] : []), "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-blink-features=AutomationControlled"] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", locale: "en-US" });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });
  const results = {};
  let i = 0;
  async function one(e) {
    const page = await ctx.newPage();
    const png = path.join(ROOT, "shots", e.id + ".png");
    try {
      const wait = e.shot_wait || 4500;
      await page.goto(e.shot_url || e.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch (_) {}
      await page.addStyleTag({ content: HIDE }).catch(() => {});
      await page.waitForTimeout(wait);
      await page.evaluate(() => {
        const vw = innerWidth, vh = innerHeight;
        document.querySelectorAll('[role="dialog"],[aria-modal="true"],.modal,.modal-backdrop,.popup,.overlay,.leaflet-control-attribution').forEach(el => { if (!el.closest('main,#map,.map')) el.style.setProperty('display','none','important'); });
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          if (cs.position !== 'fixed') continue;
          const r = el.getBoundingClientRect();
          const z = parseInt(cs.zIndex) || 0;
          const centered = r.left > vw * 0.1 && r.right < vw * 0.9 && r.top > 20 && r.width > 250 && r.height > 120;
          const blanket = r.width >= vw * 0.95 && r.height >= vh * 0.95 && (parseFloat(cs.opacity) < 1 || /rgba\(.*,\s*0?\.\d+\)/.test(cs.backgroundColor));
          if ((centered && z >= 10) || (blanket && z >= 10)) el.style.setProperty('display','none','important');
        }
        document.documentElement.style.overflow = ''; document.body.style.overflow = '';
      }).catch(() => {});
      await page.waitForTimeout(400);
      await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1280, height: 800 } });
      execFileSync("python3", ["-c", `
from PIL import Image
im = Image.open(${JSON.stringify(png)}).convert("RGB").resize((800, 500), Image.LANCZOS)
im.save(${JSON.stringify(png.replace(/\.png$/, ".webp"))}, "WEBP", quality=74, method=6)
`]);
      fs.unlinkSync(png);
      results[e.id] = "ok";
    } catch (err) {
      results[e.id] = "fail: " + String(err.message || err).split("\n")[0];
    } finally { await page.close(); }
    console.log(++i + "/" + todo.length, e.id, results[e.id]);
  }
  const queue = todo.slice();
  await Promise.all(Array.from({ length: 5 }, async () => { while (queue.length) await one(queue.shift()); }));
  await browser.close();
  fs.writeFileSync(path.join(ROOT, "research", "shots-log.json"), JSON.stringify(results, null, 1));
})();
