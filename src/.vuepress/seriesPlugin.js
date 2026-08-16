// Series aggregation plugin — gives frontmatter `series` the same
// category/tag-like interaction without patching the theme. Three steps,
// all in onInitialized:
//
//   1. aggregate   walk articles -> per-locale series groups + loose items
//   2. series pages  /series/ + /series/<slug>/ (layout "Series", rendered
//                    client-side by SeriesMap/SeriesItems in client.ts)
//   3. sidebars      every page under a category dir gets the same
//                    series-grouped sidebar config
//
// Step 2/3 both rely on `stampSidebar`: the theme's extendsPage strips
// non-boolean `sidebar` frontmatter during createPage, but the client
// resolver fully supports array configs — so configs are stamped on AFTER
// creation. Keep this the single choke point for that workaround.
import { createPage } from "vuepress/core";

const LOCALES = ["/", "/en/"];

const slugify = (name) =>
  name.replace(/[ _]/g, "-").replace(/[:?*|\\/<>]/g, "").toLowerCase();

// same article filter the theme's blog plugin uses
const isArticle = (page) =>
  page.frontmatter.article ??
  (!page.frontmatter.home && !!page.filePathRelative);

const localeOf = (pagePath) => (pagePath.startsWith("/en/") ? "/en/" : "/");

const newestFirst = (a, b) =>
  new Date(b.info.date ?? 0) - new Date(a.info.date ?? 0);

const META_KEYS = [
  "date",
  "category",
  "tag",
  "cover",
  "sticky",
  "isOriginal",
  "isEncrypted",
  "readingTime",
];

const stampSidebar = (page, config) => {
  page.frontmatter.sidebar = config;
};

// ── 1. aggregate ─────────────────────────────────────────────────────

// locale -> { grouped: { [seriesName]: items }, loose: items }
// items = { path, info: routeMeta subset }, articles only.
const aggregate = (app) => {
  const grouped = { "/": {}, "/en/": {} };
  const loose = { "/": [], "/en/": [] };

  for (const page of app.pages) {
    if (!isArticle(page)) continue;

    const info = { title: page.title };
    for (const key of META_KEYS)
      if (page.routeMeta?.[key] !== undefined)
        info[key] = page.routeMeta[key];

    const locale = localeOf(page.path);
    const series = page.frontmatter.series;

    if (series) (grouped[locale][series] ??= []).push({ path: page.path, info });
    else loose[locale].push({ path: page.path, info });
  }

  return { grouped, loose };
};

// [name, items] pairs, items newest-first
const sortedEntries = (groupedLocale) =>
  Object.entries(groupedLocale)
    .map(([name, items]) => [name, items.sort(newestFirst)])
    .filter(([, items]) => items.length > 0);

const articleLinks = (items, prefix) =>
  items
    .filter((i) => !prefix || i.path.startsWith(prefix))
    .map((i) => ({ text: i.info.title, link: i.path }));

// ── 2. series pages ──────────────────────────────────────────────────

// One page per series + the locale map page. All share a locale-wide
// sidebar: one collapsible group per series, the current one expanded.
const createSeriesPages = async (app, locale, entries, seriesMap) => {
  const sidebarOf = (currentName) =>
    entries.map(([name, items]) => ({
      text: name,
      icon: "layer-group",
      collapsible: true,
      expanded: name === currentName,
      children: articleLinks(items),
    }));

  seriesMap[locale] = {};

  const pages = await Promise.all(
    entries.map(async ([name, items]) => {
      const path = `${locale}series/${slugify(name)}/`;
      seriesMap[locale][name] = { path, items };

      const page = await createPage(app, {
        path,
        frontmatter: {
          title: name,
          icon: "layer-group",
          article: false,
          index: false,
          layout: "Series",
        },
        content: `<SeriesItems name="${name}" locale="${locale}" />`,
      });
      stampSidebar(page, sidebarOf(name));
      return page;
    }),
  );

  const mapPage = await createPage(app, {
    path: `${locale}series/`,
    frontmatter: {
      title: locale === "/en/" ? "Series" : "专题",
      icon: "layer-group",
      article: false,
      index: false,
      layout: "Series",
    },
    content: `<SeriesMap locale="${locale}" />`,
  });
  stampSidebar(mapPage, sidebarOf(null));
  pages.push(mapPage);

  return pages;
};

// ── 3. category sidebars ─────────────────────────────────────────────

// Every page under a category dir (landing + articles) gets the same
// sidebar so its shape never changes while navigating:
//   series groups -> toggle-only (a linked title would navigate instead
//                    of toggling, per theme SidebarGroup markup)
//   loose group   -> trailing 其他文章, articles without a series
// Category prefixes are discovered from the landing READMEs
// (zh/<category>/README.md).
const stampCategorySidebars = (app, locale, entries, looseItems) => {
  const landingRoot = locale === "/en/" ? "en/" : "zh/";

  const prefixes = app.pages
    .filter(({ filePathRelative: rel }) => {
      rel ??= "";
      return (
        rel.startsWith(landingRoot) && /^[^/]+\/[^/]+\/README\.md$/.test(rel)
      );
    })
    .map(({ path }) => path); // e.g. /zh/backend/

  for (const prefix of prefixes) {
    const groups = entries
      .filter(([, items]) => items.some((i) => i.path.startsWith(prefix)))
      .map(([name, items]) => ({
        text: name,
        icon: "layer-group",
        collapsible: true,
        children: articleLinks(items, prefix),
      }));

    const looseChildren = articleLinks(
      looseItems
        .filter((i) => i.path.startsWith(prefix))
        .sort(newestFirst),
    );

    if (looseChildren.length)
      groups.push({
        text: locale === "/en/" ? "Others" : "其他文章",
        icon: "file-lines",
        collapsible: true,
        children: looseChildren,
      });

    if (!groups.length) continue;

    for (const page of app.pages)
      if (page.path.startsWith(prefix)) stampSidebar(page, groups);
  }
};

// ── plugin ───────────────────────────────────────────────────────────

export const seriesPlugin = {
  name: "series-plugin",

  // Route the theme's BloggerInfo/InfoList to customized copies, which add
  // a series stat (and info tab) fed by the temp file below. Alias keys
  // are matched longest-first by the bundler, so these exact paths win
  // over the theme's broad "@theme-hope" alias (set when `custom: true`).
  alias: (app) => ({
    "@theme-hope/components/blog/BloggerInfo": app.dir.source(
      ".vuepress/components/theme/BloggerInfo.js",
    ),
    "@theme-hope/components/blog/InfoList": app.dir.source(
      ".vuepress/components/theme/InfoList.js",
    ),
  }),

  async onInitialized(app) {
    const { grouped, loose } = aggregate(app);

    const seriesMap = {};
    const newPages = [];

    for (const locale of LOCALES) {
      const entries = sortedEntries(grouped[locale]);
      if (!entries.length) continue;

      newPages.push(
        ...(await createSeriesPages(app, locale, entries, seriesMap)),
      );
      stampCategorySidebars(app, locale, entries, loose[locale]);
    }

    app.pages.push(...newPages);

    await app.writeTemp(
      "series/map.js",
      `export const seriesMap = JSON.parse(${JSON.stringify(
        JSON.stringify(seriesMap),
      )});`,
    );

    const count = Object.values(seriesMap).reduce(
      (n, localeMap) => n + Object.keys(localeMap).length,
      0,
    );
    console.log(`series plugin: aggregated ${count} series`);
  },
};
