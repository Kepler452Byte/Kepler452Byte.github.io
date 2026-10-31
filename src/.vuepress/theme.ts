import { hopeTheme } from "vuepress-theme-hope";
import { enNavbar, zhNavbar } from "./navbar/index.js";
import { enSidebar, zhSidebar } from "./sidebar/index.js";

export default hopeTheme({
  hostname: "https://kepler452byte.github.io",

  author: {
    name: "Kepler452Byte",
    url: "https://kepler452byte.github.io",
  },

  logo: "/assets/icon/site-icon.png",

  repo: "Kepler452Byte/Kepler452Byte.github.io",

  docsDir: "src",

  darkmode: "switch",

  blog: {
    avatar: "/assets/images/avatar.webp",
    medias: {
      Gitee: "https://gitee.com/Kepler452Byte",
      GitHub: "https://github.com/Kepler452Byte",
      Gmail: "mailto:shaoyuanhong1234@gmail.com",
    },
  },

  locales: {
    "/en/": {
      navbar: enNavbar,

      sidebar: enSidebar,

      footer: `<a href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010802046505" target="_blank">京公网安备11010802046505号</a>
              <a href="https://beian.miit.gov.cn/" target="_blank">京ICP备2024068300号-2</a>`,

      displayFooter: true,

      blog: {
        description: "A programmer likes to explore the world",
        intro: "/en/intro.html",
      },

      metaLocales: {
        editLink: "Edit this page on GitHub",
      },
    },

    "/": {
      navbar: zhNavbar,

      sidebar: zhSidebar,

      footer: `<a href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010802046505" target="_blank">京公网安备11010802046505号</a>
              <a href="https://beian.miit.gov.cn/" target="_blank">京ICP备2024068300号-2</a>`,

      displayFooter: true,

      blog: {
        description: "一个喜欢探索世界的开发者",
        intro: "/zh/intro.html",
      },

      metaLocales: {
        editLink: "在 GitHub 上编辑此页",
      },
    },
  },

  encrypt: {
    config: {
      "/zh/archive/meituan-20250823.html": {
        hint: "Password:",
        password: "syh123123",
      },
    },
  },

  markdown: {
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    demo: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    plantuml: true,
    spoiler: true,
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,
    math: {
      type: "mathjax", // 或 'katex'
    },

    mermaid: true,

  },

  plugins: {
    blog: true,

    docsearch: {
      appId: "JCPEPECQAM",
      apiKey: "ea99f4219d4782a4ef7349b7b499070a",
      indexName: "kepler452bytes_blog_pages",
      locales: {
        "/": {
          placeholder: "搜索文档",
          translations: {
            button: {
              buttonText: "搜索文档",
              buttonAriaLabel: "搜索文档",
            },
          },
        },
        "/en/": {
          placeholder: "Search documentation",
          translations: {
            button: {
              buttonText: "Search",
              buttonAriaLabel: "Search",
            },
          },
        },
      },
    },

    comment: {
      provider: "Giscus",
      repo: "Kepler452Byte/Kepler452Byte.github.io",
      repoId: "R_kgDOPijw7w",
      category: "Announcements",
      categoryId: "DIC_kwDOPijw784CvQGf"
    },

    components: {
      components: ["Badge", "VPCard"],
    },

    icon: {
      prefix: "fa6-solid:",
    },

  },
});
