// Renders the series overview with the theme's category-list look:
// reuses the theme's vp-category-* markup, styles and hash-based color
// classes, so /series/ looks exactly like /category/.
import { defineComponent, h } from "vue";
import { RouteLink, usePage } from "vuepress/client";
import cssVariables from "@theme-hope/styles/variables.module.scss";
import { seriesMap } from "@temp/series/map.js";
import "@theme-hope/styles/blog/category-list.scss";

// Port of vuepress-shared's generateIndexFromHash (cyrb53 variant);
// vuepress-shared itself is private to the theme under pnpm, so the
// tiny hash is copied here to keep card colors stable and identical.
const hashText = (text, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  for (let i = 0, ch; i < text.length; i++) {
    ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const colorIndex = (name) =>
  hashText(name) % Number(cssVariables.colorNumber);

export default defineComponent({
  name: "SeriesMap",

  props: {
    locale: { type: String, default: "/" },
  },

  setup(props) {
    const page = usePage();

    return () => {
      const entries = Object.entries(seriesMap[props.locale] ?? {});

      // visible empty state instead of a silent blank block
      if (!entries.length)
        return h(
          "p",
          props.locale === "/en/" ? "No series yet." : "暂无专题。",
        );

      return h(
        "ul",
        { class: "vp-category-list" },
        entries
          .sort(([, a], [, b]) => b.items.length - a.items.length)
          .map(([name, { path, items }]) =>
            h(
              "li",
              { class: "vp-category-item" },
              h(
                RouteLink,
                {
                  class: [
                    "vp-category",
                    `color${colorIndex(name)}`,
                    { active: path === page.value.path },
                  ],
                  to: path,
                },
                () => [
                  name,
                  h("span", { class: "vp-category-count" }, items.length),
                ],
              ),
            ),
          ),
      );
    };
  },
});
