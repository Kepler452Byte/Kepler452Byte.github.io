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
- **yield**: 类似return，但测试完成后会继续执行yield后面的清理代码
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

## 常见测试场景

- **正常流程**: 测试功能正确执行
- **异常处理**: 测试错误情况的处理
- **边界条件**: 测试空值、极值等情况
- **业务规则**: 测试业务逻辑约束

 📝 [在notion上管理此页](https://www.notion.so/kepler452b/Python-Flask-Unitest-Mock-25c1866cd30f80789301d0c1b542b5c1?v=25c1866cd30f80bb8ba8000cdd7b4a9d&source=copy_link)