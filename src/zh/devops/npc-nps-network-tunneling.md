---
redirectFrom: "/zh/cs-development/backend/npc-nps-network-tunneling.html"
title: "NPC NPS 网络打通"
description: "使用 npc/nps 实现内网穿透、打通内外网访问的配置与实践笔记"
date: 2025-08-25
category: "DevOps"
tags:
  - "NPS"
  - "Network"
icon: pen-to-square
---
## 详细架构图

```mermaid
graph TB
    subgraph 公网服务器 Cloud/VPS
        NPS[NPS服务端<br>公网IP: 80.80.80.80<br>端口: 8024, 8080]
    end

    subgraph 网络A - 总部/办公网
        NPC_A[NPC客户端 A<br>注册密钥: key_a123]
        Router_A[路由器/NAT]
        Server_A1[应用服务器 A1<br>192.168.1.100:80]
        Server_A2[数据库 A2<br>192.168.1.101:3306]

        NPC_A --> Router_A
        Router_A --> Server_A1
        Router_A --> Server_A2
    end

    subgraph 网络B - 分公司/家庭网
        NPC_B[NPC客户端 B<br>注册密钥: key_b456]
        Router_B[路由器/NAT]
        Server_B1[应用服务器 B1<br>192.168.2.100:8080]
        PC_B2[办公电脑 B2<br>192.168.2.50]

        NPC_B --> Router_B
        Router_B --> Server_B1
        Router_B --> PC_B2
    end

    %% 核心连接
    NPC_A -->|建立控制连接| NPS
    NPC_B -->|建立控制连接| NPS

    %% 隧道通信路径
    Server_A1 -.->|TCP隧道: 访问192.168.2.100:8080| Server_B1
    Server_B1 -.->|TCP隧道: 访问192.168.1.101:3306| Server_A2
    PC_B2 -.->|TCP隧道: 访问192.168.1.100:80| Server_A1

    style NPS fill:#2196f3,color:#fff
    style NPC_A fill:#9c27b0,color:#fff
    style NPC_B fill:#4caf50,color:#fff

```

### 数据流验证图

```mermaid
sequenceDiagram
    participant A as 网络A应用<br>192.168.1.100:80
    participant NPCA as NPC客户端A
    participant NPS as NPS服务端
    participant NPCB as NPC客户端B
    participant B as 网络B应用<br>192.168.2.100:8080

    Note over NPCA,NPCB: 1. 客户端注册阶段
    NPCA->>NPS: 连接请求 (vkey=key_a123)
    NPCB->>NPS: 连接请求 (vkey=key_b456)
    NPS-->>NPCA: 注册成功，等待隧道
    NPS-->>NPCB: 注册成功，等待隧道

    Note over A,B: 2. 隧道通信示例
    A->>NPCA: 请求访问 192.168.2.100:8080/api
    NPCA->>NPS: 封装数据包，通过隧道转发
    NPS->>NPCB: 根据目标IP路由到客户端B
    NPCB->>B: 解封装，发送到 192.168.2.100:8080
    B->>NPCB: 返回响应数据
    NPCB->>NPS: 封装响应，通过隧道返回
    NPS->>NPCA: 路由到客户端A
    NPCA->>A: 解封装，返回最终响应

```

### 配置要点确认

**NPS 服务端配置确认:**

```bash
# nps.conf 关键配置
server_addr=0.0.0.0
bridge_port=8024    # 客户端连接端口
web_port=8080       # 管理界面端口

# 客户端认证
[[clients]]
name = network_a
key = key_a123      # 客户端A的密钥

[[clients]]
name = network_b
key = key_b456      # 客户端B的密钥

```

**隧道规则配置:**

- 需要在 NPS 管理界面配置隧道规则
- 定义哪些端口的流量转发到哪个客户端
- 支持 TCP/UDP 端口映射

### 实际连接效果

```mermaid
graph LR
    subgraph 最终网络可达性
        A1[192.168.1.100] -->|可访问| B1[192.168.2.100]
        A2[192.168.1.101] -->|可访问| B2[192.168.2.50]
        B1 -->|可访问| A1
        B2 -->|可访问| A2
    end

    style A1 fill:#ffeb3b
    style B1 fill:#ffeb3b

```

 这个架构展示了：

1. ✅ 两个隔离内网通过公网NPS建立连接
2. ✅ NPC客户端主动连接NPS服务端
3. ✅ 通过隧道实现双向通信
4. ✅ 支持各种TCP/UDP应用