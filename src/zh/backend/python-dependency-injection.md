---
redirectFrom: "/zh/cs-development/backend/python-dependency-injection.html"
title: "Python 依赖注入：从概念到实践，让代码更优雅"
description: "Python 依赖注入的概念与实践，让代码组织更优雅"
date: 2025-09-18
category: "Backend"
tags:
  - "Python"
icon: pen-to-square
---

依赖注入（Dependency Injection，简称 DI）是一种重要的设计模式，它能有效降低代码耦合度，提升可测试性和可维护性。在 Python 生态中，依赖注入虽不如 Java Spring 中那样成为“标配”，但随着项目复杂度提升，其价值愈发凸显。本文将从基础概念出发，带你理解依赖注入的核心思想，掌握 Python 中实现和使用依赖注入的多种方式。

## 一、什么是依赖注入？

简单来说，**依赖注入是“控制反转（IoC）”设计原则的一种实现方式**。它解决的核心问题是：**如何让组件之间的依赖关系由外部管理，而非组件自身创建依赖**。

举个生活例子：

- 没有依赖注入时，“你”（组件）需要自己买菜、做饭（创建依赖）；
- 有依赖注入时，“外卖小哥”（注入器）直接把做好的饭菜（依赖）送到你面前，你只需享用即可。

在代码中，这种思想表现为：**一个对象不需要自己创建它所依赖的对象，而是通过外部传递（注入）获得**。

### 为什么需要依赖注入？

假设我们有一个简单的订单处理服务，依赖数据库连接：

```python
# 无依赖注入的实现
class OrderService:
    def __init__(self):
        # 自己创建依赖（强耦合）
        self.db = DatabaseConnection("localhost", "user", "pass")

    def create_order(self, product):
        self.db.execute(f"INSERT INTO orders (product) VALUES ('{product}')")

class DatabaseConnection:
    def __init__(self, host, user, password):
        self.host = host
        # ... 连接数据库的逻辑

```

这种写法存在明显问题：

1. **耦合严重**：`OrderService` 与 `DatabaseConnection` 紧耦合，若数据库连接方式改变（如换为 SQLite），需修改 `OrderService` 源码；
2. **测试困难**：无法用 mock 数据库替换真实连接，单元测试可能操作真实数据库；
3. **扩展性差**：依赖的创建逻辑分散在各个组件中，难以统一管理。

而依赖注入的实现方式如下：

```python
# 依赖注入的实现
class OrderService:
    # 依赖通过构造函数注入，而非自己创建
    def __init__(self, db):
        self.db = db  # 外部传入的数据库连接

    def create_order(self, product):
        self.db.execute(f"INSERT INTO orders (product) VALUES ('{product}')")

# 使用时：先创建依赖，再注入到组件中
db = DatabaseConnection("localhost", "user", "pass")
service = OrderService(db)  # 注入依赖

```

通过这种方式，`OrderService` 不再关心数据库连接的创建细节，只需专注于业务逻辑，解决了上述所有问题。

## 二、Python 中依赖注入的三种常见形式

依赖注入的核心是“如何传递依赖”，在 Python 中通常有三种实现形式：

### 1. 构造函数注入（最常用）

通过类的 `__init__` 方法传递依赖，是最直观且推荐的方式。

```python
class PaymentService:
    # 依赖：日志器和支付网关通过构造函数注入
    def __init__(self, logger, payment_gateway):
        self.logger = logger
        self.gateway = payment_gateway

    def process_payment(self, amount):
        self.logger.info(f"Processing payment: {amount}")
        return self.gateway.charge(amount)

# 定义依赖
class ConsoleLogger:
    def info(self, message):
        print(f"INFO: {message}")

class StripeGateway:
    def charge(self, amount):
        return f"Charged ${amount} via Stripe"

# 注入依赖并使用
logger = ConsoleLogger()
gateway = StripeGateway()
payment_service = PaymentService(logger, gateway)  # 构造函数注入
payment_service.process_payment(100)  # 输出：INFO: Processing payment: 100

```

**优点**：依赖在对象创建时就已确定，生命周期明确，适合初始化后就稳定的依赖。

### 2. 属性注入（灵活但谨慎使用）

通过类的属性赋值传递依赖，适合依赖可能动态变化的场景。

```python
class UserService:
    # 先定义属性，不初始化
    def __init__(self):
        self.db = None  # 依赖后续通过属性注入

    def get_user(self, user_id):
        return self.db.query(f"SELECT * FROM users WHERE id={user_id}")

# 使用时注入依赖
service = UserService()
service.db = DatabaseConnection()  # 属性注入
service.get_user(1)

```

**注意**：属性注入可能导致对象在依赖未注入时被使用（如 `db` 为 `None` 时调用 `get_user`），需额外判断依赖是否就绪，谨慎使用。

### 3. 方法注入（临时依赖）

在调用方法时传递依赖，适合仅某一方法需要的临时依赖。

```python
class ReportService:
    def generate_report(self, data_provider):  # 方法参数注入依赖
        data = data_provider.fetch()
        return f"Report: {data}"

# 使用时传入依赖
class CSVDataProvider:
    def fetch(self):
        return "Data from CSV"

service = ReportService()
service.generate_report(CSVDataProvider())  # 方法注入

```

**适用场景**：依赖仅用于特定方法，且每次调用可能使用不同实现（如有时从 CSV 取数，有时从数据库取数）。

## 三、Python 依赖注入框架推荐

当项目规模较小时，手动传递依赖即可满足需求。但在大型应用中，依赖关系可能错综复杂（如 A 依赖 B，B 依赖 C），此时需要专门的框架管理依赖。

### 1. Dependency Injector：功能全面的企业级框架

[Dependency Injector](https://python-dependency-injector.ets-labs.org/) 是 Python 中最成熟的依赖注入框架之一，支持自动依赖解析、生命周期管理（单例、工厂等），可与 Flask、Django 等框架无缝集成。

**安装**：

```bash
pip install dependency-injector

```

**示例**：管理数据库连接与服务的依赖

```python
from dependency_injector import containers, providers, inject
from dependency_injector.wiring import Provide

# 1. 定义依赖组件
class Database:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        print(f"Connected to {host}:{port}")

class UserService:
    # 声明依赖：Database 由容器注入
    @inject
    def __init__(self, db: Database = Provide["container.db"]):
        self.db = db

    def get_user(self, user_id):
        return f"User {user_id} from {self.db.host}"

# 2. 定义依赖容器（集中管理依赖）
class Container(containers.DeclarativeContainer):
    # 配置参数
    config = providers.Configuration()
    # 数据库依赖（单例模式）
    db = providers.Singleton(
        Database,
        host=config.db.host,
        port=config.db.port
    )
    # 用户服务依赖
    user_service = providers.Factory(UserService)

# 3. 初始化容器并注入依赖
if __name__ == "__main__":
    container = Container()
    # 配置参数
    container.config.db.host.from_value("localhost")
    container.config.db.port.from_value(5432)
    # 绑定依赖到当前模块
    container.wire(modules=[__name__])

    # 使用服务（无需手动传递依赖）
    service = container.user_service()
    print(service.get_user(123))  # 输出：User 123 from localhost

```

**核心特性**：

- 支持 `Singleton`（单例）、`Factory`（工厂）等多种生命周期；
- 通过配置文件（YAML/JSON）管理参数，方便环境切换；
- 自动解析依赖链（如 A→B→C 无需手动注入 B）。

### 2. Injector：轻量级的类型驱动注入

[Injector](https://injector.readthedocs.io/) 是一个轻量级框架，基于类型提示（Type Hint）自动绑定依赖，语法简洁，适合中小型项目。

**安装**：

```bash
pip install injector

```

**示例**：通过类型自动注入

```python
from injector import Injector, inject

# 1. 定义依赖（通过类型区分）
class MailClient:
    def send(self, message):
        print(f"Sending mail: {message}")

class NotificationService:
    # 声明依赖类型：MailClient
    @inject
    def __init__(self, mail_client: MailClient):
        self.mail_client = mail_client

    def notify(self, user, message):
        self.mail_client.send(f"To {user}: {message}")

# 2. 创建注入器并获取服务
injector = Injector()
service = injector.get(NotificationService)  # 自动注入 MailClient
service.notify("user@example.com", "Hello!")  # 输出：Sending mail: To user@example.com: Hello!

```

**核心特性**：

- 依赖通过类型提示自动匹配，无需显式配置；
- 与 pytest 结合良好，可简化测试中的依赖替换；
- 支持模块级依赖绑定，适合分层架构。

### 3. FastAPI 内置依赖注入：Web 框架的实践

FastAPI 作为现代 Python Web 框架，原生集成了依赖注入系统，专为处理请求上下文、数据库连接、权限验证等场景设计。

**示例**：接口中注入数据库连接

```python
from fastapi import FastAPI, Depends
from pydantic import BaseModel

app = FastAPI()

# 1. 定义依赖：数据库连接
def get_db():
    db = "模拟数据库连接"
    print("获取数据库连接")
    yield db  # 类似 pytest fixture，返回连接并在请求结束后清理
    print("关闭数据库连接")

# 2. 接口中注入依赖
@app.post("/items/")
def create_item(item: BaseModel, db = Depends(get_db)):
    return {"item": item, "db_used": db}

```

**核心特性**：

- 通过 `Depends()` 声明依赖，支持依赖链（如 `Depends(get_db)` 依赖 `Depends(get_config)`）；
- 自动处理依赖的生命周期（如请求结束后关闭连接）；
- 与 Pydantic 结合，支持参数验证与依赖注入一体化。

### 4. pytest fixture：测试场景的依赖注入

虽然 pytest 是测试框架，但其 `fixture` 机制本质上是依赖注入在测试场景的应用：通过声明测试函数的参数（fixture 名），自动注入测试资源。

```python
import pytest

# 定义测试依赖（fixture）
@pytest.fixture
def test_db():
    db = "测试数据库"
    yield db  # 传递资源给测试函数
    print("清理测试数据")

# 测试函数注入依赖
def test_query(test_db):
    assert test_db == "测试数据库"

```

这种方式让测试代码专注于断言逻辑，而非资源准备，极大提升了测试效率。

## 四、依赖注入最佳实践

1. **优先使用构造函数注入**
    
    构造函数注入能在对象创建时明确依赖，避免“未初始化依赖”的错误，且符合“依赖不可变”的原则。
    
2. **依赖抽象而非具体实现**
    
    例如注入 `DatabaseInterface` 而非 `MySQLConnection`，这样可随时替换为 `PostgreSQLConnection` 而不修改业务代码。
    
    ```python
    from abc import ABC, abstractmethod
    
    class Database(ABC):
        @abstractmethod
        def query(self, sql):
            pass
    
    class MySQLDatabase(Database):
        def query(self, sql):
            return f"MySQL: {sql}"
    
    class OrderService:
        def __init__(self, db: Database):  # 依赖抽象接口
            self.db = db
    
    ```
    
3. **避免过度注入**
    
    若一个类需要注入 5 个以上依赖，可能意味着类的职责过于复杂，需拆分（遵循单一职责原则）。
    
4. **结合类型提示**
    
    Python 的类型提示（如 `def __init__(self, db: Database)`）不仅能提升代码可读性，还能帮助依赖注入框架自动解析依赖。
    
5. **测试中充分利用依赖注入**
    
    通过注入 mock 对象（如 `unittest.mock`）替代真实依赖，让单元测试脱离外部资源（数据库、网络等）。
    

## 五、总结

依赖注入并非 Python 特有的特性，但它在 Python 生态中以灵活多样的形式存在——从简单的手动传参，到复杂的框架管理，再到 FastAPI、pytest 等工具的内置实现。

其核心价值在于：**解耦组件依赖，让代码更易于测试、扩展和维护**。对于小型项目，手动实现依赖注入可能已足够；而大型项目则推荐使用 Dependency Injector 等框架，通过集中管理依赖降低复杂度。

掌握依赖注入，不仅是学会一种编程技巧，更是理解“高内聚、低耦合”设计原则的重要一步。下次当你发现代码中充斥着 `import` 和 `new` 时，不妨试试用依赖注入重构，或许会带来意想不到的清晰与优雅。