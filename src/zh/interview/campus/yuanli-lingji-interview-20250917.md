---
redirectFrom: "/zh/seeking-job/campus/yuanli-lingji-interview-20250917.html"
title: "原力灵机一面 2025-09-17"
description: "原力灵机一面经历记录（2025-09-17）"
date: 2025-09-17
category: "Interview"
series: "Campus Interview"
tags:
  - "Interview Experience"
icon: pen-to-square
---
## 如何理解Redis中的Lua脚本的原子性

Redis中Lua脚本的执行**不会自动回滚**。这是一个重要的特性，需要理解以下几个关键点：

**Lua脚本的原子性特征**

Redis的Lua脚本确实是**原子性**执行的，但这里的"原子性"指的是：

- 脚本执行期间不会被其他命令打断
- 脚本要么完全执行完成，要么因错误而中止

**执行失败的情况**

当Lua脚本执行失败时：

**已执行的命令不会回滚**

```lua
-- 示例脚本
redis.call('SET', 'key1', 'value1')  -- 这个会执行成功
redis.call('INCR', 'key1')           -- 这里会失败，因为key1不是数字
redis.call('SET', 'key2', 'value2')  -- 这个不会执行

```

在上面的例子中，如果脚本在第二行失败：

- `key1`仍然会被设置为`'value1'`
- `key2`不会被设置
- 但`key1`不会被删除或恢复到脚本执行前的状态

**最佳实践**

为了处理这种情况，建议：

1. **事前验证**
    
    ```lua
    -- 先检查条件，再执行修改
    if redis.call('TYPE', 'key1').ok ~= 'string' then
        return redis.error_reply('key1 is not a string')
    end
    redis.call('SET', 'key1', 'new_value')
    
    ```
    
2. **使用事务性思维设计脚本**
    
    ```lua
    -- 将所有验证放在前面，修改操作放在后面
    local key1_type = redis.call('TYPE', 'key1').ok
    local key2_exists = redis.call('EXISTS', 'key2')
    
    if key1_type ~= 'string' or key2_exists == 0 then
        return redis.error_reply('Precondition failed')
    end
    
    -- 所有验证通过后再执行修改
    redis.call('SET', 'key1', 'value1')
    redis.call('SET', 'key2', 'value2')
    
    ```
    
3. **必要时手动实现补偿逻辑**
    
    所以记住：Redis Lua脚本提供原子性执行，但不提供事务回滚机制。
    

## Python中可迭代对象、迭代器、生成器的完整辨析

**核心定义对比**

| 概念 | 定义 | 必需方法 | 特点 |
| --- | --- | --- | --- |
| **可迭代对象 (Iterable)** | 可以被遍历的对象 | `__iter__()` | 可多次遍历，不记录位置 |
| **迭代器 (Iterator)** | 知道如何逐个返回元素的对象 | `__iter__()` + `__next__()` | 一次性消耗，记录当前位置 |
| **生成器 (Generator)** | 使用yield创建的特殊迭代器 | 自动实现迭代协议 | 惰性计算，状态自保存 |

**关系图解**

```
可迭代对象 (所有能用for循环的对象)
    ├── 容器类型: list, tuple, str, dict, set
    └── 迭代器 (Iterator)
				    ├── 所有迭代器（包括生成器）都是一次性数据处理（核心性质）
            ├── 内置迭代器: iter(list), enumerate(), zip()
            ├── 自定义迭代器类
            └── 生成器 (Generator) ⭐特殊的迭代器
                    ├── 生成器函数 (yield)
                    └── 生成器表达式 ()

```

**代码示例对比**

```python
# 1. 可迭代对象 - 容器，可多次遍历
my_list = [1, 2, 3]
for x in my_list: print(x, end=' ')  # 1 2 3
for x in my_list: print(x, end=' ')  # 1 2 3 (可重复)

# 2. 迭代器 - 一次性消耗，记录位置
my_iter = iter(my_list)
print(next(my_iter))  # 1
print(next(my_iter))  # 2
print(next(my_iter))  # 3
# print(next(my_iter))  # StopIteration异常

# 3. 生成器 - 惰性计算，按需产生
def my_generator():
    yield 1
    yield 2
    yield 3

gen = my_generator()
print(next(gen))  # 1
print(next(gen))  # 2

```

**内存使用对比**

```python
import sys

# 数据规模：100万个数字
n = 1000000

list_obj = [x for x in range(n)]        # ~40MB 内存
iter_obj = iter(range(n))               # ~48 bytes
gen_obj = (x for x in range(n))         # ~104 bytes

print(f"列表: {sys.getsizeof(list_obj)} bytes")     # 大量内存
print(f"迭代器: {sys.getsizeof(iter_obj)} bytes")   # 极少内存
print(f"生成器: {sys.getsizeof(gen_obj)} bytes")    # 极少内存

```

**实际应用场景**

🎯 选择原则

| 场景 | 推荐选择 | 原因 |
| --- | --- | --- |
| 需要多次遍历数据 | **可迭代对象** (list, tuple) | 可重复使用 |
| 处理大文件/大数据 | **生成器** | 内存高效，惰性计算 |
| 无限序列 | **生成器** | 不会耗尽内存 |
| 一次性处理数据流 | **迭代器** | 节省内存，顺序处理 |
| 需要双向通信 | **生成器** | 支持send()方法 |

**📝 实用代码模板**

```python
# 1. 处理大文件 (生成器)
def read_large_file(filename):
    with open(filename, 'r') as f:
        for line in f:
            yield line.strip()

# 2. 无限序列 (生成器)
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# 3. 自定义迭代器类
class CountDown:
    def __init__(self, start):
        self.start = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.start <= 0:
            raise StopIteration
        self.start -= 1
        return self.start + 1

# 4. 生成器表达式 (最简洁)
squares = (x**2 for x in range(10))

```

**简单记忆法**

- **可迭代对象** = 数据容器，能用`for`循环 📦
- **迭代器** = 带指针的数据流，知道下一个在哪里 👉
- **生成器** = 智能的迭代器，按需生产数据 🏭

**特性总结**

| 特性 | 可迭代对象 | 迭代器 | 生成器 |
| --- | --- | --- | --- |
| **可重复遍历** | ✅ | ❌ | ❌ |
| **内存高效** | ❌ | ✅ | ✅ |
| **惰性计算** | ❌ | ✅ | ✅ |
| **创建简单** | ✅ | ❌ | ✅ |
| **状态保存** | ❌ | ✅ | ✅ |
| **双向通信** | ❌ | ❌ | ✅ |

**🔥 最佳实践建议**

1. **数据量小且需要多次访问** → 使用list、tuple等可迭代对象
2. **数据量大或无限序列** → 使用生成器
3. **一次性数据处理** → 使用迭代器
4. **需要自定义复杂迭代逻辑** → 自定义迭代器类
5. **简单的数据转换** → 生成器表达式

**核心原则：根据数据规模和使用模式选择合适的工具！**