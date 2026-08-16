import { sidebar } from "vuepress-theme-hope";

// Prefixes mirror the physical tree: level-1 dir = category slug,
// level-2 dir = series slug. children are auto-generated ("structure").
export const zhSidebar = sidebar({
  "/zh/backend/": [
    {
      text: "后端开发",
      icon: "server",
      collapsible: true,
      children: "structure",
    },
  ],
  "/zh/devops/": [
    {
      text: "DevOps",
      icon: "server",
      collapsible: true,
      children: "structure",
    },
  ],
  "/zh/frontend/": [
    {
      text: "前端开发",
      icon: "laptop-code",
      collapsible: true,
      children: "structure",
    },
  ],
  "/zh/agent-engineering/": [
    {
      text: "AI/LLM/Agent",
      icon: "robot",
      collapsible: true,
      children: "structure",
    },
  ],
  "/zh/coding-practice/": [
    {
      text: "算法与练习",
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
        {
          text: "笔试题",
          icon: "list-check",
          collapsible: true,
          prefix: "company-coding-test/",
          children: "structure",
        },
      ],
    },
  ],
  "/zh/interview/": [
    {
      text: "求职面试",
      icon: "briefcase",
      collapsible: true,
      children: [
        {
          text: "校招",
          icon: "list-check",
          collapsible: true,
          prefix: "campus/",
          children: "structure",
        },
      ],
    },
  ],
  "/zh/journal/": [
    {
      text: "我的日志",
      icon: "list-check",
      collapsible: true,
      children: "structure",
    },
  ],
});
