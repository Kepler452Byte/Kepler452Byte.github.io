import { navbar } from "vuepress-theme-hope";

// 下拉菜单直接展示子分类；分类总览页面保留，但不重复列为菜单入口。
export const zhNavbar = navbar([
  "",
  {
    text: "后端开发",
    icon: "server",
    children: [
      { text: "Python 深入解析", link: "/zh/backend/python-deep-dive/" },
      { text: "Python 工程实践", link: "/zh/backend/python-engineering/" },
      { text: "生产工程实践", link: "/zh/backend/production-engineering/" },
    ],
  },
  { text: "前端开发", icon: "laptop-code", link: "/zh/frontend/" },
  {
    text: "AI",
    icon: "robot",
    children: [
      { text: "大模型应用", link: "/zh/ai/llm/" },
      {
        text: "Agent 工程",
        link: "/zh/ai/agent-engineering/",
      },
      {
        text: "AI 工具与实践",
        link: "/zh/ai/tools/",
      },
    ],
  },
  { text: "DevOps", icon: "server", link: "/zh/devops/" },
  {
    text: "更多",
    icon: "ellipsis",
    children: [
      {
        text: "算法与练习",
        icon: "code",
        children: [
          { text: "力扣练习", link: "/zh/coding-practice/leetcode/" },
          { text: "企业笔试", link: "/zh/coding-practice/company-coding-test/" },
        ],
      },
      {
        text: "求职面试",
        icon: "briefcase",
        children: [
          { text: "校园招聘面试", link: "/zh/interview/campus/" },
        ],
      },
      {
        text: "我的日志",
        icon: "list-check",
        children: [
          { text: "个人月记", link: "/zh/journal/mylog/" },
        ],
      },
    ],
  },
  "/zh/intro",
]);
