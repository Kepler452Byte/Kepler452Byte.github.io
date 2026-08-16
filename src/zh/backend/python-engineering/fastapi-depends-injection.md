---
series: "Python Engineering"
redirectFrom: ["/zh/cs-development/backend/fastapi-depends-injection.html","/zh/backend/fastapi-depends-injection.html"]
title: "FastAPI Depends 依赖注入：用“声明式”替代“命令式”管理依赖"
description: "FastAPI Depends 依赖注入：用声明式替代命令式管理依赖"
date: 2025-11-17
category: "Backend"
tags:
  - "Python"
  - "FastAPI"
icon: pen-to-square
---
在FastAPI开发中，依赖注入（Dependency Injection）是一个核心特性，但其本质可以用一句话概括：**用“声明式”替代“命令式”管理依赖**——不再需要手动创建、传递依赖（比如数据库连接、业务服务），只需声明“我需要什么”，框架就会自动提供。

就像做饭：命令式是“自己买菜、洗菜、切菜”（全流程手动搞定依赖）；声明式是“直接要洗好切好的菜”（只说需求，有人按需提供）。本文将从核心用法、场景、重构、特点到实战疑问，全面拆解FastAPI依赖注入的使用逻辑。

## 一、先搞懂：依赖注入的核心逻辑

依赖注入的核心是“解耦”——将“依赖的创建”与“依赖的使用”分离：

- **命令式管理**：硬编码创建依赖，比如在API路由中手动`db = create_db_connection()`，再`service = UserService(db)`，耦合紧密且重复代码多；
- **声明式管理**：通过`Depends`声明依赖，比如`def get_user(service: UserService = Depends(get_user_service))`，无需关心`service`如何创建，框架自动注入。

这一转变让代码更简洁、可维护，也是FastAPI能快速开发高效API的关键原因之一。

## 二、快速上手：FastAPI依赖注入的极简用法

FastAPI通过`Depends`实现依赖注入，步骤仅需2步，核心支持函数、类、可调用对象作为依赖。

### 1. 定义依赖

依赖可以是任意可调用对象，支持通过`yield`实现资源自动清理（比如自动关闭数据库连接）。

```python
from fastapi import Depends, FastAPI

# 示例：数据库连接依赖（复用连接+自动关闭）
def get_db():
    # 命令式：手动创建依赖
    db = create_db_connection()  # 实际项目中是真实数据库连接（如SQLAlchemy会话）
    yield db  # 声明式：提供依赖给使用者
    db.close()  # 路由执行后自动清理资源

```

### 2. 声明使用依赖

在路由函数参数中通过`Depends(依赖)`声明需求，FastAPI会自动解析并注入依赖。

```python
app = FastAPI()

@app.get("/items")
def read_items(db = Depends(get_db)):
    # 无需关心db如何创建、如何关闭，直接使用
    return {"data": db.query("select * from items"), "db_status": "connected"}

```

## 三、核心使用场景：这些场景用依赖注入准没错

依赖注入的价值在特定场景中尤为突出，以下是最常用的4类场景：

### 1. 资源管理：自动创建+销毁，避免泄漏

适用于数据库连接、缓存连接、文件句柄等需要“创建-使用-关闭”的资源，通过`yield`自动完成生命周期管理。

```python
# 缓存连接依赖示例
def get_redis():
    redis = Redis(host="localhost", port=6379)
    yield redis
    redis.close()  # 自动关闭连接

@app.get("/cache/{key}")
def get_cache(key: str, redis = Depends(get_redis)):
    return {"key": key, "value": redis.get(key)}

```

### 2. 权限校验：复用逻辑，统一管控

多个路由需要相同的权限校验（如Token验证、角色检查）时，将校验逻辑提取为依赖，避免重复编码。

```python
from fastapi import HTTPException, Header

# 权限校验依赖
def get_current_user(token: str = Header(...)):
    if token != "admin_token":
        raise HTTPException(status_code=401, detail="无效Token")
    return {"user_id": 1, "role": "admin"}  # 校验通过返回用户信息

# 多个路由复用同一依赖
@app.get("/profile")
def get_profile(user = Depends(get_current_user)):
    return {"user_info": user}

@app.get("/admin/items")
def admin_items(user = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="无管理员权限")
    return {"items": "管理员可见数据"}

```

### 3. 共享配置/工具：避免重复初始化

全局配置（如环境变量、密钥）、工具类（如加密工具、日志工具）等单例资源，通过依赖注入复用，避免多次初始化。

```python
# 全局配置依赖
def get_config():
    return {
        "app_name": "FastAPI Demo",
        "secret_key": "xxx-xxx-xxx",
        "env": "prod"
    }

@app.get("/config")
def get_app_config(config = Depends(get_config)):
    return config

```

### 4. 参数预处理：统一解析+校验

对请求参数进行统一处理（如类型转换、格式校验），提取为依赖，让路由专注于业务逻辑。

```python
# 参数预处理依赖：将字符串ID转为整数并校验
def parse_user_id(user_id: str = Path(...)):
    try:
        return int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id必须是整数")

@app.get("/users/{user_id}")
def get_user(user_id: int = Depends(parse_user_id)):
    return {"user_id": user_id, "type": type(user_id).__name__}  # type为int

```

## 四、代码重构：从“命令式”到“声明式”的蜕变

依赖注入最直观的价值是消除重复代码、解耦逻辑。以下是前后对比示例：

### 重构前（命令式）：重复代码多，耦合紧

```python
# 每个路由手动创建/关闭数据库连接，重复代码泛滥
@app.get("/users")
def get_users():
    db = create_db_connection()  # 重复代码
    users = db.query("select * from users")
    db.close()  # 重复代码
    return users

@app.get("/items")
def get_items():
    db = create_db_connection()  # 重复代码
    items = db.query("select * from items")
    db.close()  # 重复代码
    return items

```

### 重构后（声明式）：逻辑集中，复用性高

```python
# 1. 提取依赖：集中管理数据库连接（仅写一次）
def get_db():
    db = create_db_connection()
    yield db
    db.close()

# 2. 路由声明依赖：消除重复代码
@app.get("/users")
def get_users(db = Depends(get_db)):
    return db.query("select * from users")

@app.get("/items")
def get_items(db = Depends(get_db)):
    return db.query("select * from items")

```

重构后，数据库连接的创建、关闭逻辑集中在`get_db`中，修改时只需改一处，所有路由自动生效——这就是“解耦”和“可维护性”的体现。

## 五、FastAPI依赖注入的核心特点

1. **声明式简洁性**：仅需`Depends()`在参数中声明，无需额外配置（如XML、复杂注解），代码侵入性极低；
2. **动态解析**：无独立IoC容器，依赖在请求处理时按需创建，而非启动时预初始化，更轻量；
3. **自动处理依赖链**：支持嵌套依赖（如A依赖B，B依赖C），FastAPI自动解析顺序，无需手动管理；
4. **同步/异步兼容**：天然支持异步依赖（`async def`函数），与FastAPI异步路由无缝配合；
5. **Pydantic深度集成**：依赖参数可直接使用Pydantic模型，自动完成数据校验和类型转换；
6. **无注册要求**：函数、类可直接作为依赖，无需显式“注册”到容器（对比Spring的`@Bean`/`@Service`）。

## 六、与Spring Boot依赖注入的核心对比

很多开发者熟悉Spring Boot的依赖注入，以下表格清晰展示两者差异：

| 对比维度 | FastAPI 依赖注入 | Spring Boot 依赖注入 |
| --- | --- | --- |
| 核心机制 | 基于函数参数声明（`Depends`），动态解析 | 基于IoC容器，预初始化并管理Bean生命周期 |
| 声明方式 | 仅需`Depends(依赖)`在参数中声明 | 需`@Autowired`/`@Inject`等注解标记 |
| 依赖解析时机 | 请求处理时动态解析（按需创建） | 应用启动时预解析并初始化Bean |
| 支持的注入类型 | 函数、类、可调用对象（无“Bean”概念） | 类（需`@Service`/`@Component`标记为Bean） |
| 嵌套依赖处理 | 自动解析多层嵌套 | 自动解析，需确保容器存在所有依赖Bean |
| 异步支持 | 原生支持异步依赖（`async def`） | 需`@Async`额外配置，支持较弱 |
| 数据校验集成 | 与Pydantic深度集成，自动校验 | 需额外集成`javax.validation`框架 |
| 容器依赖 | 无独立容器，轻量级（内置解析逻辑） | 强依赖IoC容器（核心组件） |
| 适用场景 | 中小型API、快速开发、异步场景 | 大型企业级应用、复杂生命周期管理场景 |

## 七、常见疑问解答

### 1. 依赖函数的入参从哪来？

依赖函数可以有入参，这些参数会被FastAPI按路由参数规则自动解析（如查询参数、请求头、路径参数），无需手动传递。

示例：从请求头获取Token、路径参数获取用户ID、查询参数获取操作类型：

```python
from fastapi import Header, Path, Query

def check_permission(
    token: str = Header(..., alias="X-Token"),  # 请求头
    user_id: int = Path(..., ge=1),  # 路径参数
    action: str = Query("read", pattern="^read|write$")  # 查询参数
):
    if token != "admin_token":
        raise HTTPException(status_code=401)
    if action == "write" and user_id != 1:
        raise HTTPException(status_code=403)
    return {"permission": "allowed"}

@app.get("/users/{user_id}/actions")
def handle_action(perm = Depends(check_permission)):
    return perm

```

客户端请求示例：

```bash
curl -H "X-Token: admin_token" "<http://localhost:8000/users/1/actions?action=write>"

```

### 2. 非API场景（如脚本、测试）如何传参？

脱离API上下文后，`Depends`无法自动解析请求参数，此时依赖函数本质是普通函数，需**手动传参**：

```python
# 非API场景：直接调用依赖函数（推荐）
def check_permission(token: str, user_id: int, action: str = "read"):
    if token != "admin_token":
        raise HTTPException(status_code=401)
    return {"permission": "allowed"}

# 手动传参调用
if __name__ == "__main__":
    result = check_permission(token="admin_token", user_id=1, action="write")
    print(result)

```

若有嵌套依赖，可使用`fastapi.dependencies.utils.solveDependencies`解析依赖链（复杂场景适用）。

### 3. 非API场景推荐使用FastAPI依赖注入吗？

**不推荐默认使用**：

- 普通场景（脚本、工具函数）：直接调用函数+手动传参更简洁，无需引入框架依赖；
- 复杂场景（多层嵌套依赖、资源生命周期管理）：可考虑使用`solveDependencies`或轻量级依赖注入库（如`injector`）；
- 仅需资源管理：Python原生上下文管理器（`with`语句）更直观。

### 4. DAO+Service+API分层架构适合使用吗？

**非常适合，甚至是最佳实践**！分层架构的核心是“职责分离”，但层间必然存在依赖（API依赖Service，Service依赖DAO），依赖注入能完美解决：

- 解耦：API层无需关心Service如何创建，Service层无需关心DAO如何获取数据库连接；
- 可替换：替换DAO实现（如MySQL换PostgreSQL），只需修改DAO依赖定义，所有Service自动生效；
- 便于测试：测试Service时可注入Mock DAO，无需连接真实数据库。

分层架构示例：

```python
# DAO层：数据访问（依赖数据库连接）
class UserDAO:
    def __init__(self, db):
        self.db = db
    def get_user(self, user_id):
        return self.db.query(f"select * from users where id={user_id}")

# Service层：业务逻辑（依赖DAO）
class UserService:
    def __init__(self, user_dao):
        self.user_dao = user_dao
    def get_user_info(self, user_id):
        return {"user": self.user_dao.get_user(user_id)}

# 依赖定义：逐层注入
def get_db():
    db = "数据库连接实例"
    yield db
    db.close()

def get_user_dao(db = Depends(get_db)):
    return UserDAO(db)

def get_user_service(user_dao = Depends(get_user_dao)):
    return UserService(user_dao)

# API层：声明依赖即可
@app.get("/users/{user_id}")
def get_user(user_id: int, service = Depends(get_user_service)):
    return service.get_user_info(user_id)

```

## 八、总结：依赖注入的核心价值

FastAPI依赖注入的本质，是通过“声明式”思维解放开发者——不用再关注“依赖怎么来”，只需关注“依赖怎么用”。其核心价值体现在3点：

1. **解耦**：分离依赖的创建与使用，降低代码耦合度；
2. **复用**：依赖逻辑集中定义，多路由、多模块复用；
3. **可维护**：修改依赖逻辑（如换数据库、改权限规则），所有使用处自动生效。

对于FastAPI项目，尤其是DAO+Service+API分层架构，依赖注入不是“可选特性”，而是提升开发效率、代码质量的“必备工具”。记住核心原则：**用“声明式”替代“命令式”，让框架帮你搞定依赖**。