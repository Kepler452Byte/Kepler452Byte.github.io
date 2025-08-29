---
icon: pen-to-square
date: 2025-08-29
category:
  - 后端
tag:
  - Python
---
# 【Python】Python流式编程与生成器函数详解

在现代软件开发中，我们经常需要处理大量数据，传统的一次性加载所有数据的方式往往会导致内存不足或性能问题。Python的流式编程和生成器函数为我们提供了优雅的解决方案，让我们能够高效地处理大数据集，本文将深入探讨这些概念及其实际应用。

## 什么是流式编程？

流式编程是一种编程范式，它将数据处理过程看作是数据流在管道中的流动。数据逐个处理，而不是一次性加载全部数据。这种方式具有以下特点：

- **按需处理**：只在需要时处理数据
- **内存高效**：不需要将所有数据同时存储在内存中
- **实时性**：可以立即开始处理，无需等待全部数据加载
- **可组合**：可以将多个处理步骤串联成数据流水线

## 生成器函数：流式编程的核心

### 基础概念

生成器函数是包含`yield`关键字的函数，它不会一次性返回所有结果，而是每次调用时产出一个值，然后暂停执行状态。

```python
def simple_generator():
    print("开始执行")
    yield 1
    print("第一次暂停后继续")
    yield 2
    print("第二次暂停后继续")
    yield 3
    print("执行完成")

# 创建生成器对象
gen = simple_generator()

# 逐步获取值
print(next(gen))  # 开始执行 -> 1
print(next(gen))  # 第一次暂停后继续 -> 2
print(next(gen))  # 第二次暂停后继续 -> 3

```

## `yield` 关键字详解

提到 `yield`，很多初学者会下意识将它与 `return` 对比 —— 毕竟两者都能 “返回值”，但这恰恰是理解的第一个陷阱：**`yield` 不是 “增强版 return”，而是生成器（Generator）的 “开关”**。

```python
# 普通函数：调用即执行，返回结果后函数“消亡”
def normal_func():
    print("函数开始执行")
    return 1
    print("这行代码永远不会执行")  # return 后函数终止

# 含 yield 的函数：调用不执行，返回生成器对象
def yield_func():
    print("函数开始执行")
    yield 1  # 暂停点：返回1，同时保留函数状态
    print("这行代码会被执行！")  # 下次迭代时继续

# 测试普通函数
result = normal_func()  # 输出“函数开始执行”，result=1
print("普通函数返回值：", result)

# 测试 yield 函数
gen = yield_func()  # 无任何输出！返回的是生成器对象，而非执行结果
print("yield 函数返回值：", gen)  # 输出：<generator object yield_func at 0x102b8d6d0>
```

从这个例子能提炼出第一个核心结论：

- 当函数包含 `yield` 时，它就不再是 “普通函数”，而是**生成器函数**（Generator Function）。
- 调用生成器函数时，**不会执行函数体**，而是返回一个**生成器对象**（Generator Object）。
- 只有通过 “迭代” 生成器对象时，函数体才会逐步执行 ——`yield` 就是迭代过程中的 “暂停 / 恢复” 开关。

 **一个例子看懂生成器的执行流程：**

```python
def number_generator():
    print("步骤1：进入生成器函数")
    yield 1  # 暂停点1：返回1，保留当前状态
    print("步骤2：从暂停点1恢复")
    yield 2  # 暂停点2：返回2，保留当前状态
    print("步骤3：从暂停点2恢复")
    yield 3  # 暂停点3：返回3，保留当前状态
    print("步骤4：生成器执行完毕")

# 1. 创建生成器对象（函数未执行）
gen = number_generator()
print("生成器对象已创建\n")

# 2. 第一次迭代：通过 next() 触发执行
print("第一次调用 next(gen)：")
print("返回值：", next(gen))
print()

# 3. 第二次迭代：从上次暂停点继续
print("第二次调用 next(gen)：")
print("返回值：", next(gen))
print()

# 4. 第三次迭代：继续恢复执行
print("第三次调用 next(gen)：")
print("返回值：", next(gen))
print()

# 5. 第四次迭代：生成器已无暂停点，抛出 StopIteration
print("第四次调用 next(gen)：")
next(gen)
```

运行上述代码输出如下：

```python
生成器对象已创建

第一次调用 next(gen)：
步骤1：进入生成器函数
返回值： 1

第二次调用 next(gen)：
步骤2：从暂停点1恢复
返回值： 2

第三次调用 next(gen)：
步骤3：从暂停点2恢复
返回值： 3

第四次调用 next(gen)：
步骤4：生成器执行完毕
Traceback (most recent call last):
  File "yield_demo.py", line 26, in <module>
    next(gen)
StopIteration
```

从输出中能清晰看到 `yield` 的 “暂停 - 恢复” 逻辑：

1. **首次迭代**：执行函数体到第一个 `yield`，返回 `yield` 后的值（1），函数暂停，保留当前上下文（如变量、执行位置）。
2. **后续迭代**：每次调用 `next()`，函数从上次暂停的 `yield` 后继续执行，直到遇到下一个 `yield`，再次暂停并返回值。
3. **迭代结束**：当函数执行到末尾（无更多 `yield`），会自动抛出 `StopIteration` 异常，标志生成器生命周期结束。

**为什么需要 “惰性计算”？—— 解决内存痛点**

惰性计算是 `yield` 的核心优势之一。对于海量数据场景，普通列表会一次性将所有数据加载到内存，可能导致内存溢出；而生成器通过 `yield` 按需生成数据，内存占用始终保持在极低水平。

举个直观的例子：生成 1000 万条数据，对比列表与生成器的内存差异：

```python
import sys

# 方式1：用列表生成1000万条数据（内存杀手）
big_list = [i for i in range(10**7)]
print(f"列表占用内存：{sys.getsizeof(big_list) / 1024 / 1024:.2f} MB")  # 约76.29 MB

# 方式2：用生成器生成1000万条数据（内存友好）
def big_generator():
    for i in range(10**7):
        yield i

big_gen = big_generator()
print(f"生成器占用内存：{sys.getsizeof(big_gen) / 1024:.2f} KB")  # 约0.12 KB
```

[](data:image/png;base64,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)

两者对比堪称 “降维打击”：列表需要加载所有数据，而生成器仅保存 “执行状态”（如当前迭代位置、变量值），内存占用几乎可以忽略。这也是为什么处理日志分析、大数据导出等场景时，生成器是首选方案。

### **`yield` vs `return`：核心差异对比**

| **对比维度** | **`yield`** | **`return`** |
| --- | --- | --- |
| 函数类型 | 生成器函数（返回生成器对象） | 普通函数（返回具体值 / None） |
| 执行逻辑 | 暂停函数，保留上下文；可多次触发 | 终止函数，销毁上下文；仅触发一次 |
| 返回次数 | 可多次返回（每次迭代返回一个值） | 仅一次返回（之后代码不执行） |
| 内存占用 | 惰性计算，按需生成，内存高效 | 一次性计算所有结果，内存密集 |
| 适用场景 | 海量数据迭代、资源管理、状态交互 | 普通函数返回结果 |

### **用 `send()` 实现双向交互：生成器不只是 “生产者”**

生成器不仅能 “返回” 值，还能通过 `send()` 方法 “接收” 外部传入的值，实现双向通信。这让生成器从简单的 “数据生产者” 变成了 “状态处理器”。

用法规则：

- `send(value)` 会将 `value` 传入生成器，作为当前暂停点 `yield` 表达式的返回值。
- 首次调用生成器时，必须先通过 `next(gen)` 或 `gen.send(None)` 启动生成器（否则会报错）。

```python
def echo_generator():
    print("生成器启动，等待接收消息...")
    while True:
        # 接收外部传入的消息（yield 此时作为“输入口”）
        message = yield  
        if message is None:
            yield "错误：消息不能为空"
        else:
            yield f"已收到消息：{message}"

# 1. 创建生成器并启动
gen = echo_generator()
next(gen)  # 启动生成器，执行到第一个 yield 暂停

# 2. 发送消息并接收结果
result1 = gen.send("Hello, yield!")
print(result1)  # 输出：已收到消息：Hello, yield!

# 3. 发送空消息
result2 = gen.send(None)
print(result2)  # 输出：错误：消息不能为空

# 4. 关闭生成器（可选，关闭后无法再迭代）
gen.close()
```

这种双向交互能力，让生成器可以用于实现状态机、协程等复杂逻辑，是 Python 异步编程的基础之一。

### **pytest 中的 `yield`：资源自动 “清理” 神器**

在 pytest 测试框架中，`yield` 被赋予了特殊使命：配合 `@pytest.fixture` 装饰器，实现 “资源准备 - 测试使用 - 自动清理” 的完整生命周期。

核心逻辑：

- `yield` 之前的代码：测试执行前的 “资源准备”（如创建数据库连接、启动测试服务）。
- `yield` 本身：将准备好的资源传递给测试函数。
- `yield` 之后的代码：测试执行后的 “资源清理”（如关闭数据库连接、停止服务）——**即使测试失败，这部分代码也会执行**。

示例：实现一个 “临时文件” 测试资源，自动创建和删除：

```python
import pytest
import tempfile
import os

@pytest.fixture
def temp_test_file():
    """创建临时文件，测试后自动删除"""
    # 1. 资源准备：创建临时文件并写入测试数据
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
        f.write("pytest + yield 资源测试")
        temp_file_path = f.name  # 保存临时文件路径
    
    # 2. 传递资源给测试函数
    yield temp_file_path
    
    # 3. 资源清理：测试结束后删除临时文件
    if os.path.exists(temp_file_path):
        os.remove(temp_file_path)
        print(f"临时文件 {temp_file_path} 已删除")

# 测试函数：使用 fixture 提供的临时文件
def test_read_temp_file(temp_test_file):
    # 读取临时文件内容
    with open(temp_test_file, 'r') as f:
        content = f.read()
    # 断言内容正确
    assert content == "pytest + yield 资源测试"
```

[](data:image/png;base64,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)

运行测试后，你会发现：测试执行时临时文件被创建，测试结束后（无论成功或失败），`yield` 后的清理代码会自动执行，临时文件被删除。这种 “自动清理” 能力，让测试代码更简洁、更可靠，避免了资源泄漏。

### 小结

总结一下`yield`的核心应用场景：

1. **海量数据迭代**：处理日志、大数据集时，用生成器按需生成数据，避免内存溢出（如读取 10GB 日志文件，逐行生成）。
2. **测试资源管理**：在 pytest 中实现 “准备 - 使用 - 清理” 的资源生命周期（如数据库连接、临时文件、测试服务）。
3. **状态化交互**：通过 `send()` 实现双向通信，用于状态机、协程（如异步任务调度、消息处理）。
4. **简化迭代器实现**：自定义迭代器时，用生成器（`yield`）替代手动实现 `__iter__()` 和 `__next__()` 方法，代码量减少 80% 以上。

### 三个掌握`yield` 的关键技巧

1. **用 `for` 循环迭代生成器**：`for` 循环会自动处理 `StopIteration` 异常，比手动调用 `next()` 更简洁（如 `for num in number_generator(): ...`）。
2. **生成器表达式替代列表推导**：对于不需要复用的临时迭代场景，用 `(i for i in range(10))` 替代 `[i for i in range(10)]`，内存更高效。
3. **谨慎使用 `close()` 方法**：调用 `gen.close()` 会强制关闭生成器，之后再迭代会抛出 `StopIteration`；若生成器内有 `finally` 块，`close()` 会触发 `finally` 执行（可用于紧急清理）。

## 生成器的创建方式

### 1. 生成器函数

使用`yield`关键字创建的函数：

```python
def fibonacci_generator(n):
    """生成斐波那契数列"""
    a, b = 0, 1
    count = 0
    while count < n:
        yield a
        a, b = b, a + b
        count += 1

# 使用示例
fib = fibonacci_generator(10)
fibonacci_numbers = list(fib)
print(fibonacci_numbers)  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

```

### 2. 生成器表达式

类似列表推导式，但使用圆括号：

```python
# 生成器表达式
squares = (x**2 for x in range(10) if x % 2 == 0)
print(type(squares))  # <class 'generator'>

# 转换为列表查看结果
print(list(squares))  # [0, 4, 16, 36, 64]

# 更复杂的例子：处理文件
def process_lines(filename):
    with open(filename, 'r') as f:
        return (line.strip().upper() for line in f if line.strip())

```

可以像迭代普通生成器一样使用`process_lines`：

```python
# 调用函数获取生成器
lines_generator = process_lines("large_file.txt")

# 迭代处理（逐行生成结果，不占大量内存）
for line in lines_generator:
    print(line)  # 打印处理后的行（去空格、转大写）`
```

**总结**

- 函数 `process_lines` 返回的是**生成器对象**（通过生成器表达式创建）
- 生成器的特性使其特别适合处理大文件或流式数据，避免内存溢出
- 生成器表达式是创建简单生成器的便捷语法，与 `yield` 定义的生成器函数本质相同，只是适用场景不同（简单逻辑用表达式，复杂逻辑用函数）

### 3. 内置生成器

Python内置了许多生成器函数：

```python
import itertools

# range 是生成器
numbers = range(1000000)  # 不会立即创建100万个数字

# itertools 模块提供了丰富的生成器工具
# 无限循环
cycle_gen = itertools.cycle(['A', 'B', 'C'])

# 累积计算
accumulate_gen = itertools.accumulate([1, 2, 3, 4, 5])  # [1, 3, 6, 10, 15]

# 链式连接
chain_gen = itertools.chain([1, 2], [3, 4], [5, 6])

```

## 实际应用场景

### 1. 大文件处理

处理大型文件时，生成器能显著减少内存使用：

```python
def read_large_csv(filename):
    """逐行读取大型CSV文件"""
    import csv
    with open(filename, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            yield row

def process_user_data(filename):
    """处理用户数据，只保留活跃用户"""
    for user in read_large_csv(filename):
        if user.get('is_active') == 'True':
            yield {
                'id': user['id'],
                'name': user['name'],
                'last_login': user['last_login']
            }

# 使用：即使文件有几GB，内存使用也很少
active_users = process_user_data('users.csv')
for user in active_users:
    print(user)
    # 可以随时break，不需要处理完整个文件

```

### 2. 数据流水线处理

将多个处理步骤组合成数据流水线：

```python
def data_source():
    """数据源生成器"""
    import random
    for i in range(100):
        yield {
            'id': i,
            'value': random.randint(1, 1000),
            'category': random.choice(['A', 'B', 'C'])
        }

def filter_by_category(data_stream, category):
    """按类别过滤"""
    for item in data_stream:
        if item['category'] == category:
            yield item

def transform_value(data_stream, multiplier):
    """转换数值"""
    for item in data_stream:
        item['value'] *= multiplier
        yield item

def aggregate_by_range(data_stream, range_size):
    """按范围聚合"""
    current_range = 0
    range_sum = 0
    count = 0

    for item in data_stream:
        value_range = item['value'] // range_size

        if value_range == current_range:
            range_sum += item['value']
            count += 1
        else:
            if count > 0:
                yield {
                    'range': f"{current_range * range_size}-{(current_range + 1) * range_size - 1}",
                    'sum': range_sum,
                    'count': count,
                    'average': range_sum / count
                }
            current_range = value_range
            range_sum = item['value']
            count = 1

    # 处理最后一个范围
    if count > 0:
        yield {
            'range': f"{current_range * range_size}-{(current_range + 1) * range_size - 1}",
            'sum': range_sum,
            'count': count,
            'average': range_sum / count
        }

# 构建数据流水线
pipeline = aggregate_by_range(
    transform_value(
        filter_by_category(data_source(), 'A'),
        2
    ),
    1000
)

# 执行流水线
for result in pipeline:
    print(result)

```

### 3. 网络数据流处理

处理来自网络的数据流：（爬虫/流式处理 + 分页迭代）

```python
import json
import requests
from typing import Iterator, Dict, Any

def fetch_paginated_data(base_url: str, per_page: int = 100) -> Iterator[Dict[str, Any]]:
    """从分页API获取数据"""
    page = 1
    while True:
        response = requests.get(f"{base_url}?page={page}&per_page={per_page}")
        if response.status_code != 200:
            break

        data = response.json()
        if not data.get('results'):
            break

        for item in data['results']:
            yield item

        if len(data['results']) < per_page:
            break

        page += 1

def process_api_data():
    """处理API数据示例"""
    for item in fetch_paginated_data('https://api.example.com/users'):
        # 实时处理每个用户数据
        if item.get('is_premium'):
            processed_item = {
                'user_id': item['id'],
                'username': item['username'],
                'signup_date': item['created_at']
            }
            yield processed_item

```

### 4. 日志分析

实时分析日志文件：

```python
import re
from datetime import datetime
from typing import Iterator, Dict

def tail_log_file(filename: str) -> Iterator[str]:
    """模拟tail -f命令，持续读取新日志"""
    import time
    with open(filename, 'r') as file:
        # 移动到文件末尾
        file.seek(0, 2)

        while True:
            line = file.readline()
            if line:
                yield line.strip()
            else:
                time.sleep(0.1)  # 等待新内容

def parse_access_log(log_stream: Iterator[str]) -> Iterator[Dict[str, Any]]:
    """解析访问日志"""
    log_pattern = re.compile(
        r'(?P<ip>\S+) - - \[(?P<timestamp>[^\]]+)\] "(?P<method>\S+) (?P<path>\S+) (?P<protocol>\S+)" (?P<status>\d+) (?P<size>\d+)'
    )

    for line in log_stream:
        match = log_pattern.match(line)
        if match:
            yield match.groupdict()

def analyze_access_patterns(parsed_logs: Iterator[Dict[str, Any]]) -> Iterator[Dict[str, Any]]:
    """分析访问模式"""
    ip_counts = {}
    error_count = 0
    total_requests = 0

    for log_entry in parsed_logs:
        total_requests += 1
        ip = log_entry['ip']
        status = int(log_entry['status'])

        # 统计IP访问次数
        ip_counts[ip] = ip_counts.get(ip, 0) + 1

        # 统计错误请求
        if status >= 400:
            error_count += 1

        # 每处理100个请求输出一次统计
        if total_requests % 100 == 0:
            yield {
                'total_requests': total_requests,
                'error_rate': error_count / total_requests,
                'top_ips': sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:5],
                'timestamp': datetime.now().isoformat()
            }

# 使用示例（注意：这会持续运行）
# log_analyzer = analyze_access_patterns(
#     parse_access_log(
#         tail_log_file('/var/log/access.log')
#     )
# )
#
# for stats in log_analyzer:
#     print(f"统计信息: {stats}")

```

## 高级特性

### 1. 生成器的双向通信

生成器可以接收外部发送的值：

```python
def interactive_processor():
    """可交互的处理器"""
    result = None
    while True:
        # 接收外部发送的值
        data = yield result
        if data is None:
            break

        # 处理数据
        result = f"处理结果: {data.upper()}"

# 使用示例
processor = interactive_processor()
next(processor)  # 启动生成器

print(processor.send("hello"))     # 处理结果: HELLO
print(processor.send("world"))     # 处理结果: WORLD
print(processor.send("python"))    # 处理结果: PYTHON

processor.send(None)  # 结束处理器

```

### 2. 异常处理

生成器中的异常处理：

```python
def robust_data_processor(data_source):
    """健壮的数据处理器"""
    processed_count = 0
    error_count = 0

    try:
        for item in data_source:
            try:
                # 模拟数据处理
                if item.get('value', 0) < 0:
                    raise ValueError(f"负值: {item['value']}")

                processed_item = {
                    'id': item['id'],
                    'processed_value': item['value'] * 2,
                    'status': 'success'
                }
                processed_count += 1
                yield processed_item

            except (ValueError, KeyError) as e:
                error_count += 1
                yield {
                    'id': item.get('id', 'unknown'),
                    'error': str(e),
                    'status': 'error'
                }

    finally:
        # 清理工作
        yield {
            'summary': {
                'processed': processed_count,
                'errors': error_count,
                'total': processed_count + error_count
            }
        }

# 测试数据
test_data = [
    {'id': 1, 'value': 10},
    {'id': 2, 'value': -5},  # 会产生错误
    {'id': 3, 'value': 20},
    {'id': 4},  # 缺少value，会产生错误
]

for result in robust_data_processor(test_data):
    print(result)

```

### 3. 生成器装饰器

使用装饰器简化生成器的创建：

```python
from functools import wraps
import time

def timed_generator(func):
    """为生成器添加计时功能"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        gen = func(*args, **kwargs)

        try:
            while True:
                item_start = time.time()
                item = next(gen)
                item_time = time.time() - item_start

                yield {
                    'data': item,
                    'item_process_time': item_time,
                    'total_elapsed': time.time() - start_time
                }
        except StopIteration:
            total_time = time.time() - start_time
            yield {
                'summary': f'总处理时间: {total_time:.2f}秒'
            }

    return wrapper

@timed_generator
def slow_data_generator():
    """慢速数据生成器"""
    for i in range(5):
        time.sleep(0.1)  # 模拟慢速处理
        yield f"数据项 {i}"

# 使用
for result in slow_data_generator():
    print(result)

```

## 最佳实践

```python
# 1. 使用生成器表达式替代小型生成器函数
# 好的做法
even_squares = (x**2 for x in range(100) if x % 2 == 0)

# 不必要的复杂做法
def even_squares_func():
    for x in range(100):
        if x % 2 == 0:
            yield x**2

# 2. 合理使用 itertools
import itertools

def efficient_data_processing(data_sources):
    """高效的多数据源处理"""
    # 使用 itertools.chain 连接多个数据源
    combined = itertools.chain(*data_sources)

    # 使用 itertools.islice 限制处理数量
    limited = itertools.islice(combined, 1000)

    # 使用 itertools.groupby 分组处理
    grouped = itertools.groupby(limited, key=lambda x: x.get('category'))

    for category, items in grouped:
        yield category, list(items)

# 3. 错误处理和资源清理
from contextlib import contextmanager

@contextmanager
def managed_generator(generator_func, *args, **kwargs):
    """管理生成器的生命周期"""
    gen = None
    try:
        gen = generator_func(*args, **kwargs)
        yield gen
    finally:
        if gen:
            try:
                gen.close()
            except GeneratorExit:
                pass

# 使用示例
def resource_intensive_generator():
    print("初始化资源")
    try:
        for i in range(10):
            yield i
    finally:
        print("清理资源")

# 安全使用
with managed_generator(resource_intensive_generator) as gen:
    for item in gen:
        print(item)
        if item == 5:
            break  # 提前结束，资源仍会被正确清理

```

## 总结

Python的流式编程和生成器函数为我们提供了处理大数据的强大工具。通过合理运用这些特性，我们可以：

1. **显著降低内存使用**：只在需要时加载数据，避免内存溢出
2. **提高程序响应性**：立即开始处理，无需等待全部数据加载
3. **构建灵活的数据流水线**：将多个处理步骤优雅地组合
4. **处理无限或超大数据集**：突破内存限制的约束

在现代数据驱动的应用中，掌握流式编程思想和生成器技术不仅能让我们写出更高效的代码，更能让我们以全新的视角思考数据处理问题。无论是处理大型文件、实时数据流，还是构建复杂的数据转换流水线，生成器都是Python开发者工具箱中不可或缺的利器。

记住：**不要一次性加载所有数据，而是让数据像水流一样在管道中流动**。这就是流式编程的精髓所在。