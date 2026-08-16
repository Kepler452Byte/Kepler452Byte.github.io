// Series aggregation plugin — gives frontmatter `series` the same
// category/tag-like interaction without patching the theme:
//   /series/          overview page (all series of the locale)
//   /series/<slug>/   one page per series, article list rendered client-side
//
// Node side only aggregates and emits data/pages; rendering happens in
// .vuepress/components/SeriesMap.js and SeriesItems.js (registered in client.ts).
import { createPage } from "vuepress/core";

const slugify = (name) =>
  name.replace(/[ _]/g, "-").replace(/[:?*|\\/<>]/g, "").toLowerCase();

// same article filter the theme's blog plugin uses
const isArticle = (page) =>
  page.frontmatter.article ??
  (!page.frontmatter.home && !!page.filePathRelative);

const localeOf = (pagePath) => (pagePath.startsWith("/en/") ? "/en/" : "/");

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

export const seriesPlugin = {
  name: "series-plugin",

  // Route the theme's BloggerInfo to our customized copy, which adds a
  // series stat to the info-panel counts row. Alias keys are matched
  // longest-first by the bundler, so this exact path wins over the
  // theme's broad "@theme-hope" alias (set when `custom: true`).
  alias: (app) => ({
    "@theme-hope/components/blog/BloggerInfo": app.dir.source(
      ".vuepress/components/theme/BloggerInfo.js",
    ),
    "@theme-hope/components/blog/InfoList": app.dir.source(
      ".vuepress/components/theme/InfoList.js",
    ),
  }),

  async onInitialized(app) {
    // locale -> series name -> items
    const grouped = { "/": {}, "/en/": {} };

    for (const page of app.pages) {
      const series = page.frontmatter.series;
      if (!series || !isArticle(page)) continue;

      const info = { title: page.title };
      for (const key of META_KEYS)
        if (page.routeMeta?.[key] !== undefined)
          info[key] = page.routeMeta[key];

      const locale = localeOf(page.path);
      (grouped[locale][series] ??= []).push({ path: page.path, info });
    }

    const seriesMap = {};
    const newPages = [];

    for (const locale of ["/", "/en/"]) {
      const entries = Object.entries(grouped[locale])
        .map(([name, items]) => [
          name,
          items.sort(
            (a, b) =>
              new Date(b.info.date ?? 0) - new Date(a.info.date ?? 0),
          ),
        ])
        .filter(([, items]) => items.length > 0);

      if (!entries.length) continue;

      seriesMap[locale] = {};

      for (const [name, items] of entries) {
        const itemPath = `${locale}series/${slugify(name)}/`;
        seriesMap[locale][name] = { path: itemPath, items };

        newPages.push(
          await createPage(app, {
            path: itemPath,
            frontmatter: {
              title: name,
              icon: "layer-group",
              article: false,
              index: false,
            },
            content: `<SeriesItems name="${name}" locale="${locale}" />`,
          }),
        );
      }

      newPages.push(
        await createPage(app, {
          path: `${locale}series/`,
          frontmatter: {
            title: locale === "/en/" ? "Series" : "专题",
            icon: "layer-group",
            article: false,
            index: false,
          },
          content: `<SeriesMap locale="${locale}" />`,
        }),
      );
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
