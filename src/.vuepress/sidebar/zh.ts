import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/zh/my-log/": [
    {
      text: "我的日志",
      icon: "list-check",
      collapsible: true,
      children: "structure"
    }
  ],
  "/zh/seeking-job/": [
    {
      text: "求职经历",
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
  "/zh/cs-development/code-practice/": [
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
  "/zh/cs-development/backend/": [
    {
      text: "后端开发",
      icon: "code",
      collapsible: true,
      children: "structure"
    }
  ],
  "/zh/cs-development/frontend/": [
    {
      text: "前端开发",
      icon: "code",
      collapsible: true,
      children: "structure"
    }
  ],
  "/zh/cs-development/ai-llm-agent/": [
    {
      text: "AI/LLM/Agent",
      icon: "robot",
      collapsible: true,
      children: "structure"
    }
  ]
});
