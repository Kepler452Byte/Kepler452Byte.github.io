// One-off content-model migration. Run from repo root:
//   node scripts/migrate-content.mjs          → dry run (prints plan, changes nothing)
//   node scripts/migrate-content.mjs --apply  → execute
//
// What it does:
//   1. validate the whole mapping table (abort on any error, zero mutations)
//   2. git mv each article to its clean slug
//   3. replace the entire frontmatter block with the canonical model
//      (title / description / date / category / series? / tags / icon / article?)
//   4. strip the leading H1 (title now lives in frontmatter)
//   5. rewrite image links that point into the bracket-named asset dirs
//   6. git mv the asset/company dirs to clean names
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const SRC = path.resolve("src");
const rel = (p) => path.join(SRC, p);

const CATEGORIES = [
  "Backend",
  "Frontend",
  "Infra & DevOps",
  "Agent Engineering",
  "Coding Practice",
  "Career & Interview",
  "Journal",
];

// from/to are relative to src/
const ARTICLES = [
  // ---- backend ----
  {
    from: "zh/cs-development/backend/【IT】【Tools】NPC NPS网络打通.md",
    to: "zh/cs-development/backend/npc-nps-network-tunneling.md",
    title: "NPC NPS 网络打通",
    description: "使用 npc/nps 实现内网穿透、打通内外网访问的配置与实践笔记",
    date: "2025-08-25",
    category: "Infra & DevOps",
    tags: ["NPS", "Network"],
  },
  {
    from: "zh/cs-development/backend/【IT】【Tools】Zabbix详解.md",
    to: "zh/cs-development/backend/zabbix-guide.md",
    title: "Zabbix 详解",
    description: "Zabbix 监控体系的核心概念、部署配置与常见用法详解",
    date: "2025-11-17",
    category: "Infra & DevOps",
    tags: ["Zabbix"],
  },
  {
    from: "zh/cs-development/backend/【JAVA】【DB】【MQ】库存预扣 + MySQL 最终落库技术方案（Java + Redis + RocketMQ）.md",
    to: "zh/cs-development/backend/inventory-pre-deduction-java-redis-rocketmq.md",
    title: "库存预扣 + MySQL 最终落库技术方案（Java + Redis + RocketMQ）",
    description: "库存预扣与 MySQL 最终落库的技术方案：Java + Redis + RocketMQ 的落地实现",
    date: "2025-08-25",
    category: "Backend",
    tags: ["Java", "Redis", "RocketMQ"],
  },
  {
    from: "zh/cs-development/backend/【JAVA】【Python】【DB】从操作系统中的各种线程与进程的同步机制到JAVA、Python、MySQL的并发编程.md",
    to: "zh/cs-development/backend/os-sync-to-concurrent-programming.md",
    title: "从操作系统中的各种线程与进程的同步机制到 Java、Python、MySQL 的并发编程",
    description: "从操作系统的同步机制出发，梳理 Java、Python 与 MySQL 中的并发编程",
    date: "2025-08-25",
    category: "Backend",
    tags: ["Java", "Python", "MySQL", "OS"],
  },
  {
    from: "zh/cs-development/backend/【Noah】【DB】轻量文档数据库盘点：从部署到场景，一篇理清选择指南.md",
    to: "zh/cs-development/backend/lightweight-doc-db-comparison.md",
    title: "轻量文档数据库盘点：从部署到场景，一篇理清选择指南",
    description: "盘点多款轻量文档数据库的定位、部署与查询能力，给出场景化选型建议",
    date: "2025-09-02",
    category: "Backend",
    tags: ["Database"],
  },
  {
    from: "zh/cs-development/backend/【Python】Python 依赖注入：从概念到实践，让代码更优雅.md",
    to: "zh/cs-development/backend/python-dependency-injection.md",
    title: "Python 依赖注入：从概念到实践，让代码更优雅",
    description: "Python 依赖注入的概念与实践，让代码组织更优雅",
    date: "2025-09-18",
    category: "Backend",
    tags: ["Python"],
  },
  {
    from: "zh/cs-development/backend/【Python】Python 异常处理实战：从复杂函数到未捕获异常的连锁反应.md",
    to: "zh/cs-development/backend/python-exception-handling.md",
    title: "Python 异常处理实战：从复杂函数到未捕获异常的连锁反应",
    description: "Python 异常处理实战：从复杂函数到未捕获异常的连锁反应",
    date: "2025-09-12",
    category: "Backend",
    tags: ["Python", "Experience"],
  },
  {
    from: "zh/cs-development/backend/【Python】Python中的解包与拆包相关便捷操作.md",
    to: "zh/cs-development/backend/python-unpacking-idioms.md",
    title: "Python 中的解包与拆包相关便捷操作",
    description: "Python 中解包与拆包相关的便捷操作一览",
    date: "2025-09-10",
    category: "Backend",
    tags: ["Python"],
  },
  {
    from: "zh/cs-development/backend/【Python】Python流式编程与生成器函数详解.md",
    to: "zh/cs-development/backend/python-streaming-generators.md",
    title: "Python 流式编程与生成器函数详解",
    description: "Python 流式编程与生成器函数的原理与详解",
    date: "2025-08-29",
    category: "Backend",
    tags: ["Python"],
  },
  {
    from: "zh/cs-development/backend/【Python】Python的上下文管理器.md",
    to: "zh/cs-development/backend/python-context-manager.md",
    title: "Python 的上下文管理器",
    description: "Python 上下文管理器的原理与用法",
    date: "2025-08-30",
    category: "Backend",
    tags: ["Python"],
  },
  {
    from: "zh/cs-development/backend/【Python】【DB】【Refactor】使用DuckDB完成BigJSONFile的解析与聚合.md",
    to: "zh/cs-development/backend/duckdb-big-json-file.md",
    title: "使用 DuckDB 完成 BigJSONFile 的解析与聚合",
    description: "使用 DuckDB 解析与聚合大型 JSON 文件的重构实践",
    date: "2025-09-15",
    category: "Backend",
    tags: ["Python", "DuckDB"],
  },
  {
    from: "zh/cs-development/backend/【Python】【EventLoop】Python 事件循环最佳实践：Flask、FastAPI 与 通用项目指南.md",
    to: "zh/cs-development/backend/python-event-loop-best-practices.md",
    title: "Python 事件循环最佳实践：Flask、FastAPI 与通用项目指南",
    description: "Python 事件循环最佳实践：Flask、FastAPI 与通用项目指南",
    date: "2025-08-29",
    category: "Backend",
    tags: ["Python", "EventLoop"],
  },
  {
    from: "zh/cs-development/backend/【Python】【FastApi】Depends依赖注入 用 “声明式” 替代 “命令式” 管理依赖.md",
    to: "zh/cs-development/backend/fastapi-depends-injection.md",
    title: "FastAPI Depends 依赖注入：用“声明式”替代“命令式”管理依赖",
    description: "FastAPI Depends 依赖注入：用声明式替代命令式管理依赖",
    date: "2025-11-17",
    category: "Backend",
    tags: ["Python", "FastAPI"],
  },
  {
    from: "zh/cs-development/backend/【Python】【Flask】【Unitest】Mock在单元测试中怎么用.md",
    to: "zh/cs-development/backend/flask-mock-in-unit-tests.md",
    title: "Mock 在单元测试中怎么用",
    description: "Mock 在 Python（Flask）单元测试中的使用方法",
    date: "2025-08-27",
    category: "Backend",
    tags: ["Python", "Flask", "UnitTest", "Mock"],
  },
  {
    from: "zh/cs-development/backend/【Python】【Flask】单元测试应该怎么写.md",
    to: "zh/cs-development/backend/how-to-write-unit-tests.md",
    title: "单元测试应该怎么写",
    description: "单元测试应该怎么写：思路与实践",
    date: "2025-08-27",
    category: "Backend",
    tags: ["Python", "Flask", "UnitTest"],
  },
  {
    from: "zh/cs-development/backend/【Python】【dahlin】项目中的AK 与 SK设计.md",
    to: "zh/cs-development/backend/ak-sk-design.md",
    title: "项目中的 AK 与 SK 设计",
    description: "项目中的 AK 与 SK 认证设计",
    date: "2025-08-25",
    category: "Backend",
    tags: ["Design"],
  },
  {
    from: "zh/cs-development/backend/【Python】梳理一下Python的包管理工具.md",
    to: "zh/cs-development/backend/python-package-managers.md",
    title: "梳理一下 Python 的包管理工具",
    description: "梳理 Python 的包管理工具与选型",
    date: "2025-10-19",
    category: "Backend",
    tags: ["Python"],
  },
  {
    from: "zh/cs-development/backend/【Windows】Windows 远程桌面使用与配置指南 2971866cd30f80cea418dcec4e431e96.md",
    to: "zh/cs-development/backend/windows-rdp-guide.md",
    title: "Windows 远程桌面使用与配置指南",
    description: "Windows 远程桌面的使用与配置指南",
    date: "2025-10-26",
    category: "Infra & DevOps",
    tags: ["Windows", "RDP"],
    imgDir: [
      "zh/cs-development/backend/【Windows】Windows 远程桌面使用与配置指南 2971866cd30f80cea418dcec4e431e96",
      "zh/cs-development/backend/windows-rdp-guide",
    ],
  },
  // ---- ai-llm-agent ----
  {
    from: "zh/cs-development/ai-llm-agent/【AI】【LLM】【Claude】Claude Code使用的最佳实践 25d1866cd30f80ce8fa6cd4aad8570e8.md",
    to: "zh/cs-development/ai-llm-agent/claude-code-best-practices.md",
    title: "Claude Code 使用的最佳实践",
    description: "Claude Code 使用的最佳实践经验总结",
    date: "2025-08-30",
    category: "Agent Engineering",
    tags: ["LLM", "Agent", "Claude Code"],
    imgDir: [
      "zh/cs-development/ai-llm-agent/【AI】【LLM】【Claude】Claude Code使用的最佳实践 25d1866cd30f80ce8fa6cd4aad8570e8",
      "zh/cs-development/ai-llm-agent/claude-code-best-practices",
    ],
  },
  // ---- frontend ----
  {
    from: "zh/cs-development/frontend/【Vite】前端构建工具Vite.md",
    to: "zh/cs-development/frontend/vite-build-tool.md",
    title: "前端构建工具 Vite",
    description: "前端构建工具 Vite 的入门与原理",
    date: "2025-10-20",
    category: "Frontend",
    tags: ["Vite"],
  },
  // ---- code-practice ----
  {
    from: "zh/cs-development/code-practice/leetcode/leetcode-1-two-sum.md",
    to: "zh/cs-development/code-practice/leetcode/leetcode-1-two-sum.md",
    title: "1. 两数之和",
    description: "LeetCode 1. 两数之和：题解与思路",
    date: "2024-01-05",
    category: "Coding Practice",
    series: "LeetCode",
    tags: ["Easy"],
  },
  {
    from: "zh/cs-development/code-practice/company-codeing-test/meituan-20250823.md",
    to: "zh/cs-development/code-practice/company-codeing-test/meituan-20250823.md",
    title: "美团秋招笔试题（2025-08-23）",
    description: "美团 2025-08-23 秋招笔试题记录与题解",
    date: "2025-08-23",
    category: "Coding Practice",
    series: "Company Coding Test",
    tags: ["Easy", "Medium"],
    article: false,
  },
  // ---- my-log ----
  {
    from: "zh/my-log/【202509】MyLog.md",
    to: "zh/my-log/mylog-202509.md",
    title: "MyLog 2025-09",
    description: "2025 年 9 月的日志与随笔",
    date: "2025-08-25",
    category: "Journal",
    series: "MyLog",
    tags: [],
  },
  {
    from: "zh/my-log/【202510】MyLog.md",
    to: "zh/my-log/mylog-202510.md",
    title: "MyLog 2025-10",
    description: "2025 年 10 月的日志与随笔",
    date: "2025-11-21",
    category: "Journal",
    series: "MyLog",
    tags: [],
    imgDir: ["zh/my-log/【202510】MyLog", "zh/my-log/mylog-202510"],
  },
  {
    from: "zh/my-log/【开发】如何快乐的访问互联网资源 2671866cd30f8029a2b9f9d3cc1b1143.md",
    to: "zh/my-log/internet-access-guide.md",
    title: "如何快乐的访问互联网资源",
    description: "如何快乐地访问互联网资源：工具与方法记录",
    date: "2025-08-25",
    category: "Journal",
    tags: [],
    imgDir: [
      "zh/my-log/【开发】如何快乐的访问互联网资源 2671866cd30f8029a2b9f9d3cc1b1143",
      "zh/my-log/internet-access-guide",
    ],
  },
  // ---- seeking-job/campus ----
  {
    from: "zh/seeking-job/campus/【经验】秋招简历投递的最佳姿势.md",
    to: "zh/seeking-job/campus/campus-resume-tips-20250826.md",
    title: "秋招简历投递的最佳姿势",
    description: "秋招简历投递的最佳姿势与经验总结",
    date: "2025-08-26",
    category: "Career & Interview",
    series: "Campus Interview",
    tags: ["Experience"],
  },
  {
    from: "zh/seeking-job/campus/【面经】Fellou-AI-20250825 .md",
    to: "zh/seeking-job/campus/fellou-ai-interview-20250825.md",
    title: "Fellou AI 面经 2025-08-25",
    description: "Fellou AI 面试经历记录（2025-08-25）",
    date: "2025-08-25",
    category: "Career & Interview",
    series: "Campus Interview",
    tags: ["Interview Experience"],
  },
  {
    from: "zh/seeking-job/campus/【面经】Shopee面经-20250903.md",
    to: "zh/seeking-job/campus/shopee-interview-20250903.md",
    title: "Shopee 面经 2025-09-03",
    description: "Shopee 面试经历记录（2025-09-03）",
    date: "2025-09-03",
    category: "Career & Interview",
    series: "Campus Interview",
    tags: ["Interview Experience"],
  },
  {
    from: "zh/seeking-job/campus/【面经】京东企业与信息化部-20250905.md",
    to: "zh/seeking-job/campus/jd-enterprise-it-interview-20250905.md",
    title: "京东企业与信息化部面经 2025-09-05",
    description: "京东企业与信息化部面试经历记录（2025-09-05）",
    date: "2025-09-05",
    category: "Career & Interview",
    series: "Campus Interview",
    tags: ["Interview Experience"],
  },
  {
    from: "zh/seeking-job/campus/【面经】京东企业与信息化部-二面-20250909.md",
    to: "zh/seeking-job/campus/jd-enterprise-it-interview-round2-20250909.md",
    title: "京东企业与信息化部二面 2025-09-09",
    description: "京东企业与信息化部二面经历记录（2025-09-09）",
    date: "2025-09-09",
    category: "Career & Interview",
    series: "Campus Interview",
    tags: ["Interview Experience"],
  },
  {
    from: "zh/seeking-job/campus/【面经】原力灵机一面-20250917.md",
    to: "zh/seeking-job/campus/yuanli-lingji-interview-20250917.md",
    title: "原力灵机一面 2025-09-17",
    description: "原力灵机一面经历记录（2025-09-17）",
    date: "2025-09-17",
    category: "Career & Interview",
    series: "Campus Interview",
    tags: ["Interview Experience"],
  },
  {
    from: "zh/seeking-job/campus/【面经】梧桐花开-20251012 28a1866cd30f80fc9d69cba1bdf551f7.md",
    to: "zh/seeking-job/campus/wutong-huakai-interview-20251012.md",
    title: "梧桐花开面经 2025-10-12",
    description: "梧桐花开面试经历记录（2025-10-12）",
    date: "2025-10-12",
    category: "Career & Interview",
    series: "Campus Interview",
    tags: ["Interview Experience"],
  },
  {
    from: "zh/seeking-job/campus/【面经】美团AI面试-20250824 .md",
    to: "zh/seeking-job/campus/meituan-ai-interview-20250824.md",
    title: "美团 AI 面试 2025-08-24",
    description: "美团 AI 面试经历记录（2025-08-24）",
    date: "2025-08-24",
    category: "Career & Interview",
    series: "Campus Interview",
    tags: ["Interview Experience"],
  },
  // ---- en ----
  {
    from: "en/code-practice/leetcode/leetcode-1-two-sum.md",
    to: "en/code-practice/leetcode/leetcode-1-two-sum.md",
    title: "1. Two Sum",
    description: "LeetCode 1. Two Sum: walkthrough and solution",
    date: "2024-01-05",
    category: "Coding Practice",
    series: "LeetCode",
    tags: ["Easy"],
  },
];

// [oldDir, newDir] — asset dirs + the company-codeing-test typo fix
const DIR_RENAMES = [
  ["zh/cs-development/code-practice/company-codeing-test", "zh/cs-development/code-practice/company-coding-test"],
];

const q = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function frontmatter(r) {
  const lines = [
    "---",
    `title: ${q(r.title)}`,
    `description: ${q(r.description)}`,
    `date: ${r.date}`,
    `category: ${q(r.category)}`,
  ];
  if (r.series) lines.push(`series: ${q(r.series)}`);
  lines.push(
    r.tags.length
      ? "tags:\n" + r.tags.map((t) => `  - ${q(t)}`).join("\n")
      : "tags: []",
  );
  lines.push("icon: pen-to-square");
  if (r.article === false) lines.push("article: false");
  lines.push("---");
  return lines.join("\n");
}

const slugRe = /^[a-z0-9][a-z0-9-]*\.md$/;
const tagRe = /^[A-Za-z][A-Za-z0-9 .+#&-]*$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

// ---------- 1. validate ----------
const errors = [];
const seenTo = new Set();
const hasNewFm = (p) => readFileSync(rel(p), "utf8").startsWith('---\ntitle:');

// working path per row: current file if present, else `to` if it exists
// (resume after a partial run); row marked done if `to` already migrated.
const workPath = new Map();
const doneRows = new Set();

if (ARTICLES.length !== 34) errors.push(`expected 34 articles, got ${ARTICLES.length}`);

for (const [i, r] of ARTICLES.entries()) {
  const n = i + 1;
  if (existsSync(rel(r.from))) {
    workPath.set(r, r.from);
    if (r.from !== r.to && existsSync(rel(r.to)))
      errors.push(`#${n}: to already exists: ${r.to}`);
  } else if (existsSync(rel(r.to))) {
    if (hasNewFm(r.to)) {
      doneRows.add(r);
      console.log(`#${n}: already migrated, skipping (${r.to})`);
    } else {
      workPath.set(r, r.to);
      console.log(`#${n}: resuming partially-migrated file (${r.to})`);
    }
  } else {
    errors.push(`#${n}: from not found: ${r.from}`);
  }
  if (!slugRe.test(path.basename(r.to)))
    errors.push(`#${n}: bad slug: ${r.to}`);
  if (!CATEGORIES.includes(r.category))
    errors.push(`#${n}: unknown category: ${r.category}`);
  if (!dateRe.test(r.date)) errors.push(`#${n}: bad date: ${r.date}`);
  for (const t of r.tags)
    if (!tagRe.test(t)) errors.push(`#${n}: non-English tag: ${t}`);
  if (seenTo.has(r.to)) errors.push(`#${n}: duplicate to: ${r.to}`);
  seenTo.add(r.to);
}

const imgDirs = [];
for (const r of ARTICLES) if (r.imgDir) imgDirs.push(r.imgDir);
const allDirRenames = [...DIR_RENAMES, ...imgDirs].filter(([o, n]) => {
  if (!existsSync(rel(o)) && existsSync(rel(n))) {
    console.log(`DIR already renamed, skipping: ${n}`);
    return false;
  }
  return true;
});
for (const [oldDir, newDir] of allDirRenames) {
  if (!existsSync(rel(oldDir))) errors.push(`dir rename: old not found: ${oldDir}`);
  if (existsSync(rel(newDir))) errors.push(`dir rename: new already exists: ${newDir}`);
}

if (errors.length) {
  console.error(`VALIDATION FAILED (${errors.length}):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`validation OK: ${ARTICLES.length} articles, ${allDirRenames.length} dir renames`);

// ---------- 2. plan ----------
for (const [i, r] of ARTICLES.entries()) {
  const same = r.from === r.to ? " (keep name)" : "";
  console.log(
    `${String(i + 1).padStart(2)}. ${path.basename(r.from)} -> ${path.basename(r.to)}${same}\n     [${r.category}]${r.series ? ` series=${r.series}` : ""} tags=[${r.tags.join(", ")}] date=${r.date}`,
  );
}
for (const [o, n] of allDirRenames) console.log(`DIR ${o} -> ${n}`);

if (!APPLY) {
  console.log("\ndry run only — re-run with --apply to execute");
  process.exit(0);
}

// ---------- 3. apply ----------
const git = (...args) =>
  execFileSync("git", args, { stdio: ["ignore", "pipe", "inherit"] }).toString();

let warn = 0;
for (const r of ARTICLES) {
  if (doneRows.has(r)) continue;
  const from = workPath.get(r);
  let p = rel(from);
  if (from !== r.to) {
    git("mv", "--", "src/" + from, "src/" + r.to);
    p = rel(r.to);
  }

  let content = readFileSync(p, "utf8");

  // replace frontmatter block
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    console.error(`FATAL: no frontmatter in ${r.to}`);
    process.exit(1);
  }
  const end = content.indexOf("\n---", 4);
  const body = content.slice(end + 4).replace(/^\r?\n/, "");
  content = frontmatter(r) + "\n" + body;

  // strip leading H1 (title moved to frontmatter)
  const lines = content.split("\n");
  // find the closing "---" of the frontmatter block
  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") { closeIdx = i; break; }
  }
  // first non-empty body line
  let idx = -1;
  for (let i = closeIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() !== "") { idx = i; break; }
  }
  if (idx >= 0 && lines[idx].startsWith("# ")) {
    lines.splice(idx, 1);
    if (lines[idx] !== undefined && lines[idx].trim() === "") lines.splice(idx, 1);
  } else {
    console.warn(`  WARN: no leading H1 in ${r.to}`);
    warn++;
  }
  content = lines.join("\n");

  // rewrite asset-dir image links — links are relative, so match on the
  // directory basename in both raw and percent-encoded forms
  if (r.imgDir) {
    const [oldDir, newDir] = r.imgDir;
    const oldBn = path.basename(oldDir);
    const newBn = path.basename(newDir);
    const forms = [oldBn, encodeURIComponent(oldBn), encodeURI(oldBn)];
    let hits = 0;
    for (const f of new Set(forms)) {
      const parts = content.split(f + "/");
      hits += parts.length - 1;
      content = parts.join(newBn + "/");
    }
    if (!hits) console.warn(`  WARN: no image links rewritten in ${r.to}`);
    if (content.includes(oldBn) || content.includes(encodeURIComponent(oldBn)))
      console.warn(`  WARN: old dir ref still present in ${r.to}`);
  }

  writeFileSync(p, content);
  console.log(`ok: ${r.to}`);
}

for (const [o, n] of allDirRenames) {
  git("mv", "--", "src/" + o, "src/" + n);
  console.log(`dir ok: ${n}`);
}

// ---------- 4. post-check ----------
let bad = 0;
for (const r of ARTICLES) {
  const c = readFileSync(rel(r.to), "utf8");
  if (!c.startsWith('---\ntitle: "')) { console.error(`post-check fail: ${r.to}`); bad++; }
}
console.log(
  `\ndone: ${ARTICLES.length} articles migrated, ${allDirRenames.length} dirs renamed, ${warn} warnings, post-check ${bad === 0 ? "OK" : "FAILED"}`,
);
process.exit(bad ? 1 : 0);
