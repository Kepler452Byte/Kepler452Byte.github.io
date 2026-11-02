---
title: "读 DeepSeek Super-agent 源码：任务、Session 与执行生命周期如何分离"
description: "从 DeepSeek Super-agent 公开原型理解 Ticket、Assignment 与 Session 的分工，以及任务恢复、人机协作与 Agent Runtime 的设计。"
date: 2026-11-02
updated: 2026-11-02
category: AI
tags:
  - Agent
  - Agent Runtime
  - 架构
  - DeepSeek
draft: false
---

本文基于 DeepSeek Super-agent 公开研究原型的源码与文档，阅读版本为 2026-11-02 的 `main`；公开实现与内部版本及原文描述有所不同。

让 Agent 改一段代码，通常从打开一个对话开始。但代码写完以后，工作未必就结束了：PR 还在等评审，CI 可能没有跑完，明天还会有人提出修改意见。

Agent 可以暂时停下来，这件事却需要有人接着管。它现在进行到哪一步？下一条反馈应该交给谁？如果执行中途服务重启，又该从哪里继续？当这些信息都留在聊天记录里，我们就很容易把“接着做这件事”变成“回到那个 Session 里继续聊”。

读 DeepSeek 的 Super-agent 公开原型时，我最关注的就是它怎样处理这个问题：**让任务有自己的进度和生命周期，再由 Session 承担具体执行。** 上层管理系统记录进展、安排执行，Worker Session 保留执行时的对话与工具上下文。一轮执行结束后，系统仍能知道这件事是否完成、接下来需要做什么。

这个分工听起来直观，落到代码里却有不少细节。例如，任务独立管理后，重试还要不要沿用原来的 Session？下面先看整体区别，再沿着 Ticket、Assignment 和 Worker Session 的关系展开。

<div style="margin:24px 0;padding:22px;border:1px solid #94a3b8;border-radius:16px;">
<div style="margin-bottom:18px;font-size:18px;font-weight:700;">先看区别：任务状态由谁管理？</div>
<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:stretch;">
<div style="flex:1;min-width:240px;padding:18px;border:2px solid #d97706;border-radius:12px;">
<div style="color:#d97706;font-size:18px;font-weight:700;">传统对话式 Agent</div>
<div style="margin-top:8px;font-size:13px;">以 Session 为中心的常见组织方式</div>
<div style="margin-top:18px;padding:16px;border:1px dashed #d97706;border-radius:10px;">
<div style="font-weight:700;">Session</div>
<div style="margin-top:12px;padding:12px;border:1px solid #94a3b8;border-radius:8px;">任务目标、要求与进度</div>
<div style="margin-top:10px;padding:12px;border:1px solid #94a3b8;border-radius:8px;">对话历史与工具交互</div>
<div style="margin-top:10px;padding:12px;border:1px solid #94a3b8;border-radius:8px;">接下来做什么、等待谁回复</div>
</div>
<div style="padding:12px;text-align:center;">↓ Session 中断或更换</div>
<div style="font-size:14px;line-height:1.8;">若缺少独立任务记录，需要从对话历史或人工交接中重新确认工作进展。</div>
</div>
<div style="flex:1;min-width:240px;padding:18px;border:2px solid #059669;border-radius:12px;">
<div style="color:#059669;font-size:18px;font-weight:700;">Super-agent 原型</div>
<div style="margin-top:8px;font-size:13px;">任务管理与执行上下文分开承担职责</div>
<div style="margin-top:18px;padding:16px;border:2px solid #7c3aed;border-radius:10px;">
<div style="color:#7c3aed;font-weight:700;">上层管理系统 + 持久化 Ticket</div>
<div style="margin-top:10px;font-size:14px;line-height:1.8;">任务目标与授权 · 输入与派工记录<br>进展与等待条件 · 消息路由</div>
</div>
<div style="padding:12px;text-align:center;">↓ Assignment 派工与输入投递 ↑ 执行报告</div>
<div style="padding:16px;border:2px solid #059669;border-radius:10px;">
<div style="color:#059669;font-weight:700;">Worker Session</div>
<div style="margin-top:10px;font-size:14px;line-height:1.8;">保留对话历史与工具交互<br>执行具体工作，按需调用 Sub-agent</div>
</div>
<div style="margin-top:14px;font-size:14px;line-height:1.8;">执行暂停或中断后，任务记录仍保留；系统依据任务状态与执行环境安排继续工作。</div>
</div>
</div>
<div style="margin-top:16px;color:#64748b;font-size:13px;line-height:1.8;">左侧是便于理解的对照模型，并不代表所有传统 Agent；传统系统也可以有独立任务管理。右侧强调管理职责分离，DeepSeek 原型在重试时通常复用同一 Worker Session，并未把全部执行上下文搬到上层。</div>
</div>

## 原型中的几个核心术语

仓库用下面这些概念组织任务的接收、执行与后续协作。先记住 Ticket 是工作本身、Assignment 是一次派工，其余概念可以在读到具体流程时回看。

| 术语         | 中文名称 | 含义与作用                                                                          |
| ------------ | -------- | ----------------------------------------------------------------------------------- |
| Ticket       | 工单     | 一项经过授权的工作，独立记录任务状态、输入、返回渠道和派工历史。                    |
| Mandate      | 授权     | 接单时确定的工作范围与授权依据，限定这项工作可以做到哪里。                          |
| Assignment   | 派工     | Ticket 与一个执行器实例的绑定记录；重试或恢复可以产生新派工，但不一定更换 Session。 |
| Executor     | 执行器   | 接受派工，启动或继续 Worker Session，并将执行情况报告给任务管理层。                 |
| Trigger      | 触发事件 | 从 GitHub、飞书等来源收到的一条事件，例如请求、后续评论或 CI 结果。                 |
| Eval         | 评估     | 对事件进行准入检查与模型研判，决定是否接单、忽略或停止工作。                        |
| Subscription | 订阅     | Ticket 与讨论线程的关联，让后续消息能够送达对应任务。                               |
| Report       | 执行报告 | Worker 提交的结构化进展或结果，帮助系统判断继续执行、等待人工还是结束工作。         |

## 为什么需要单独记录任务？

把工作进展留在一个长期 Session 中，能够保留细节，却也会让后续执行越来越依赖那段对话。为每项工作创建新 Session，便于隔离与并行，但又需要解决输入、决策与进度的衔接。

独立的任务记录提供了一个稳定入口：无论执行者是在运行、等待回复还是中断，系统都能查询任务状态，再决定如何继续。它不替代 Session 的对话历史，而是承担任务管理所需的那部分信息。

## 一条请求如何变成可执行的任务

这个原型面向单个 GitHub 仓库，接收 GitHub 和可选的飞书事件。外部事件形成 Trigger，经过准入与评估，接受的工作成为 Ticket，再通过 Assignment 交给 Executor。

<div style="margin:24px 0;padding:22px;border:1px solid #94a3b8;border-radius:16px;">
<div style="margin-bottom:18px;font-size:18px;font-weight:700;">01 · 从外部事件到执行结果</div>
<div style="flex:1;min-width:160px;padding:16px;border:2px solid #2563eb;border-radius:12px;"><div style="color:#2563eb;font-size:17px;font-weight:700;">Sources：GitHub / 飞书</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">Issue、PR、评论、CI 或聊天消息</div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ Trigger 进入准入与评估</div><div style="display:flex;flex-wrap:wrap;gap:12px;"><div style="flex:1;min-width:160px;padding:16px;border:2px solid #2563eb;border-radius:12px;"><div style="color:#2563eb;font-size:17px;font-weight:700;">Main Session / Assessor</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">理解请求、研判是否接单</div></div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #7c3aed;border-radius:12px;"><div style="color:#7c3aed;font-size:17px;font-weight:700;">Engine + Policy</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">检查规则，事务性地变更领域状态</div></div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ 接单后创建授权工作单元</div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #7c3aed;border-radius:12px;"><div style="color:#7c3aed;font-size:17px;font-weight:700;">Ticket + Mandate</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">记录工作范围、授权依据、输入与返回渠道</div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ 通过 Assignment 派工</div><div style="display:flex;flex-wrap:wrap;gap:12px;"><div style="flex:1;min-width:160px;padding:16px;border:2px solid #059669;border-radius:12px;"><div style="color:#059669;font-size:17px;font-weight:700;">Worker Session A</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">Ticket A 的执行上下文</div></div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #059669;border-radius:12px;"><div style="color:#059669;font-size:17px;font-weight:700;">Worker Session B</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">Ticket B 的执行上下文</div></div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ Report / Channel / Outbox</div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #d97706;border-radius:12px;"><div style="color:#d97706;font-size:17px;font-weight:700;">结果回到原始协作渠道</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">提交 PR、交付结果，或提出需要人回答的问题</div></div>
<div style="margin-top:16px;color:#64748b;font-size:13px;line-height:1.7;">示意图按仓库职责整理。SQLite 持久化贯穿管理与投递流程；它不是只在执行结束时保存结果。</div>
</div>

Main Session 参与请求研判与任务路由，Worker Session 承担具体工作。任务管理还依赖一组软件组件：`Engine` 统一更新事件、工单和派工等状态，Policy 提供接单与授权规则，存储与执行适配器负责保存数据和执行外部操作。

例如，接受一个请求时，Ticket、授权与初始派工需要一起创建。`Engine` 用数据库事务保证这些记录一致，再由适配器执行已记录的外部操作。模型负责研判请求，代码负责落实决策并维护约束。

因此，理解这套架构时，需要同时看上层 Agent 的判断，以及支撑它的任务规则、存储和调度代码。[架构文档](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/007-architecture.md) · [Engine 源码](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/core/engine.ts)

## Ticket、Assignment 和 Session 如何分工？

阅读这个仓库时，我认为最值得分清的是三个对象：

| 对象       | 回答的问题                     | 在原型中的职责                                    |
| ---------- | ------------------------------ | ------------------------------------------------- |
| Ticket     | 这是什么工作，现在进展如何？   | 持有任务状态、输入、渠道和派工记录，引用授权      |
| Assignment | 当前由哪个执行器实例承担工作？ | 记录派工绑定，以及 pending、running、ended 等状态 |
| Session    | 执行者通过什么上下文开展工作？ | 承载对话历史、模型与工具交互                      |

Ticket 被定义为“一项经过授权的工作”。其 Mandate 记录授权依据和范围。新的上下文不会自动扩大工作授权；扩大范围应产生新的 Ticket。

领域文档明确规定，Ticket 应当有自己的状态，因为工作可能被移交或恢复。例如，Worker 停止运行时，Ticket 可能仍在等待评审；执行器出错后，Ticket 也需要保留进度，供后续重试使用。[领域模型](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/001-domain.md)

<div style="margin:24px 0;padding:22px;border:1px solid #94a3b8;border-radius:16px;">
<div style="margin-bottom:18px;font-size:18px;font-weight:700;">02 · Ticket、Assignment 与 Session</div>
<div style="flex:1;min-width:160px;padding:16px;border:2px solid #7c3aed;border-radius:12px;"><div style="color:#7c3aed;font-size:17px;font-weight:700;">Ticket：持续存在的工作</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">持有任务状态、授权、输入及派工记录</div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ 先后经历多次派工</div><div style="display:flex;flex-wrap:wrap;gap:12px;"><div style="flex:1;min-width:160px;padding:16px;border:2px solid #2563eb;border-radius:12px;"><div style="color:#2563eb;font-size:17px;font-weight:700;">Assignment 1</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">首次执行</div></div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #2563eb;border-radius:12px;"><div style="color:#2563eb;font-size:17px;font-weight:700;">Assignment 2</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">失败后重试</div></div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #2563eb;border-radius:12px;"><div style="color:#2563eb;font-size:17px;font-weight:700;">Assignment 3</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">中断后恢复</div></div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ 此原型通常复用同一个 Session</div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #059669;border-radius:12px;"><div style="color:#059669;font-size:17px;font-weight:700;">Worker Session：worker-&lt;ticket id&gt;</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">保留对话历史；重试沿用工作目录、分支和 PR</div></div>
<div style="margin-top:16px;color:#64748b;font-size:13px;line-height:1.7;">这是时间上的先后关系，不表示同一 Ticket 同时交给三个 Worker。新 Assignment 不等于新 Session。</div>
</div>

## 新派工不等于新 Session

看到 Ticket 与 Assignment 分开，很容易继续推导：每次重试都新建一个 Session，再从任务记录重建上下文。

不过，这个原型的常规重试会沿用已有 Session。

代码按 Ticket 生成稳定的 Session ID：

```ts
export const workerSessionId = (ticketId: string): string =>
  `worker-${ticketId}`
```

`DshExecutor` 使用这个 ID 确保对应 Session 存在，再投递派工消息。对于后续 Assignment，它还检查 Session 是否保留最初的派工信息，决定是否需要补充完整输入。

执行文档明确说明：重试创建新的 Assignment，但沿用同一 Session、目录、分支与 Pull Request。

**任务状态独立管理，与保留已有 Session 上下文可以同时成立。** 这里实现了管理职责的分离，Worker 仍会利用已有对话继续工作。[执行器源码](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/executor/dsh.ts) · [执行文档](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md)

## Super-agent 之下，Sub-agent 依然存在

这个实现允许 Worker 使用 Sub-agent，也允许嵌套 Sub-agent。

在我的理解中，上层管理与内部委派关注不同问题：上层判断工作是否被接受、应交给谁以及何时推进；Worker 内部则决定怎样拆分和协作完成具体工作。

<div style="margin:24px 0;padding:22px;border:1px solid #94a3b8;border-radius:16px;">
<div style="margin-bottom:18px;font-size:18px;font-weight:700;">03 · 管理层与执行层内部委派</div>
<div style="flex:1;min-width:160px;padding:16px;border:2px solid #2563eb;border-radius:12px;"><div style="color:#2563eb;font-size:17px;font-weight:700;">Main Session + 任务管理组件</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">评估请求、路由工作，管理任务推进</div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ 将不同 Ticket 交给执行器</div><div style="display:flex;flex-wrap:wrap;gap:12px;"><div style="flex:1;min-width:160px;padding:16px;border:2px solid #059669;border-radius:12px;"><div style="color:#059669;font-size:17px;font-weight:700;">Worker A · Session A</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">执行 Ticket A</div></div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #059669;border-radius:12px;"><div style="color:#059669;font-size:17px;font-weight:700;">Worker B · Session B</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">执行 Ticket B</div></div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ Worker 内部按需调用</div><div style="display:flex;flex-wrap:wrap;gap:12px;"><div style="flex:1;min-width:160px;padding:16px;border:2px solid #d97706;border-radius:12px;"><div style="color:#d97706;font-size:17px;font-weight:700;">Sub-agent A1 / A2</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">拆分和协作完成局部工作</div></div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #d97706;border-radius:12px;"><div style="color:#d97706;font-size:17px;font-weight:700;">Sub-agent B1</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">承担具体子任务</div></div></div>
<div style="margin-top:16px;color:#64748b;font-size:13px;line-height:1.7;">层级图表达委派关系。Super-agent 架构仍可使用 Sub-agent；具体工作并不要求全部经过三层。</div>
</div>

因此，Super-agent 并没有取代 Sub-agent。Worker 可以按需调用子执行者，某个子任务结束，也不会自动意味着整个 Ticket 已经完成。[Worker 执行规则](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md)

## 中断后，如何避免重复执行？

持续执行任务时，恢复过程尤其需要处理已经发生的外部操作。

假设 Agent 已经向 GitHub 推送代码，还没记录结果，服务就重启了。如果恢复后只重复上一条指令，就可能再次执行已经完成的外部操作。

这个原型在恢复提示中要求执行器检查当前工作目录、Git 历史和 GitHub 状态，避免重复已完成的外部操作。运行中的 Assignment 会结束，新的 Assignment 带着恢复提示接续执行。

SQLite 保存任务相关的结构化状态；待执行操作也会先持久化，再由执行机制处理，并按规则重试。Session 历史则由 Harness 的 Session 机制保留，不能把所有恢复能力都归于任务数据库。

恢复时，需要核对系统记录的进度与外部系统的实际结果。

一段对话摘要可以帮助 Agent 理解背景，却不能单独证明代码是否推送成功、消息是否发送、PR 是否创建。持久化与重试机制也不会自动保证所有外部操作只执行一次。例如，创建 PR 前应检查是否已经存在对应 PR，重发消息前需要核对发送记录。具体保证取决于每类操作的设计。[恢复提示源码](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/core/assignments.ts) · [SQLite 存储](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/app/store.ts)

## 等待人工回复时，任务如何继续？

Worker 遇到需要人澄清的问题，或提交 PR 等待评审时，工作会暂时停下来。系统需要记录任务在等什么，并在收到回复后安排后续执行。

在这个原型中，Worker 通过结构化问题请求人工回答。交接给人时，系统释放 Worker 槽位，保留任务记录与 Session；收到回复后，再按规则调度执行。有关联 PR 时，`ready` 通常表示结果已可评审，是否完成任务还要结合 PR 状态判断。

<div style="margin:24px 0;padding:22px;border:1px solid #94a3b8;border-radius:16px;">
<div style="margin-bottom:18px;font-size:18px;font-weight:700;">04 · 工作暂停，任务继续存在</div>
<div style="flex:1;min-width:160px;padding:16px;border:2px solid #059669;border-radius:12px;"><div style="color:#059669;font-size:17px;font-weight:700;">Worker 执行</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">占用活跃 Worker 槽位</div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ 结构化提问或报告 ready</div><div style="display:flex;flex-wrap:wrap;gap:12px;"><div style="flex:1;min-width:160px;padding:16px;border:2px solid #d97706;border-radius:12px;"><div style="color:#d97706;font-size:17px;font-weight:700;">需要人工回答</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">等待澄清、选择或补充信息</div></div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #d97706;border-radius:12px;"><div style="color:#d97706;font-size:17px;font-weight:700;">等待 PR 评审</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">已产出可评审结果</div></div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ 交接给人，释放 Worker 槽位</div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #7c3aed;border-radius:12px;"><div style="color:#7c3aed;font-size:17px;font-weight:700;">Ticket 与 Session 保留</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">任务状态继续存在；不需要持续占用活跃执行资源</div></div><div style="padding:10px;text-align:center;color:#64748b;font-size:14px;">↓ 回复或相关事件到达；按规则调度</div><div style="flex:1;min-width:160px;padding:16px;border:2px solid #059669;border-radius:12px;"><div style="color:#059669;font-size:17px;font-weight:700;">继续执行或确认结束</div><div style="margin-top:8px;font-size:14px;line-height:1.7;">处理反馈；结合报告和相关 PR 状态判断结果</div></div>
<div style="margin-top:16px;color:#64748b;font-size:13px;line-height:1.7;">流程为常见路径的简化示意。ready 不总是等待评审：没有 PR 的 ready 报告可以直接完成任务。</div>
</div>

执行暂停、等待人工和任务完成，在这里对应不同的处理方式。

等待评审的任务需要继续存在，却没有必要一直占用活跃执行资源。反过来，不能把所有空闲都当成等待人工：如果后台 Job 或 Sub-agent 还在运行，系统会按后台执行规则判断它是否仍在工作，以及是否继续占用槽位。[执行与交付规则](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md)

## 目录独立，不代表安全隔离

每个 Ticket 有自己的目录，但这不能等同于独立沙箱。

执行文档说明，Worker 以操作者的操作系统用户运行命令；目录与命令包装建立的是默认行为，不构成安全边界。

因此，在借鉴架构时，需要分别看待上下文隔离、工作目录组织和权限隔离。不同 Session 不代表不同权限，独立目录也不代表独立容器。通用多租户环境还需要额外设计执行隔离与凭证边界。[执行环境说明](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md)

## 设计 Agent Runtime 时，需要补上什么？

这个原型让我更清楚地看到，Session 管理与任务管理需要回答不同的问题。Session 保留执行上下文，Assignment 记录派工关系，Ticket 则跟踪工作从接收到完成的整个过程。

由此带来的架构启发是：Runtime 可以负责模型调用、工具执行、消息投递和 Session 恢复，而任务管理层还需要回答：

- 这项工作为什么可以做，授权范围是什么？
- 当前在等什么，哪些输入还没有处理？
- 执行中断后，应当怎样继续？
- 什么条件下才算完成？

请求是否属于当前任务，需要模型理解；派工记录是否有效、输入是否投递、状态如何更新，则需要代码维护明确规则。通用长期记忆与大规模分布式调度仍是另外需要解决的问题。

当任务比一次对话活得更久，系统就需要持续记录目标、授权、输入、执行进度和尚未解决的问题。对我而言，这个原型最值得借鉴的地方，就是让这些信息有明确的归属，使下一次执行能够围绕同一项工作继续推进。

## 源码阅读入口

建议先读领域模型与执行文档，再对照 Engine 和执行器源码查看具体行为。

- [README：原型定位与适用边界](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/README.md)
- [001 Domain model：理解核心对象](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/001-domain.md)
- [003 Execution：执行、重试与恢复](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md)
- [007 Architecture：模块职责](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/007-architecture.md)
- [src/core/engine.ts：事务与状态变更入口](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/core/engine.ts)
- [src/executor/dsh.ts：Worker Session 与派工执行](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/executor/dsh.ts)
