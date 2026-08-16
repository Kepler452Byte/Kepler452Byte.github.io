import { sidebar } from "vuepress-theme-hope";

export const enSidebar = sidebar({
  // fallback for pages outside any category dir (e.g. /en/intro.html)
  "/en/": [{ text: "About", icon: "user", link: "/en/intro.html" }],
  // "/en/demo/": [
  //   {
  //     text: "Demo",
  //     icon: "laptop-code",
  //     children: "structure",
  //   },
  // ],
  "/en/coding-practice/": [
    {
      text: "Algorithm",
      icon: "code",
      collapsible: true,
      children: [
        {
          text: "LeetCode",
          icon: "list-check",
          collapsible: true,
          prefix: "leetcode/",
          children: "structure",
        },
      ],
    },
  ],
});
