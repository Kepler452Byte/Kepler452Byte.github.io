// Custom "Series" layout: gives /series/ pages the same structure as the
// theme's /category/ and /tag/ pages — main column renders just the page
// markdown (series card cloud + article list, no breadcrumb or page title)
// inside main#main-content, with the blogger info panel in the right aside.
//
// Registered as the "Series" layout in client.ts and applied to series
// pages via frontmatter.layout in seriesPlugin.js.
import { defineComponent, h } from "vue";
import { usePage } from "vuepress/client";
import MarkdownContent from "@theme-hope/components/base/MarkdownContent";
import BlogMainLayout from "@theme-hope/components/blog/BlogMainLayout";
import InfoPanel from "@theme-hope/components/blog/InfoPanel";
import DropTransition from "@theme-hope/components/transitions/DropTransition";

export default defineComponent({
  name: "SeriesLayout",

  slots: Object,

  setup(_props, { slots }) {
    const page = usePage();

    return () =>
      h(BlogMainLayout, null, {
        ...slots,
        default: () =>
          h("div", { class: "vp-page vp-blog" },
            h("div", { class: "blog-page-wrapper" }, [
              h(
                "main",
                { id: "main-content", class: "vp-blog-main" },
                h(
                  DropTransition,
                  { key: page.value.path, appear: true },
                  () => h(MarkdownContent, { key: page.value.path }, slots),
                ),
              ),
              h(
                DropTransition,
                { delay: 0.16 },
                () => h(InfoPanel, { key: "blog" }, slots),
              ),
            ])),
      });
  },
});
