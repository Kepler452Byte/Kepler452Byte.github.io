import { defineUserConfig } from "vuepress";
import theme from "./theme.js";

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
});