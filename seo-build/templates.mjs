// seo-build/templates.mjs
export const LOCALES = { uk: "uk-UA", en: "en-US", tr: "tr-TR" };

export const I18N = {
  uk: {
    siteName: "Сьогодні в Україні",
    dateTitle: (y, m, d) => `Свята та події: ${d}.${m}.${y}`,
    monthTitle: (y, m) => `Календар: ${m}.${y}`,
    events: "Події та свята",
    month: "Календар місяця",
    prevDay: "← Попередній день",
    nextDay: "Наступний день →",
    backToMonth: "← До місяця",
    goToToday: "Сьогодні",
    noEvents: "Немає подій у базі для цієї дати.",
    updated: "Оновлено",
    disclaimer:
      "Примітка: статус «вихідного дня» може змінюватися залежно від чинних правил.",
    scopesLabel: "Регіон",
    typesLabel: "Тип",
    tagsLabel: "Теги"
  },
  en: {
    siteName: "Today in Ukraine",
    dateTitle: (y, m, d) => `Holidays & events: ${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    monthTitle: (y, m) => `Calendar: ${y}-${String(m).padStart(2, "0")}`,
    events: "Events & holidays",
    month: "Month calendar",
    prevDay: "← Previous day",
    nextDay: "Next day →",
    backToMonth: "← Back to month",
    goToToday: "Today",
    noEvents: "No events in the database for this date.",
    updated: "Updated",
    disclaimer:
      "Note: “day off” status can change depending on current rules.",
    scopesLabel: "Region",
    typesLabel: "Type",
    tagsLabel: "Tags"
  },
  tr: {
    siteName: "Ukrayna’da Bugün",
    dateTitle: (y, m, d) => `Günler ve olaylar: ${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`,
    monthTitle: (y, m) => `Takvim: ${String(m).padStart(2, "0")}.${y}`,
    events: "Etkinlikler ve günler",
    month: "Aylık takvim",
    prevDay: "← Önceki gün",
    nextDay: "Sonraki gün →",
    backToMonth: "← Aya dön",
    goToToday: "Bugün",
    noEvents: "Bu tarih için veri tabanında etkinlik yok.",
    updated: "Güncellendi",
    disclaimer:
      "Not: “resmî tatil” durumu güncel kurallara göre değişebilir.",
    scopesLabel: "Bölge",
    typesLabel: "Tür",
    tagsLabel: "Etiketler"
  }
};

export const FLAGS = {
  ua: "🇺🇦",
  tr: "🇹🇷",
  us: "🇺🇸",
  eu: "🇪🇺",
  jp: "🇯🇵",
  kr: "🇰🇷",
  eg: "🇪🇬",
  global: "🌍"
};

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtDateLabel(lang, y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(LOCALES[lang], {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
}

function titleForLang(e, lang) {
  return e.title?.[lang] || e.title?.uk || e.title?.en || e.title?.tr || "—";
}
function descForLang(e, lang) {
  return e.desc?.[lang] || e.desc?.uk || e.desc?.en || e.desc?.tr || "";
}

export function renderDatePage({
  lang,
  siteUrl,
  year,
  month,
  day,
  events,
  prevHref,
  nextHref,
  monthHref,
  todayHref,
  lastUpdatedISO
}) {
  const t = I18N[lang];
  const niceDate = fmtDateLabel(lang, year, month, day);
  const pageTitle = `${t.siteName} — ${t.dateTitle(year, month, day)}`;
  const description = `${t.siteName}: ${niceDate}. ${events.length} ${t.events.toLowerCase()}.`;

  const eventHtml = events.length
    ? events
        .map((e) => {
          const flag = FLAGS[e.scope] || "🌍";
          const title = esc(titleForLang(e, lang));
          const desc = esc(descForLang(e, lang));
          const scope = esc(e.scope || "");
          const type = esc(e.type || "other");
          const tags = Array.isArray(e.tags) ? e.tags.map(esc).join(", ") : "";
          const src = Array.isArray(e.sources) && e.sources.length ? e.sources[0] : null;

          return `
            <article class="event">
              <div class="eventTop">
                <div class="eventTitle">${flag} ${title}</div>
                <div class="tag">${esc(type)} • ${esc(scope)}</div>
              </div>
              ${desc ? `<div class="eventMeta">${desc}</div>` : ""}
              <div class="eventMeta tiny">
                <strong>${esc(t.tagsLabel)}:</strong> ${tags || "—"}
                ${src ? ` • <a href="${esc(src)}" rel="nofollow noopener" target="_blank">source</a>` : ""}
              </div>
            </article>
          `;
        })
        .join("\n")
    : `<p class="muted">${esc(t.noEvents)}</p>`;

  // Simple hreflang links for SEO
  const hrefUk = `${siteUrl}/uk/${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/`;
  const hrefEn = `${siteUrl}/en/${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/`;
  const hrefTr = `${siteUrl}/tr/${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/`;

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(siteUrl)}/${esc(lang)}/${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/" />

  <link rel="alternate" hreflang="uk" href="${esc(hrefUk)}" />
  <link rel="alternate" hreflang="en" href="${esc(hrefEn)}" />
  <link rel="alternate" hreflang="tr" href="${esc(hrefTr)}" />
  <link rel="alternate" hreflang="x-default" href="${esc(hrefUk)}" />

  <link rel="stylesheet" href="/assets/style.css" />
</head>
<body>
  <header class="container header">
    <div class="brand">${esc(t.siteName)}</div>
    <div class="controls">
      <div class="lang">
        <a class="chip ${lang === "uk" ? "active" : ""}" href="${esc(hrefUk)}">UA</a>
        <a class="chip ${lang === "en" ? "active" : ""}" href="${esc(hrefEn)}">EN</a>
        <a class="chip ${lang === "tr" ? "active" : ""}" href="${esc(hrefTr)}">TR</a>
      </div>
      <nav class="nav">
        <a class="btn ghost" href="${esc(prevHref)}">${esc(t.prevDay)}</a>
        <a class="btn" href="${esc(todayHref)}">${esc(t.goToToday)}</a>
        <a class="btn ghost" href="${esc(nextHref)}">${esc(t.nextDay)}</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <h1>${esc(niceDate)}</h1>
    <p class="muted tiny">${esc(t.updated)}: ${esc(lastUpdatedISO)}</p>

    <section class="panel">
      <div class="panelHead">
        <h2>${esc(t.events)}</h2>
        <span class="badge">${events.length}</span>
      </div>
      ${eventHtml}
      <p class="muted tiny">${esc(t.disclaimer)}</p>
    </section>

    <section class="panel">
      <div class="panelHead">
        <h2>${esc(t.month)}</h2>
        <a class="btn ghost" href="${esc(monthHref)}">${esc(t.backToMonth)}</a>
      </div>
      <p class="muted">
        <a href="${esc(monthHref)}">${esc(t.monthTitle(year, month))}</a>
      </p>
    </section>
  </main>

  <footer class="container footer">
    <span class="muted">© ${esc(t.siteName)}</span>
  </footer>
</body>
</html>`;
}

export function renderMonthPage({
  lang,
  siteUrl,
  year,
  month,
  daysInMonth,
  dayHasEvents,
  monthLabel,
  prevMonthHref,
  nextMonthHref,
  todayHref,
  lastUpdatedISO
}) {
  const t = I18N[lang];
  const pageTitle = `${t.siteName} — ${t.monthTitle(year, month)}`;
  const description = `${t.siteName}: ${monthLabel}.`;

  const hrefUk = `${siteUrl}/uk/${year}/${String(month).padStart(2, "0")}/`;
  const hrefEn = `${siteUrl}/en/${year}/${String(month).padStart(2, "0")}/`;
  const hrefTr = `${siteUrl}/tr/${year}/${String(month).padStart(2, "0")}/`;

  const dayCards = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .map((d) => {
      const href = `/${lang}/${year}/${String(month).padStart(2, "0")}/${String(d).padStart(2, "0")}/`;
      const dot = dayHasEvents(d) ? "•" : "";
      return `<a class="day" href="${href}"><strong>${d}</strong><div class="hint">${dot}</div></a>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(siteUrl)}/${esc(lang)}/${year}/${String(month).padStart(2, "0")}/" />

  <link rel="alternate" hreflang="uk" href="${esc(hrefUk)}" />
  <link rel="alternate" hreflang="en" href="${esc(hrefEn)}" />
  <link rel="alternate" hreflang="tr" href="${esc(hrefTr)}" />
  <link rel="alternate" hreflang="x-default" href="${esc(hrefUk)}" />

  <link rel="stylesheet" href="/assets/style.css" />
</head>
<body>
  <header class="container header">
    <div class="brand">${esc(t.siteName)}</div>
    <div class="controls">
      <div class="lang">
        <a class="chip ${lang === "uk" ? "active" : ""}" href="${esc(hrefUk)}">UA</a>
        <a class="chip ${lang === "en" ? "active" : ""}" href="${esc(hrefEn)}">EN</a>
        <a class="chip ${lang === "tr" ? "active" : ""}" href="${esc(hrefTr)}">TR</a>
      </div>
      <nav class="nav">
        <a class="btn ghost" href="${esc(prevMonthHref)}">←</a>
        <a class="btn" href="${esc(todayHref)}">${esc(t.goToToday)}</a>
        <a class="btn ghost" href="${esc(nextMonthHref)}">→</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <h1>${esc(monthLabel)}</h1>
    <p class="muted tiny">${esc(t.updated)}: ${esc(lastUpdatedISO)}</p>

    <section class="panel">
      <div class="panelHead">
        <h2>${esc(t.month)}</h2>
      </div>
      <div class="grid">
        ${dayCards}
      </div>
    </section>
  </main>

  <footer class="container footer">
    <span class="muted">© ${esc(t.siteName)}</span>
  </footer>
</body>
</html>`;
}

export function renderTodayRedirectPage({ siteUrl }) {
  // Client-side redirect to /<lang>/<YYYY>/<MM>/<DD>/
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Today</title>
</head>
<body>
  <script>
    (function(){
      const lang = (localStorage.getItem("lang") || (navigator.language || "uk").slice(0,2)).toLowerCase();
      const allowed = ["uk","en","tr"];
      const use = allowed.includes(lang) ? lang : "uk";
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth()+1).padStart(2,"0");
      const d = String(now.getDate()).padStart(2,"0");
      location.replace("${siteUrl}/" + use + "/" + y + "/" + m + "/" + d + "/");
    })();
  </script>
  <noscript>
    <p>Open: <a href="${siteUrl}/uk/">${siteUrl}/uk/</a></p>
  </noscript>
</body>
</html>`;
}