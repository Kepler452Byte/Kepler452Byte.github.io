import { sidebar } from "vuepress-theme-hope";

export const enSidebar = sidebar({
  "/en/": [
    "",
    "/en/intro",
  ],
  // "/en/demo/": [
  //   {
  //     text: "Demo",
  //     icon: "laptop-code",
  //     children: "structure",
  //   },
  // ],
  "/en/code-practice/": [
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
