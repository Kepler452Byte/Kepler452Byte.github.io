import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineUserConfig } from "vuepress";
import theme from "./theme.js";


// draft 是创作状态：开发服务可预览，生产构建从页面输入中排除。
const sourceDir = fileURLToPath(new URL("../", import.meta.url));
function draftPatterns(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || entry.name === "node_modules") return [];
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return draftPatterns(file);
    if (!entry.name.endsWith(".md")) return [];
    const header = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    return header && /^draft:[ \t]*true[ \t]*(?:#.*)?$/m.test(header)
      ? ["!" + relative(sourceDir, file).split(sep).join("/")]
      : [];
  });
}

export default defineUserConfig({
  pagePatterns: ["**/*.md", "!.vuepress", "!node_modules", ...(process.argv.includes("build") ? draftPatterns(sourceDir) : [])],
  base: "/",
  head: [
    ["link", { rel: "icon", href: "/favicon.ico", sizes: "any" }],
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/assets/icon/favicon-32.png" }],
    ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/assets/icon/apple-touch-icon.png" }],
  ],

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

})
