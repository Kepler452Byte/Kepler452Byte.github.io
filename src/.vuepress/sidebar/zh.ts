import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/zh/": [
    "",
    {
      text: "文章",
      icon: "book",
      prefix: "posts/",
      children: "structure",
    },
    "intro",
    {
      text: "幻灯片",
      icon: "person-chalkboard",
      link: "https://ecosystem.vuejs.press/zh/plugins/markdown/revealjs/demo.html",
    },
  ],
  "/zh/demo/": [
    {
      text: "如何使用",
      collapsible: true,
      icon: "laptop-code",
      children: "structure",
    },
  ],
  "/zh/code-practice/": [
    {
      text: "算法题练习记录",
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
      ],
    },
  ],
});
