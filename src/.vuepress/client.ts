import { defineClientConfig } from "vuepress/client";
import SeriesMap from "./components/SeriesMap.js";
import SeriesItems from "./components/SeriesItems.js";

export default defineClientConfig({
  enhance({ app }) {
    app.component("SeriesMap", SeriesMap);
    app.component("SeriesItems", SeriesItems);
  },
});
