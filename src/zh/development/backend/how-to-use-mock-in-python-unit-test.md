---
icon: pen-to-square
date: 2025-08-27
category:
  - 后端
tag:
  - Python
  - unitest
---
# 【Python】【Flask】【Unitest】Mock在单元测试中怎么用

在Python单元测试中，Mock是一个不可或缺的工具，它让我们能够隔离被测试的代码，专注于验证核心业务逻辑。本文将详细对比pytest和unittest中Mock的使用方法，帮你选择最适合的测试方案。

## Mock是什么？为什么需要它？

Mock是一个"替身"对象，用来模拟真实的依赖项。在测试中使用Mock可以：

- **隔离测试**：避免依赖外部系统（数据库、网络、文件系统）
- **控制行为**：精确控制依赖项的返回值和异常
- **验证交互**：确认代码是否正确调用了依赖项
- **提高速度**：避免耗时的真实操作

## unittest.mock 基础用法

### 1. 创建Mock对象

```python
from unittest.mock import Mock, MagicMock

# 基础Mock
basic_mock = Mock()
basic_mock.method.return_value = "mocked_result"

# MagicMock支持魔法方法
magic_mock = MagicMock()
magic_mock.__len__.return_value = 5
print(len(magic_mock))  # 输出: 5

```

**区别说明**：

- `Mock`：基础Mock对象
- `MagicMock`：支持Python魔法方法（如`__len__`、`__str__`等）

### 2. @patch装饰器 - 最常用方式

```python
import unittest
from unittest.mock import patch

class TestUserService(unittest.TestCase):

    @patch('myapp.services.database.get_user')
    def test_get_user_info(self, mock_get_user):
        """替换函数"""
        mock_get_user.return_value = {'id': 1, 'name': 'John'}

        result = UserService().get_user_info(1)

        self.assertEqual(result['name'], 'John')
        mock_get_user.assert_called_once_with(1)

    @patch('myapp.services.EmailService')
    def test_send_notification(self, mock_email_class):
        """替换类"""
        mock_instance = mock_email_class.return_value
        mock_instance.send.return_value = True

        result = UserService().send_notification('test@example.com')

        self.assertTrue(result)
        mock_instance.send.assert_called_once()

    @patch.object(UserService, 'validate_user')
    def test_object_method(self, mock_validate):
        """替换对象方法"""
        mock_validate.return_value = True

        service = UserService()
        result = service.create_user('john', 'john@example.com')

        mock_validate.assert_called_once()

```

**关键点**：

- `@patch`的字符串路径必须是**被测试代码导入时的路径**
- 多个`@patch`时，参数顺序是**倒序**的
- `patch.object`用于替换已存在对象的特定方法

### 3. with patch() 上下文管理器

```python
def test_with_context_manager(self):
    """适用于需要精确控制Mock生效范围的场景"""
    with patch('myapp.services.external_api') as mock_api:
        mock_api.return_value = {'status': 'success'}

        # 只在这个范围内mock生效
        result = MyService().call_external_api()

        self.assertEqual(result['status'], 'success')

    # 这里mock已经失效

```

### 4. setUp()中创建Mock - 复杂依赖注入

```python
class TestComponentService(unittest.TestCase):
    def setUp(self):
        """适用于需要Mock多个依赖的复杂服务"""
        self.component_dao_mock = MagicMock()
        self.history_dao_mock = MagicMock()

        # 替换构造函数中的依赖创建
        with patch('myapp.dao.ComponentDAO', return_value=self.component_dao_mock), \
             patch('myapp.dao.HistoryDAO', return_value=self.history_dao_mock):
            self.service = ComponentService()

    def test_create_component(self):
        # 设置Mock行为
        mock_component = MagicMock()
        mock_component.id = 123
        self.component_dao_mock.create.return_value = mock_component

        # 执行测试
        result = self.service.create_component("test")

        # 验证
        self.assertEqual(result.id, 123)
        self.component_dao_mock.create.assert_called_once_with("test")

```

## pytest中的Mock使用

### 1. 使用unittest.mock（推荐）

```python
import pytest
from unittest.mock import patch, MagicMock

class TestUserService:

    @patch('myapp.services.database.get_user')
    def test_get_user_info(self, mock_get_user):
        """pytest可以直接使用unittest.mock"""
        mock_get_user.return_value = {'id': 1, 'name': 'John'}

        result = UserService().get_user_info(1)

        assert result['name'] == 'John'
        mock_get_user.assert_called_once_with(1)

```

### 2. monkeypatch - pytest专用

```python
class TestDiskCleanup:

    def test_disk_usage_cleanup(self, monkeypatch):
        """pytest的monkeypatch提供了更直观的API"""
        call_count = 0

        def mock_get_disk_usage(path):
            nonlocal call_count
            call_count += 1

            if call_count == 1:
                return {'usage_percent': 0.85}  # 85% - 触发清理
            else:
                return {'usage_percent': 0.60}  # 60% - 清理后

        # 使用monkeypatch替换
        monkeypatch.setattr(
            'myapp.utils.get_disk_usage',
            mock_get_disk_usage
        )

        result = cleanup_disk_cache()

        assert result is True
        assert call_count == 2  # 验证被调用了2次

    def test_environment_variable(self, monkeypatch):
        """Mock环境变量"""
        monkeypatch.setenv('API_KEY', 'test_key')

        result = MyService().get_api_key()
        assert result == 'test_key'

    def test_delete_attribute(self, monkeypatch):
        """删除属性"""
        monkeypatch.delattr('myapp.config.DEBUG', raising=False)

        # 测试DEBUG不存在时的行为

```

**monkeypatch的优势**：

- API更直观：`setattr`、`setenv`、`delattr`
- 自动清理：测试结束后自动恢复
- 类型安全：更好的IDE支持

### 3. pytest fixture中创建Mock

```python
@pytest.fixture
def mock_database():
    """创建可重用的Mock fixture"""
    mock_db = MagicMock()
    mock_db.get_user.return_value = {'id': 1, 'name': 'Test User'}
    return mock_db

@pytest.fixture
def user_service(mock_database):
    """注入Mock依赖"""
    with patch('myapp.services.Database', return_value=mock_database):
        return UserService()

def test_service_with_fixture(user_service):
    """使用fixture中的Mock"""
    result = user_service.get_user_info(1)
    assert result['name'] == 'Test User'

```

## 高级Mock技巧

### 1. 自定义Mock行为

```python
def test_stateful_mock():
    """模拟有状态的外部系统"""
    call_history = []

    def mock_api_call(endpoint, data=None):
        call_history.append((endpoint, data))

        if endpoint == '/login':
            return {'token': 'abc123'}
        elif endpoint == '/users' and data:
            return {'id': len(call_history), 'name': data['name']}
        else:
            return {'error': 'Not found'}

    with patch('requests.post', side_effect=mock_api_call):
        # 测试需要多次API调用的复杂流程
        api = APIClient()
        token = api.login('user', 'pass')
        user = api.create_user('John')

        assert token == 'abc123'
        assert user['name'] == 'John'
        assert len(call_history) == 2

```

### 2. side_effect的多种用法

```python
def test_side_effect_variations():
    mock_func = MagicMock()

    # 1. 返回不同的值
    mock_func.side_effect = ["first", "second", "third"]
    assert mock_func() == "first"
    assert mock_func() == "second"

    # 2. 抛出异常
    mock_func.side_effect = ValueError("Mock exception")
    with pytest.raises(ValueError):
        mock_func()

    # 3. 自定义函数
    def custom_behavior(arg):
        if arg > 0:
            return arg * 2
        else:
            raise ValueError("Invalid argument")

    mock_func.side_effect = custom_behavior
    assert mock_func(5) == 10

```

### 3. 验证Mock交互

```python
def test_mock_verification():
    mock_service = MagicMock()

    # 执行被测试的代码
    process_users(mock_service)

    # 验证调用次数
    assert mock_service.get_users.call_count == 1

    # 验证具体调用参数
    mock_service.create_user.assert_called_with(
        name="John",
        email="john@example.com"
    )

    # 验证调用顺序
    expected_calls = [
        call.get_users(),
        call.create_user(name="John", email="john@example.com"),
        call.send_notification("john@example.com")
    ]
    mock_service.assert_has_calls(expected_calls)

```

## pytest vs unittest：如何选择？

### unittest.mock 适合的场景：

**优势**：

- Python标准库，无需额外安装
- 功能完整，API稳定
- 与unittest框架无缝集成

```python
class TestPaymentService(unittest.TestCase):
    @patch('payment.gateway.charge_card')
    @patch('payment.email.send_receipt')
    def test_process_payment(self, mock_email, mock_charge):
        # 传统单元测试风格，适合复杂的企业级应用
        mock_charge.return_value = {'status': 'success', 'id': '12345'}

        result = PaymentService().process_payment(amount=100)

        self.assertTrue(result)
        mock_charge.assert_called_once()
        mock_email.assert_called_once()

```

### pytest + monkeypatch 适合的场景：

**优势**：

- API更简洁直观
- 自动清理，测试隔离性更好
- 与pytest生态系统集成更好

```python
def test_config_loading(monkeypatch):
    """简单直接的测试风格"""
    monkeypatch.setenv('DATABASE_URL', 'sqlite:///:memory:')

    config = load_config()
    assert config.database_url == 'sqlite:///:memory:'

```

## 最佳实践

### 1. Mock粒度控制

```python
# ❌ 过度Mock
@patch('myapp.services.UserService.get_user')
@patch('myapp.services.UserService.validate_email')
@patch('myapp.services.UserService.hash_password')
def test_create_user_over_mocked(self, mock_hash, mock_validate, mock_get):
    # Mock了太多内部逻辑，测试价值不大
    pass

# ✅ 适度Mock
@patch('myapp.database.save_user')
@patch('myapp.email.send_welcome_email')
def test_create_user_proper(self, mock_email, mock_save):
    # 只Mock外部依赖，保留核心业务逻辑
    service = UserService()
    result = service.create_user('john', 'john@example.com', 'password')

    assert result.username == 'john'
    mock_save.assert_called_once()
    mock_email.assert_called_once()

```

### 2. Mock数据要有意义

```python
# ❌ 无意义的Mock数据
mock_user = MagicMock()
mock_user.id = 1
mock_user.name = "test"

# ✅ 有意义的Mock数据
mock_user = MagicMock()
mock_user.configure_mock(
    id=12345,
    username="john_doe",
    email="john.doe@company.com",
    role="admin",
    created_at=datetime(2023, 1, 15)
)

```

### 3. 验证关键交互

```python
def test_user_registration_flow():
    with patch('myapp.email.send_verification') as mock_email, \
         patch('myapp.database.save_user') as mock_save:

        service = UserService()
        result = service.register_user('john', 'john@example.com')

        # 验证业务逻辑结果
        assert result.status == 'pending_verification'

        # 验证关键交互发生了
        mock_save.assert_called_once()
        mock_email.assert_called_once_with('john@example.com')

        # 验证交互的参数正确
        saved_user = mock_save.call_args[0][0]
        assert saved_user.username == 'john'
        assert saved_user.status == 'pending'

```

## `@patch` 装饰器的工作原理/`mock_get_user` 是什么

要理解 `mock_get_user` 是什么、以及它的“配置”逻辑，需要结合 `@patch` 装饰器的工作原理和测试函数的参数传递规则。下面分两部分清晰拆解：

### 一、`mock_get_user` 是什么？

`mock_get_user` 是 **`@patch` 装饰器自动创建的「Mock 替身对象」**，本质是 `unittest.mock.MagicMock` 类的实例。它的核心角色是：

- 替代被 `patch` 掉的真实函数（这里是 `myapp.services.database.get_user`），拦截所有对该真实函数的调用；
- 提供可配置的“行为”（如设置返回值 `return_value`）和“调用记录”（如记录被调用的次数、参数），方便测试中控制依赖和验证逻辑。

### 二、`mock_get_user` 在哪“配置”？

这里的“配置”分为两部分：**Mock 对象的「创建与注入」**（由 `@patch` 自动完成）和 **Mock 对象的「行为设置」**（由开发者手动写代码配置），两者分工明确：

### 1. 第一步：`mock_get_user` 的创建与注入（自动完成，无需手动配置）

`mock_get_user` 是 `@patch` 装饰器在测试函数执行前 **自动创建** 并 **自动注入到测试函数参数中** 的，整个过程无需开发者手动“定义”或“注册”，背后逻辑如下：

- 当测试框架（如 `unittest`）执行 `test_get_user_info` 时，会先触发 `@patch('myapp.services.database.get_user')` 装饰器的逻辑；
- `@patch` 会先找到要替换的真实函数（`database.get_user`），然后创建一个 `MagicMock` 实例（这就是 `mock_get_user`）；
- `@patch` 会临时将真实函数 `database.get_user` 替换为这个 Mock 实例（确保后续调用都指向 Mock）；
- 最后，`@patch` 会将创建好的 Mock 实例（`mock_get_user`）作为 **第一个参数** 传入测试函数 `test_get_user_info`，供开发者使用。

简单说：`@patch` 负责“造好 Mock 对象并递到你手上”，你只需要在测试函数的参数列表里“接住它”（参数名可以自定义，比如叫 `mock_db_get` 也可以，但通常用 `mock_+真实函数名` 格式方便理解）。

### 2. 第二步：`mock_get_user` 的行为配置（开发者手动写代码）

`@patch` 只负责创建一个“空的” Mock 实例（默认情况下，调用它会返回另一个空的 Mock 对象，无法直接用），**而 Mock 对象的具体“行为”（比如调用后返回什么值、是否抛出异常）**需要开发者手动配置，这才是测试中需要写代码的“配置”环节，对应你代码中的这行：

```python
# 手动配置 mock_get_user 的行为：被调用时返回预设的用户字典
mock_get_user.return_value = {'id': 1, 'name': 'John'}

```

除了设置返回值，常见的手动配置还有：

- 模拟抛出异常（测试异常场景）：
    
    ```python
    mock_get_user.side_effect = ValueError("数据库连接失败")  # 调用时会抛出 ValueError
    
    ```
    
- 模拟动态返回值（不同调用返回不同结果）：
    
    ```python
    mock_get_user.side_effect = [{'id':1, 'name':'John'}, None]  # 第一次调用返回用户，第二次返回 None
    
    ```
    

### 三、关键总结

| 问题 | 答案 |
| --- | --- |
| `mock_get_user` 是什么？ | `MagicMock` 实例，替代真实函数的 Mock 替身，负责拦截调用、记录行为。 |
| 在哪创建？ | `@patch` 装饰器自动创建，无需手动定义。 |
| 怎么到测试函数里？ | `@patch` 自动注入到测试函数的参数中，只需在参数列表里“接住”即可。 |
| 怎么配置它的行为？ | 开发者手动写代码，通过 `mock_get_user.xxx` 配置（如 `return_value`）。 |

举个通俗的例子：

`@patch` 像一个“道具组”，测试前自动给你递上一个“假的数据库查询工具”（`mock_get_user`）；你拿到这个“假工具”后，手动设置它“每次用都返回 John 的信息”（`return_value`），然后用它测试“业务逻辑是否能正确处理 John 的信息”——整个过程既不用动真实数据库，又能精准控制依赖。

## Mock对象的行为配置

要理解 **Mock 配置的方法** 与 **未配置的方法**，核心是围绕 `unittest.mock.Mock`（及 `MagicMock`）的设计逻辑——它们本质是“占位对象”，但对“如何响应外部调用”的处理方式，会因是否提前定义规则而完全不同。

先明确一个前提：在单元测试中，Mock 对象的核心作用是 **替换真实依赖**（如数据库接口、第三方API、复杂函数等），避免真实逻辑执行（如操作数据库、发送网络请求）。而“配置”的本质，就是给这个“占位对象”设定 **明确的行为规则**（比如调用后返回什么值、是否抛出异常、记录调用次数等）。

### 1. 未配置的方法（Unconfigured Methods）

当你创建一个基础 `Mock` 对象（或 `MagicMock` 对象），但没有为其某个方法设定任何行为时，这个方法就是“未配置的方法”。

### 核心特征：

- **自动生成“空壳响应”**：调用未配置的方法时，不会报错，但会返回一个新的 `Mock`（`MagicMock` 则返回新的 `MagicMock`）实例，而非你期望的具体值（如字符串、字典、数字）。
- **无预设逻辑**：既不会返回业务相关数据，也不会抛出异常，仅作为“占位符的延伸”存在，避免因“方法未定义”导致测试崩溃。

### 示例：未配置的 Mock 方法

以基础 `Mock` 为例（`MagicMock` 行为类似，只是返回的是 `MagicMock` 实例）：

```python
from unittest.mock import Mock

# 1. 创建一个未配置的 Mock 对象（模拟某个服务类）
mock_service = Mock()

# 2. 调用它的未配置方法 `get_data()`
result = mock_service.get_data()  # 调用未配置的方法

# 3. 查看结果：返回的是一个新的 Mock 实例，而非具体数据
print(type(result))  # <class 'unittest.mock.Mock'>
print(result == "hello")  # False（不是预期的字符串）

# 4. 虽然能调用，但无法满足业务断言
# 比如测试期望 get_data() 返回 {"id": 1}，未配置时会断言失败

```

### 2. 配置的方法（Configured Methods）

当你为 Mock 对象的某个方法 **显式设定行为规则** 后，这个方法就是“配置的方法”。配置的核心目的是让 Mock 方法的响应符合真实业务场景（如返回指定数据、抛出特定异常），从而能正常验证测试逻辑。

### 常见的配置方式（4种核心场景）

### 场景1：配置方法返回固定值（最常用）

通过 `Mock 对象.目标方法.return_value` 设定方法调用后返回的具体值。

```python
from unittest.mock import Mock

# 1. 创建 Mock 对象（模拟用户服务）
mock_user_service = Mock()

# 2. 配置方法：让 get_user(1) 返回 {"id": 1, "name": "John"}
mock_user_service.get_user.return_value = {"id": 1, "name": "John"}  # 关键配置

# 3. 调用配置后的方法
user = mock_user_service.get_user(1)  # 传入参数1（参数会被记录，但不影响返回值）

# 4. 验证结果：符合预期，可正常断言
print(user)  # {"id": 1, "name": "John"}
assert user["name"] == "John"  # 断言成功

```

### 场景2：配置方法根据入参返回不同值

如果需要方法根据传入的参数动态返回结果（如 `get_user(1)` 返回 John，`get_user(2)` 返回 Alice），可通过 `side_effect` 绑定一个自定义函数。

```python
from unittest.mock import Mock

# 1. 创建 Mock 对象
mock_user_service = Mock()

# 2. 定义自定义函数（根据入参返回不同结果）
def dynamic_get_user(user_id):
    if user_id == 1:
        return {"id": 1, "name": "John"}
    elif user_id == 2:
        return {"id": 2, "name": "Alice"}
    else:
        return None  # 其他ID返回None

# 3. 配置方法：用 side_effect 绑定自定义函数
mock_user_service.get_user.side_effect = dynamic_get_user

# 4. 调用验证
assert mock_user_service.get_user(1)["name"] == "John"  # 成功
assert mock_user_service.get_user(2)["name"] == "Alice"  # 成功
assert mock_user_service.get_user(3) is None  # 成功

```

### 场景3：配置方法抛出指定异常

模拟真实场景中的错误情况（如数据库连接失败、参数错误），通过 `side_effect` 绑定一个异常类或异常实例。

```python
from unittest.mock import Mock

# 1. 创建 Mock 对象（模拟数据库服务）
mock_db = Mock()

# 2. 配置方法：让 connect() 调用时抛出 ConnectionError
mock_db.connect.side_effect = ConnectionError("数据库连接超时")

# 3. 调用验证：会触发预期的异常
try:
    mock_db.connect()
except ConnectionError as e:
    assert str(e) == "数据库连接超时"  # 断言异常信息正确

```

### 场景4：配置方法的调用次数/参数验证

即使不配置返回值，也可以通过 `assert_called_*` 系列方法验证方法是否被正确调用（如调用次数、传入参数是否符合预期）——这本质是对“调用行为”的配置（Mock 会自动记录调用历史，无需额外配置）。

```python
from unittest.mock import Mock

# 1. 创建 Mock 对象
mock_payment = Mock()

# 2. 调用方法（未配置返回值，但调用历史会被记录）
mock_payment.process(amount=100, user_id=1)
mock_payment.process(amount=200, user_id=2)

# 3. 验证调用行为（“配置”了验证规则）
mock_payment.process.assert_called_twice()  # 断言被调用2次
mock_payment.process.assert_any_call(amount=100, user_id=1)  # 断言某次调用参数正确
mock_payment.process.assert_called_last_with(amount=200, user_id=2)  # 断言最后一次调用参数正确

```

### 3. 关键区别：配置 vs 未配置

| 维度 | 未配置的方法 | 配置的方法 |
| --- | --- | --- |
| **返回结果** | 自动返回新的 Mock/MagicMock 实例 | 返回预设的具体值（或抛出指定异常） |
| **业务适配性** | 无法满足业务逻辑断言（返回空壳） | 贴合真实场景，支持正常断言 |
| **使用场景** | 仅临时占位（如避免代码崩溃） | 核心测试逻辑（验证方法调用、结果正确性） |
| **典型操作** | 直接调用，无额外设置 | 通过 `return_value`/`side_effect` 配置 |

### 4. 延伸：MagicMock 的“默认配置”特性

之前提到“MagicMock 的方法调用默认返回 MagicMock 实例，而 Mock 需要显式配置”，这里需要补充：

MagicMock 本质是 **预配置了部分常用方法** 的 Mock 子类（如 `__iter__`、`__len__`、`__call__` 等魔术方法），但普通方法（如 `get_user`、`process`）依然是“未配置”的——它们默认返回 MagicMock 实例，而非具体业务值。

例如：

```python
from unittest.mock import MagicMock

mock = MagicMock()
result = mock.get_user()  # 未配置的普通方法

print(type(result))  # <class 'unittest.mock.MagicMock'>（而非具体数据）
# 若要让 get_user() 返回 {"id":1}，仍需显式配置：
mock.get_user.return_value = {"id": 1}

```

因此，无论 Mock 还是 MagicMock，**要让方法返回业务相关的具体结果，都必须显式配置**——MagicMock 只是减少了“魔术方法”的配置工作量，普通业务方法的配置逻辑与 Mock 完全一致。

## 总结

- **unittest.mock**：功能完整，适合复杂的企业级应用，与传统单元测试框架集成度高
- **pytest + monkeypatch**：API简洁，适合现代Python开发，自动清理机制更安全
- **选择建议**：新项目推荐pytest，现有unittest项目可继续使用unittest.mock
- **Mock原则**：只Mock外部依赖，保留核心业务逻辑，验证关键交互

无论选择哪种方式，记住Mock的核心目标是让测试更快、更稳定、更专注于被测试的逻辑。合理使用Mock能显著提高测试质量和开发效率。

 📝 [在notion上管理此页](https://www.notion.so/kepler452b/25c1866cd30f80479e16d3cd4fbd86d5?v=25c1866cd30f80bb8ba8000cdd7b4a9d&source=copy_link)