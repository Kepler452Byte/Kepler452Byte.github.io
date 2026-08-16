import { navbar } from "vuepress-theme-hope";
import { seriesChildren } from "./series.js";

// Thin navbar: every entry targets an auto-generated page, so adding
// categories/series never touches this file.
//   分类 dropdown -> /category/<slug>/ pages (driven by frontmatter)
//   专题         -> /series/ (driven by the series plugin)
export const zhNavbar = navbar([
  "",
  {
    text: "分类",
    icon: "layer-group",
    children: [
      { text: "后端开发", icon: "server", link: "/zh/backend/" },
      { text: "前端开发", icon: "laptop-code", link: "/zh/frontend/" },
      { text: "AI/LLM/Agent", icon: "robot", link: "/zh/agent-engineering/" },
      { text: "DevOps", icon: "server", link: "/zh/devops/" },
      { text: "算法与练习", icon: "code", link: "/zh/coding-practice/" },
      { text: "求职面试", icon: "briefcase", link: "/zh/interview/" },
      { text: "我的日志", icon: "list-check", link: "/zh/journal/" },
    ],
  },
  {
    text: "专题",
    icon: "layer-group",
    children: [
      { text: "全部专题", icon: "list", link: "/series/" },
      ...seriesChildren("zh", "/"),
    ],
  },
  "/zh/intro",
]);
