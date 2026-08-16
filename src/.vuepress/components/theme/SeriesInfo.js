// Aside-panel block for series, mirroring the theme's CategoriesInfo.
// Reuses the "vp-category-wrapper" class so the title / count / hr
// styling matches the neighboring category and tag blocks.
import { computed, defineComponent, h } from "vue";
import { useRouteLocale } from "vuepress/client";
import DropTransition from "@theme-hope/components/transitions/DropTransition";
import { useNavigate } from "@theme-hope/composables/useNavigate";
import { seriesMap } from "@temp/series/map.js";
import SeriesIcon from "../SeriesIcon.js";
import SeriesMap from "../SeriesMap.js";

export default defineComponent({
  name: "SeriesInfo",

  setup() {
    const routeLocale = useRouteLocale();
    const navigate = useNavigate();
    const seriesCount = computed(
      () => Object.keys(seriesMap[routeLocale.value] ?? {}).length,
    );

    return () => {
      const isEn = routeLocale.value === "/en/";

      return h("div", { class: "vp-category-wrapper vp-series-wrapper" }, [
        seriesCount.value
          ? [
              h(
                "div",
                {
                  class: "title",
                  onClick: () => navigate(`${routeLocale.value}series/`),
                },
                [
                  h(SeriesIcon),
                  h("span", { class: "num" }, seriesCount.value),
                  isEn ? "Series" : "专题",
                ],
              ),
              h("hr"),
              h(DropTransition, { delay: 0.04 }, () =>
                h(SeriesMap, { locale: routeLocale.value }),
              ),
            ]
          : h(
              "div",
              { class: "vp-category-empty" },
              isEn ? "No series" : "暂无专题",
            ),
      ]);
    };
  },
});
