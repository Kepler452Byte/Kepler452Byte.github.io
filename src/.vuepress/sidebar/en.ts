import { sidebar } from "vuepress-theme-hope";

// Sidebars are generated at build time by seriesPlugin:
//   category pages/articles -> series groups + trailing Others group
//   /series/ pages          -> all series of the locale
// This file only holds the fallback for pages outside any category dir.
export const enSidebar = sidebar({
  "/en/": [{ text: "About", icon: "user", link: "/en/intro.html" }],
});
