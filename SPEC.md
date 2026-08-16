# Blog Agent Guide

## 1. 内容结构

每篇文章使用：

```yaml
---
title:
description:
date:
updated:
category:
series:
tags: []
draft: true
---
```

核心规则：

> Category 管领域，Series 管专题，Tags 管关键词。

---

## 2. Category

* 每篇文章只能有一个 Category。
* Category 必须是长期稳定的领域。
* 总量建议保持在 5～10 个。
* 不要把具体技术作为 Category。

推荐：

```text
Agent Engineering
Backend & Systems
Data & AI
Infra & DevOps
History
Literature
Philosophy
Ideas
```

新建 Category 前，优先复用已有分类。

---

## 3. Series

* Series 可选。
* 一篇文章最多一个 Series。
* 只有预计存在至少 3 篇相关内容时才建立。
* Series 表示连续专题，不是普通关键词。

例如：

```text
Agent Runtime
MCP Gateway
Roman History
Existentialism
```

---

## 4. Tags

* 每篇文章建议 2～5 个 Tags。
* Tags 用于描述具体技术、概念、人物、协议、作品等。
* 优先使用已有 Tag。
* 同一概念只保留一个名称。

例如：

```text
PostgreSQL
```

不要同时出现：

```text
Postgres
PG
pgsql
```

---

## 5. Agent 分类流程

处理文章时按顺序判断：

```text
1. 主要属于哪个长期领域？
   → Category

2. 是否属于已有连续专题？
   → Series

3. 具体涉及哪些关键词？
   → 2～5 个 Tags
```

优先级：

```text
复用已有结构
> 新增 Tag
> 新增 Series
> 新增 Category
```

---

## 6. 创建文章

创建新文章时：

1. 检查已有 Category / Series / Tags。
2. 选择一个 Category。
3. 判断是否需要 Series。
4. 选择 2～5 个 Tags。
5. 生成简洁 description。
6. 使用稳定 slug。
7. 默认 `draft: true`。

---

## 7. 编辑文章

编辑已有文章时：

* 保持原 slug 和 URL 稳定。
* 更新 `updated`。
* 不随意修改 Category。
* 不随意改变文章核心观点。
* 可以修复 Markdown、Front Matter、Tag 命名和内部链接。

---

## 8. 维护博客

定期检查：

* 重复或同义 Tags
* 只有 1 篇文章的 Series
* 过细的 Category
* 缺失的 Front Matter
* 失效内部链接
* 可以合并的重复内容

批量修改前先给出修改计划，不直接重构。

---

## 9. 最终原则

```text
Category：少而稳定
Series：按需增长
Tags：灵活但统一
```
目标不是增加更多分类，而是让博客长期保持简单、可搜索、可维护。

