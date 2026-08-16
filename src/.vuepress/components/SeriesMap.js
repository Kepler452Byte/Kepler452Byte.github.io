// Renders the series overview: chip-style list linking to each series page.
// Data comes from the series plugin's temp file; styles reuse the theme's
// tag-list look via .vuepress/styles/index.scss (.vp-series-*).
import { defineComponent, h } from "vue";
import { RouteLink } from "vuepress/client";
import { seriesMap } from "@temp/series/map.js";

export default defineComponent({
  name: "SeriesMap",

  props: {
    locale: { type: String, default: "/" },
  },

  setup(props) {
    return () =>
      h(
        "ul",
        { class: "vp-series-list" },
        Object.entries(seriesMap[props.locale] ?? {})
          .sort(([, a], [, b]) => b.items.length - a.items.length)
          .map(([name, { path, items }]) =>
            h(
              "li",
              { class: "vp-series-item" },
              h(
                RouteLink,
                { class: "vp-series", to: path },
                () => [
                  name,
                  h("span", { class: "vp-series-count" }, items.length),
                ],
              ),
            ),
          ),
      );
  },
});
