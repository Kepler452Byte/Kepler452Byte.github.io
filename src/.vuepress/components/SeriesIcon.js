// "Layers" icon for the series blog type. Mirrors the theme's IconBase
// output (svg viewBox 0 0 1024 1024, class "icon", fill currentColor) so
// it matches the other blog type switcher icons; drawn directly instead
// of importing IconBase, which pnpm keeps private to the theme.
import { defineComponent, h } from "vue";

export default defineComponent({
  name: "SeriesIcon",

  setup: () => () =>
    h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        class: ["icon", "series-icon"],
        viewBox: "0 0 1024 1024",
        fill: "currentColor",
        "aria-hidden": "true",
      },
      [
        h("path", {
          d: "M512 48 L944 264 L512 480 L80 264 Z",
        }),
        h("path", {
          d: "M80 400 L512 616 L944 400 L944 520 L512 736 L80 520 Z",
        }),
        h("path", {
          d: "M80 656 L512 872 L944 656 L944 776 L512 992 L80 776 Z",
        }),
      ],
    ),
});
