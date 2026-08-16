// One-shot: split zh/backend into three series dirs (spec: series >= 3
// articles, physical layout mirrors the series). Stamps `series` and merges
// the new URL into any existing `redirectFrom`. Kept as record.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src/zh/backend";

const SERIES = {
  "python-deep-dive": "Python Deep Dive",
  "python-engineering": "Python Engineering",
  "production-engineering": "Production Engineering",
};

const MOVES = {
  "python-deep-dive": [
    "python-context-manager.md",
    "python-exception-handling.md",
    "python-streaming-generators.md",
    "python-unpacking-idioms.md",
    "python-event-loop-best-practices.md",
    "os-sync-to-concurrent-programming.md",
  ],
  "python-engineering": [
    "python-package-managers.md",
    "python-dependency-injection.md",
    "fastapi-depends-injection.md",
    "how-to-write-unit-tests.md",
    "flask-mock-in-unit-tests.md",
  ],
  "production-engineering": [
    "inventory-pre-deduction-java-redis-rocketmq.md",
    "ak-sk-design.md",
    "duckdb-big-json-file.md",
  ],
};

for (const [dir, files] of Object.entries(MOVES)) {
  mkdirSync(join(ROOT, dir), { recursive: true });

  for (const file of files) {
    // idempotent: skip the move if it already happened
    if (existsSync(join(ROOT, file)))
      execSync(`git mv ${ROOT}/${file} ${ROOT}/${dir}/${file}`);

    const dst = join(ROOT, dir, file);
    let raw = readFileSync(dst, "utf8");

    // drop a stale series line if any, then stamp the new one
    // (\r?\n everywhere — files are CRLF)
    raw = raw.replace(/^series:.*\r?\n/m, "");
    raw = raw.replace(
      /^---\r?\n/,
      `---\nseries: "${SERIES[dir]}"\n`,
    );

    // merge the pre-move URL into redirectFrom (string -> array)
    const oldUrl = `/zh/backend/${file.replace(/\.md$/, ".html")}`;
    const m = raw.match(/^redirectFrom:[ \t]*(.+)\r?\n/m);
    if (m) {
      const existing = m[1].trim();
      const arr = existing.startsWith("[")
        ? JSON.parse(existing)
        : [existing.replace(/^"|"$/g, "")];
      if (!arr.includes(oldUrl)) arr.push(oldUrl);
      raw = raw.replace(
        /^redirectFrom:.*\r?\n/m,
        `redirectFrom: ${JSON.stringify(arr)}\n`,
      );
    } else {
      raw = raw.replace(/^---\r?\n/, `---\nredirectFrom: "${oldUrl}"\n`);
    }

    writeFileSync(dst, raw);
    console.log(`${file} -> ${dir}/ (series: ${SERIES[dir]})`);
  }
}
