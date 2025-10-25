import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { docsearchPlugin } from '@vuepress/plugin-docsearch'
export default defineUserConfig({
  base: "/",

  locales: {
    "/en/": {
      lang: "en-US",
      title: "Kepler452Byte's Blog",
      description: "A blog for Kepler452Byte",
    },
    "/": {
      lang: "zh-CN",
      title: "Kepler452Byte's Blog",
      description: "Kepler452Byte 的博客",
    },
  },

  theme,

  // Enable it with pwa
  // shouldPrefetch: false,

  plugins: [
    docsearchPlugin({
      appId: 'JCPEPECQAM',
      indexName: 'kepler452bytes_blog_pages', // TODO: Replace with your DocSearch index name
      apiKey: 'ea99f4219d4782a4ef7349b7b499070a',
    }),
  ],
})