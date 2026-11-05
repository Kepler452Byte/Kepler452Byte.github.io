---
title: "从多空间到多租户：一种简洁、可扩展的资源隔离架构"
description: "从资源归属出发，以 Actor、AccessScope、Authorizer 和 Scoped Repository 建立清晰、默认拒绝且可演进的访问控制边界。"
date: 2026-11-06
updated: 2026-11-06
category: 后端开发
tags:
  - 架构设计
  - 多租户
  - 权限控制
  - 数据隔离
draft: false
---

在开发团队协作系统时，随着用户、项目和资源逐渐增多，一个问题会变得越来越重要：**如何让不同用户共享同一空间内的资源，同时确保不同空间之间的数据和操作相互隔离？**

最直接的做法，是在每个业务接口中检查用户身份、查询成员关系、判断操作权限，再给 SQL 加上空间过滤条件。

这种方式在项目初期往往能够正常工作，但随着 HTTP、MCP、后台任务等调用入口增加，权限逻辑很容易散落在 API、Service 和 Repository 中。

同一个权限可能有多个实现，新增资源容易遗漏范围过滤，业务方法也会逐渐被身份、角色和 Token 检查淹没。

解决这个问题，并不一定需要复杂的 RBAC/ABAC 引擎，也不需要一开始就引入完整的多租户框架。

更重要的是建立一套**职责清晰、默认拒绝、访问范围明确，并且能够随业务演进的架构约定**。

## 一、先设计资源归属，而不是先设计权限系统

资源隔离的基础，是明确每个资源究竟属于谁。

在一个多 Workspace 协作系统中，用户不应该天然成为业务资源的所有者。用户可以创建 Script、Task 或 Workflow，但这些资源通常属于团队空间，而不是创建人私人独占。

一种合理的资源归属结构如下：

```text
Platform
│
├── User
├── ExecutionWorker / RuntimeProfile
│
└── Workspace                  ← 空间隔离边界
    │
    ├── WorkspaceMember
    │
    ├── Dataset                ← workspace_id
    │   └── DatasetVersion
    │       └── DatasetItem
    │
    ├── Credential             ← workspace_id
    │
    └── Project                ← workspace_id
        │
        ├── Script             ← project_id
        │   └── ScriptVersion  ← script_id
        │
        ├── Task               ← project_id
        │
        ├── Workflow           ← project_id
        │
        └── ExecutionRun       ← project_id
            └── ExecutionLog
```

这套结构将资源分成三个层次：

- **平台级资源**：User、执行节点等，不属于某个特定 Workspace。
- **空间级资源**：Dataset、Credential 等，由 Workspace 持有，可以被同空间内多个项目共享。
- **项目级资源**：Script、Task、Workflow 等，由 Project 组织，并通过 Project 继承 Workspace 归属。

这里有一个重要原则：

**并非所有实体都需要保存 `workspace_id`。**

例如：

```text
Script → Project → Workspace
```

只要 Script 通过 `project_id` 能够确定唯一的 Project，而 Project 通过 `workspace_id` 能够确定唯一的 Workspace，就已经存在明确的归属链。

查询时可以通过关联限定范围：

```sql
SELECT script.*
FROM script
JOIN project
  ON script.project_id = project.id
WHERE project.workspace_id = :workspace_id;
```

这避免了在所有子表中机械地冗余空间标识，也减少了维护多份归属字段的复杂度。

不过，归属关系不仅需要在查询时成立，还要在创建和关联资源时得到保证。跨资源引用必须验证双方归属一致，数据库应尽可能使用外键、唯一约束和必要的组合外键维护完整性。

对于执行日志、大规模结果数据等特殊场景，也可以为了性能、分区或完整性约束冗余 `project_id`，不必机械追求完全无冗余。

资源归属模型解决的是**数据属于哪个边界**，而不是谁有权限操作它。后者需要独立的访问控制设计。

## 二、用四个核心概念建立访问控制边界

一套足够简洁的访问控制架构，可以围绕四个核心概念建立：

| 概念 | 职责 |
|---|---|
| Actor | 认证身份：谁在调用 |
| AccessScope | 经过验证的数据访问范围 |
| Authorizer | 判断当前操作是否允许 |
| Scoped Repository | 强制执行数据访问范围 |

整个调用链如下：

```text
          HTTP / MCP / Hook / Scheduler
                       |
                       v
                Authentication
                验证身份凭据
                       |
                       v
                     Actor
                       |
                       v
                Access Resolver
                - Workspace 状态
                - 成员关系与角色
                - Token 授权范围
                       |
                       v
                  AccessScope
                 （不可变）
                       |
                       v
                Service Factory
                       |
             +---------+----------+
             |                    |
             v                    v
       Business Service      Scoped Repository
             |                    |
             v                    |
         Authorizer               |
         require()                |
             |                    |
             +--------------------+
                                  |
                                  v
                             Scoped SQL
                                  |
                                  v
                               Database
```

这套架构的价值，不在于增加四个类，而在于将原本混杂的责任分开。

**Actor 只回答“谁在调用”。**

无论请求来自 HTTP、MCP 还是后台触发，都应该在可信入口建立协议无关的调用身份。Service 不需要知道 JWT 如何解析，也不需要接触 HTTP Header。

**AccessScope 只表达“这次调用能够访问什么范围”。**

它由服务端验证 Workspace 状态、成员关系和凭据限制后生成，并在本次调用中保持不可变。

例如，一个 Token 可以在 Project A 中维护脚本，在 Project B 中只能读取脚本。AccessScope 必须保留这种逐项目差异，而不能简单地把所有权限合并成一个全局集合。

**Authorizer 回答“本次操作是否允许”。**

它根据操作定义、成员角色、Token 限制和目标资源范围作出决策，不负责数据库 CRUD。

**Scoped Repository 负责把数据范围落实到 SQL。**

即使调用者已经通过权限检查，Repository 仍必须对查询、修改和删除应用相应的 Workspace 与 Project 范围，不能依赖 Service 的自觉性。

这是一种纵深防护：身份验证、操作授权和数据隔离各有边界，任何一层都不能假设其他层已经完成了全部安全工作。

### 为什么 AccessScope 应该不可变？

因为它代表一次可信调用的授权结果，而不是业务执行过程中可以随意修改的查询条件。

不推荐：

```python
access.project_id = project_id
access.filter_uuid = resource_uuid

await service.update(...)
```

更推荐：

```python
@dataclass(frozen=True)
class WorkspaceAccess:
    workspace_id: int
    actor_id: int
    role: str
    grants: tuple[ProjectGrant, ...]
```

用户搜索关键字、标签过滤和分页信息应当由独立的查询参数表达，不应该混入访问上下文。

但不可变并不等于永远有效，也不等于天然可信。AccessScope 必须由受信任的解析过程创建；新的业务调用需要重新验证访问资格，敏感写入还需要考虑成员撤销、Token 吊销和资源归属变化带来的并发问题。

## 三、让权限声明清晰，让业务代码保持干净

权限系统最容易出现的两个极端，是把所有判断散落到每个 Service 中，或者构造一个能够自动解析资源、角色、Token、业务状态的万能权限框架。

前者导致重复，后者隐藏控制流。

对于普通的 MVC 后端，更合理的方式是：

**统一操作目录，由 Authorizer 决策，在 Service 中显式声明权限。**

例如，定义具体业务操作：

```python
class OperationId(StrEnum):
    SCRIPT_READ = "script.read"
    SCRIPT_UPDATE = "script.update"
    SCRIPT_DELETE = "script.delete"
    RUN_CREATE = "run.create"
```

再建立操作与权限能力的映射：

```python
OPERATION_PERMISSIONS = {
    OperationId.SCRIPT_READ: "scripts:read",
    OperationId.SCRIPT_UPDATE: "scripts:maintain",
    OperationId.RUN_CREATE: "executions:execute",
}
```

具体操作可以拥有多个必需能力，也可以明确禁止向 Agent Token 授予某些管理权限。操作标识与可签发的 Token Scope 是两个不同概念，不应因为名称相似就混为一谈。

在业务 Service 中，权限校验可以保持非常直观：

```python
class RunnerService:
    def __init__(self, repo, authz):
        self.repo = repo
        self.authz = authz

    async def update_script(self, uuid, body):
        script = await self.repo.get_visible(uuid)

        if script is None:
            raise ScriptNotFound()

        self.authz.require(
            OperationId.SCRIPT_UPDATE,
            project_id=script.project_id,
        )

        if script.edit_revision != body.revision:
            raise StaleResource()

        script.name = body.name
        await self.repo.flush()
```

这段代码的逻辑非常清楚：

```text
在合法可见范围内定位 Script
                |
                v
       检查 SCRIPT_UPDATE
                |
                v
       检查业务状态和版本
                |
                v
             持久化
```

为什么可以先查询资源，再判断更新权限？

因为**资源可见性和资源操作权限是两个不同的问题**。

一个用户可能允许读取某个 Script，却不允许修改它。而更新权限需要知道目标 Script 属于哪个 Project，因此可以先在已授权的可见范围内定位目标，再判断写入权限。

但查询必须已经受到可见范围约束，不能先取出任意资源再决定是否授权。

创建操作则不同：资源还不存在，应先验证父 Project 的归属和创建权限，再执行插入。关键写操作还需要结合事务锁、版本检查或条件更新防止授权检查后的竞态。

### 为什么不优先使用权限装饰器？

装饰器本身没有问题，问题是把过多行为隐藏在装饰器中。

例如，如果一个装饰器不仅声明权限，还要解析函数签名、查找资源、判断项目、获取数据库锁、修改共享访问上下文，那么业务方法虽然变短了，系统的真实控制流却变得更加隐晦。

显式的：

```python
self.authz.require(
    OperationId.SCRIPT_UPDATE,
    project_id=script.project_id,
)
```

更容易阅读、调试、测试和维护。

简单固定的权限声明仍可以使用装饰器，但不应让装饰器成为一个隐藏的业务执行框架。

另外，显式 `require()` 也存在开发者忘记调用的风险，因此必须配合默认拒绝的操作目录、入口覆盖检查和反向授权测试，而不能只靠代码规范。

### Repository 如何保持整洁？

Repository 应在构造时绑定可信范围：

```python
class RunnerRepository:
    def __init__(self, db, access):
        self.db = db
        self.access = access

    def _query(self):
        return (
            select(RunnerScript)
            .join(Project)
            .where(
                Project.workspace_id
                == self.access.workspace_id
            )
        )
```

这里展示的是 Workspace 范围；正式实现仍须进一步应用 Token 的项目级可见范围。

不需要设计一个复杂的万能 `ScopedRepository[T]` 框架。

每个业务 Repository 可以维护自己的基础范围查询，必要时共享小型 SQL 条件构造函数。

Service 通过 Protocol 依赖 Repository，具体实现由 Factory 负责组装。事务由调用入口统一管理，同一次业务调用共享数据库 Session。

这既符合普通 MVC 的组织方式，也避免了通过多层 Repository 继承复用权限逻辑带来的职责混乱。

## 四、为什么这种架构适合长期演进？

这套设计最大的优势，是将**业务资源的归属结构**与**访问控制的执行机制**分开。

当前系统可能只有：

```text
Workspace
   |
   +-- Project
         |
         +-- Resource
```

未来真正需要企业级多租户时，可以演进为：

```text
Tenant
   |
   +-- Workspace
         |
         +-- Project
               |
               +-- Resource
```

只要资源依然具有明确的归属路径，Actor、Authorizer、Scoped Repository 这些基础概念就不需要推翻。

需要扩展的是 Tenant 成员关系、租户级资源、租户与空间的权限继承规则，以及可能的数据库、对象存储和计算环境隔离。

因此，**可扩展性并不来自提前建立 Tenant、TenantMember 或通用多级 Scope 框架，而是来自当前各层边界足够清晰。**

这种设计还具有几个直接的工程优势：

- **减少重复**：统一解析成员与凭据限制，不需要各个 Service 自行查询角色。
- **减少遗漏**：普通 Repository 必须绑定访问范围，避免无意创建无限制数据查询。
- **协议无关**：HTTP、MCP 和后台任务使用同一套业务授权语义。
- **便于测试**：Authorizer 可以独立测试权限决策，Repository 可以独立测试跨空间隔离。
- **便于迁移**：新增资源只需要明确归属、操作权限和范围查询，不必重新设计整个权限系统。

不过，平台治理和后台 Worker 必须使用明确的受限系统能力，不能简单通过 `workspace_id=None` 关闭过滤。对象存储、缓存、队列和运行环境也需要分别落实隔离。

最终值得沉淀到后端模板中的，并不是完整的 Workspace 或 Tenant 业务模型，而是一套稳定的架构约定：

```text
Identity        → Actor
Access          → AccessScope
Authorization   → Authorizer
Business        → Service
Data Isolation  → Scoped Repository
Consistency     → Database Constraints
```

这套架构不追求抽象数量，而是让每一部分都有明确责任。

**好的资源隔离架构，不是把所有权限检查都集中到一个地方，而是统一权限决策，并让不同层分别承担自己必须执行的安全约束。**

身份由可信入口建立，访问范围由业务能力解析，操作权限由 Authorizer 决策，业务状态由 Service 保证，数据范围由 Repository 强制执行。

当这些边界足够清晰时，系统才能在保持代码整洁的同时，支持更多资源、更多协作空间和未来可能出现的多租户需求，而不必为尚未发生的需求提前付出过高的复杂度成本。