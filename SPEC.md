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
tags: []
draft: true
---
```

核心规则：

> Category 管领域，目录与分类页承载子分类，Tags 管关键词。

---

## 2. Category

* 每篇文章只能有一个 Category。
* Category 必须是长期稳定的领域。
* 总量建议保持在 5～10 个。
* 不要把具体技术作为 Category。

当前中文博客导航与 Campfire `myblog` 顶层领域同名：

```text
后端开发
前端开发
AI
  ├── 大模型应用
  ├── Agent 工程
  └── AI 工具与实践
DevOps
算法与练习
求职面试
我的日志
```

子分类与 Campfire 对应同名领域：后端开发下为 Python 深入解析、Python 工程实践、生产工程实践；算法与练习下为力扣练习、企业笔试；求职面试下为校园招聘面试；我的日志下为个人月记。Campfire 另有独立“选题”领域，不映射博客栏目或自动导出。

AI 文章统一使用 `category: AI`；三个子分类由目录与分类页承载，Campfire 使用同名子领域。其他历史文章分类本轮不批量调整。MCP、Agent Runtime 等具体主题用标签表达，不另设 AI 顶层分类。

博客目录迁移必须保留文章原有 slug 与公开 URL；可通过 `permalink` 固定原地址，分类入口使用重定向保持可访问。

新建 Category 前，优先复用已有分类。

---

## 3. Tags

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

## 4. Agent 分类流程

处理文章时按顺序判断：

```text
1. 主要属于哪个长期领域？
   → Category

2. 应放入该领域的哪个现有子分类？
   → 目录与分类页

3. 具体涉及哪些关键词？
   → 2～5 个 Tags
```

优先级：

```text
复用已有结构
> 新增 Tag
> 新增 Category
```

---

## 5. 创建文章

创建新文章时：

1. 检查已有 Category、子分类目录和 Tags。
2. 选择一个 Category。
3. 选择合适的现有子分类目录。
4. 选择 2～5 个 Tags。
5. 生成简洁 description。
6. 使用稳定 slug。
7. 默认 `draft: true`。开发服务可预览；生产构建必须排除标记为 `draft: true` 的页面。同步草稿不等于发布。

---

## 6. 编辑文章

编辑已有文章时：

* 保持原 slug 和 URL 稳定。
* 更新 `updated`。
* 不随意修改 Category。
* 不随意改变文章核心观点。
* 可以修复 Markdown、Front Matter、Tag 命名和内部链接。

---

## 7. 维护博客

定期检查：

* 重复或同义 Tags
* 过细的 Category
* 缺失的 Front Matter
* 失效内部链接
* 可以合并的重复内容

批量修改前先给出修改计划，不直接重构。

---

## 8. 最终原则

```text
Category：少而稳定
子分类：由目录与分类页承载
Tags：灵活但统一
```
目标不是增加更多分类，而是让博客长期保持简单、可搜索、可维护。

