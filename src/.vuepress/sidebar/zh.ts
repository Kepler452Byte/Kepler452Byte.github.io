import { sidebar } from "vuepress-theme-hope";

// Sidebars are generated at build time by seriesPlugin:
//   category pages/articles -> series groups + trailing 其他文章 group
//   /series/ pages          -> all series of the locale
// This file only holds the fallback for pages outside any category dir.
export const zhSidebar = sidebar({
  "/zh/": [{ text: "关于", icon: "user", link: "/zh/intro.html" }],
});
