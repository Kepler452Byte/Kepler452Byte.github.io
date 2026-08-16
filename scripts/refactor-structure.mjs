// One-shot physical restructure of src/{zh,en}:
//   level-1 dir = category slug, level-2 dir = series slug.
//
// What it does:
//   1. git mv every article (history preserved) into the new tree
//   2. rename two category values (Career Interview -> Interview,
//      Infra DevOps -> DevOps) in frontmatter
//   3. stamp every moved article with `redirectFrom: <old url>` so
//      @vuepress/plugin-redirect keeps old links alive
//
// Run once from the repo root:  node scripts/refactor-structure.mjs
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");

const run = (cmd) =>
  execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "inherit"] })
    .toString()
    .trim();

const mkdirp = (p) => mkdirSync(join(SRC, p), { recursive: true });

const mv = (from, to) => {
  if (!existsSync(join(SRC, from)))
    throw new Error(`source missing: ${from}`);
  if (existsSync(join(SRC, to))) throw new Error(`target exists: ${to}`);
  run(`git mv "src/${from}" "src/${to}"`);
};

// ---------------------------------------------------------------- moves ---
// directories
mkdirp("zh/devops");
mkdirp("zh/agent-engineering");
mkdirp("zh/coding-practice");
mkdirp("zh/interview");
mkdirp("zh/journal/mylog");
mkdirp("en/coding-practice");

// 1. pull the DevOps articles out of backend/ first, then rename the dir
mv("zh/cs-development/backend/npc-nps-network-tunneling.md", "zh/devops/npc-nps-network-tunneling.md");
mv("zh/cs-development/backend/windows-rdp-guide.md", "zh/devops/windows-rdp-guide.md");
mv("zh/cs-development/backend/windows-rdp-guide", "zh/devops/windows-rdp-guide");
mv("zh/cs-development/backend/zabbix-guide.md", "zh/devops/zabbix-guide.md");
mv("zh/cs-development/backend", "zh/backend");

mv("zh/cs-development/frontend", "zh/frontend");
mv("zh/cs-development/ai-llm-agent/claude-code-best-practices.md", "zh/agent-engineering/claude-code-best-practices.md");
mv("zh/cs-development/ai-llm-agent/claude-code-best-practices", "zh/agent-engineering/claude-code-best-practices");
mv("zh/cs-development/code-practice/leetcode", "zh/coding-practice/leetcode");
mv("zh/cs-development/code-practice/company-coding-test", "zh/coding-practice/company-coding-test");
mv("zh/seeking-job/campus", "zh/interview/campus");

mv("zh/my-log/internet-access-guide.md", "zh/journal/internet-access-guide.md");
mv("zh/my-log/internet-access-guide", "zh/journal/internet-access-guide");
mv("zh/my-log/mylog-202509.md", "zh/journal/mylog/mylog-202509.md");
mv("zh/my-log/mylog-202510.md", "zh/journal/mylog/mylog-202510.md");
mv("zh/my-log/mylog-202510", "zh/journal/mylog/mylog-202510");

mv("en/code-practice/leetcode", "en/coding-practice/leetcode");

// board READMEs are trivial <Catalog /> stubs — drop them, fresh per-category
// ones are written below
run('git rm -q "src/zh/cs-development/README.md" "src/zh/cs-development/code-practice/README.md" "src/zh/seeking-job/README.md" "src/en/code-practice/README.md"');

// ------------------------------------------------------ frontmatter pass ---
const CATEGORY_RENAMES = {
  '"Career Interview"': '"Interview"',
  '"Infra DevOps"': '"DevOps"',
};

// all moved articles: src-relative old path -> src-relative new path
const MOVED = [
  ["zh/cs-development/backend/ak-sk-design.md", "zh/backend/ak-sk-design.md"],
  ["zh/cs-development/backend/duckdb-big-json-file.md", "zh/backend/duckdb-big-json-file.md"],
  ["zh/cs-development/backend/fastapi-depends-injection.md", "zh/backend/fastapi-depends-injection.md"],
  ["zh/cs-development/backend/flask-mock-in-unit-tests.md", "zh/backend/flask-mock-in-unit-tests.md"],
  ["zh/cs-development/backend/how-to-write-unit-tests.md", "zh/backend/how-to-write-unit-tests.md"],
  ["zh/cs-development/backend/inventory-pre-deduction-java-redis-rocketmq.md", "zh/backend/inventory-pre-deduction-java-redis-rocketmq.md"],
  ["zh/cs-development/backend/lightweight-doc-db-comparison.md", "zh/backend/lightweight-doc-db-comparison.md"],
  ["zh/cs-development/backend/os-sync-to-concurrent-programming.md", "zh/backend/os-sync-to-concurrent-programming.md"],
  ["zh/cs-development/backend/python-context-manager.md", "zh/backend/python-context-manager.md"],
  ["zh/cs-development/backend/python-dependency-injection.md", "zh/backend/python-dependency-injection.md"],
  ["zh/cs-development/backend/python-event-loop-best-practices.md", "zh/backend/python-event-loop-best-practices.md"],
  ["zh/cs-development/backend/python-exception-handling.md", "zh/backend/python-exception-handling.md"],
  ["zh/cs-development/backend/python-package-managers.md", "zh/backend/python-package-managers.md"],
  ["zh/cs-development/backend/python-streaming-generators.md", "zh/backend/python-streaming-generators.md"],
  ["zh/cs-development/backend/python-unpacking-idioms.md", "zh/backend/python-unpacking-idioms.md"],
  ["zh/cs-development/backend/npc-nps-network-tunneling.md", "zh/devops/npc-nps-network-tunneling.md"],
  ["zh/cs-development/backend/windows-rdp-guide.md", "zh/devops/windows-rdp-guide.md"],
  ["zh/cs-development/backend/zabbix-guide.md", "zh/devops/zabbix-guide.md"],
  ["zh/cs-development/frontend/vite-build-tool.md", "zh/frontend/vite-build-tool.md"],
  ["zh/cs-development/ai-llm-agent/claude-code-best-practices.md", "zh/agent-engineering/claude-code-best-practices.md"],
  ["zh/cs-development/code-practice/leetcode/leetcode-1-two-sum.md", "zh/coding-practice/leetcode/leetcode-1-two-sum.md"],
  ["zh/cs-development/code-practice/company-coding-test/meituan-20250823.md", "zh/coding-practice/company-coding-test/meituan-20250823.md"],
  ["zh/seeking-job/campus/campus-resume-tips-20250826.md", "zh/interview/campus/campus-resume-tips-20250826.md"],
  ["zh/seeking-job/campus/fellou-ai-interview-20250825.md", "zh/interview/campus/fellou-ai-interview-20250825.md"],
  ["zh/seeking-job/campus/jd-enterprise-it-interview-20250905.md", "zh/interview/campus/jd-enterprise-it-interview-20250905.md"],
  ["zh/seeking-job/campus/jd-enterprise-it-interview-round2-20250909.md", "zh/interview/campus/jd-enterprise-it-interview-round2-20250909.md"],
  ["zh/seeking-job/campus/meituan-ai-interview-20250824.md", "zh/interview/campus/meituan-ai-interview-20250824.md"],
  ["zh/seeking-job/campus/shopee-interview-20250903.md", "zh/interview/campus/shopee-interview-20250903.md"],
  ["zh/seeking-job/campus/wutong-huakai-interview-20251012.md", "zh/interview/campus/wutong-huakai-interview-20251012.md"],
  ["zh/seeking-job/campus/yuanli-lingji-interview-20250917.md", "zh/interview/campus/yuanli-lingji-interview-20250917.md"],
  ["zh/my-log/internet-access-guide.md", "zh/journal/internet-access-guide.md"],
  ["zh/my-log/mylog-202509.md", "zh/journal/mylog/mylog-202509.md"],
  ["zh/my-log/mylog-202510.md", "zh/journal/mylog/mylog-202510.md"],
  ["en/code-practice/leetcode/leetcode-1-two-sum.md", "en/coding-practice/leetcode/leetcode-1-two-sum.md"],
];

const oldUrl = (p) => "/" + p.replace(/\.md$/, ".html");

let renamed = 0;
let stamped = 0;

for (const [from, now] of MOVED) {
  const file = join(SRC, now);
  const raw = readFileSync(file, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);

  if (!lines[0].trim().match(/^---$/))
    throw new Error(`no frontmatter in ${now}`);

  // rename category value
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith("category:")) {
      const value = lines[i].slice("category:".length).trim();
      if (CATEGORY_RENAMES[value]) {
        lines[i] = `category: ${CATEGORY_RENAMES[value]}`;
        renamed++;
      }
      break;
    }
  }

  // stamp redirectFrom right after the opening --- (skip if already there)
  if (!lines.some((l) => l.startsWith("redirectFrom:"))) {
    lines.splice(1, 0, `redirectFrom: "${oldUrl(from)}"`);
    stamped++;
  }

  writeFileSync(file, lines.join(eol));
}

console.log(`moved ${MOVED.length} files, renamed ${renamed} categories, stamped ${stamped} redirectFrom`);

// ------------------------------------------------- per-category landings ---
const README = (title, icon, description) =>
  `---${"\n"}title: ${title}${"\n"}index: false${"\n"}article: false${"\n"}icon: ${icon}${"\n"}description: ${description}${"\n"}---${"\n"}${"\n"}<Catalog />${"\n"}`;

const LANDINGS = [
  ["zh/devops/README.md", "DevOps", "server", "记录基础设施与运维实践"],
  ["zh/frontend/README.md", "前端开发", "laptop-code", "记录前端开发经历"],
  ["zh/agent-engineering/README.md", "Agent 工程", "robot", "记录 AI/LLM/Agent 开发经历"],
  ["zh/coding-practice/README.md", "算法与练习", "code", "记录算法与 SQL 题的笔记"],
  ["zh/interview/README.md", "求职面试", "briefcase", "记录我的求职面试经历"],
  ["zh/journal/README.md", "我的日志", "list-check", "记录我的日常日志"],
  ["en/coding-practice/README.md", "Coding Practice", "code", "Algorithm and SQL notes"],
];

for (const [p, ...rest] of LANDINGS) {
  const file = join(SRC, p);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, README(...rest));
  run(`git add "src/${p}"`);
}

console.log(`wrote ${LANDINGS.length} landing READMEs`);
