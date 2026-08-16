import { navbar } from "vuepress-theme-hope";

// Thin navbar: every entry targets a category landing page (auto-generated
// `<Catalog />` README), so adding categories never touches this file.
export const zhNavbar = navbar([
  "",
  { text: "后端开发", icon: "server", link: "/zh/backend/" },
  { text: "前端开发", icon: "laptop-code", link: "/zh/frontend/" },
  { text: "AI/LLM/Agent", icon: "robot", link: "/zh/agent-engineering/" },
  { text: "DevOps", icon: "server", link: "/zh/devops/" },
  {
    text: "",
    icon: "ellipsis",
    children: [
      { text: "算法与练习", icon: "code", link: "/zh/coding-practice/" },
      { text: "求职面试", icon: "briefcase", link: "/zh/interview/" },
      { text: "我的日志", icon: "list-check", link: "/zh/journal/" },
    ],
  },
  "/zh/intro",
]);
