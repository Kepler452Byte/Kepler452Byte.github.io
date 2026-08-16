import { defineClientConfig } from "vuepress/client";
import SeriesLayout from "./components/theme/SeriesLayout.js";
import SeriesMap from "./components/SeriesMap.js";
import SeriesItems from "./components/SeriesItems.js";

export default defineClientConfig({
  // used by series pages via frontmatter.layout (see seriesPlugin.js)
  layouts: {
    Series: SeriesLayout,
  },

  enhance({ app }) {
    app.component("SeriesMap", SeriesMap);
    app.component("SeriesItems", SeriesItems);
  },
});
