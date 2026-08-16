---
redirectFrom: "/zh/cs-development/backend/zabbix-guide.html"
title: "Zabbix 详解"
description: "Zabbix 监控体系的核心概念、部署配置与常见用法详解"
date: 2025-11-17
category: "DevOps"
tags:
  - "Zabbix"
icon: pen-to-square
---
- **Zabbix Proxy**：用于从被监控的主机收集数据，并将这些数据转发给 Zabbix Server。这有助于减轻 Zabbix Server 的负载，特别是在大规模监控环境中。Zabbix Proxy 还可以作为网络隔离的桥梁，缓存数据以应对网络不稳定的情况。
- **Zabbix Agent**：运行在被监控的主机上，用于收集本地的监控数据，并将数据发送给 Zabbix Server 或 Zabbix Proxy。
- **Zabbix Sender**：用于主动向 Zabbix Server 发送数据。
- **MySQL 数据库**：用于存储 Zabbix Proxy 的相关数据，包括监控数据和配置信息。
- **NPS Client (npc)**：用于网络穿透，允许内部网络的主机通过公网服务器访问内部服务。

`zabbix_get` 本身不能直接 “主动执行” shell 命令，但它可以 **获取 Zabbix Agent 执行 shell 命令后的结果**—— 前提是在 Agent 端提前配置好对应的 “自定义监控项”（通过 `UserParameter` 定义）。

### **具体逻辑：**

`zabbix_get` 的作用是 “向 Agent 请求指定监控项的数据”，而 Agent 可以被配置为：当收到某个监控项（Key）的请求时，执行一段 shell 命令 / 脚本，并将命令的输出结果返回给 `zabbix_get`。

简单说：`zabbix_get` 不直接运行 shell 命令，而是 “触发 Agent 执行预设的 shell 命令”，再获取结果。

### **实现步骤（示例）：**

1. **在被监控的 “盒子”（Agent 端）配置自定义参数**：编辑 Zabbix Agent 的配置文件（如 `zabbix_agentd.conf`），添加一行 `UserParameter`，定义一个 “监控项 Key” 与 “shell 命令” 的映射：
    
    ```jsx
    # 格式：UserParameter=键名,要执行的shell命令
    UserParameter=custom.ping.baidu,ping -c 3 baidu.com | grep "packet loss"  # 执行ping百度3次，提取丢包率
    ```
    
    保存后重启 Zabbix Agent，使配置生效。
    
2. **在安装了 zabbix_get 的机器上查询结果**：执行 `zabbix_get` 命令，指定 Agent 的 IP 和上述定义的 Key，即可获取 shell 命令的输出：
    
    ```jsx
    zabbix_get -s 10.0.0.1  # 目标盒子的IP
               -k "custom.ping.baidu"  # 刚才定义的Key
    ```
    

输出结果可能类似：`3 packets transmitted, 3 received, 0% packet loss, time 2002ms`（即 ping 命令的执行结果）。

### **注意事项：**

- Agent 执行的 shell 命令权限由 Agent 进程的运行用户（如 `zabbix` 用户）决定，若命令需要 root 权限，需配置`sudo`或调整权限。
- 命令的输出需符合 Zabbix 的格式要求（通常是单行文本或数值，避免复杂格式导致解析错误）。
- 这种方式本质是 “通过监控项间接执行 shell 命令”，而非 `zabbix_get` 直接运行命令，适合预先定义好的探测逻辑（如你需要的 PING、CURL 等）。

结合你的 “全网拨测” 需求：可以在各地盒子的 Agent 中，通过 `UserParameter` 预先定义好 PING、CURL、DNS 等 shell 命令的监控项，然后用 `zabbix_get` 从中心节点向各地盒子发送请求，获取这些命令的执行结果，从而实现全网探测。

### **核心目标**

想做一个「全国（甚至全球）范围的网络拨测工具」，功能类似现有的 `http://itops.jd.com/#/nettools/pingtools`（可能是个基础 ping 工具），但要更全面 —— 支持多种常用网络探测命令（PING、CURL、DNS、TELNET 等），能从分布在各地的「盒子」（推测是部署在不同地区的监控节点 / 设备）出发，一键发起探测并获取结果。

### **现有基础**

目前这些「盒子」已经通过 **ZABBIX** 进行监控数据上报（即盒子的状态、基础数据会同步到 ZABBIX 系统）。

### **实现思路的考虑**

为了实现上述拨测功能，计划：

1. 在所有全球分布的「盒子」上部署一个 **AGENT**（代理程序），让这个 AGENT 能执行 PING、CURL、DNS、TELNET 等探测命令；
2. 封装这些功能时，考虑复用现有工具：比如用 ZABBIX 的 `zabbix_get` 工具（ZABBIX 中用于从服务器主动获取代理数据的工具），或者 Prometheus 的 `Blackbox Exporter`（专门用于黑盒探测的组件，支持多种网络协议探测）。

简单说就是：基于现有的全球分布的「盒子」和 ZABBIX 监控基础，新增一个能从各地盒子主动发起多种网络探测（PING / 域名解析 / 端口连通性等）的工具，方便做全网范围的网络状态验证，实现方式考虑复用 zabbix_get 或 Blackbox 这类成熟工具。

## **反向监控**

监控中心在内网 而agent在外网 、这通常被称为 **"反向监控"** 或 **"外网设备监控"** 场景。让我详细解释这种情况的工作原理和典型应用场景。

### 为什么会出现这种需求？

**监控中心在内网，Agent在外网** 的场景通常出现在以下情况：

1. **企业总部监控分支/门店**：总部有完善的监控系统，需要监控各个门店的服务器、POS机等设备。
2. **监控云资源**：公司内部监控系统需要监控公有云上的云主机、数据库等资源。
3. **远程办公设备监控**：需要监控员工居家办公的电脑或服务器。
4. **IoT设备监控**：监控分布在不同地点的物联网设备。

---

### 技术实现方案

由于Agent在外网，监控中心在内网，**最大的挑战是内网的监控中心无法主动连接外网的Agent**。以下是几种解决方案：

### 方案一：使用 Zabbix Proxy（推荐）

这是最标准、最稳定的做法。

```mermaid
flowchart TD
    subgraph Internet [外网]
        A1[Zabbix Agent<br>云服务器]
        A2[Zabbix Agent<br>门店POS机]
        A3[Zabbix Agent<br>远程办公电脑]

        P[Zabbix Proxy<br>有公网IP的服务器]
    end

    subgraph Intranet [企业内网]
        S[Zabbix Server]
    end

    A1 -- "主动上报数据" --> P
    A2 -- "主动上报数据" --> P
    A3 -- "主动上报数据" --> P

    P -- "主动连接并上报汇总数据" --> S

```

**工作流程**：

1. 在外网部署一台 **Zabbix Proxy**（需要公网IP）
2. 所有外网的 **Zabbix Agent** 配置为**主动模式**，主动向Proxy上报数据
3. **Zabbix Proxy** 主动连接内网的 **Zabbix Server** 并上报汇总数据
4. Zabbix Server 处理数据、触发告警

**优势**：

- Zabbix 原生支持，稳定性高
- Proxy 可以缓存数据，网络中断时不会丢失数据
- 安全性好，只需Proxy能访问Server即可

### 方案二：使用 NPS/NPC 建立隧道

这种方式通过隧道"拉回"外网Agent。

```mermaid
flowchart TD
    subgraph Internet [外网]
        A1[Zabbix Agent<br>云服务器 + NPC]
        A2[Zabbix Agent<br>门店设备 + NPC]
    end

    subgraph Intranet [企业内网]
        NPS[NPS Server]
        S[Zabbix Server]
    end

    A1 -- "建立持久隧道" --> NPS
    A2 -- "建立持久隧道" --> NPS

    NPS -- "流量转发" --> S
    S -- "通过隧道采集数据" --> NPS

```

**工作流程**：

1. 在内网部署 **NPS 服务端**
2. 在外网Agent机器上运行 **NPC 客户端**，与NPS建立隧道
3. Zabbix Server 通过隧道地址访问外网的Agent

**配置示例**：

- 为云服务器Agent创建隧道：`nps云端口:10050` → `外网AgentIP:10050`
- Zabbix Server 添加主机时，地址填写：`nps内网IP:nps云端口`

### 方案三：Agent完全主动模式

最简单的方案，但功能有限。

```mermaid
flowchart TD
    subgraph Internet [外网]
        A[Zabbix Agent<br>主动模式]
    end

    subgraph Intranet [企业内网]
        S[Zabbix Server]
    end

    A -- "直接主动上报数据" --> S

```

**配置要点**：

- Agent 配置文件中设置：
    
    ```
    ServerActive=zabbix-server-internal-ip:10051
    Hostname=唯一标识符
    
    ```
    
- 在Zabbix Server上创建主机时，`Host name` 要与Agent的`Hostname`一致

**限制**：

- Server 无法主动触发检查（如网络发现、自动注册）
- 某些监控项可能无法工作

---

### 实际场景对比

| 场景 | 推荐方案 | 理由 |
| --- | --- | --- |
| **监控多个云主机** | Zabbix Proxy | 集中管理，降低网络开销 |
| **监控少量远程设备** | Agent主动模式 | 简单直接，无需额外组件 |
| **网络环境复杂** | NPS/NPC隧道 | 穿透能力强，适应性好 |
| **安全性要求高** | Zabbix Proxy | Zabbix原生安全机制 |

### 总结

**监控中心在内网，Agent在外网是完全可行的**，关键在于解决连接方向的问题：

- **Zabbix Proxy**：企业级推荐，稳定可靠
- **NPS/NPC隧道**：灵活性强，适合复杂网络
- **Agent主动模式**：简单场景适用，配置便捷

选择哪种方案取决于你的具体需求：设备数量、网络环境、安全要求和维护成本。对于生产环境，我通常推荐 **Zabbix Proxy 方案**，因为它是Zabbix生态的原生组成部分，有最好的兼容性和支持。

## JDIT Zabbix数据采集方案

您说得对，完整的监控流程应该包括配置下发和主动采集。让我修正图表，添加Zabbix Server向Proxy下发采集配置的线路：

```mermaid
flowchart TD
    subgraph Internet [外网]
        A1[Zabbix Agent<br>云服务器]
        A2[Zabbix Agent<br>门店POS机]
        A3[Zabbix Agent<br>远程办公电脑]

        subgraph Proxy_Server [外网Proxy服务器]
            NPC[NPC Client]
            P[Zabbix Proxy]
        end
    end

    subgraph Intranet [企业内网]
        NPS[NPS Server]
        S[Zabbix Server]
    end

    %% 数据上报流程（实线）
    A1 -- "① 主动上报监控数据" --> P
    A2 -- "① 主动上报监控数据" --> P
    A3 -- "① 主动上报监控数据" --> P

    P -- "② 转发监控数据" --> NPC
    NPC -- "③ 通过隧道传输" --> NPS
    NPS -- "④ 转发至Server" --> S

    %% 配置下发流程（虚线）
    S -. "A. 下发采集配置" .-> NPS
    NPS -. "B. 通过隧道下发" .-> NPC
    NPC -. "C. 转发配置" .-> P
    P -. "D. 向Agent下发<br>采集指令" .-> A1
    P -. "D. 向Agent下发<br>采集指令" .-> A2
    P -. "D. 向Agent下发<br>采集指令" .-> A3

```

### 完整的数据流说明

**配置下发流程（虚线路径 A→B→C→D）：**

1. **A**: Zabbix Server 通过Web界面配置监控项后，向Proxy下发采集配置
2. **B**: NPS Server 通过已建立的隧道将配置指令转发给NPC
3. **C**: NPC 将配置指令传递给本地的Zabbix Proxy
4. **D**: Zabbix Proxy 将具体的采集任务下发给各个Zabbix Agent

**数据上报流程（实线路径 ①→②→③→④）：**

1. **①**: 各Zabbix Agent 执行采集任务，主动将监控数据上报给Zabbix Proxy
2. **②**: Zabbix Proxy 汇总和处理数据后，准备发送给Server
3. **③**: NPC 通过隧道将监控数据发送给NPS Server
4. **④**: NPS Server 将数据转发给Zabbix Server进行处理和存储

### 关键配置要点

要使这个双向通信正常工作，需要正确配置：

**Zabbix Proxy 配置：**

```
# 必须配置为主动模式，才能通过隧道连接Server
Server=内网NPS服务器IP:隧道端口
Hostname=外网Proxy唯一标识

```

**Zabbix Agent 配置：**

```
# 配置为主动模式，向Proxy上报数据
ServerActive=Proxy服务器IP
Hostname=设备唯一标识

```

**NPS 隧道配置：**

- 需要建立**双向TCP隧道**，确保配置下发和数据上报都能通过同一个隧道传输
- 隧道需要保持持久连接，避免频繁重连影响监控实时性

这样的架构确保了监控系统完整的闭环：既能下发监控配置，又能收集监控数据，完全满足了生产环境的需求。

```mermaid
graph TB
    subgraph Center["中心管理层"]
        ZS[Zabbix Server<br/>中央服务器]
        WEB[Zabbix Web UI<br/>管理界面]
        DB[(中央MySQL数据库)]
        ZG[zabbix_get<br/>主动查询工具]
    end

    subgraph Network["网络穿透层"]
        Tunnel[穿透服务器<br/>公网中继节点<br/>NPS/frp/其他方案]
    end

    subgraph Box1["监控盒子 - 北京节点"]
        direction TB
        TC1[穿透客户端<br/>网络打通方案]
        ZP1[Zabbix Proxy<br/>区域代理服务]
        DB1[(Proxy MySQL<br/>本地数据库)]
        ZA1[Zabbix Agent<br/>监控代理]
        UP1[UserParameter配置<br/>自定义监控项]
        CMD1[Shell命令执行<br/>PING/CURL/DNS/TELNET]
        
        TC1 -.内部通信.-> ZP1
        ZP1 --> DB1
        ZP1 --> ZA1
        ZA1 --> UP1
        UP1 --> CMD1
    end

    subgraph Box2["监控盒子 - 上海节点"]
        direction TB
        TC2[穿透客户端<br/>网络打通方案]
        ZP2[Zabbix Proxy<br/>区域代理服务]
        DB2[(Proxy MySQL<br/>本地数据库)]
        ZA2[Zabbix Agent<br/>监控代理]
        UP2[UserParameter配置<br/>自定义监控项]
        CMD2[Shell命令执行<br/>PING/CURL/DNS/TELNET]
        
        TC2 -.内部通信.-> ZP2
        ZP2 --> DB2
        ZP2 --> ZA2
        ZA2 --> UP2
        UP2 --> CMD2
    end

    subgraph Box3["监控盒子 - 海外节点"]
        direction TB
        TC3[穿透客户端<br/>网络打通方案]
        ZP3[Zabbix Proxy<br/>区域代理服务]
        DB3[(Proxy MySQL<br/>本地数据库)]
        ZA3[Zabbix Agent<br/>监控代理]
        UP3[UserParameter配置<br/>自定义监控项]
        CMD3[Shell命令执行<br/>PING/CURL/DNS/TELNET]
        
        TC3 -.内部通信.-> ZP3
        ZP3 --> DB3
        ZP3 --> ZA3
        ZA3 --> UP3
        UP3 --> CMD3
    end

    %% 中心层连接
    WEB --> ZS
    ZS <--> DB

    %% 网络穿透连接
    Tunnel <-.穿透隧道.-> TC1
    Tunnel <-.穿透隧道.-> TC2
    Tunnel <-.穿透隧道.-> TC3

    %% Proxy与Server的数据同步
    ZS <-.配置下发/数据上报.-> ZP1
    ZS <-.配置下发/数据上报.-> ZP2
    ZS <-.配置下发/数据上报.-> ZP3

    %% zabbix_get主动查询
    ZG -.主动查询Key.-> ZA1
    ZG -.主动查询Key.-> ZA2
    ZG -.主动查询Key.-> ZA3

    %% 命令执行结果返回
    CMD1 -.结果返回.-> ZA1
    CMD2 -.结果返回.-> ZA2
    CMD3 -.结果返回.-> ZA3

    %% 样式定义
    style Center fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style Network fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style Box1 fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    style Box2 fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    style Box3 fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    
    style ZS fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000
    style WEB fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000
    style ZG fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000
    style DB fill:#b3e5fc,stroke:#0277bd,stroke-width:2px,color:#000
    
    style Tunnel fill:#f8bbd0,stroke:#ad1457,stroke-width:2px,color:#000
    
    style TC1 fill:#ffe0b2,stroke:#ef6c00,stroke-width:2px,color:#000
    style TC2 fill:#ffe0b2,stroke:#ef6c00,stroke-width:2px,color:#000
    style TC3 fill:#ffe0b2,stroke:#ef6c00,stroke-width:2px,color:#000
    
    style ZP1 fill:#ffcc80,stroke:#e65100,stroke-width:2px,color:#000
    style ZP2 fill:#ffcc80,stroke:#e65100,stroke-width:2px,color:#000
    style ZP3 fill:#ffcc80,stroke:#e65100,stroke-width:2px,color:#000
    
    style DB1 fill:#fff9c4,stroke:#f9a825,stroke-width:2px,color:#000
    style DB2 fill:#fff9c4,stroke:#f9a825,stroke-width:2px,color:#000
    style DB3 fill:#fff9c4,stroke:#f9a825,stroke-width:2px,color:#000
    
    style ZA1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000
    style ZA2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000
    style ZA3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000
    
    style UP1 fill:#d1c4e9,stroke:#512da8,stroke-width:2px,color:#000
    style UP2 fill:#d1c4e9,stroke:#512da8,stroke-width:2px,color:#000
    style UP3 fill:#d1c4e9,stroke:#512da8,stroke-width:2px,color:#000
    
    style CMD1 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000
    style CMD2 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000
    style CMD3 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000
```

```mermaid
graph TB
    subgraph Legend["📊 流程图例"]
        L1[🟠 橙色粗线: 命令下发流程]
        L2[🟢 绿色粗线: 数据回调流程]
        L3[🔵 蓝色细线: 常规监控数据流]
    end

    subgraph AIAgent["🤖 AI Agent操作区 (Web界面)"]
        WEB[Zabbix Web界面<br/>AI Agent操作平台]
        USER[🤖 运维 Agent<br/>配置/告警/命令]
    end

    subgraph Public["公网环境 - 中心监控"]
        ZS[Zabbix Server<br/>监控服务器]
        DB[(MySQL数据库<br/>存储监控数据)]
        
        subgraph NPS["NPS穿透集群"]
            NPS1[NPS主节点<br/>公网IP:8024]
            NPS2[NPS备节点<br/>公网IP:8024]
        end
    end

    subgraph Private1["内网环境 - 北京机房"]
        subgraph Proxy1["Zabbix Proxy + NPC"]
            NPC1[NPC客户端<br/>连接NPS集群]
            ZP1[Zabbix Proxy<br/>区域代理服务]
            DB1[(本地MySQL<br/>数据缓存)]
        end
        
        subgraph Server1["内网服务器-Web01"]
            ZA1[Zabbix Agent<br/>监控代理]
            UP1[UserParameter<br/>自定义监控项]
            CMD1[Shell命令执行器<br/>systemctl/df/curl]
        end
        
        subgraph Server2["内网服务器-DB01"]
            ZA2[Zabbix Agent<br/>监控代理]
            UP2[UserParameter<br/>自定义监控项]
            CMD2[Shell命令执行器<br/>mysqladmin/df]
        end
    end

    %% AI Agent操作命令下发流程（橙色粗线）
    USER -->|① AI Agent登录操作| WEB
    WEB -->|② 界面操作请求| ZS
    ZS -->|③ 配置NPS通道| NPS
    NPS -->|④ 穿透传输命令| NPC1
    NPC1 -->|⑤ 代理接收命令| ZP1
    ZP1 -->|⑥ 分发执行命令| CMD1
    ZP1 -->|⑥ 分发执行命令| CMD2

    %% 命令执行结果回调流程（绿色粗线）
    CMD1 -->|⑦ 执行结果返回| ZP1
    CMD2 -->|⑦ 执行结果返回| ZP1
    ZP1 -->|⑧ 代理汇总结果| NPC1
    NPC1 -->|⑨ 穿透回调数据| NPS
    NPS -->|⑩ 服务端接收| ZS
    ZS -->|⑪ 数据存储更新| DB
    ZS -->|⑫ 界面实时展示| WEB
    WEB -->|⑬ AI Agent查看结果| USER

    %% 常规监控数据流
    ZA1 -->|监控数据采集| ZP1
    ZA2 -->|监控数据采集| ZP1
    ZP1 -->|数据批量上报| ZS

    %% 内部连接
    NPS1 --- NPS2
    ZA1 --> UP1 --> CMD1
    ZA2 --> UP2 --> CMD2

    %% 样式定义
    classDef legend fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    classDef aiAgentArea fill:#fff3e0,stroke:#ff9800,stroke-width:3px
    classDef commandFlow fill:#ffecb3,stroke:#ff6f00,stroke-width:2px
    classDef center fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1px
    classDef nps fill:#fce4ec,stroke:#c2185b,stroke-width:1px
    classDef proxy fill:#fff8e1,stroke:#f57c00,stroke-width:1px
    classDef agent fill:#e8f5e8,stroke:#1b5e20,stroke-width:1px
    
    class Legend legend
    class AIAgent aiAgentArea
    class USER,WEB commandFlow
    class Public,Private1 center
    class NPS nps
    class Proxy1 proxy
    class Server1,Server2 agent
    
    %% 链接样式 - 命令下发流程（橙色粗线）
    linkStyle 0,1,2,3,4,5,6 stroke:#ff6f00,stroke-width:4px
    
    %% 链接样式 - 数据回调流程（绿色粗线）
    linkStyle 7,8,9,10,11,12,13,14 stroke:#2e7d32,stroke-width:4px
    
    %% 链接样式 - 常规监控数据流（蓝色细线）
    linkStyle 15,16,17 stroke:#1565c0,stroke-width:2px
```

```mermaid
graph TB
    subgraph Legend["📊 流程图例"]
        L1[🟠 橙色粗线: 命令下发流程]
        L2[🟢 绿色粗线: 数据回调流程]
        L3[🔵 蓝色细线: 常规监控数据流]
    end

    subgraph AIAgent["🤖 AI Agent操作区 (Web界面)"]
        WEB[Zabbix Web界面<br/>AI Agent操作平台]
        USER[🤖 运维 Agent<br/>配置/告警/命令]
    end

    subgraph Public["公网环境 - 中心监控"]
        ZS[Zabbix Server<br/>监控服务器]
        DB[(MySQL数据库<br/>存储监控数据)]
        
        subgraph NPS["NPS穿透集群"]
            NPS1[NPS主节点<br/>公网IP:8024]
            NPS2[NPS备节点<br/>公网IP:8024]
        end
    end

    subgraph Private1["内网环境 - 北京机房"]
        subgraph Proxy1["Zabbix Proxy + NPC"]
            NPC1[NPC客户端<br/>连接NPS集群]
            ZP1[Zabbix Proxy<br/>区域代理服务]
            DB1[(本地MySQL<br/>数据缓存)]
        end
        
        subgraph Server1["内网服务器-Web01"]
            ZA1[Zabbix Agent<br/>监控代理]
            UP1[UserParameter<br/>自定义监控项]
            CMD1[Shell命令执行器<br/>systemctl/df/curl]
        end
        
        subgraph Server2["内网服务器-DB01"]
            ZA2[Zabbix Agent<br/>监控代理]
            UP2[UserParameter<br/>自定义监控项]
            CMD2[Shell命令执行器<br/>mysqladmin/df]
        end
    end

    %% AI Agent操作命令下发流程（橙色粗线）
    USER -->|① AI Agent登录操作| WEB
    WEB -->|② 界面操作请求| ZS
    ZS -->|③ 配置NPS通道| NPS
    NPS -->|④ 穿透传输命令| NPC1
    NPC1 -->|⑤ 代理接收命令| ZP1
    ZP1 -->|⑥ 下发到Agent| ZA1
    ZP1 -->|⑥ 下发到Agent| ZA2
    ZA1 -->|⑦ 调用执行器| CMD1
    ZA2 -->|⑦ 调用执行器| CMD2

    %% 命令执行结果回调流程（绿色粗线）
    CMD1 -->|⑧ 返回结果| ZA1
    CMD2 -->|⑧ 返回结果| ZA2
    ZA1 -->|⑨ Agent回传| ZP1
    ZA2 -->|⑨ Agent回传| ZP1
    ZP1 -->|⑩ 代理汇总结果| NPC1
    NPC1 -->|⑪ 穿透回调数据| NPS
    NPS -->|⑫ 服务端接收| ZS
    ZS -->|⑬ 数据存储更新| DB
    ZS -->|⑭ 界面实时展示| WEB
    WEB -->|⑮ AI Agent查看结果| USER

    %% 常规监控数据流
    ZA1 -->|监控数据采集| ZP1
    ZA2 -->|监控数据采集| ZP1
    ZP1 -->|数据批量上报| ZS
    ZP1 -->|本地缓存| DB1

    %% 内部连接
    NPS1 --- NPS2
    ZA1 --- UP1
    ZA2 --- UP2

    %% 样式定义
    classDef legend fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    classDef aiAgentArea fill:#fff3e0,stroke:#ff9800,stroke-width:3px
    classDef commandFlow fill:#ffecb3,stroke:#ff6f00,stroke-width:2px
    classDef center fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1px
    classDef nps fill:#fce4ec,stroke:#c2185b,stroke-width:1px
    classDef proxy fill:#fff8e1,stroke:#f57c00,stroke-width:1px
    classDef agent fill:#e8f5e8,stroke:#1b5e20,stroke-width:1px
    
    class Legend legend
    class AIAgent aiAgentArea
    class USER,WEB commandFlow
    class Public,Private1 center
    class NPS nps
    class Proxy1 proxy
    class Server1,Server2 agent
    
    %% 链接样式 - 命令下发流程（橙色粗线）
    linkStyle 0,1,2,3,4,5,6,7,8 stroke:#ff6f00,stroke-width:4px
    
    %% 链接样式 - 数据回调流程（绿色粗线）
    linkStyle 9,10,11,12,13,14,15,16,17,18 stroke:#2e7d32,stroke-width:4px
    
    %% 链接样式 - 常规监控数据流（蓝色细线）
    linkStyle 19,20,21,22 stroke:#1565c0,stroke-width:2px
```

- **本地的 MySQL 缓存是属于 Zabbix Proxy 的。**

```mermaid
graph LR
    subgraph Proxy节点
        ZP[Zabbix Proxy服务]
        DB[(本地MySQL<br/>Proxy专用数据库)]

        subgraph 数据流向
            A[Zabbix Agent] -->|① 采集数据| ZP
            ZP -->|② 写入缓存| DB
            ZP -->|③ 读取缓存| DB
            DB -->|④ 批量上报| ZS[Zabbix Server]
        end
    end

    ZS -->|⑤ 配置下发| ZP

    style DB fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style ZP fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

```

- IT监控盒子服务框架 ✅**被监控设备**（主机）需要单独部署和配置各自的 Agent
- zabbix proxy的大版本必须要和zabbix server版本一致，否则会导致出现zabbix server与zabbix proxy不兼容问题

```mermaid
graph TB
    subgraph 监控盒子["监控盒子（运行脚本的机器）"]
        ZP[Zabbix Proxy]
        ZA[Zabbix Agent<br/>监控盒子自身状态]
        DB[(Proxy数据库)]

        ZA -->|上报监控数据| ZP
    end

    subgraph 被监控设备["其他被监控设备（需要单独配置）"]
        ZA1[Zabbix Agent 1<br/>监控Web服务器]
        ZA2[Zabbix Agent 2<br/>监控数据库服务器]
        ZA3[Zabbix Agent 3<br/>监控应用服务器]
    end

    ZA1 -->|上报监控数据| ZP
    ZA2 -->|上报监控数据| ZP
    ZA3 -->|上报监控数据| ZP

    ZP -->|汇总数据发送| ZS[Zabbix Server]

```

```mermaid
graph TB
    subgraph 中心层
        ZS[Zabbix Server]
    end

    subgraph 代理层
        ZP[Zabbix Proxy]
    end

    subgraph 被监控主机层
        H1[主机 1] --> A1[Zabbix Agent 1]
        H2[主机 2] --> A2[Zabbix Agent 2]
        H3[主机 3] --> A3[Zabbix Agent 3]
        H4[主机 N] --> A4[Zabbix Agent N]
    end

    ZS --> ZP
    ZP --> A1
    ZP --> A2
    ZP --> A3
    ZP --> A4

    style A1 fill:#c8e6c9,stroke:#2e7d32
    style A2 fill:#c8e6c9,stroke:#2e7d32
    style A3 fill:#c8e6c9,stroke:#2e7d32
    style A4 fill:#c8e6c9,stroke:#2e7d32

```

- 内网穿透ncp方案梳理

```mermaid
graph TB
    subgraph Public["🌐 公网环境"]
        ZS[Zabbix Server]
        NPS[NPS 服务端]
    end

    subgraph Private["🏠 内网环境"]
        NPC[NPC 客户端]
        ZP[Zabbix Proxy<br/>数据中转中心]

        subgraph Agents["Zabbix Agent 集群"]
            ZA1[Zabbix Agent 1]
            ZA2[Zabbix Agent 2]
            ZA3[Zabbix Agent 3]
            ZA4[...更多 Zabbix Agent]
        end
    end

    %% 核心连接关系
    NPS -->|① 隧道连接| NPC
    NPC -->|② 本地连接| ZP
    ZP -->|③ 管理连接| ZA1
    ZP -->|③ 管理连接| ZA2
    ZP -->|③ 管理连接| ZA3
    ZP -->|③ 管理连接| ZA4

    ZS -->|④ 通过NPS访问| NPS

    %% 数据流向
    ZA1 -->|⑤ 监控数据| ZP
    ZA2 -->|⑤ 监控数据| ZP
    ZA3 -->|⑤ 监控数据| ZP
    ZA4 -->|⑤ 监控数据| ZP

    ZP -->|⑥ 数据汇总| NPC
    NPC -->|⑦ 隧道传输| NPS
    NPS -->|⑧ 转发数据| ZS

    %% 样式定义
    classDef public fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef private fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef nps fill:#ffcdd2,stroke:#c2185b,stroke-width:3px
    classDef npc fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef proxy fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    classDef agent fill:#e1f5fe,stroke:#0277bd,stroke-width:2px

    class Public public
    class Private private
    class NPS nps
    class NPC npc
    class ZP proxy
    class Agents agent

```