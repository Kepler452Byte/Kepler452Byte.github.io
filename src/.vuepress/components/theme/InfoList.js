// Customized copy of vuepress-theme-hope's InfoList
// (lib/client/components/blog/InfoList.js). Identical to the original
// except the blog type switcher gains a "series" tab (with a
// SeriesInfo panel) between category and tag.
//
// Takes effect via the alias registered in seriesPlugin.js.
import { defineComponent, h, ref } from "vue";
import { useRouteLocale } from "vuepress/client";
import ArticlesInfo from "@theme-hope/components/blog/ArticlesInfo";
import CategoriesInfo from "@theme-hope/components/blog/CategoriesInfo";
import TagsInfo from "@theme-hope/components/blog/TagsInfo";
import TimelineList from "@theme-hope/components/blog/TimelineList";
import {
  ArticleIcon,
  CategoryIcon,
  TagIcon,
  TimelineIcon,
} from "@theme-hope/components/blog/icons";
import DropTransition from "@theme-hope/components/transitions/DropTransition";
import { useBlogLocale } from "@theme-hope/composables/blog/useBlogLocale";
import SeriesInfo from "./SeriesInfo.js";
import SeriesIcon from "../SeriesIcon.js";
import "@theme-hope/styles/blog/info-list.scss";

const buttons = {
  article: ArticleIcon,
  category: CategoryIcon,
  series: SeriesIcon,
  tag: TagIcon,
  timeline: TimelineIcon,
};

export default defineComponent({
  name: "InfoList",

  setup() {
    const blogLocale = useBlogLocale();
    const routeLocale = useRouteLocale();
    const activeType = ref("article");

    return () => {
      const labels = {
        ...blogLocale.value,
        series: routeLocale.value === "/en/" ? "Series" : "专题",
      };

      return h("div", { class: "vp-blog-infos" }, [
        h(
          "div",
          { class: "vp-blog-type-switcher" },
          Object.entries(buttons).map(([key, Icon]) =>
            h(
              "button",
              {
                type: "button",
                class: "vp-blog-type-button",
                onClick: () => {
                  activeType.value = key;
                },
              },
              h(
                "div",
                {
                  class: [
                    "vp-blog-type-icon-wrapper",
                    { active: activeType.value === key },
                  ],
                  "aria-label": labels[key],
                  "data-balloon-pos": "down",
                },
                h(Icon),
              ),
            ),
          ),
        ),
        h(
          DropTransition,
          () =>
            activeType.value === "article"
              ? h(ArticlesInfo)
              : activeType.value === "category"
                ? h(CategoriesInfo)
                : activeType.value === "series"
                  ? h(SeriesInfo)
                  : activeType.value === "tag"
                    ? h(TagsInfo)
                    : h(TimelineList),
        ),
      ]);
    };
  },
});
