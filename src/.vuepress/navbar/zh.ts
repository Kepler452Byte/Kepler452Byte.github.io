import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "",
  // "/zh/demo/",
  // {
  //   text: "博文",
  //   icon: "pen-to-square",
  //   prefix: "/zh/posts/",
  //   children: [
  //     {
  //       text: "苹果",
  //       icon: "pen-to-square",
  //       prefix: "apple/",
  //       children: [
  //         { text: "苹果1", icon: "pen-to-square", link: "1" },
  //         { text: "苹果2", icon: "pen-to-square", link: "2" },
  //         "3",
  //         "4",
  //       ],
  //     },
  //     {
  //       text: "香蕉",
  //       icon: "pen-to-square",
  //       prefix: "banana/",
  //       children: [
  //         {
  //           text: "香蕉 1",
  //           icon: "pen-to-square",
  //           link: "1",
  //         },
  //         {
  //           text: "香蕉 2",
  //           icon: "pen-to-square",
  //           link: "2",
  //         },
  //         "3",
  //         "4",
  //       ],
  //     },
  //     { text: "樱桃", icon: "pen-to-square", link: "cherry" },
  //     { text: "火龙果", icon: "pen-to-square", link: "dragonfruit" },
  //     "tomato",
  //     "strawberry",
  //   ],
  // },
  "/zh/code-practice/",
  {
    text: "开发经历",
    icon: "pen-to-square",
    prefix: "/zh/development/",
    children: [
      {
        text: "后端开发",
        icon: "server",
        prefix: "backend/",
        link: "/zh/development/backend/README.md"
      },
      {
        text: "前端开发",
        icon: "laptop-code",
        prefix: "frontend/",
        link: "/zh/development/frontend/README.md"
      },
      {
        text: "AI/LLM/Agent",
        icon: "robot",
        prefix: "ai-llm-agent/",
        link: "/zh/development/ai-llm-agent/README.md"
      }
    ]
  },
  "/zh/seeking-job/",
  "/zh/intro",
]);
