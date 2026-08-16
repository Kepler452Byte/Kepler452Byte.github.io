// Renders one series as a paginated article list by reusing the theme's
// own ArticleList component, so item look matches category/tag pages.
import { defineComponent, h } from "vue";
import { ArticleList } from "vuepress-theme-hope/blog";
import { seriesMap } from "@temp/series/map.js";

export default defineComponent({
  name: "SeriesItems",

  props: {
    name: { type: String, required: true },
    locale: { type: String, default: "/" },
  },

  setup(props) {
    return () => {
      const series = seriesMap[props.locale]?.[props.name];

      return h(
        "div",
        { class: "vp-series-items" },
        series
          ? h(ArticleList, { items: series.items })
          : h("p", props.locale === "/en/" ? "No such series." : "没有该专题。"),
      );
    };
  },
});
