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
  "/zh/my-log/",
  {
    text: "CS/开发经历",
    icon: "pen-to-square",
    prefix: "/zh/cs-development/",
    children: [
      {
        text: "算法练习",
        icon: "code", // 更换为更适合算法练习的图标
        prefix: "code-practice/",
        link: "/zh/cs-development/code-practice/README.md"
      },
      {
        text: "后端开发",
        icon: "server",
        prefix: "backend/",
        link: "/zh/cs-development/backend/README.md"
      },
      {
        text: "前端开发",
        icon: "laptop-code",
        prefix: "frontend/",
        link: "/zh/cs-development/frontend/README.md"
      },
      {
        text: "AI/LLM/Agent",
        icon: "robot",
        prefix: "ai-llm-agent/",
        link: "/zh/cs-development/ai-llm-agent/README.md"
      }
    ]
  },
  "/zh/seeking-job/",
  { text: "专题", icon: "layer-group", link: "/series/" },
  "/zh/intro",
]);
