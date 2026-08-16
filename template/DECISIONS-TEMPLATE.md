# DECISIONS

> append-only 决策日志：记录「为什么这么做、何时改的」。当前稳定模型（what）在 `SPEC.md`，不在这里。

## 规则

- 用户确认一项非显然决策 → 追加一条，最新在上。
- 过时只标注 `> Superseded YYYY-MM-DD HH:MM by：<较新条目标题>`，不删不重写。
- 一条一两行（Decision / Why / Impact），不做 formal ADR 的模板负担。
- 域内决策放本文件（贴近代码）；跨域 / 系统级决策放仓库根 `DECISIONS.md`。
- 时间戳精确到分钟（本地时间，便于和 git commit 对齐）；仅回溯、不知具体时间时用 `YYYY-MM-DD`，不要编造分钟。

## 条目格式

```markdown
## YYYY-MM-DD HH:MM — 标题
- **Decision**：结论（一句话）
- **Why**：背景与取舍
- **Impact**：影响范围 / 触及模块
- **Supersedes**：<旧条目标题>（可选）
```

---

<!-- 最新条目加在下方，旧的依次往下 -->
