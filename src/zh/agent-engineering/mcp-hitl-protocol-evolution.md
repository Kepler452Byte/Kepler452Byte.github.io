---
title: "MCP HITL 的协议演进：从反向请求到「返回再重试」"
description: "用同一台 Server 同时服务两个协议时代的客户端做实验，把 MCP 2025-11-25 与 2026-07-28 的 Human-in-the-Loop 机制差异讲清楚：为什么 server 主动发请求的 elicitation 会被废弃，guard 模式和 request_state 又解决了什么问题。"
date: 2026-08-30
category:
  - "Agent Engineering"
  - "MCP"
tags:
  - "MCP"
  - "HITL"
  - "Protocol Design"
  - "Elicitation"
icon: user-check
---

Human-in-the-Loop（HITL）是 Agent 工具调用里最敏感的一环：模型想执行一个危险操作，谁来拦、怎么拦、拦下来之后流程怎么恢复。MCP 在两个协议版本里给了两个答案，而且是**方向相反**的两个答案。

我最近做了一个实验：用 fastmcp 分别搭了协议 `2025-11-25` 和 `2026-07-28` 的两个 HTTP Server，各自实现同一组 HITL 工具，再让一台新版 Server 同时兼容两个时代的客户端。这篇文章是实验之后沉淀下来的理解。

## 两个时代，两种 HITL

先建立一个共同的背景：MCP 的 Client-Server 通信底层是 JSON-RPC，HTTP 传输下每个 `tools/call` 是一次独立的 POST。在 `2025-11-25` 及更早的版本里，连接以一次 `initialize` 握手开始，双方在握手时交换能力（capabilities）——Client 要在 `ClientCapabilities` 里声明 `elicitation` 能力，Server 才被允许向这个 Client 发起提问（规范原文是 MUST 级别的约束）。这是旧方案成立的前提：**协议层面存在一个反向通道，且握手时就已经协商好了**。

值得注意的是，握手协商的不只是「能不能问」，还有「用什么模式问」：`2025-11-25` 的 elicitation 有两种 mode——`form`（表单，数据经过客户端）和 `url`（把用户带到外部 URL 完成敏感操作，数据不经过客户端，典型场景是 OAuth 和支付）。Client 声明能力时至少要支持一种，Server 不得发送 Client 未声明支持的 mode。本文讨论的 HITL 主要是 form mode。

### 2025-11-25：Server 反向发起请求

旧协议下，工具执行到一半需要人确认时，Server 主动向 Client 发一个 server-initiated JSON-RPC 请求 `elicitation/create`，然后**阻塞等待**应答：

```text
Client ──tools/call（Request #1）────────▶ Server
Client ◀──elicitation/create（Request #2，反向）─ Server
    （人类思考、点按钮）
Client ──ElicitResult（Response #2）────▶ Server
Client ◀──工具最终结果（Response #1）───── Server
```

注意这里发生在同一条 HTTP 连接上：`tools/call` 的响应（#1）还没有返回，Server 就要先「借」这条连接发一个自己的请求（#2）。也就是说，**一次 HTTP POST 的生命周期内嵌套了一次完整的反向 RPC**。人类不点按钮，这个 POST 就一直挂着。

线上传输的内容大致是：

```json
// Server → Client（反向请求）
{
  "jsonrpc": "2.0", "id": 42,
  "method": "elicitation/create",
  "params": {
    "message": "确认对 prod 环境执行变更吗？",
    "requestedSchema": { "type": "object", "properties": { "...": "..." } }
  }
}
// Client → Server（应答）
{ "jsonrpc": "2.0", "id": 42,
  "result": { "action": "accept", "content": { "decision": "approve" } } }
```

客户端要做的事是注册一个 handler，收到反向请求时弹 UI、等人、回填：

```python
async def human_decision(message, response_type, params, context):
    answer = await my_ui.confirm(message, response_type)
    return ElicitResult(action="accept", content=answer)
```

服务端代码则非常直觉，就是一问一答——`await` 挂起，醒来时答案已经在手里：

```python
result = await ctx.elicit("确认对 prod 环境执行变更吗？",
                          response_type=ConfirmDecision)
if result.action != "accept" or result.data.decision != "approve":
    return "REFUSED"
return "APPLIED"
```

`response_type` 是一个 pydantic 模型，框架把它编译成 JSON Schema 发过去，答案回来再反序列化成模型实例——所以服务端可以类型安全地写 `result.data.decision`。`action` 有三种取值，规范的定义比字面更细：`accept`（用户明确提交了数据，`content` 必须符合 schema）、`decline`（用户明确拒绝，点了「Reject / No」这类按钮）、`cancel`（用户没做选择就关掉了——关对话框、点外面、按 Esc、页面加载失败都算）。后两种都要当作「未获批」处理，但语义上一个是「说不」，一个是「没说」。

规范对 `requestedSchema` 也做了刻意的收紧：**只允许扁平对象的原始类型属性**，具体是四种 schema——string（支持 `email` / `uri` / `date` / `date-time` 四种 format）、number、boolean、enum（单选和多选，可带标题）。嵌套结构、对象数组、其它高级 JSON Schema 特性全部不支持，理由写在规范里：「simplify client user experience」——客户端要能拿任何合法 schema 直接渲染表单，复杂度必须封顶。另外所有原始类型都支持 `default`，客户端 SHOULD 用默认值预填表单。

这套模型对「桌面助手」场景是完美的：连接本来就在人手边，弹个窗等人是自然语义。问题出在它对部署形态的三个隐含假设上——下一节展开。

### 2026-07-28：返回 input_required，客户端重试

新协议（SEP-2322 MRTR，Multi Round-Trip Requests）下，Server **永远不主动发请求**。规范在 MRTR 页开头的 Note 里说得非常直白：此前所有 server-initiated 请求——`elicitation/create`、`sampling/createMessage`、`roots/list`——都改用 MRTR 模式，「旧的服务端主动发请求模式不再支持，这是 breaking change」。连带地，`initialize` 握手整个被移除了（SEP-2575）：每个请求在 `_meta` 里自带协议版本和 Client 能力，`elicitation` 支持与否不再是一次性的握手约定，而是逐请求声明。

工具需要人输入时，直接返回一个 `resultType: input_required` 的结果，表单内嵌在 `inputRequests` 里；Client 收集人类输入后，用**新的 Request ID** 重试原始调用（规范明确要求两次请求的 JSON-RPC `id` 必须不同，因为它们是完全独立的请求），并附上 `inputResponses`：

```text
Client ──tools/call（第 1 轮）───────────▶ Server
Client ◀──input_required + 表单 ────────── Server
    （人类思考，隔多久都行；连接断了也行）
Client ──tools/call（第 2 轮，带答案）────▶ Server
Client ◀──工具最终结果 ─────────────────── Server
```

第一轮返回的线上内容：

```json
{
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "confirm": {
        "method": "elicitation/create",
        "params": {
          "message": "确认对 prod 环境执行变更吗？",
          "requestedSchema": { "...": "同旧的 schema 格式" }
        }
      }
    },
    "requestState": "prod"
  }
}
```

三个细节值得注意：

- `inputRequests` 是一个 **key → 请求** 的映射，key 是 Server 自己分配的标识符（规范要求在单个请求范围内唯一），一次可以问多个问题（比如「选环境」+「填理由」），客户端逐个收集后一起回填。值不限于 elicitation——`sampling/createMessage`、`roots/list` 也走同一个信封，MRTR 是统一的「向 Client 要信息」机制。
- 每个请求的 `method` 仍然是 `elicitation/create`，`params` 也复用旧格式——**表单这个数据结构没有变，变的只是传输方向**：从「Server 推给 Client 的请求」变成了「Server 结果里携带的数据」。
- `resultType` 是所有结果都必带的字段：`complete`（正常完成）/ `input_required`（等人）/ `task`（任务化句柄）。普通工具、HITL 工具、长任务工具在结果层面统一成了同一个模型。向后兼容规则也写进了规范：遇到旧协议 Server 返回的、缺这个字段的结果，客户端必须当作 `complete` 处理。
- `InputRequiredResult` 只允许出现在三个请求上：`tools/call`、`prompts/get`、`resources/read`。其它请求上一律 MUST NOT。

第二轮重试时，客户端把答案放进 `inputResponses`（key 与 `inputRequests` 一一对应），并原样带回 `requestState`：

```json
{
  "method": "tools/call",
  "params": {
    "name": "test_hitl_confirm",
    "arguments": { "env": "prod" },
    "inputResponses": {
      "confirm": { "action": "accept", "content": { "decision": "approve" } }
    },
    "requestState": "prod"
  }
}
```

服务端改成 guard 模式——函数入口先检查「有没有人类的回答」：

```python
if ctx.input_responses is None:
    return InputRequiredResult(
        input_requests={"confirm": form},
        request_state=env)          # 跨轮次状态

answer = ctx.input_responses["confirm"]
# 从这里继续执行
```

读出来会发现一个微妙的事实：第二轮里 `env` 这个参数客户端也会重新传一遍（`arguments` 原样重发），所以这个简单例子里 `request_state` 显得多余。它真正的用武之地是**参数装不下的中间状态**——第 1 轮已经查出来的数据、工具自己生成的 token、执行到哪一步的标记。凡是「重试时需要、但又不该让客户端随便改」的东西，都放行李箱。

规范对这只行李箱的定义比「带状态回传」严格得多。`requestState` 被定义为一个 **opaque string**——客户端 MUST NOT 查看、解析、修改或对其内容做任何假设，只许原样带回（第一轮没有给，重试时就也不许带）。而 Server 侧必须把它当作 **attacker-controlled input**：一旦它影响授权、资源访问或业务逻辑，就必须做完整性保护（HMAC 或 AEAD——规范自己的示例值就叫 `"AEAD-protected blob"`），并且建议在保护载荷里放三样东西防重放：认证主体（换个人带回来就拒绝）、短 TTL（过期即拒绝）、原始请求的标识摘要（挪到别的请求上用就拒绝）。规范甚至预判了边角：这些措施能限定重放窗口，但保证不了「一次性消费」——真正的一次性语义必须 Server 自己在内存里记账。

另外两条 MUST 值得记下，因为它们塑造了正确的服务端心态：Server **不得假设客户端一定会重试**（客户端可能收集完答案就消失了，也可能反复触发同一个请求让 Server 反复弹表单）；Client 少交了某个答案时，Server 应该**再返回一次 `InputRequiredResult` 把缺的要素回来，而不是报错**。

## 为什么方向反转：无状态化

表面看，反向请求的旧方案「更好写」，为什么废弃？根子在于 `2026-07-28` 的核心主题：**协议无状态化**。这不只是 elicitation 一个特性的事，整份 changelog 都在围绕它动刀——`Mcp-Session-Id` 会话头被移除（SEP-2567），`initialize` 握手被移除、协议版本和塞进每个请求的 `_meta`（SEP-2575），SSE 断线重连的消息重投递也被移除，「断掉的响应流等于丢掉在途请求，客户端必须用新 Request ID 重发」。在这个大方向下，「Server 挂着连接等人」的 HITL 是最格格不入的一块。

旧方案的「阻塞等待」隐含了三个前提：

1. **连接必须活着**。`elicitation/create` 是一次反向 RPC，挂在同一个 HTTP 连接上等人。人 10 分钟后才点按钮，这个连接就要挂 10 分钟。
2. **Session 必须活着**。跨轮次的中间状态（工具执行到哪、参数是什么）存在 MCP session 里，session 断了上下文就丢了。
3. **Server 必须可寻址**。Server 要能「主动」发请求，意味着它不是纯粹的请求-响应服务。

这三条与 Serverless、CDN 边缘、网关后面的横向扩展全部冲突。新方案把「等人」这个动作从协议层挪走：Server 只负责把「我需要输入」作为一个**正常结果**返回，之后的每一次交互都是全新的一次 `tools/call`。Server 可以在两轮之间被销毁、被重启、被换到另一台机器——MRTR 规范的基本工作流一节标题就叫这个意思：allows servers to request additional information **without maintaining any server-side state**。

这就是 `request_state` 的意义：它是协议层密封回传的行李箱。第 1 轮 Server 把 `env=prod` 塞进行李箱还给 Client，第 2 轮 Client 原样带回，Server 从里面取出来继续。**状态不在 Server 的内存里，在往返的请求里。** 无状态化不是没有状态，而是**状态的全部往返都在协议消息里，Server 内存里一个字节都不留**。

用一个理解模型概括：guard 模式本质上是把工具函数写成了**可重入的可恢复函数**——`input_responses is None` 就是检查点，返回 `InputRequiredResult` 就是主动让出执行权，重试就是恢复执行。

## 表单即 JSON Schema

两个时代的表单载体是同一个：`requested_schema` 就是一份 JSON Schema，字段类型直接映射交互控件：

- `enum` → 单选
- `array` + `items.enum` → 多选
- `string` → 填空
- `boolean` → 开关

我在实验里用这套机制实现了一个类似 Claude Code ask-user 的问卷（填空 + 单选 + 多选 + 开关），一个 schema 全部覆盖。Accept / Decline 按钮不是 schema 里的内容，是客户端根据协议动作自己渲染的。

这个设计值得注意：**Server 声明「我要什么数据」，Client 决定「用什么 UI 呈现」**。同一份 schema，在 Claude Code 里渲染成表单，在脚本客户端里就是一次回调。这也是 HITL 能跨客户端工作的前提。

顺带一个新协议的细节损失：`2025-11-25` 为 URL mode 设计的 `notifications/elicitation/complete` 完成通知（带外交互完成后 Server 主动通知客户端）在 `2026-07-28` 里被移除了，理由和主线一致——客户端通过**重试原始请求**来获知带外交互的结果，不需要服务端主动推送；需要跨重试关联的，Server 自己把标识编进 `requestState`。连「完成信号」都要无状态化，这个版本的态度可见一斑。

## 实验：两个协议时代各搭一台，再合到一台

为了让上面的对比不是纸上谈兵，我搭了一套可以复现的实验环境：两个 uv 项目（fastmcp 3.4.7 / mcp 1.29.1 和 fastmcp 4.0.0b5 / mcp 2.1.1），各起一台 HTTP Server，再让新版那台同时服务两个时代的客户端。下面是关键代码，都来自实测跑通的版本。

**双模式 Server 的核心：一个分叉 + 同一份表单 schema。** 协议协商是按连接进行的——旧客户端连上来时框架自动把协议降级到 `2025-11-25`，反向 elicitation 通道重新可用；新客户端走 guard 模式。整个兼容层就是这一个判断函数，加每个工具里的两条路径：

```python
CONFIRM_SCHEMA = {
    "type": "object",
    "properties": {
        "decision": {
            "type": "string",
            "enum": ["approve", "reject"],
            "title": "人工决定",
            "default": "approve",
        }
    },
    "required": ["decision"],
}

def _client_is_modern(ctx) -> bool:
    """当前连接是否协商为 2026-07-28（无 server-initiated 反向通道）"""
    rc = ctx.request_context
    return rc is not None and rc.protocol_version in MODERN_PROTOCOL_VERSIONS

@mcp.tool
async def test_hitl_confirm(env: str, ctx: Context) -> str | InputRequiredResult:
    # ---- Legacy 路径：旧协议客户端 → 阻塞式反向 elicitation/create ----
    if not _client_is_modern(ctx):
        result = await ctx.elicit(
            f"[Legacy] 确认对 {env} 环境执行变更吗？",
            response_type=["approve", "reject"],
        )
        if result.action != "accept" or result.data != "approve":
            return f"TEST-REFUSED(Legacy): {env} 未执行（人工拒绝）"
        return f"TEST-APPLIED(Legacy): {env} 已执行（旧协议反向 RPC）"

    # ---- MRTR 路径：新协议客户端 → guard 模式 ----
    # 第 1 轮：还没有人类回答 → 返回表单，env 存进 request_state
    if ctx.input_responses is None:
        return InputRequiredResult(
            input_requests={
                "confirm": ElicitRequest(
                    method="elicitation/create",
                    params=ElicitRequestFormParams(
                        message=f"确认对 {env} 环境执行变更吗？",
                        requested_schema=CONFIRM_SCHEMA,
                    ),
                )
            },
            request_state=env,  # 跨轮次关联状态（协议层密封回传）
        )

    # 第 2 轮：Client 带 inputResponses 重试 → 读回答继续执行
    answer = ctx.input_responses["confirm"]
    if answer.action != "accept" or answer.content.get("decision") != "approve":
        return f"TEST-REFUSED: {ctx.request_state} 未执行（人工拒绝）"
    return f"TEST-APPLIED: {ctx.request_state} 已执行（MRTR 完成）"
```

**问卷的 schema**——一份 JSON Schema 同时覆盖填空 / 单选 / 多选 / 开关：

```python
SURVEY_SCHEMA = {
    "type": "object",
    "properties": {
        "project": {"type": "string", "title": "项目名（填空）"},
        "env": {"type": "string", "enum": ["dev", "test", "prod"],
                "title": "部署环境（单选）", "default": "dev"},
        "features": {
            "type": "array",
            "items": {"type": "string",
                      "enum": ["cache", "logging", "metrics", "trace"]},
            "title": "启用特性（多选）",
        },
        "force": {"type": "boolean", "title": "强制执行（开关）", "default": False},
    },
    "required": ["project", "env"],
}
```

**客户端只需要一个 handler。** 旧协议下它应答反向请求；新协议下 fastmcp 把 `input_required` 的表单转交给它，拿到答案后自动用新 Request ID 重试——多轮往返对调用方完全透明，一次 `call_tool` 直接拿到最终结果：

```python
async def human_decision(message, response_type, params, context):
    """真实场景中这里应弹出 UI 等待真人点击"""
    print(f"[HUMAN] {message}")
    schema = getattr(params, "requested_schema", None)
    if "project" in schema["properties"]:        # 问卷
        return ElicitResult(action="accept", content={
            "project": "demo-app", "env": "test",
            "features": ["cache", "metrics"], "force": False,
        })
    return ElicitResult(action="accept", content={"decision": "approve"})

async with Client(
    "http://127.0.0.1:8001/mcp",
    elicitation_handler=human_decision,
    input_required_max_rounds=5,   # MRTR 最多重试 5 轮，防不收敛
) as client:
    result = await client.call_tool("test_hitl_confirm", {"env": "prod"})
```

验证矩阵是四个方向两两组合（新客户端 × 旧 Server 没有意义，协议只能向上协商）：

| 客户端 \ 服务端 | 旧（8000） | 新，双模式（8001） |
|---|---|---|
| 旧协议 client | ✅ 反向 elicitation | ✅ 自动降级，走 Legacy 分支 |
| 新协议 client | — | ✅ MRTR guard 模式 |

两个实测观察，比读规范更直观：

**1. Claude Code 就是那个「现代客户端」。** 把 8001 注册进 `.mcp.json` 后在 Claude Code 里调用工具，`input_required` 的表单会被渲染成原生的选项卡表单，Accept / Decline 是客户端自己加的按钮。也就是说这套机制不是实验室玩具，今天接上主流客户端就能用。

**2. 旧 SDK 的客户端打新 Server，证据在返回值里。** 用 `uv run --with "fastmcp==3.4.7"` 跑一个旧版客户端连同一台 8001，返回的是 `TEST-APPLIED(Legacy): prod 已执行（旧协议反向 RPC）`——同一台 Server、同一个工具、按连接协商出两套 HITL 语义。这也说明 **HITL 的迁移可以做成服务端单方面的兼容**，客户端不需要同步升级；新旧路径复用同一份 schema，差异只在「表单怎么送到人面前、答案怎么送回来」。

## 踩过的坑

- fastmcp 4.x 在新协议连接上调用 `await ctx.elicit()` 会**直接抛错**，不是静默降级。反向通道不是「不推荐」，是被移除了（SEP-2577）。所以 guard 模式不是可选项。
- 本地调试时系统代理会劫持发往 `127.0.0.1` 的 HTTP 请求，症状是莫名其妙的 502，排查了半天协议层，其实 `NO_PROXY` 一行就解决。
- 旧版 SDK 的 dict 简写 elicitation 会被解析成单选菜单（生成一个 `value` 字段），要自定义多个字段必须用 pydantic BaseModel。

## 结语

MCP 这次演进的本质，是把「等人」从一个**连接内的阻塞**，重构为一个**跨请求的协议状态**。旧的 elicitation 是 RPC 思维——问一答一；新的 `input_required` 是工作流思维——把人类当成一个可能延迟数小时的异步节点。

这个视角也可以推广：Agent 系统里所有「需要人参与」的环节，最终都会面临同样的选择——是让机器挂着等人，还是把等待本身建模成数据。MCP 选择了后者，而且是用删除旧能力的强硬方式选的。这个信号值得所有做 Agent 平台的人注意。
