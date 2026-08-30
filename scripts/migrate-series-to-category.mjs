// One-shot migration: logical "series" moves from custom seriesPlugin to the
// theme's native category system, physical structure moves to sidebar
// "structure" mode.
//
//   1. frontmatter: drop `series: "X"`, append X to `category` (as array)
//   2. series dirs without a README get one with `dir` frontmatter so the
//      structure sidebar shows a proper title/icon
//
// Usage: node scripts/migrate-series-to-category.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const walkMd = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkMd(join(dir, e.name)) : e.name.endsWith(".md") ? [join(dir, e.name)] : [],
  );

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

// series dir -> dir frontmatter for the generated README
const SERIES_DIRS = {
  "zh/backend/python-deep-dive": "Python Deep Dive",
  "zh/backend/python-engineering": "Python Engineering",
  "zh/backend/production-engineering": "Production Engineering",
  "zh/coding-practice/company-coding-test": "Company Coding Test",
  "zh/coding-practice/leetcode": "LeetCode",
  "zh/interview/campus": "Campus Interview",
  "zh/journal/mylog": "MyLog",
};

let touched = 0;

// 1. frontmatter rewrite
const files = walkMd(src);
for (const full of files) {
  const raw = readFileSync(full, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;

  const fm = m[1];
  const seriesMatch = fm.match(/^series:\s*"([^"]+)"\s*$/m);
  if (!seriesMatch) continue;
  const series = seriesMatch[1];

  let next = fm.replace(seriesMatch[0] + "\n", "").replace(seriesMatch[0], "");

  // category: string | array | missing -> array containing series
  const catMatch = next.match(/^category:(.*)$/m);
  if (!catMatch) {
    next = next.replace(/^(tag:)/m, `category:\n  - "${series}"\n$1`);
    if (next === fm.replace(seriesMatch[0], "")) next += `\ncategory:\n  - "${series}"`;
  } else {
    const values = [...catMatch[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    if (!values.includes(series)) values.push(series);
    next = next.replace(
      catMatch[0],
      "category:\n" + values.map((v) => `  - "${v}"`).join("\n"),
    );
  }

  writeFileSync(full, raw.replace(m[0], `---\n${next}\n---`));
  touched++;
}

// 2. READMEs for series dirs
let created = 0;
for (const [rel, text] of Object.entries(SERIES_DIRS)) {
  const readme = join(src, rel, "README.md");
  if (existsSync(readme)) continue;
  writeFileSync(
    readme,
    `---\ntitle: ${text}\ndir:\n  text: ${text}\n  icon: layer-group\narticle: false\n---\n`,
  );
  created++;
}

console.log(`frontmatter updated: ${touched}, READMEs created: ${created}`);
