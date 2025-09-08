---
icon: pen-to-square
date: 2025-08-27
category:
  - 后端
tag:
  - Python
  - unitest
---
# 【Python】【Flask】单元测试应该怎么写

## Flask应用单元测试实现完整步骤

## 环境准备和项目结构

### 1. 安装测试依赖

```bash
pip install pytest pytest-flask pytest-cov factory-boy faker

```

### 2. 创建项目结构

```
my_flask_app/
├── app/
│   ├── __init__.py           # 应用工厂函数
│   ├── config.py             # 配置文件
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py           # 用户模型
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py           # 认证路由
│   │   └── api.py            # API路由
│   ├── services/
│   │   ├── __init__.py
│   │   └── user_service.py   # 业务逻辑
│   └── utils/
│       ├── __init__.py
│       └── helpers.py        # 工具函数
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # 测试配置
│   ├── factories.py          # 测试数据工厂
│   ├── test_models.py        # 模型测试
│   ├── test_routes.py        # 路由测试
│   ├── test_services.py      # 服务测试
│   └── test_utils.py         # 工具函数测试
├── pytest.ini               # pytest配置
└── requirements.txt

```

## Step 1: 安装依赖

```bash
pip install pytest pytest-flask pytest-cov

```

### 库功能说明

- **pytest**: 测试框架，提供测试发现、运行、断言功能
- **pytest-flask**: Flask专用插件，提供Flask应用测试支持
- **pytest-cov**: 代码覆盖率插件，统计测试覆盖的代码比例

## Step 2: 创建测试配置文件

**conftest.py** - pytest的全局配置文件

```python
import pytest
from your_app import create_app, db

@pytest.fixture  # 装饰器：标记这是一个测试夹具，可以被测试函数注入
def app():
    # 创建测试用的Flask应用，使用内存数据库
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    with app.app_context():  # Flask应用上下文，让数据库操作生效
        db.create_all()      # 创建所有表
        yield app            # 返回app给测试函数使用
        db.drop_all()        # 测试完成后清理数据库

@pytest.fixture
def client(app):  # 依赖于app fixture，pytest会自动注入
    return app.test_client()  # 返回Flask测试客户端，用于模拟HTTP请求

```

### 关键概念说明

- **@pytest.fixture**: 创建可重用的测试资源（数据、对象等）
- **yield**: 类似return，**但测试完成后会继续执行yield后面的清理代码**
- **app_context()**: Flask应用上下文，确保数据库等组件正常工作
- **test_client()**: Flask提供的测试客户端，可以发送模拟的HTTP请求

## Step 3: 编写测试文件

**test_models.py** - 模型测试

```python
def test_user_creation(app):  # 函数名以test_开头，pytest自动识别
    with app.app_context():   # 在Flask应用上下文中执行
        user = User(username='test', email='test@example.com')
        user.set_password('password')
        db.session.add(user)    # 添加到数据库会话
        db.session.commit()     # 提交事务

        assert user.id is not None        # assert断言：验证条件为真
        assert user.check_password('password')  # 验证密码哈希功能

```

**test_routes.py** - 路由测试

```python
def test_register_route(client):  # client参数会自动注入测试客户端
    response = client.post('/auth/register', json={  # 发送POST请求
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'password123'
    })

    assert response.status_code == 201    # 验证HTTP状态码
    assert 'user' in response.get_json()  # 验证响应JSON内容

```

**test_services.py** - 业务逻辑测试

```python
def test_create_user_service(app):
    with app.app_context():
        user = UserService.create_user('test', 'test@example.com', 'password')

        assert user.username == 'test'  # 验证返回的用户对象
        assert User.query.count() == 1  # 验证数据库中确实创建了用户

```

### 测试函数说明

- **函数命名**: 必须以`test_`开头，pytest才能自动发现
- **参数注入**: 函数参数名对应fixture名，pytest自动注入
- **assert断言**: Python内置，用于验证条件是否为真
- **with app.app_context()**: 数据库操作必须在应用上下文中进行

## Step 4: 运行测试

```bash
pytest                    # 运行所有测试
pytest -v                 # 详细输出 (verbose)
pytest --cov=your_app     # 显示覆盖率
pytest -k "test_user"     # 只运行名称包含"test_user"的测试
pytest tests/test_models.py::test_user_creation  # 运行特定测试

```

### 命令参数说明

- **v**: verbose，显示每个测试的详细信息
- **-cov**: coverage，显示代码覆盖率统计
- **k**: keyword，根据关键字过滤测试
- **::**: 用于指定具体的测试文件和函数

## 核心原则

1. **一个测试只测一个功能**
2. **使用内存数据库避免真实数据库操作**
3. **通过fixture提供测试数据**
4. **Mock外部依赖，保留业务逻辑**

## Mock示例

```python
from unittest.mock import patch

def test_with_mock(app):
    with app.app_context():
        # @patch装饰器：替换指定的函数/对象为Mock对象
        with patch('your_app.services.send_email') as mock_email:
            mock_email.return_value = True  # 设置Mock的返回值

            # 测试你的业务逻辑
            result = some_function_that_sends_email()

            # 验证邮件发送被调用了一次
            mock_email.assert_called_once()

def test_exception_handling(app):
    with app.app_context():
        # 让Mock抛出异常，测试错误处理
        with patch('your_app.dao.create_user') as mock_create:
            mock_create.side_effect = Exception("数据库错误")

            # 使用pytest.raises验证异常
            with pytest.raises(Exception, match="数据库错误"):
                UserService.create_user('test', 'test@example.com', 'password')

```

### Mock相关说明

- **@patch**: unittest.mock模块的装饰器，用于替换函数/对象
- **Mock对象**: 模拟的假对象，可以设置返回值和行为
- **return_value**: 设置Mock对象被调用时的返回值
- **side_effect**: 设置Mock对象被调用时的副作用（如抛异常）
- **assert_called_once()**: 验证Mock对象被调用了一次
- **pytest.raises**: pytest提供的异常断言工具

## 注意点

### **为什么 `yield` 返回的不是 “生成器”？**

这里有个常见误解：虽然 `yield` 关键字常用于生成器，但在 pytest fixture 中，`yield` 的作用**不是创建生成器**，而是标记 “资源返回点” 和 “清理逻辑起点”。

pytest 会特殊处理 fixture 中的 `yield`：

- 不会将 fixture 视为生成器函数，而是将 `yield` 前的代码视为 “setup”，`yield` 后视为 “teardown”。
- 测试函数获取的是 `yield` 后的值（如 `conn`），而非生成器对象。

### `pytest` 中的`yield`详解

**`yield` 关键字本身的语法含义始终是“生成器的标志”**——在普通函数中使用 `yield`，函数会变成生成器函数；但在 pytest fixture 中，pytest 会对 `yield` 的行为做**特殊封装**，让开发者感知不到“生成器”的存在，只需要关注“资源提供”和“清理逻辑”。

简单来说：`yield` 本质是生成器，但 pytest 帮我们屏蔽了生成器的细节，让 fixture 中的 `yield` 看起来不像在使用生成器。

**1. 先明确基础：普通函数中 `yield` 就是生成器**

在非 pytest 场景下，只要函数包含 `yield`，它就是**生成器函数**——调用该函数时，不会执行函数体，而是返回一个生成器对象；只有通过 `next()` 或迭代（`for` 循环），才会逐步执行函数体并获取 `yield` 的值。

示例（普通生成器函数）：

```python
def normal_generator():
    print("执行 yield 前的代码")
    yield "生成器返回的值"  # 生成器的“产出点”
    print("执行 yield 后的代码")  # 需再次调用才会执行

# 1. 调用函数，返回生成器对象（不执行函数体）
gen = normal_generator()
print(type(gen))  # <class 'generator'>

# 2. 第一次调用 next()，执行到 yield 并获取值
print(next(gen))  # 打印“执行 yield 前的代码”，再打印“生成器返回的值”

# 3. 第二次调用 next()，执行 yield 后的代码，然后抛出 StopIteration
try:
    next(gen)  # 打印“执行 yield 后的代码”
except StopIteration:
    print("生成器迭代结束")

```

这是 `yield` 的原生行为：**生成器函数→生成器对象→迭代获取值**。

**2. pytest fixture 中：`yield` 本质是生成器，但被 pytest 封装了**

pytest fixture 函数中使用 `yield` 时，该函数**本质上依然是生成器函数**——但 pytest 会自动处理生成器的迭代逻辑，不让开发者手动调用 `next()` 或处理 `StopIteration`，而是将其转化为“setup→提供资源→teardown”的流程。

我们可以通过一个“底层视角”的例子验证这一点：

```python
import pytest

# 定义一个用 yield 的 fixture
@pytest.fixture
def demo_fixture():
    print("fixture setup: 准备资源")
    yield "fixture 提供的资源"  # 本质是生成器的产出值
    print("fixture teardown: 清理资源")

# 查看 fixture 函数的类型
print("fixture 函数类型:", type(demo_fixture))  # <class 'function'>（pytest 包装后的类型）

# 模拟 pytest 内部调用 fixture 的逻辑（简化版）
def simulate_pytest_fixture_call(fixture_func):
    # 1. 调用 fixture 函数，得到生成器对象（原生行为）
    gen = fixture_func()
    print("fixture 生成的对象类型:", type(gen))  # <class 'generator'>（验证是生成器）

    try:
        # 2. 第一次 next()：执行 setup 代码，获取资源（yield 的值）
        resource = next(gen)
        print("获取到的资源:", resource)

        # 3. 模拟执行测试函数（使用资源）
        print("模拟执行测试函数...")

    finally:
        # 4. 第二次 next()：执行 teardown 代码（yield 后的逻辑）
        try:
            next(gen)
        except StopIteration:
            # 生成器迭代结束是正常现象，pytest 会忽略这个异常
            print("fixture 生成器迭代结束")

# 调用模拟函数
simulate_pytest_fixture_call(demo_fixture)

```

**执行结果**：

```
fixture 函数类型: <class 'function'>
fixture 生成的对象类型: <class 'generator'>
fixture setup: 准备资源
获取到的资源: fixture 提供的资源
模拟执行测试函数...
fixture teardown: 清理资源
fixture 生成器迭代结束

```

从这个模拟可以看出：

- pytest 内部会调用 fixture 函数，得到**生成器对象**（`yield` 的原生产物）；
- 通过 `next(gen)` 触发 setup 代码并获取资源，提供给测试函数；
- 测试函数执行后，再通过 `next(gen)` 触发 teardown 代码（`yield` 后的逻辑）；
- 最后自动处理 `StopIteration` 异常，避免报错。

也就是说：**fixture 中的 `yield` 本质是生成器，但 pytest 帮我们完成了生成器的迭代、异常处理等底层工作**，开发者无需关注“生成器”的细节，只需要按“setup→yield资源→teardown”的逻辑写代码即可。

**3. 核心区别：普通生成器 vs pytest fixture 中的 `yield`**

| 对比维度 | 普通函数中的 `yield`（原生生成器） | pytest fixture 中的 `yield` |
| --- | --- | --- |
| 函数类型 | 生成器函数（调用返回生成器对象） | 被 pytest 包装的 fixture 函数（表面是普通函数） |
| 迭代控制 | 需手动调用 `next()` 或用 `for` 循环迭代 | pytest 自动处理迭代（无需开发者干预） |
| 核心用途 | 生成序列值（懒加载） | 管理资源生命周期（setup + teardown） |
| 异常处理 | 需手动捕获 `StopIteration` | pytest 自动捕获并忽略 `StopIteration` |

**总结**

- **`yield` 的本质不变**：无论在何处使用 `yield`，只要在函数中，该函数调用后都会产生生成器对象（这是 Python 语法的原生规则）。
- **pytest 的封装作用**：pytest 对 fixture 中的生成器做了“透明化处理”——帮我们完成迭代、异常处理，将生成器的“产出值”转化为“测试资源”，将“后续迭代”转化为“清理逻辑”，让开发者无需关注生成器的底层细节。

所以，不是“pytest 中 yield 返回的不是生成器”，而是“pytest 让 fixture 中的 yield 看起来不像生成器”。