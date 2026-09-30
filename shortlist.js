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
    journalist: ["indie", "Journalist"],
    commercial: ["indie", "Company"],
    watchdog: ["watch", "Government watchdog"],
    official: ["city", "Government agency"],
    state: ["city", "State government"],
    federal: ["city", "Federal institution"]
  };

  // Plain-language questions are matched against each tool's own questions,
  // descriptions and data sources. CONCEPTS maps everyday words (after
  // stemming) to the words the entries use, so "cops" finds police tools and
  // "is the water safe to swim" finds the water-quality tools.
  var CONCEPTS = {
    cop: "police officer precinct", cops: "police officer", nypd: "police", policing: "police",
    officer: "police misconduct", misconduct: "complaint discipline officer",
    crime: "crime compstat murder robbery assault", crimes: "crime", safe: "crime safety violent", safety: "crime safety",
    dangerous: "crime violent crash", violent: "crime violence murder shooting assault slashing stabbing", murder: "murder homicide crime",
    shooting: "shooting gun violence", shot: "shooting gun", gun: "shooting gun", guns: "shooting gun",
    stabbing: "assault", stab: "assault", mug: "robbery", mugging: "robbery", stolen: "larceny theft", steal: "larceny theft",
    jail: "jail rikers correction custody", jails: "jail rikers", prison: "prison jail parole", rikers: "rikers jail",
    bail: "bail pretrial release", court: "court case trial", courts: "court", judge: "court judge", prosecutor: "prosecution district attorney",
    landlord: "landlord owner building portfolio", owner: "owner landlord", own: "owner landlord", owns: "owner landlord",
    apartment: "apartment building housing rent tenant", apartments: "apartment housing", tenant: "tenant eviction landlord",
    rent: "rent stabilized tenant housing", rents: "rent", stabilized: "rent stabilized", evict: "eviction", evicted: "eviction",
    eviction: "eviction housing court", evictions: "eviction", housing: "housing affordable apartment",
    affordable: "affordable housing", build: "construction housing built development", built: "construction housing",
    building: "building", buildings: "building", violation: "violation housing code", violations: "violation",
    homeless: "homelessness shelter", homelessness: "homelessness shelter", shelter: "shelter homelessness",
    migrant: "migrant asylum shelter", migrants: "migrant asylum shelter", nycha: "nycha public housing", project: "nycha",
    scaffold: "sidewalk shed", scaffolding: "sidewalk shed", shed: "sidewalk shed", zoning: "zoning rezoning land use",
    rezoning: "rezoning zoning", subway: "subway train transit mta", train: "subway train", trains: "subway train",
    late: "delay slow", delay: "delay slow", delayed: "delay", bus: "bus transit mta performance ridership lane", buses: "bus", slow: "slow speed",
    elevator: "elevator accessible accessibility", wheelchair: "elevator accessible", mta: "mta subway bus",
    car: "vehicle plate driver ticket", cars: "vehicle", driver: "driver driving vehicle", drivers: "driver",
    speeding: "speed camera ticket", ticket: "ticket violation camera parking", tickets: "ticket", parking: "parking ticket",
    plate: "plate vehicle", crash: "crash traffic injury", crashes: "crash", accident: "crash injury", accidents: "crash",
    pedestrian: "pedestrian crash injury", bike: "bike cycling lane citi", bikes: "bike", biking: "bike cycling", cyclist: "bike cycling",
    congestion: "congestion pricing toll traffic", toll: "congestion toll", traffic: "traffic congestion crash",
    rat: "rat rodent", rats: "rat rodent", mice: "rat rodent", noise: "noise 311 complaint", noisy: "noise", loud: "noise",
    trash: "trash garbage sanitation compost recycling", garbage: "garbage trash sanitation", compost: "compost organics",
    recycling: "recycling", dirty: "sanitation street cleanliness", fix: "response resolution satisfaction", fixing: "response resolution satisfaction", sweeper: "sweeper street cleaning", sweep: "sweeper street cleaning", plaza: "public space plaza", sit: "public space plaza park", clean: "sanitation cleanliness", snow: "snow plow",
    complain: "311 complaint", complaint: "311 complaint", complaints: "311 complaint", "311": "311 complaint",
    park: "park parks playground", parks: "park", playground: "park playground", tree: "tree trees", trees: "tree",
    flood: "flood flooding stormwater", flooding: "flood", floods: "flood", storm: "flood rain", rain: "flood rain",
    heat: "heat hot temperature", hot: "heat hot", air: "air quality pollution", pollution: "pollution air",
    water: "water harbor river bacteria swim", swim: "swim water beach", swimming: "swim water", kayak: "water swim",
    beach: "beach water swim", climate: "climate emissions heat flood", emissions: "emissions carbon",
    school: "school schools education", schools: "school", kid: "child children school", kids: "child children school",
    child: "child children", children: "child children", daycare: "child care", teacher: "school teacher",
    admission: "admissions school", admissions: "admissions", test: "test scores school", absent: "absence absenteeism",
    budget: "budget spending money", money: "budget spending money", spend: "spending budget", spending: "spending budget",
    spends: "spending", tax: "tax property", taxes: "tax property", contract: "contract vendor", contracts: "contract vendor",
    vendor: "vendor contract", salary: "payroll pay salary", salaries: "payroll pay", paid: "pay payroll", pay: "pay payroll",
    pension: "pension retirement", pensions: "pension", overtime: "overtime payroll", workers: "workforce staffing employees",
    staff: "staffing vacancies", hiring: "staffing hiring vacancies", union: "union contract labor",
    mayor: "mayor mamdani administration", mamdani: "mamdani mayor", promise: "promise pledge", promises: "promise pledge",
    council: "council legislation bill", bill: "bill legislation council", bills: "bill legislation", law: "law legislation local",
    laws: "law legislation", hearing: "hearing council testimony", hearings: "hearing",
    represents: "represent elected official", representative: "represent elected", elected: "elected official",
    vote: "vote election voting ballot", voting: "vote election", election: "election vote results", elections: "election",
    donor: "campaign contribution finance", donors: "campaign contribution", lobbying: "lobbyist lobbying", lobbyist: "lobbyist",
    board: "community board", audit: "audit comptroller", audits: "audit", performance: "performance indicator management",
    foil: "records request foil", records: "records request",
    neighborhood: "neighborhood community district", neighborhoods: "neighborhood", block: "neighborhood block building",
    live: "neighborhood population residents", lives: "population residents", population: "population census demographics",
    census: "census population", income: "income poverty", poor: "poverty poor", poverty: "poverty",
    job: "jobs employment economy", jobs: "jobs employment economy", economy: "economy jobs", unemployment: "unemployment jobs",
    cost: "cost living wage affordability", expensive: "cost living affordability", afford: "cost living affordability",
    store: "store retail chain", stores: "store retail", history: "historical photo archive", photo: "photo photographs",
    health: "health hospital asthma", hospital: "hospital health safety", hospitals: "hospital health", overdose: "overdose drug", "911": "911 emergency response",
    immigrant: "immigration immigrants newcomers", immigrants: "immigration newcomers", immigration: "immigration court deportation",
    ice: "immigration enforcement arrests detention", deportation: "immigration removal enforcement", deported: "deportation immigration",
    asylum: "asylum immigration shelter migrant", language: "language english spoken", languages: "language spoken",
    covid: "covid respiratory illness", flu: "flu respiratory illness", rsv: "respiratory illness", sick: "illness health",
    maternal: "maternal childbirth infant", pregnancy: "maternal childbirth", birth: "maternal infant childbirth", baby: "infant maternal",
    mental: "mental health crisis", crisis: "mental health crisis 911", outage: "outage heat hot water elevator nycha", outages: "outage nycha",
    ridership: "ridership subway station", turnout: "turnout election voted", vacant: "vacant land owned city", land: "land owned property city",
    ambulance: "911 ems emergency response", emergency: "911 emergency response", fire: "fire fdny 911"
  };
  var STOP = ("a an the and or but is are was were be been being am do does did has have had i me my mine we our you your it its " +
    "this that these those there here what which who whom whose where when why how can could would should will shall may might " +
    "much many any some more most about into onto from for with without to of in on at by as than then so if not no yes " +
    "new york nyc city s get got find tell show see know want need look looking like just really " +
    "go goes going getting gets people person folks someone anyone there their them they being will would still ever forever why").split(" ");
  // Place words say where, not what, so they count for less.
  var LOW = ["block", "street", "neighborhood", "near", "area", "around", "local", "here", "live", "place", "me", "nearby", "town"];

  function stem(w) {
    if (w.length > 5 && /ies$/.test(w)) return w.slice(0, -3) + "y";
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function tokens(text) {
    return String(text || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter(function (w) { return w && STOP.indexOf(w) < 0 && (w.length > 1 || /\d/.test(w)); });
  }

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
  var NOMINATE = "mailto:info@vitalcitynyc.org?subject=" + encodeURIComponent("Civic tech tool shortlist") +
    "&body=" + encodeURIComponent("Tool name:\nLink:\nWho made it:\nWhat data it uses:\nWhy it belongs on the list:\n");
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function fmtMonth(iso) {
    var m = /^(\d{4})-(\d{2})/.exec(iso || "");
    return m ? MONTHS[parseInt(m[2], 10) - 1] + " " + m[1] : "";
  }
  var SIGNALS = { method: "Method published", open: "Open code or data", cited: "Cited as a source" };
  var OWN = {
    vc: "Disclosure: a Vital City tool. Vital City's editor assembled this list.",
    jg: "Disclosure: built by Josh Greenman, who assembled this list.",
    tr: "Disclosure: built by Tal Roded, a Vital City contributor.",
    ta: "Disclosure: Ted Alcorn worked at Vital City until September 2026.",
    trt: "Disclosure: Tal Roded, a Vital City contributor, is on the team."
  };
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

  // The quality checks a tool passed (see "How we chose"), shown on every card.
  App.prototype.checksHTML = function (e) {
    var q = e.quality;
    if (!q) return "";
    var items = [];
    if (q.cadence === "historical") items.push("Historical collection");
    else if (q.cadence === "live") items.push("Live data");
    else if (q.updated) items.push("Updated " + fmtMonth(q.updated));
    (q.signals || []).forEach(function (k) { if (SIGNALS[k]) items.push(SIGNALS[k]); });
    return '<p class="checks"><span class="vh">Quality checks passed: </span>' +
      items.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</p>";
  };

  App.prototype.ownHTML = function (e) {
    return e.own && OWN[e.own] ? '<p class="own">' + esc(OWN[e.own]) + "</p>" : "";
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
      this.byline(e) + this.checksHTML(e) +
      '<p class="what">' + esc(e.summary) + "</p>" +
      '<p class="why"><b>Why it\'s here.</b> ' + esc(e.why) + "</p>" + this.ownHTML(e) +
      (qs ? '<div class="asks"><span class="label">Good for questions like</span><ul>' + qs + "</ul></div>" : "") +
      (e.caveat ? '<p class="mind"><b>Keep in mind.</b> ' + esc(e.caveat) + "</p>" : "") +
      this.srcLine(e) + this.flag(e.id) + "</li>";
  };

  App.prototype.miniHTML = function (e, areaName) {
    return '<li class="card mini" id="t-' + esc(e.id) + '">' +
      this.shotHTML(e, false) +
      (areaName ? '<p class="area-tag">' + esc(areaName) + "</p>" : "") +
      '<h4><a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.name) + '&nbsp;<span class="arrow" aria-hidden="true">&#8599;</span></a></h4>' +
      this.byline(e) + this.checksHTML(e) +
      '<p class="what">' + esc(e.summary) + "</p>" +
      '<p class="why"><b>Why it\'s here.</b> ' + esc(e.why) + "</p>" + this.ownHTML(e) +
      (e.caveat ? '<p class="mind"><b>Keep in mind.</b> ' + esc(e.caveat) + "</p>" : "") +
      this.flag(e.id) + "</li>";
  };

  App.prototype.shell = function () {
    return '<link rel="stylesheet" href="' + BASE + 'style.css">' +
      '<div class="sl">' +
      '<div class="hero"><div class="wrap">' +
        '<p class="stamp">Updated <span data-date></span> &middot; every tool checked against the same two tests</p>' +
        '<div class="grid"><div>' +
          '<h1>The Shortlist</h1>' +
          '<p class="finding">We reviewed <span data-count="reviewed"></span> tools and dashboards about New York City. These <span data-count="picks"></span> are the ones to start with.</p>' +
          '<p class="lede">The city posts more than 2,400 datasets on its open data portal, and nonprofits, universities, newsrooms and independent developers have built dashboards, maps and trackers on top of them. Many are good. Few are seen outside the small world of people who build such things, and there are often five versions of the same idea.</p>' +
          '<p class="lede">This page picks the best two to four in each of <span data-count="areas"></span> areas of city life, then lists a few more worth knowing and the best tools the government itself publishes. Each entry says what is in the tool, why it made the list and what to watch out for. Start with the ten below, ask a question, or browse by area or by agency.</p>' +
          '<p class="key"><span><i class="sw indie"></i>Built independently: nonprofits, universities, newsrooms, developers</span>' +
          '<span><i class="sw watch"></i>Government watchdog offices, such as the comptroller</span>' +
          '<span><i class="sw city"></i>Government agencies</span></p>' +
          '<p class="nominate">Know a tool that belongs here? <a href="' + NOMINATE + '">Nominate it</a>.</p>' +
        '</div><div><div class="mosaic" id="mosaic"></div><p class="mosaic-note">A few of the picks. Select one to jump to it.</p></div></div>' +
      '</div></div>' +
      '<div class="bar" role="search"><div class="wrap">' +
        '<div class="row"><input id="q" type="search" autocomplete="off" spellcheck="false" aria-label="Ask a question or search the list" placeholder="Ask a question, like: Who owns my building?">' +
        '<button id="clear" class="clear" type="button" hidden>Clear</button></div>' +
        '<nav class="jump" id="jump" aria-label="Areas"></nav>' +
      '</div></div>' +
      '<div class="wrap"><section class="results" id="results" hidden aria-live="polite"></section></div>' +
      '<div id="browse">' +
        '<div class="wrap"><section class="start" id="start"><h2>Start here</h2>' +
          '<p class="sub">Ten tools that between them cover most of what people ask about the city. Each is the best on the list at its job.</p><ol class="startlist" id="startlist"></ol></section></div>' +
        '<div class="wrap"><section class="agencies" id="agencies"><h2>Browse by agency</h2>' +
          '<p class="sub">Every tool is tagged with the parts of government it tells you about. Pick one to see its tools.</p><div class="chips" id="chips"></div></section></div>' +
        '<div class="wrap"><section class="questions"><h2>Start with a question</h2>' +
          '<p class="sub">Each question leads to the tool on the list that answers it best.</p><div class="qgrid" id="qgrid"></div></section></div>' +
        '<div class="wrap" id="areas"><p class="loading">Loading the list&hellip;</p></div>' +
        '<div class="wrap"><section class="gaps" id="gaps"><h2>Where no good tool exists</h2>' +
          '<p class="sub">Questions about the city that nothing we found answers well. If you know a tool that does, or you build one, <a href="' + NOMINATE + '">tell us</a>.</p><ul class="gaplist" id="gaplist"></ul></section></div>' +
        '<div class="wrap"><section class="held" id="held"><h2>Held back</h2>' +
          '<p class="sub">Tools that would make the list with one fix. We say what it is, so their makers can make it and readers can decide for themselves.</p><ul class="heldlist" id="heldlist"></ul></section></div>' +
        '<section class="method"><div class="wrap"><h2>How we chose</h2><div class="cols"><div>' +
          '<h3>Two tests, for every tool</h3>' +
          "<p><b>It has to be current.</b> Its data updates automatically, or its latest edition came out in the past year and uses the newest release of its source data. A tool one release behind still counts if the newest release came out less than three months ago. Collections that are historical by nature, such as archival photographs, are marked that way.</p>" +
          "<p><b>It has to show objective signs of quality.</b> It names its maker and the datasets its numbers come from, and it shows at least two of the following: a published method, open code or downloadable data, updates in the past 90 days, and either the standards of a university, newsroom or watchdog office or citation by news organizations. Each card lists the checks the tool passed.</p>" +
          "<p>It also has to be free, work without an account and give someone who is not a data person an answer in a few minutes.</p>" +
          "<p><b>Fourteen exceptions.</b> Fourteen tools failed one of the two tests, most often by not naming who made them or by running a release behind their source, and are on the list anyway by the editor's judgment. Each one says so under \"Keep in mind,\" beginning \"Included by the editor's judgment.\"</p>" +
          "<h3>Who made what</h3><p>The picks and the tools under \"Also worth knowing\" come from outside government: nonprofits, universities, newsrooms, civic technologists and independent developers, the people with a reason to look hard at the government's numbers. Tools the government builds are listed separately under \"From the government.\" That includes watchdog offices such as the city and state comptrollers, the Independent Budget Office and the Board of Correction, which are independent of the agencies they track but are still part of government; their tools are marked in blue.</p>" +
          "<p>Some tools come from Vital City, from its editor, Josh Greenman, who assembled this list, and from Tal Roded, a Vital City contributor. They had to pass the same tests as everything else, and each one carries a disclosure.</p>" +
        "</div><div>" +
          '<h3>How we checked</h3><p>Every tool on this page was opened and tested on Sept. 28, 2026, and the list was last revised on <span data-date></span>. For each one we read its about or methodology page, noted which datasets it uses, looked for the date of its newest data and for public code or data, and searched for news coverage. We applied the same tests to tools made by Vital City and the people involved in this list; many of them failed, most often for not naming who made them. A script rechecks every link each week and marks any that stop responding.</p>' +
          "<h3>How the question box works</h3><p>It compares the words in your question with each tool's description, the questions it answers and the data it uses, and ranks the closest matches. It knows everyday words (\"cops\" finds police tools, \"scaffolding\" finds sidewalk sheds). It does not use AI, read the tools' data or answer questions itself, and it can miss a tool described in different words. Nothing you type is sent anywhere.</p>" +
          "<h3>What this is not</h3><p>A place on the list is a recommendation, not an audit. We do not vouch for every number in these tools. Where we know of a limit, it is under \"Keep in mind.\"</p>" +
          '<h3>Nominate a tool</h3><p>If you know a tool that belongs here, or one that has broken or gone stale, email <a href="' + NOMINATE + '">info@vitalcitynyc.org</a> with "Civic tech tool shortlist" in the subject line. Tell us what it is, who made it and what data it uses.</p>' +
          '<h3>What has changed</h3><ul class="changes" id="changes"></ul>' +
          '<h3>Reuse the list</h3><p>The list is a public data file, <a href="' + BASE + 'data/shortlist.json">shortlist.json</a>, and the page can be embedded on any site with two lines of code (see the <a href="https://github.com/joshgreenman1973/nyc-shortlist" target="_blank" rel="noopener">code repository</a>).</p>' +
        "</div></div></div></section>" +
      "</div>" +
      '<div class="foot"><div class="wrap">The Shortlist. <span data-count="total"></span> tools listed, <span data-count="reviewed"></span> reviewed. <a href="' + NOMINATE + '">Nominate a tool</a>.</div></div>' +
      "</div>";
  };

  App.prototype.renderAreas = function () {
    var self = this, d = this.data;
    this.$("#areas").innerHTML = d.areas.map(function (a) {
      var picks = a.picks.map(function (e) { return self.pickHTML(e); }).join("");
      var bench = self.shelfHTML(a.bench, "Also worth knowing", "Narrower, or a close second", a.id + "-bench");
      var off = self.shelfHTML(a.official, "From the government", "Built by public agencies and government watchdog offices", a.id + "-gov");
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

  // A shelf shows its heading and a count; the cards open on request, so an
  // area reads as its picks first.
  App.prototype.shelfHTML = function (list, title, sub, key) {
    if (!list || !list.length) return "";
    var names = list.slice(0, 3).map(function (e) { return e.name; }).join(", ") + (list.length > 3 ? " and " + (list.length - 3) + " more" : "");
    return '<div class="shelf" id="shelf-' + esc(key) + '"><div class="shelfhead"><h3>' + esc(title) + ' <span class="n">(' + list.length + ")</span></h3><p>" + esc(sub) + "</p>" +
      '<button type="button" class="open" data-shelf="' + esc(key) + '" aria-expanded="false">Show</button></div>' +
      '<p class="shelfnames">' + esc(names) + "</p>" +
      '<ul class="minis" hidden>' + list.map(function (e) { return this.miniHTML(e); }, this).join("") + "</ul></div>";
  };

  App.prototype.toggleShelf = function (key, open) {
    var sh = this.$("#shelf-" + key);
    if (!sh) return;
    var ul = sh.querySelector(".minis"), btn = sh.querySelector(".open"), names = sh.querySelector(".shelfnames");
    var on = open == null ? ul.hidden : open;
    ul.hidden = !on; names.hidden = on;
    btn.textContent = on ? "Hide" : "Show";
    btn.setAttribute("aria-expanded", on ? "true" : "false");
  };

  App.prototype.renderStart = function () {
    var byId = this.byId();
    this.$("#startlist").innerHTML = (this.data.start || []).map(function (it) {
      var e = byId[it.id];
      if (!e) return "";
      var t = typeOf(e.maker_type);
      var img = e.shot === false ? '<span class="noshot"><span class="d">' + esc(host(e.url)) + "</span></span>"
        : '<img src="' + BASE + "shots/" + esc(e.id) + '.webp" alt="" loading="lazy" decoding="async" width="800" height="500">';
      return '<li><a class="shot" href="' + esc(e.url) + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">' + img + "</a>" +
        '<div><h3><a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.name) + '&nbsp;<span class="arrow" aria-hidden="true">&#8599;</span></a></h3>' +
        '<p class="by"><span class="sw ' + t[0] + '" aria-hidden="true"></span><span>' + esc(e.maker) + "</span></p>" +
        "<p>" + esc(it.line) + ' <button type="button" class="more" data-go="' + esc(e.id) + '">More</button></p></div></li>';
    }).join("");
  };

  App.prototype.renderAgencies = function () {
    var counts = {};
    this.data.areas.forEach(function (a) {
      ["picks", "bench", "official"].forEach(function (t) {
        (a[t] || []).forEach(function (e) { (e.agencies || []).forEach(function (g) { counts[g] = (counts[g] || 0) + 1; }); });
      });
    });
    var names = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x] || x.localeCompare(y); });
    this.$("#chips").innerHTML = names.map(function (g) {
      return '<button type="button" class="chip" data-agency="' + esc(g) + '">' + esc(g) + ' <span>' + counts[g] + "</span></button>";
    }).join("");
  };

  App.prototype.renderGapsHeld = function () {
    var d = this.data;
    this.$("#gaplist").innerHTML = (d.gaps || []).map(function (g) {
      return "<li><b>" + esc(g.q) + "</b> " + esc(g.note) + "</li>";
    }).join("");
    var held = d.held || [];
    this.$("#heldlist").innerHTML = held.map(function (h) {
      return '<li><a href="' + esc(h.url) + '" target="_blank" rel="noopener">' + esc(h.name) + "</a> <span class=\"m\">" + esc(h.maker) + "</span><span class=\"fix\">" + esc(h.fix) + "</span></li>";
    }).join("");
    if (!held.length) this.$("#held").hidden = true;
    this.$("#changes").innerHTML = (d.changelog || []).map(function (c) {
      return "<li><b>" + esc(fmtDate(c.date)) + ".</b> " + esc(c.note) + "</li>";
    }).join("");
  };

  App.prototype.byId = function () {
    var m = {};
    this.data.areas.forEach(function (a) { ["picks", "bench", "official"].forEach(function (t) { (a[t] || []).forEach(function (e) { m[e.id] = e; }); }); });
    return m;
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
  // BM25 over each tool's fields, weighted toward the questions it answers.
  var FIELDS = [["questions", 3], ["index", 3], ["name", 2.5], ["agencies", 2], ["subtopic", 2], ["area", 1.5],
    ["summary", 1.2], ["why", 0.8], ["data", 0.8], ["maker", 0.6], ["caveat", 0.3]];

  App.prototype.buildIndex = function () {
    var docs = [], df = {}, total = 0;
    this.data.areas.forEach(function (a) {
      [["pick", a.picks], ["bench", a.bench || []], ["official", a.official || []]].forEach(function (pair) {
        pair[1].forEach(function (e) {
          var tf = {}, len = 0;
          FIELDS.forEach(function (f) {
            var v = f[0] === "area" ? a.name : e[f[0]];
            if (Array.isArray(v)) v = v.join(" ");
            tokens(v).forEach(function (w) { w = stem(w); tf[w] = (tf[w] || 0) + f[1]; len += f[1]; });
          });
          Object.keys(tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
          total += len;
          docs.push({ e: e, area: a, tier: pair[0], tf: tf, len: len });
        });
      });
    });
    this.docs = docs; this.df = df; this.avglen = total / Math.max(docs.length, 1);
  };

  // Each query word becomes a group: the word itself plus its concept
  // expansions, stemmed. Expansions count for less, unless the word itself
  // appears nowhere on the list ("scaffolding"), in which case they stand in.
  App.prototype.queryGroups = function (q) {
    var df = this.df, seen = {};
    return tokens(q).filter(function (w) { if (seen[w]) return false; seen[w] = 1; return true; }).map(function (w) {
      var s0 = stem(w), g = {}, low = LOW.indexOf(w) >= 0 ? 0.35 : 1;
      var exp = CONCEPTS[w] || CONCEPTS[s0];
      var known = !!df[s0];
      if (known) g[s0] = low;
      if (exp) exp.split(" ").forEach(function (x) {
        var sx = stem(x);
        if (!(sx in g)) g[sx] = (known ? 0.55 : 0.9) * low;
      });
      return { word: w, terms: g, weight: low };
    }).filter(function (g) { return Object.keys(g.terms).length; });
  };

  App.prototype.search = function (q) {
    var groups = this.queryGroups(q);
    if (!groups.length) return [];
    var N = this.docs.length, df = this.df, avg = this.avglen, k1 = 1.2, bb = 0.6;
    var tierBoost = { pick: 1.2, bench: 1, official: 0.95 };
    var totalWeight = groups.reduce(function (t, g) { return t + g.weight; }, 0);
    var flat = {};
    groups.forEach(function (g) { Object.keys(g.terms).forEach(function (w) { flat[w] = Math.max(flat[w] || 0, g.terms[w]); }); });
    var scored = this.docs.map(function (d) {
      var score = 0, covered = 0;
      groups.forEach(function (g) {
        var best = 0;
        Object.keys(g.terms).forEach(function (w) {
          var f = d.tf[w];
          if (!f) return;
          var idf = Math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5));
          var v = g.terms[w] * idf * (f * (k1 + 1)) / (f + k1 * (1 - bb + bb * d.len / avg));
          if (v > best) best = v;
        });
        if (best > 0) { score += best; covered += g.weight; }
      });
      var coord = covered / totalWeight;
      return { d: d, score: score * (0.25 + 0.75 * coord * coord) * tierBoost[d.tier] };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; });
    if (!scored.length) return [];
    var top = scored[0].score;
    return scored.filter(function (x) { return x.score >= top * 0.25; }).slice(0, 15).map(function (x) {
      x.d.best = bestQuestion(x.d.e, flat);
      return x.d;
    });
  };

  // The tool's own question that best matches what was asked, if any.
  function bestQuestion(e, qt) {
    var best = null, bestScore = 0;
    (e.questions || []).concat(e.index || []).forEach(function (text) {
      var sc = 0;
      tokens(text).forEach(function (w) { sc += qt[stem(w)] || 0; });
      if (sc > bestScore) { bestScore = sc; best = text; }
    });
    return bestScore >= 1 ? best : null;
  }

  App.prototype.showAgency = function (g) {
    var self = this, box = this.$("#results"), hits = [];
    this.docs.forEach(function (d) { if ((d.e.agencies || []).indexOf(g) >= 0) hits.push(d); });
    var tier = { pick: 0, bench: 1, official: 2 };
    hits.sort(function (a, b) { return tier[a.tier] - tier[b.tier]; });
    var picks = hits.filter(function (h) { return h.tier === "pick"; }), rest = hits.filter(function (h) { return h.tier !== "pick"; });
    this.$("#q").value = "";
    box.hidden = false; this.$("#browse").hidden = true; this.$("#clear").hidden = false;
    box.innerHTML = '<p class="count">' + esc(g) + "</p>" +
      '<p class="limits">' + hits.length + (hits.length === 1 ? " tool on the list is" : " tools on the list are") + " about this part of government. Picks first, then the rest.</p>" +
      (picks.length ? '<ol class="picks results-lead">' + picks.map(function (h) { return self.pickHTML(h.e, h.area.name); }).join("") + "</ol>" : "") +
      (rest.length ? '<div class="shelfhead"><h3>' + (picks.length ? "Also" : "Tools") + '</h3></div><ul class="minis">' + rest.map(function (h) { return self.miniHTML(h.e, h.area.name); }).join("") + "</ul>" : "");
    window.scrollTo({ top: 0 });
    if (this.standalone) history.replaceState(null, "", "?agency=" + encodeURIComponent(g));
  };

  App.prototype.renderResults = function (q) {
    var self = this, box = this.$("#results"), hits = this.search(q);
    if (!hits.length) {
      var sugg = ["Who owns my building?", "How slow is my bus?", "Is my street flooding?", "How violent is Rikers?"];
      box.innerHTML = '<p class="count">Nothing on the list seems to answer “' + esc(q) + '.”</p><p class="none">Try other words, or one of these: ' +
        sugg.map(function (s) { return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + "</button>"; }).join(" ") +
        '</p><p class="none">If you know a tool that answers it, <a href="' + NOMINATE + '">nominate it</a>.</p>';
      return;
    }
    var lead = hits.slice(0, 3), rest = hits.slice(3);
    function match(h) {
      return h.best ? '<p class="answers">Answers questions like "' + esc(h.best) + '"</p>' : "";
    }
    box.innerHTML = '<p class="count">' + (hits.length === 1 ? "One tool" : "These tools") + ' may answer “' + esc(q) + '”</p>' +
      '<p class="limits">How this works: the box matches the words in your question to the descriptions of the tools on this list. It does not read the tools\' data or answer the question itself, and it can miss a tool that uses different words. Open a tool to get the answer.</p>' +
      '<ol class="picks results-lead">' + lead.map(function (h) {
        return (h.tier === "pick" ? self.pickHTML(h.e, h.area.name) : self.miniHTML(h.e, h.area.name)).replace("</h3>", "</h3>" + match(h)).replace("</h4>", "</h4>" + match(h));
      }).join("") + "</ol>" +
      (rest.length ? '<div class="shelfhead"><h3>Also related</h3></div><ul class="minis">' +
        rest.map(function (h) { return self.miniHTML(h.e, h.area.name).replace("</h4>", "</h4>" + match(h)); }).join("") + "</ul>" : "");
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
    var shelf = el.closest(".shelf");
    if (shelf) this.toggleShelf(shelf.id.replace("shelf-", ""), true);
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
      var ch = ev.target.closest("[data-agency]");
      if (ch) { ev.preventDefault(); self.showAgency(ch.getAttribute("data-agency")); return; }
      var sb = ev.target.closest("[data-shelf]");
      if (sb) { ev.preventDefault(); self.toggleShelf(sb.getAttribute("data-shelf")); return; }
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
      // One retry before giving up, so a dropped request does not hide a preview.
      if (!img.getAttribute("data-retried")) {
        img.setAttribute("data-retried", "1");
        setTimeout(function () { img.src = img.src.split("?")[0] + "?retry=1"; }, 1200);
        return;
      }
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
      self.renderStart();
      self.renderAgencies();
      self.renderQuestions();
      self.renderGapsHeld();
      self.renderMosaic();
      self.fillCounts();
      self.buildIndex();
      self.wire();
      self.watchAreas();
      if (self.standalone) {
        var q = new URLSearchParams(location.search).get("q"), ag = new URLSearchParams(location.search).get("agency");
        if (q) self.setQuery(q);
        else if (ag) self.showAgency(ag);
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
