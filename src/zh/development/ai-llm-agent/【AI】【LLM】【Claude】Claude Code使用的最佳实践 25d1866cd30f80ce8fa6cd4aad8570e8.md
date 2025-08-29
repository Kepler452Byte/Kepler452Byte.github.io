---
icon: pen-to-square
date: 2025-08-30
category:
  - AI/LLM/Agent
tag:
  - LLM
  - Agent
---

# 【AI】【LLM】【Claude】Claude Code使用的最佳实践

## **CLAUDE.md files**

### **`CLAUDE.md`**

- **CLAUDE.md**：CLAUDE.md
- **Generated with /init**：通过 `/init` 生成
- **Commit to source control**：提交到版本控制
- **Shared with other engineers**：与其他工程师共享
- **Location: project directory**：位置：项目目录

### **`CLAUDE.local.md`**

- **CLAUDE.local.md**：CLAUDE.local.md
- **Not shared with other engineers**：不与其他工程师共享
- **Contains personal instructions and customizations for Claude**：包含针对 Claude 的个人指令和自定义设置
- **Location: project directory**：位置：项目目录

### **`~/.claude/CLAUDE.md`**

- **~/.claude/CLAUDE.md**：~/.claude/CLAUDE.md（`~` 代表用户主目录）
- **Used with all projects on your machine**：用于你机器上的所有项目
- **Contains instructions that you want Claude to follow on all projects**：包含你希望 Claude 在所有项目中遵循的指令
- **Location: .claude folder stored in your home directory (~)**：位置：存储在你主目录（`~`）下的 `.claude` 文件夹中

![image.png](%E3%80%90AI%E3%80%91%E3%80%90LLM%E3%80%91%E3%80%90Claude%E3%80%91Claude%20Code%E4%BD%BF%E7%94%A8%E7%9A%84%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5%2025d1866cd30f80ce8fa6cd4aad8570e8/image.png)

## `CLAUDE.md` **加载机制**

Claude Code 会从当前工作目录开始，向上递归查找 `CLAUDE.md` 文件，直到根目录。同时，它也会加载全局的用户记忆和企业策略。**高层级的记忆会先被加载，**形成基础上下文，然后被更具体的低层级记忆覆盖或补充。

## **动态更新记忆**

除了编辑文件，我们还可以使用 `#` 快捷指令在对话中快速添加记忆。Claude Code 会询问你希望将这条记忆保存在哪个文件中（项目、本地或用户），选择后，`CLAUDE.md` 文件就会被自动更新。

## 常用Claude Code CLI 交互模式命令

- `@` 给Claude Code提供上下文，你可以轻松地用 @ 标记文件，使用斜杠命令（很有帮助），并精确选择要包含的上下文。除非 Opus 出现问题，否则我主要使用 Opus，然后切换到 Sonnet。大多数人可能应该使用默认设置——它会使用 Opus 直到你达到 50% 的使用量，然后为了成本效益切换到 Sonnet。
    
    直接用`@` 命令后面输入文件名可以直接进行检索。
    
    ![image.png](%E3%80%90AI%E3%80%91%E3%80%90LLM%E3%80%91%E3%80%90Claude%E3%80%91Claude%20Code%E4%BD%BF%E7%94%A8%E7%9A%84%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5%2025d1866cd30f80ce8fa6cd4aad8570e8/image%201.png)
    
    **专业技巧**：经常使用 `/clear`。每次开始新任务时，清除聊天记录。你不需要所有那些历史记录占用你的 token，你绝对不需要 Claude 运行压缩调用来总结旧对话。直接清除并继续。
    
    向上箭头可以让你浏览过去的聊天记录，甚至是之前会话的记录。当你需要参考昨天的内容时很方便。
    
- `#` ：符号超快地添加记忆。保存到你想要的md文件。
- `/clear`: 完全清空当前对话历史，开始一个全新的上下文。
- `/terminal-setup` ：**Shift+Enter** 默认不能换行。通过这个命令可以配置终端换行。
- `/help`: 显示所有可用命令的帮助信息。
- `/compact`: 清空历史，但保留一份摘要，以便在新的对话中延续之前的背景。
- `/ide`: 连接到你的 IDE (如 VS Code)，让 Claude 知道你当前正在查看或编辑哪个文件。
- `Esc` 键: 随时中断 Claude 正在执行的任何任务。

## Claude Code 命令

- `claude --dangerously-skip-permissions` ：自动授予Claude Code编辑等危险权限，这个权限可以规避烦人的权限请求。yolo模式（狂飙模式）
- `claude “ 问题”`：直接从terminal发起对Claude Code的提问。
    
    ```jsx
    claude -p "生成MySQL的SQL的JOIN语句案例" > query.sql
    ```
    
- `claude -p “问题…”` ：纯文本输出，执行完成直接退出。
- `cat filename | claude “问题…”` ： **管道处理 ，**Claude Code可以通过管道符`“｜”` `grep`等方式给claude **提供对话的初始化上下文**。
    
    ```jsx
    # 管道链式处理
    git diff | claude "总结改动" | claude "用中文解释"
    ```
    
- `批处理多个文件`
    
    ```jsx
    for file in *.py; do
      cat "$file" | claude "检查这个Python文件的代码质量" > "${file%.py}_review.txt"
    done
    ```
    
- `claude config` ：设置Claude Code
    
    ```jsx
    # 设置默认模型
    claude config set model claude-3-sonnet
    
    # 设置最大tokens
    claude config set max-tokens 4000
    
    # 设置温度参数
    claude config set temperature 0.7
    ```
    

## Claude Code历史对话管理

在CLI页面中双击`esc` 进入历史对话页面(好像只能从某个历史开启一个新的对话，不能像cursor一样对代码进行`restore`):

![image.png](%E3%80%90AI%E3%80%91%E3%80%90LLM%E3%80%91%E3%80%90Claude%E3%80%91Claude%20Code%E4%BD%BF%E7%94%A8%E7%9A%84%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5%2025d1866cd30f80ce8fa6cd4aad8570e8/image%202.png)

可以尝试一下用第三方的方案实现代码改动的`restore`

[ccundo：为 Claude Code 提供智能级联撤销/重做功能的本地插件 | SD百科导航](https://sd114.wiki/14107.html)

## GAC Claude Code

[gaccode.com](https://gaccode.com/dashboard)

```jsx
# set env vars
export ANTHROPIC_BASE_URL=https://gaccode.com/claudecode
export ANTHROPIC_API_KEY=sk-ant-oat01-xxxxxxx 

# programmatically approve this API Key
(cat ~/.claude.json 2>/dev/null || echo 'null') | jq --arg key "${ANTHROPIC_API_KEY: -20}" '(. // {}) | .customApiKeyResponses.approved |= ([.[]?, $key] | unique)' > ~/.claude.json.tmp && mv ~/.claude.json.tmp ~/.claude.json
```

## 参考链接

1. [**吴恩达 Claude Code 教程 03：深入代码库与 AI 记忆的构建**](https://mp.weixin.qq.com/s/5LvwLn2d5kxqThfKElLX2g)
2. [**国外大佬是如何使用 Claude Code的？（附最佳技巧）**](https://www.builder.io/blog/claude-code)https://ctok.ai/claude-code-big-brother