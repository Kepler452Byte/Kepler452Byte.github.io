import { sidebar } from "vuepress-theme-hope";


// One structure sidebar per top-level category: entering a category from the
// navbar shows only that category's tree (dirs = nested groups, README
// frontmatter `dir` customizes title/icon/order).
export const zhSidebar = sidebar({
  "/zh/backend/": "structure",
  "/zh/frontend/": "structure",
  "/zh/ai/": "structure",
  "/zh/devops/": "structure",
  "/zh/coding-practice/": "structure",
  "/zh/interview/": "structure",
  "/zh/journal/": "structure",
  "/zh/archive/": "structure",
});
