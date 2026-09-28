/* The Shortlist.
   One script does everything: it finds a mount point, attaches a shadow root
   (so Ghost's theme CSS cannot touch it), loads style.css and the data from
   wherever this script lives, and renders the page.

   Embed anywhere:
     <div data-shortlist></div>
     <script src="https://joshgreenman1973.github.io/nyc-shortlist/shortlist.js" defer></script>

   Optional attributes on the mount:
     data-sticky-offset="64"   height of a fixed site header, so the search bar sits below it
     data-standalone           let the page write ?q= searches and #anchors into the address bar
*/
(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    for (var i = s.length - 1; i >= 0; i--) if (/shortlist\.js/.test(s[i].src)) return s[i];
  })();
  var BASE = script.src.replace(/shortlist\.js(\?.*)?$/, "");

  var TYPE = {
    nonprofit: ["indie", "Nonprofit"],
    academic: ["indie", "University"],
    newsroom: ["indie", "Newsroom"],
    advocacy: ["indie", "Advocacy group"],
    "independent-developer": ["indie", "Independent developer"],
    "civic-tech": ["indie", "Civic technologists"],
    commercial: ["indie", "Company"],
    watchdog: ["watch", "Watchdog office"],
    official: ["city", "City agency"],
    state: ["city", "State agency"],
    federal: ["city", "Federal institution"]
  };

  // Everyday words people type, mapped to words the entries use.
  var SYNONYMS = {
    cops: "police", cop: "police", nypd: "police", precinct: "police", arrests: "arrest",
    trash: "sanitation garbage", garbage: "sanitation trash", litter: "sanitation",
    subway: "transit train", train: "subway transit", bus: "buses transit", buses: "bus transit",
    landlord: "owner building", apartment: "housing rent building", rent: "rent stabilized housing",
    jail: "rikers correction", jails: "rikers correction", rikers: "jail",
    school: "schools education", kids: "children schools", teacher: "schools",
    money: "budget spending", taxes: "tax property", salary: "payroll pay", salaries: "payroll pay",
    crash: "crashes traffic", crashes: "traffic safety", bike: "cycling bikes", bikes: "cycling",
    homeless: "homelessness shelter", shelter: "homelessness", migrants: "asylum shelter",
    council: "city council legislation", election: "elections voting", vote: "elections",
    flood: "flooding", heat: "heat climate", rats: "rat", noise: "noise 311", complaint: "311",
    doctor: "health", hospital: "health hospitals", drugs: "overdose", overdoses: "overdose",
    neighborhood: "neighborhoods", block: "neighborhood building", zoning: "land use rezoning",
    parks: "park", tree: "trees", trees: "tree", jobs: "economy employment", work: "jobs"
  };
  var STOP = ["the", "and", "is", "my", "in", "of", "to", "a", "an", "how", "what", "who", "where", "does", "do", "are", "for", "on", "nyc", "new", "york", "city", "i", "can", "it", "much", "many"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function typeOf(t) { return TYPE[t] || ["indie", "Independent"]; }
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    var m = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."][d.getMonth()];
    return m + " " + d.getDate() + ", " + d.getFullYear();
  }
  function host(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; } }

  // Fonts must be declared on the document; a shadow root cannot load them.
  function loadFonts() {
    if (!document.querySelector('link[href*="use.typekit.net/qqk2vto"]')) {
      var l = document.createElement("link");
      l.rel = "stylesheet"; l.href = "https://use.typekit.net/qqk2vto.css";
      document.head.appendChild(l);
    }
    if (!document.getElementById("shortlist-fonts")) {
      var s = document.createElement("style");
      s.id = "shortlist-fonts";
      s.textContent = '@font-face{font-family:"GascogneTS";src:url("https://vital-city-nyc.github.io/vital-city-design-system/fonts/GascogneTS-Light.ttf") format("truetype");font-weight:200;font-style:normal;font-display:swap;}';
      document.head.appendChild(s);
    }
  }

  function App(mount) {
    this.mount = mount;
    this.standalone = mount.hasAttribute("data-standalone");
    this.offset = parseInt(mount.getAttribute("data-sticky-offset") || "0", 10) || 0;
    this.root = mount.attachShadow ? mount.attachShadow({ mode: "open" }) : mount;
    this.data = null; this.checks = {}; this.all = [];
  }

  App.prototype.$ = function (s) { return this.root.querySelector(s); };

  App.prototype.shotHTML = function (e, big) {
    var inner = e.shot === false
      ? '<span class="noshot"><span class="d">' + esc(host(e.url)) + '</span><span class="n">This site blocks previews</span></span>'
      : '<img src="' + BASE + "shots/" + esc(e.id) + '.webp" alt="Screenshot of ' + esc(e.name) + '" loading="lazy" decoding="async" width="' + (big ? 800 : 800) + '" height="500">';
    return '<a class="shot" href="' + esc(e.url) + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">' + inner + "</a>";
  };

  App.prototype.byline = function (e) {
    var t = typeOf(e.maker_type);
    return '<p class="by"><span class="sw ' + t[0] + '" aria-hidden="true"></span><span>' + esc(e.maker) + " &middot; " + t[1] + "</span></p>";
  };

  App.prototype.flag = function (id) {
    var c = this.checks[id];
    return (c && c.fails >= 2) ? '<p class="flag">Not responding when we last checked, ' + esc(fmtDate(c.last)) + ".</p>" : "";
  };

  App.prototype.srcLine = function (e) {
    var bits = [];
    if (e.data) bits.push("Data: " + e.data);
    if (e.freshness) bits.push(e.freshness);
    return bits.length ? '<p class="src">' + esc(bits.join(". ").replace(/\.\./g, ".")) + "</p>" : "";
  };

  App.prototype.pickHTML = function (e, areaName) {
    var qs = (e.questions || []).map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("");
    return '<li class="card pick" id="t-' + esc(e.id) + '">' +
      this.shotHTML(e, true) +
      (areaName ? '<p class="area-tag">' + esc(areaName) + "</p>" : "") +
      '<h3><a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.name) + '&nbsp;<span class="arrow" aria-hidden="true">&#8599;</span></a></h3>' +
      this.byline(e) +
      '<p class="what">' + esc(e.summary) + "</p>" +
      '<p class="why"><b>Why it\'s here.</b> ' + esc(e.why) + "</p>" +
      (qs ? '<div class="asks"><span class="label">Good for questions like</span><ul>' + qs + "</ul></div>" : "") +
      (e.caveat ? '<p class="mind"><b>Keep in mind.</b> ' + esc(e.caveat) + "</p>" : "") +
      this.srcLine(e) + this.flag(e.id) + "</li>";
  };

  App.prototype.miniHTML = function (e, areaName) {
    return '<li class="card mini" id="t-' + esc(e.id) + '">' +
      this.shotHTML(e, false) +
      (areaName ? '<p class="area-tag">' + esc(areaName) + "</p>" : "") +
      '<h4><a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.name) + '&nbsp;<span class="arrow" aria-hidden="true">&#8599;</span></a></h4>' +
      this.byline(e) +
      '<p class="what">' + esc(e.summary) + "</p>" +
      '<p class="why"><b>Why it\'s here.</b> ' + esc(e.why) + "</p>" +
      (e.caveat ? '<p class="mind"><b>Keep in mind.</b> ' + esc(e.caveat) + "</p>" : "") +
      this.flag(e.id) + "</li>";
  };

  App.prototype.shell = function () {
    return '<link rel="stylesheet" href="' + BASE + 'style.css">' +
      '<div class="sl">' +
      '<div class="hero"><div class="wrap">' +
        '<p class="stamp">First cut &middot; every tool checked <span data-date></span></p>' +
        '<div class="grid"><div>' +
          '<h1>The Shortlist</h1>' +
          '<p class="finding">We reviewed <span data-count="reviewed"></span> tools built on New York City\'s public data. These <span data-count="picks"></span> are the ones to start with.</p>' +
          '<p class="lede">The city posts more than 2,400 datasets on its open data portal, and nonprofits, universities, newsrooms and independent developers have built dashboards, maps and trackers on top of them. Many are good. Few are seen outside the small world of people who build such things, and there are often five versions of the same idea.</p>' +
          '<p class="lede">This page picks the best two to four in each of <span data-count="areas"></span> areas of city life, then lists a few more worth knowing and the city\'s own best tools. Each entry says what is in the tool, why it made the list and what to watch out for.</p>' +
          '<p class="key"><span><i class="sw indie"></i>Built independently: nonprofits, universities, newsrooms, developers</span>' +
          '<span><i class="sw watch"></i>Watchdog offices, such as the comptroller</span>' +
          '<span><i class="sw city"></i>City and state agencies</span></p>' +
        '</div><div><div class="mosaic" id="mosaic"></div><p class="mosaic-note">A few of the picks. Select one to jump to it.</p></div></div>' +
      '</div></div>' +
      '<div class="bar" role="search"><div class="wrap">' +
        '<div class="row"><input id="q" type="search" autocomplete="off" spellcheck="false" aria-label="Search the list" placeholder="Search: landlord, bus speeds, Rikers, rats">' +
        '<button id="clear" class="clear" type="button" hidden>Clear</button></div>' +
        '<nav class="jump" id="jump" aria-label="Areas"></nav>' +
      '</div></div>' +
      '<div class="wrap"><section class="results" id="results" hidden aria-live="polite"></section></div>' +
      '<div id="browse">' +
        '<div class="wrap"><section class="questions"><h2>Start with a question</h2>' +
          '<p class="sub">Each question leads to the tool on the list that answers it best.</p><div class="qgrid" id="qgrid"></div></section></div>' +
        '<div class="wrap" id="areas"><p class="loading">Loading the list&hellip;</p></div>' +
        '<section class="method"><div class="wrap"><h2>How we chose</h2><div class="cols"><div>' +
          '<h3>What gets a tool on the list</h3><ul>' +
            "<li>It is built mostly on public data about New York City, usually from city agencies.</li>" +
            "<li>You can tell who made it, and it says where its numbers come from.</li>" +
            "<li>Its data is current, or it says plainly when the data stops.</li>" +
            "<li>It is free and needs no account.</li>" +
            "<li>Someone who is not a data person can get an answer out of it in a few minutes.</li>" +
            "<li>It does something the city's own version does not, or does it better.</li></ul>" +
          "<h3>Who made what</h3><p>The picks lean toward independent makers, because outsiders are the ones with a reason to look hard at the city's numbers. Watchdog offices, such as the city comptroller, the Independent Budget Office and the Board of Correction, are part of government but independent of the agencies they track, so their tools can be picks too. Tools built by the agencies themselves are listed under \"From the city itself.\"</p>" +
        "</div><div>" +
          '<h3>How we checked</h3><p>Every tool on this page was opened and tested on <span data-date></span>. For each one we read its about or methodology page, noted which datasets it uses and looked for evidence of when its data was last updated. A script rechecks every link each week and marks any that stop responding.</p>' +
          "<h3>What this is not</h3><p>A place on the list is a recommendation, not an audit. These tools are made by other people, and we do not vouch for every number in them. Where we know of a limit, it is under \"Keep in mind.\"</p>" +
          '<h3>Tell us what we missed</h3><p>If you know a tool that belongs here, or one that has broken or gone stale, <a href="https://github.com/joshgreenman1973/nyc-shortlist/issues/new" target="_blank" rel="noopener">tell us on GitHub</a>.</p>' +
        "</div></div></div></section>" +
      "</div>" +
      '<div class="foot"><div class="wrap">The Shortlist, a first cut. <span data-count="total"></span> tools listed, <span data-count="reviewed"></span> reviewed.</div></div>' +
      "</div>";
  };

  App.prototype.renderAreas = function () {
    var self = this, d = this.data;
    this.$("#areas").innerHTML = d.areas.map(function (a) {
      var picks = a.picks.map(function (e) { return self.pickHTML(e); }).join("");
      var bench = (a.bench || []).length
        ? '<div class="shelfhead"><h3>Also worth knowing</h3><p>Narrower, or a close second</p></div><ul class="minis">' + a.bench.map(function (e) { return self.miniHTML(e); }).join("") + "</ul>" : "";
      var off = (a.official || []).length
        ? '<div class="shelfhead"><h3>From the city itself</h3><p>Built by the agencies that own the data</p></div><ul class="minis">' + a.official.map(function (e) { return self.miniHTML(e); }).join("") + "</ul>" : "";
      return '<section class="area" id="area-' + esc(a.id) + '" aria-labelledby="h-' + esc(a.id) + '">' +
        '<div class="rail" aria-hidden="true"><span>' + esc(a.rail) + "</span></div>" +
        '<div class="abody"><h2 id="h-' + esc(a.id) + '">' + esc(a.name) + "</h2>" +
        '<p class="dek">' + esc(a.dek) + "</p>" +
        '<ol class="picks" data-n="' + a.picks.length + '">' + picks + "</ol>" + bench + off +
        "</div></section>";
    }).join("");
    this.$("#jump").innerHTML = d.areas.map(function (a) {
      return '<a href="#area-' + esc(a.id) + '" data-area="' + esc(a.id) + '">' + esc(a.rail) + "</a>";
    }).join("");
  };

  App.prototype.renderQuestions = function () {
    this.$("#qgrid").innerHTML = this.data.areas.map(function (a) {
      var items = [];
      a.picks.forEach(function (e) {
        (e.index || []).forEach(function (q) {
          items.push('<li><button type="button" data-go="' + esc(e.id) + '"><span class="q">' + esc(q) +
            '</span><span class="to">' + esc(e.name) + "</span></button></li>");
        });
      });
      return items.length ? '<div class="qgroup"><h3>' + esc(a.name) + "</h3><ul>" + items.join("") + "</ul></div>" : "";
    }).join("");
  };

  App.prototype.renderMosaic = function () {
    var byId = {};
    this.data.areas.forEach(function (a) { a.picks.forEach(function (e) { byId[e.id] = e; }); });
    var ids = (this.data.mosaic || []).filter(function (id) { return byId[id] && byId[id].shot !== false; });
    this.$("#mosaic").innerHTML = ids.slice(0, 12).map(function (id) {
      var e = byId[id];
      return '<button type="button" data-go="' + esc(id) + '" aria-label="' + esc(e.name) + '">' +
        '<img src="' + BASE + "shots/" + esc(id) + '.webp" alt="" decoding="async" width="800" height="500">' +
        '<span class="cap">' + esc(e.name) + "</span></button>";
    }).join("");
  };

  App.prototype.fillCounts = function () {
    var d = this.data, picks = 0, bench = 0, off = 0;
    d.areas.forEach(function (a) { picks += a.picks.length; bench += (a.bench || []).length; off += (a.official || []).length; });
    var v = { picks: picks, bench: bench, official: off, total: picks + bench + off, reviewed: d.reviewed, areas: d.areas.length };
    this.root.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = v[el.getAttribute("data-count")]; });
    this.root.querySelectorAll("[data-date]").forEach(function (el) { el.textContent = fmtDate(d.checked); });
  };

  // ---------- Search ----------
  App.prototype.buildIndex = function () {
    var all = [];
    this.data.areas.forEach(function (a) {
      [["pick", a.picks], ["bench", a.bench || []], ["official", a.official || []]].forEach(function (pair) {
        pair[1].forEach(function (e) {
          var text = [e.name, e.maker, e.summary, e.why, e.caveat, e.data, e.subtopic,
            (e.questions || []).join(" "), (e.index || []).join(" "), (e.tags || []).join(" "), a.name]
            .join(" ").toLowerCase();
          all.push({ e: e, area: a, tier: pair[0], text: text, name: e.name.toLowerCase() });
        });
      });
    });
    this.all = all;
  };

  function terms(q) {
    return q.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(function (w) {
      return w.length > 1 && STOP.indexOf(w) < 0;
    }).map(function (w) {
      var alts = [w];
      if (w.length > 4 && /s$/.test(w)) alts.push(w.slice(0, -1));
      if (SYNONYMS[w]) alts = alts.concat(SYNONYMS[w].split(" "));
      return alts;
    });
  }

  App.prototype.search = function (q) {
    var groups = terms(q);
    if (!groups.length) return [];
    var boost = { pick: 3, bench: 1, official: 1 };
    return this.all.map(function (r) {
      var score = 0, every = true;
      groups.forEach(function (alts) {
        var best = 0;
        alts.forEach(function (w, i) {
          var hit = r.text.indexOf(w) >= 0 ? (i === 0 ? 2 : 1) : 0;
          if (hit && r.name.indexOf(w) >= 0) hit += 3;
          if (hit > best) best = hit;
        });
        if (!best) every = false;
        score += best;
      });
      return { r: r, score: every ? score + boost[r.tier] : 0 };
    }).filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (x) { return x.r; });
  };

  App.prototype.renderResults = function (q) {
    var self = this, box = this.$("#results"), hits = this.search(q);
    if (!hits.length) {
      var sugg = ["landlord", "rats", "bus speeds", "Rikers", "city budget", "schools"];
      box.innerHTML = '<p class="count">Nothing on the list matches "' + esc(q) + '".</p><p class="none">Try a plainer word, or one of these: ' +
        sugg.map(function (s) { return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + "</button>"; }).join(", ") + ".</p>";
      return;
    }
    var picks = hits.filter(function (h) { return h.tier === "pick"; });
    var rest = hits.filter(function (h) { return h.tier !== "pick"; });
    box.innerHTML = '<p class="count">' + hits.length + (hits.length === 1 ? " tool matches" : " tools match") + ' "' + esc(q) + '"</p>' +
      (picks.length ? '<ol class="picks">' + picks.map(function (h) { return self.pickHTML(h.e, h.area.name); }).join("") + "</ol>" : "") +
      (rest.length ? '<div class="shelfhead"><h3>' + (picks.length ? "More matches" : "Matches") + '</h3></div><ul class="minis">' +
        rest.map(function (h) { return self.miniHTML(h.e, h.area.name); }).join("") + "</ul>" : "");
  };

  App.prototype.setQuery = function (q) {
    var input = this.$("#q");
    if (input.value !== q) input.value = q;
    var on = q.trim().length > 0;
    this.$("#results").hidden = !on;
    this.$("#browse").hidden = on;
    this.$("#clear").hidden = !on;
    if (on) this.renderResults(q.trim());
    if (this.standalone) history.replaceState(null, "", on ? "?q=" + encodeURIComponent(q.trim()) : location.pathname);
  };

  App.prototype.scrollToEl = function (el) {
    var bar = this.$(".bar");
    var pad = this.offset + (bar ? bar.offsetHeight : 0) + 16;
    var top = el.getBoundingClientRect().top + window.pageYOffset - pad;
    window.scrollTo({ top: top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  App.prototype.go = function (id) {
    if (this.$("#q").value) this.setQuery("");
    var el = this.root.getElementById ? this.root.getElementById("t-" + id) : this.$("#t-" + id);
    if (!el) return;
    this.scrollToEl(el);
    el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit");
    setTimeout(function () { el.classList.remove("hit"); }, 2600);
    if (this.standalone) history.replaceState(null, "", "#t-" + id);
  };

  App.prototype.watchAreas = function () {
    if (!("IntersectionObserver" in window)) return;
    var links = {};
    this.root.querySelectorAll(".jump a").forEach(function (a) { links[a.getAttribute("data-area")] = a; });
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id.replace("area-", "");
        if (current) current.classList.remove("on");
        current = links[id];
        if (current) {
          current.classList.add("on");
          var nav = current.parentNode;
          if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = current.offsetLeft - 16;
        }
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    this.root.querySelectorAll(".area").forEach(function (s) { io.observe(s); });
    var top = this.root.querySelector(".questions");
    if (top) new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && current) { current.classList.remove("on"); current = null; }
    }, { rootMargin: "-35% 0px -60% 0px" }).observe(top);
  };

  App.prototype.wire = function () {
    var self = this, input = this.$("#q"), t;
    input.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { self.setQuery(input.value); }, 120); });
    input.addEventListener("keydown", function (ev) { if (ev.key === "Escape") self.setQuery(""); });
    this.$("#clear").addEventListener("click", function () { self.setQuery(""); input.focus(); });
    this.root.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-q]");
      if (b) { ev.preventDefault(); self.setQuery(b.getAttribute("data-q")); return; }
      var g = ev.target.closest("[data-go]");
      if (g) { ev.preventDefault(); self.go(g.getAttribute("data-go")); return; }
      var j = ev.target.closest(".jump a");
      if (j) {
        ev.preventDefault();
        if (input.value) self.setQuery("");
        var sec = self.$("#area-" + j.getAttribute("data-area"));
        if (sec) self.scrollToEl(sec);
        if (self.standalone) history.replaceState(null, "", "#area-" + j.getAttribute("data-area"));
      }
    });
    // A screenshot that fails to load becomes a typographic placeholder.
    this.root.addEventListener("error", function (ev) {
      var img = ev.target;
      if (!img || img.tagName !== "IMG") return;
      var shot = img.closest(".shot");
      if (shot) {
        shot.innerHTML = '<span class="noshot"><span class="d">' + esc(host(shot.getAttribute("href"))) + '</span><span class="n">This site blocks previews</span></span>';
      } else {
        var btn = img.closest("button"); if (btn) btn.style.display = "none";
      }
    }, true);
    if (this.standalone) {
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "/" && self.root.activeElement !== input && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) { ev.preventDefault(); input.focus(); }
      });
    }
  };

  App.prototype.start = function () {
    var self = this;
    var mount = this.mount;
    mount.style.visibility = "hidden";
    this.root.innerHTML = this.shell();
    var show = function () { mount.style.visibility = ""; };
    var css = this.root.querySelector("link[rel=stylesheet]");
    if (css) { css.addEventListener("load", show); css.addEventListener("error", show); }
    setTimeout(show, 2500);
    mount.style.setProperty("--sticky", this.offset + "px");
    Promise.all([
      fetch(BASE + "data/shortlist.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(BASE + "data/linkcheck.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (res) {
      self.data = res[0];
      self.checks = (res[1] && res[1].results) || {};
      if (res[1] && res[1].checked) self.data.checked = res[1].checked;
      self.renderAreas();
      self.renderQuestions();
      self.renderMosaic();
      self.fillCounts();
      self.buildIndex();
      self.wire();
      self.watchAreas();
      if (self.standalone) {
        var q = new URLSearchParams(location.search).get("q");
        if (q) self.setQuery(q);
        else if (location.hash.indexOf("#t-") === 0) setTimeout(function () { self.go(location.hash.slice(3)); }, 60);
        else if (location.hash.indexOf("#area-") === 0) { var s = self.$(location.hash); if (s) setTimeout(function () { self.scrollToEl(s); }, 60); }
      }
    }).catch(function (err) {
      self.$("#areas").innerHTML = '<p class="loading">The list did not load. Reload the page to try again.</p>';
      if (window.console) console.error("Shortlist:", err);
    });
  };

  function boot() {
    loadFonts();
    var mounts = document.querySelectorAll("[data-shortlist]");
    if (!mounts.length) {
      var d = document.createElement("div");
      d.setAttribute("data-shortlist", "");
      script.parentNode.insertBefore(d, script);
      mounts = [d];
    }
    Array.prototype.forEach.call(mounts, function (m) {
      if (m.__shortlist) return;
      m.__shortlist = new App(m);
      m.__shortlist.start();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
