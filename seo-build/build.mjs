// seo-build/build.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDatePage, renderMonthPage, renderTodayRedirectPage, LOCALES } from "./templates.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======= CONFIG =======
const TARGET_YEAR = 2026;

// IMPORTANT: set your real domain before deploying
// e.g. "https://example.com" (no trailing slash)
const SITE_URL = "https://example.com";

// Choose your dataset file name here:
const DATA_FILE = path.resolve(__dirname, "..", "data", "world_10000_event_pack_OPTION_A_framework_2026.json");

// Assets to copy into dist/assets
const STYLE_SOURCE = path.resolve(__dirname, "..", "style.css");

const DIST_DIR = path.resolve(__dirname, "..", "dist");
const ASSETS_DIR = path.join(DIST_DIR, "assets");

const LANGS = ["uk", "en", "tr"];
// =======================

function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymdKey(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function monthKey(y, m) {
  return `${y}-${pad2(m)}`;
}

function daysInMonth(year, month1to12) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

function fmtMonthLabel(lang, year, month) {
  const dt = new Date(Date.UTC(year, month - 1, 1));
  return dt.toLocaleDateString(LOCALES[lang], { year: "numeric", month: "long" });
}

function normalizeEvents(raw) {
  // Keep events that match the target year OR have no year (recurring)
  // and have month/day.
  return raw
    .filter((e) => e && e.month && e.day)
    .filter((e) => !e.year || e.year === TARGET_YEAR)
    .map((e) => ({
      id: e.id || null,
      year: e.year || null,
      month: Number(e.month),
      day: Number(e.day),
      scope: e.scope || "global",
      type: e.type || "other",
      title: e.title || {},
      desc: e.desc || {},
      tags: Array.isArray(e.tags) ? e.tags : [],
      sources: Array.isArray(e.sources) ? e.sources : []
    }));
}

function sortEventsForDay(events) {
  // Put UA first, TR second, then others
  const weight = (scope) => {
    if (scope === "ua") return 0;
    if (scope === "tr") return 1;
    return 2;
  };
  return events.slice().sort((a, b) => {
    const wa = weight(a.scope);
    const wb = weight(b.scope);
    if (wa !== wb) return wa - wb;
    return (a.type || "").localeCompare(b.type || "");
  });
}

async function ensureCleanDist() {
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  await fs.copyFile(STYLE_SOURCE, path.join(ASSETS_DIR, "style.css"));
}

async function writeFileEnsured(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function urlForDate(lang, y, m, d) {
  return `/${lang}/${y}/${pad2(m)}/${pad2(d)}/`;
}
function urlForMonth(lang, y, m) {
  return `/${lang}/${y}/${pad2(m)}/`;
}

async function build() {
  const lastUpdatedISO = new Date().toISOString().slice(0, 10);

  const rawJson = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  const all = normalizeEvents(rawJson);

  // Index by month/day for this TARGET_YEAR
  const byMD = new Map(); // key: "M-D" => events[]
  for (const e of all) {
    const key = `${e.month}-${e.day}`;
    if (!byMD.has(key)) byMD.set(key, []);
    byMD.get(key).push(e);
  }

  // Generate
  await ensureCleanDist();

  const sitemapUrls = [];

  // Today redirect page (one, language autodetect)
  await writeFileEnsured(path.join(DIST_DIR, "today", "index.html"), renderTodayRedirectPage({ siteUrl: SITE_URL }));
  sitemapUrls.push(`${SITE_URL}/today/`);

  // Build all date pages and month pages for each language
  for (const lang of LANGS) {
    for (let month = 1; month <= 12; month++) {
      const dim = daysInMonth(TARGET_YEAR, month);
      const monthLabel = fmtMonthLabel(lang, TARGET_YEAR, month);

      // Month page
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? TARGET_YEAR - 1 : TARGET_YEAR;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? TARGET_YEAR + 1 : TARGET_YEAR;

      const monthHtml = renderMonthPage({
        lang,
        siteUrl: SITE_URL,
        year: TARGET_YEAR,
        month,
        daysInMonth: dim,
        monthLabel,
        dayHasEvents: (d) => (byMD.get(`${month}-${d}`) || []).length > 0,
        prevMonthHref: urlForMonth(lang, prevYear, prevMonth),
        nextMonthHref: urlForMonth(lang, nextYear, nextMonth),
        todayHref: `${SITE_URL}/today/`,
        lastUpdatedISO
      });

      const monthOut = path.join(DIST_DIR, lang, String(TARGET_YEAR), pad2(month), "index.html");
      await writeFileEnsured(monthOut, monthHtml);
      sitemapUrls.push(`${SITE_URL}${urlForMonth(lang, TARGET_YEAR, month)}`);

      // Date pages in this month
      for (let day = 1; day <= dim; day++) {
        const key = `${month}-${day}`;
        const dayEvents = sortEventsForDay(byMD.get(key) || []);

        // prev/next day links
        const dt = new Date(Date.UTC(TARGET_YEAR, month - 1, day));
        const prev = new Date(dt);
        prev.setUTCDate(prev.getUTCDate() - 1);
        const next = new Date(dt);
        next.setUTCDate(next.getUTCDate() + 1);

        const prevHref = urlForDate(lang, prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate());
        const nextHref = urlForDate(lang, next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
        const monthHref = urlForMonth(lang, TARGET_YEAR, month);

        const dateHtml = renderDatePage({
          lang,
          siteUrl: SITE_URL,
          year: TARGET_YEAR,
          month,
          day,
          events: dayEvents,
          prevHref,
          nextHref,
          monthHref,
          todayHref: `${SITE_URL}/today/`,
          lastUpdatedISO
        });

        const out = path.join(DIST_DIR, lang, String(TARGET_YEAR), pad2(month), pad2(day), "index.html");
        await writeFileEnsured(out, dateHtml);
        sitemapUrls.push(`${SITE_URL}${urlForDate(lang, TARGET_YEAR, month, day)}`);
      }
    }

    // Helpful root for each language: /uk/ -> redirects to /today/
    const langRoot = `<!doctype html><html><head><meta charset="utf-8"/><meta name="robots" content="noindex"/><meta http-equiv="refresh" content="0;url=${SITE_URL}/today/"/></head><body></body></html>`;
    await writeFileEnsured(path.join(DIST_DIR, lang, "index.html"), langRoot);
    sitemapUrls.push(`${SITE_URL}/${lang}/`);
  }

  // robots.txt
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  await writeFileEnsured(path.join(DIST_DIR, "robots.txt"), robots);

  // sitemap.xml
  // keep it simple; for huge sites you’d split sitemaps, but this is fine here
  const sitemapXml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemapUrls
      .map((u) => `  <url><loc>${u}</loc></url>`)
      .join("\n") +
    `\n</urlset>\n`;

  await writeFileEnsured(path.join(DIST_DIR, "sitemap.xml"), sitemapXml);

  console.log(`✅ Build complete: ${DIST_DIR}`);
  console.log(`👉 Next: deploy the dist/ folder. Remember to set SITE_URL in build.mjs`);
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});