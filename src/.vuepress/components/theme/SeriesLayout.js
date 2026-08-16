// Custom "Series" layout: left sidebar with series groups (injected via
// frontmatter.sidebar by seriesPlugin) + main column with the article
// list, like a regular content page. Mobile gets the native sidebar
// drawer; the navbar screen keeps the blogger info (with our series
// stat chip) at the bottom, same as blog pages.
//
// Registered as the "Series" layout in client.ts and applied to series
// pages via frontmatter.layout in seriesPlugin.js.
import { defineComponent, h } from "vue";
import { usePage } from "vuepress/client";
import MarkdownContent from "@theme-hope/components/base/MarkdownContent";
import MainLayout from "@theme-hope/components/base/MainLayout";
import SkipLink from "@theme-hope/components/base/SkipLink";
import BloggerInfo from "@theme-hope/components/blog/BloggerInfo";

export default defineComponent({
  name: "SeriesLayout",

  slots: Object,

  setup(_props, { slots }) {
    const page = usePage();

    return () => [
      h(SkipLink),
      h(MainLayout, { noToc: true }, {
        ...slots,
        navScreenBottom: () => h(BloggerInfo, {}, slots),
        default: () =>
          h(
            "div",
            { class: "vp-page" },
            h(MarkdownContent, { key: page.value.path }, slots),
          ),
      }),
    ];
  },
});
