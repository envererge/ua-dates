// =====================
// CONFIG
// =====================
const DATA_FILE = "data/world_10000_event_pack_OPTION_A_framework_2026.json";

// =====================
// STATE
// =====================
let EVENTS_BY_DAY = new Map(); // "M-D" -> events[]
let CURRENT_DATE = new Date();

let LANG = localStorage.getItem("lang") || "uk";
let SEARCH = "";
let SCOPE_FILTER = "all";
let TYPE_FILTER = "all";

// =====================
// CONSTANTS
// =====================
const LOCALES = { uk: "uk-UA", en: "en-US", tr: "tr-TR" };
const FLAGS = { ua:"🇺🇦", tr:"🇹🇷", us:"🇺🇸", eu:"🇪🇺", jp:"🇯🇵", kr:"🇰🇷", eg:"🇪🇬", global:"🌍" };

const I18N = {
  uk: {
    today: "Сьогодні",
    events: "Події та свята",
    month: "Календар місяця",
    note: "Примітка: статус «вихідного дня» може змінюватися залежно від чинних правил.",
    none: "На цю дату в базі поки немає подій."
  },
  en: {
    today: "Today",
    events: "Events & holidays",
    month: "Month calendar",
    note: "Note: “day off” status can change depending on current rules.",
    none: "No events in the database for this date."
  },
  tr: {
    today: "Bugün",
    events: "Etkinlikler ve günler",
    month: "Aylık takvim",
    note: "Not: “resmî tatil” durumu güncel kurallara göre değişebilir.",
    none: "Bu tarih için veri tabanında etkinlik yok."
  }
};

// =====================
// HELPERS
// =====================
function keyOf(month, day) {
  return `${month}-${day}`;
}

function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTitle(e) {
  return e.title?.[LANG] || e.title?.uk || e.title?.en || e.title?.tr || "—";
}

function getDesc(e) {
  // your 10k pack uses "desc"
  return e.desc?.[LANG] || e.desc?.uk || e.desc?.en || e.desc?.tr || "";
}

function weightScope(scope) {
  // Ukraine first, then Turkey, then rest
  if (scope === "ua") return 0;
  if (scope === "tr") return 1;
  return 2;
}

function applyFilters(list) {
  return list
    .filter(e => e.verified === true) 
    .filter(e => (SCOPE_FILTER === "all" ? true : e.scope === SCOPE_FILTER))
    .filter(e => (TYPE_FILTER === "all" ? true : (e.type || "other") === TYPE_FILTER))
    .filter(e => {
      if (!SEARCH) return true;
      const q = SEARCH.toLowerCase();
      const text = [
        getTitle(e),
        getDesc(e),
        e.scope,
        e.type,
        ...(e.tags || [])
      ].join(" ").toLowerCase();
      return text.includes(q);
    })
    .sort((a, b) => {
      const wa = weightScope(a.scope);
      const wb = weightScope(b.scope);
      if (wa !== wb) return wa - wb;
      return String(a.type || "").localeCompare(String(b.type || ""));
    });
}

// =====================
// BUILD INDEX (ONCE)
// =====================
function buildIndex(data) {
  EVENTS_BY_DAY.clear();

  for (const e of data) {
    if (!e.month || !e.day) continue;
    const key = keyOf(e.month, e.day);
    if (!EVENTS_BY_DAY.has(key)) EVENTS_BY_DAY.set(key, []);
    EVENTS_BY_DAY.get(key).push(e);
  }

  console.log("✅ Events loaded:", data.length);
  console.log("✅ Indexed days:", EVENTS_BY_DAY.size);
}

// =====================
// UI UPDATES
// =====================
function setLangUI() {
  document.querySelectorAll(".chip").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === LANG);
  });

  const t = I18N[LANG];
  const todayBtn = document.getElementById("todayBtn");
  const eventsTitle = document.getElementById("eventsTitle");
  const monthTitle = document.getElementById("monthTitle");
  const note = document.getElementById("note");

  if (todayBtn) todayBtn.textContent = t.today;
  if (eventsTitle) eventsTitle.textContent = t.events;
  if (monthTitle) monthTitle.textContent = t.month;
  if (note) note.textContent = t.note;
}

function renderHeaderDate() {
  const titleEl = document.getElementById("dateTitle");
  const weekdayEl = document.getElementById("weekdayTitle");

  if (titleEl) {
    titleEl.textContent = CURRENT_DATE.toLocaleDateString(LOCALES[LANG], {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
  if (weekdayEl) {
    weekdayEl.textContent = CURRENT_DATE.toLocaleDateString(LOCALES[LANG], {
      weekday: "long"
    });
  }
}

// =====================
// RENDER EVENTS
// =====================
function renderEvents() {
  renderHeaderDate();

  const month = CURRENT_DATE.getMonth() + 1;
  const day = CURRENT_DATE.getDate();

  const eventsEl = document.getElementById("events");
  const badgeEl = document.getElementById("countBadge");
  if (!eventsEl) return;

  const todaysRaw = EVENTS_BY_DAY.get(keyOf(month, day)) || [];
  const todays = applyFilters(todaysRaw);

  if (badgeEl) badgeEl.textContent = todays.length ? String(todays.length) : "";

  eventsEl.innerHTML = "";

  if (!todays.length) {
    eventsEl.innerHTML = `<p class="muted">${escapeHtml(I18N[LANG].none)}</p>`;
    return;
  }

  for (const e of todays) {

  if (e.verified === false) continue;
    const flag = FLAGS[e.scope] || "🌍";
    const title = escapeHtml(getTitle(e));
    const desc = escapeHtml(getDesc(e));
    const type = escapeHtml(e.type || "other");
    const scope = escapeHtml(e.scope || "global");
    const tags = Array.isArray(e.tags) ? escapeHtml(e.tags.join(", ")) : "";
    const year = e.year ? ` <span class="muted">(${escapeHtml(String(e.year))})</span>` : "";

    const card = document.createElement("article");
    card.className = "event";
    card.innerHTML = `
      <div class="eventTop">
        <div class="eventTitle">${flag} ${title}${year}</div>
        <div class="tag">${type} • ${scope}</div>
      </div>
      ${desc ? `<div class="eventMeta">${desc}</div>` : ""}
      ${tags ? `<div class="eventMeta tiny">${tags}</div>` : ""}
    `;
    eventsEl.appendChild(card);
  }
}

function render() {
  setLangUI();
  renderEvents();
}

// =====================
// NAVIGATION
// =====================
function changeDay(delta) {
  CURRENT_DATE.setDate(CURRENT_DATE.getDate() + delta);
  render();
}

// =====================
// INIT
// =====================
async function init() {
  // 1) load data
  const res = await fetch(DATA_FILE);
  const data = await res.json();
  buildIndex(data);

  // 2) wire navigation
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const todayBtn = document.getElementById("todayBtn");

  if (prevBtn) prevBtn.onclick = () => changeDay(-1);
  if (nextBtn) nextBtn.onclick = () => changeDay(1);
  if (todayBtn) todayBtn.onclick = () => { CURRENT_DATE = new Date(); render(); };

  // 3) wire language chips
  document.querySelectorAll(".chip").forEach(btn => {
    btn.onclick = () => {
      LANG = btn.dataset.lang;
      localStorage.setItem("lang", LANG);
      render();
    };
  });

  // 4) wire filters
  const searchBox = document.getElementById("searchBox");
  const scopeFilter = document.getElementById("scopeFilter");
  const typeFilter = document.getElementById("typeFilter");

  if (searchBox) {
    searchBox.addEventListener("input", (ev) => {
      SEARCH = ev.target.value.trim();
      renderEvents(); // only rerender list (fast)
    });
  }

  if (scopeFilter) {
    scopeFilter.addEventListener("change", (ev) => {
      SCOPE_FILTER = ev.target.value;
      renderEvents();
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", (ev) => {
      TYPE_FILTER = ev.target.value;
      renderEvents();
    });
  }

  // 5) first render
  render();
}

init();