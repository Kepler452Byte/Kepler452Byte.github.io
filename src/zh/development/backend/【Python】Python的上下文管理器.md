---
icon: pen-to-square
date: 2025-08-30
category:
  - 后端
tag:
  - Python
---
# 【Python】Python的**上下文管理器**

Python中的"上下文"主要指**上下文管理器（Context Manager）**，这是一种用于管理资源的设计模式，确保资源在使用后能够正确清理。

## 什么是上下文管理器

上下文管理器是实现了`__enter__`和`__exit__`方法的对象，通常与`with`语句一起使用。它的核心思想是：

- 进入上下文时自动获取资源
- 离开上下文时自动释放资源（无论是否发生异常）

## 基本用法

### 文件操作（最常见的例子）

```python
# 使用with语句，文件会自动关闭
with open('file.txt', 'r') as f:
    content = f.read()
    # 即使这里发生异常，文件也会被正确关闭

```

### 数据库连接

```python
import sqlite3

with sqlite3.connect('database.db') as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    # 连接会自动关闭

```

## 自定义上下文管理器

### 方法1：类实现

```python
class DatabaseConnection:
    def __init__(self, db_name):
        self.db_name = db_name
        self.connection = None

    def __enter__(self):
        print(f"连接到数据库 {self.db_name}")
        self.connection = f"connection_to_{self.db_name}"
        return self.connection

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"关闭数据库连接 {self.db_name}")
        if exc_type:
            print(f"发生异常: {exc_type.__name__}")
        # 返回False表示不抑制异常
        return False

# 使用
with DatabaseConnection("mydb") as conn:
    print(f"使用连接: {conn}")

```

### 方法2：使用contextlib装饰器

```python
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.time()
    print("开始计时")
    try:
        yield  # 这里是with语句块执行的地方
    finally:
        end = time.time()
        print(f"耗时: {end - start:.2f}秒")

# 使用
with timer():
    import time
    time.sleep(1)
    print("执行某些操作")

```

## 最佳实践

### 1. 资源管理

始终使用上下文管理器处理需要清理的资源：

```python
# ✅ 好的做法
with open('file.txt') as f:
    data = f.read()

# ❌ 不好的做法
f = open('file.txt')
data = f.read()
f.close()  # 如果前面出现异常，这行代码可能不会执行

```

### 2. 多个上下文管理器

```python
# 多个文件同时操作
with open('input.txt') as infile, open('output.txt', 'w') as outfile:
    data = infile.read()
    outfile.write(data.upper())

```

### 3. 异常处理

```python
@contextmanager
def safe_operation():
    print("开始操作")
    try:
        yield
    except Exception as e:
        print(f"操作失败: {e}")
        # 可以选择重新抛出异常或处理它
        raise
    finally:
        print("清理工作")

```

### 4. 线程锁管理

```python
import threading

lock = threading.Lock()

with lock:  # 自动获取和释放锁
    # 临界区代码
    shared_resource += 1

```

### 5. 临时状态管理

```python
@contextmanager
def temporary_setting(obj, attr, new_value):
    old_value = getattr(obj, attr)
    setattr(obj, attr, new_value)
    try:
        yield
    finally:
        setattr(obj, attr, old_value)

# 使用
import sys
with temporary_setting(sys, 'stdout', open('log.txt', 'w')):
    print("这会写入文件")
# print现在又回到控制台了

```

## 实际应用场景

### 1. 数据库事务

```python
@contextmanager
def transaction(connection):
    trans = connection.begin()
    try:
        yield connection
        trans.commit()
    except:
        trans.rollback()
        raise

```

### 2. 临时目录

```python
import tempfile
import shutil
from contextlib import contextmanager

@contextmanager
def temp_dir():
    dir_path = tempfile.mkdtemp()
    try:
        yield dir_path
    finally:
        shutil.rmtree(dir_path)

```

### 3. 性能监控

```python
@contextmanager
def measure_time(operation_name):
    import time
    start = time.perf_counter()
    try:
        yield
    finally:
        duration = time.perf_counter() - start
        print(f"{operation_name} 耗时: {duration:.4f}秒")

```

上下文管理器是Python中非常重要的概念，它让代码更加健壮和优雅，特别是在处理资源管理时。掌握好上下文管理器能显著提高代码质量。

## 注意点

`yield` 在上下文管理器（`contextlib`）和 pytest fixture 中的作用**核心思想高度相似**，但应用场景和细节有所不同。两者都围绕“资源生命周期管理”设计，通过 `yield` 实现“准备资源→使用资源→清理资源”的自动化流程，但定位域和功能范围存在差异。

### 1. 核心相似点：`yield` 的角色一致

无论是在上下文管理器还是 pytest fixture 中，`yield` 都承担着**“资源移交点”和“生命周期分割线”**的核心角色：

1. **分割“准备”与“清理”逻辑**
    - `yield` 之前的代码：负责资源的创建/初始化（如创建临时目录、建立数据库连接）。
    - `yield` 之后的代码：负责资源的销毁/清理（如删除临时目录、关闭数据库连接）。
2. **保证清理逻辑的可靠性**
    
    无论资源使用过程中是否发生异常（正常结束、抛出错误），`yield` 之后的清理代码**一定会执行**，避免资源泄漏。
    
3. **传递资源给使用者**
    
    `yield` 后面的值会被传递给“资源使用者”（上下文管理器中是 `with` 语句块，pytest 中是测试函数），供其直接使用。
    

### 2. 具体对比：场景和细节的差异

| 维度 | 上下文管理器（`contextlib`）中的 `yield` | pytest fixture 中的 `yield` |
| --- | --- | --- |
| **核心用途** | 通用的资源管理（文件、目录、连接等），适用于任何 Python 代码 | 专门用于测试场景的资源管理（测试数据、数据库连接等） |
| **使用方式** | 通过 `with` 语句块使用：<br>`with temp_dir() as path: ...` | 通过测试函数参数注入使用：<br>`def test_xxx(fixture): ...` |
| **资源复用范围** | 通常在单个 `with` 块内有效，复用需手动多次调用 | 支持通过 `scope` 参数（`function`/`module`/`session`）控制复用范围，可跨测试函数/模块共享 |
| **依赖管理** | 不支持嵌套依赖（需手动在 `with` 块内调用其他管理器） | 支持 fixture 嵌套依赖（fixture 可依赖其他 fixture），自动解析依赖链 |
| **与测试框架结合** | 无特殊结合，纯 Python 原生功能 | 深度集成 pytest 测试框架，支持测试发现、参数化、插件扩展等 |

### 3. 举例：两种机制的“异曲同工”

以“临时目录”资源为例，对比两者的实现逻辑：

**1. 上下文管理器（通用资源管理）**

```python
from contextlib import contextmanager
import tempfile
import shutil

@contextmanager
def temp_dir():
    # 准备资源
    dir_path = tempfile.mkdtemp()
    try:
        # 移交资源给 with 块
        yield dir_path
    finally:
        # 清理资源
        shutil.rmtree(dir_path)

# 使用方式：with 语句块内使用
with temp_dir() as path:
    print(f"在 {path} 中操作文件")  # 使用资源
# 离开 with 块后，临时目录自动删除（清理）

```

**2. pytest fixture（测试资源管理）**

```python
import pytest
import tempfile
import shutil

@pytest.fixture
def temp_dir():
    # 准备资源
    dir_path = tempfile.mkdtemp()
    # 移交资源给测试函数
    yield dir_path
    # 清理资源
    shutil.rmtree(dir_path)

# 使用方式：测试函数参数注入
def test_write_file(temp_dir):
    file_path = f"{temp_dir}/test.txt"
    with open(file_path, "w") as f:
        f.write("test")  # 使用资源
    assert os.path.exists(file_path)
# 测试结束后，临时目录自动删除（清理）

```

可以看到，两者通过 `yield` 实现的“准备-移交-清理”逻辑完全一致，只是使用场景和调用方式不同。

4. 总结：形似神似，各有侧重

- **核心思想一致**：`yield` 都是“资源生命周期的分割点”，通过“准备→移交→清理”的流程实现资源自动化管理，确保清理逻辑可靠执行。
- **应用场景不同**：
    - 上下文管理器是**通用工具**，用于任何需要安全管理资源的 Python 代码（如文件操作、网络连接）。
    - pytest fixture 是**测试专用工具**，除了资源管理，还支持测试框架特有的功能（如依赖注入、作用域控制、与测试用例联动）。

可以说，pytest fixture 中的 `yield` 机制，是上下文管理器思想在测试领域的“增强版实现”。