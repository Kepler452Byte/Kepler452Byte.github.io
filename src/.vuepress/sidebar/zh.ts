import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/zh/code-practice/": [
    {
      text: "算法题",
      collapsible: true,
      icon: "code", // 更换icon为code
      children: [
        {
          text: "LeetCode",
          icon: "list-check", // 更换icon为list-check
          collapsible: true,
          prefix: "leetcode/",
          children: "structure",
        },
        {
          text: "笔试题",
          icon: "list-check", // 更换icon为list-check
          collapsible: true,
          prefix: "company-codeing-test/",
          children: "structure",
        },
      ],
    },
  ],
  "/zh/seeking-job/": [
    {
      text: "求职记录",
      icon: "list-check",
      collapsible: true,
      children: [
        {
          text: "校招",
          icon: "list-check",
          collapsible: true,
          prefix: "campus/",
          children: "structure",
        },
      ]
    },
  ],
});
