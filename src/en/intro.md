---
article: false
icon: id-card
cover: /assets/images/cover3.jpg
---

# My Resume

### 👤 Basic Information

---

<aside>


Name: Shao Yuanhong           Major: Electronic Information (Biomedical Engineering)
Education: Master | 2026    Job Objective: Backend Development Engineer/AI Full-stack Developer
Language: CET-6 527        Date of Birth: November 2001
Phone: 17879307139     Email: [shaoyuanhong1234@gmail.com](mailto:shaoyuanhong1234@gmail.com)

</aside>

### 🏫 Education

---

<aside>


- Beijing University of Posts and Telecommunications    Master    2023.09-2026.06
- South-Central Minzu University                        Bachelor  2019.09-2023.06
</aside>

### 🏁 Competition Achievements

---

<aside>


- Nov 2021 National Undergraduate Electronic Design Contest, Provincial Third Prize
- Feb 2022 Mathematical Contest in Modeling (MCM/ICM), Honorable Mention
- May 2022 LanQiao Cup — Lichuang EDA Contest, Provincial Second Prize
- Jun 2022 "Internet+" Innovation and Entrepreneurship Competition, Provincial Third Prize
- Jun 2022 Biomedical Engineering Innovation Design Competition, National Second Prize
</aside>

### 🧑🏻‍💻 Skills

---

<aside>


- Programming Languages:
	- Proficient in Java language, understanding of collection source code, concurrent programming and lock mechanisms. Familiar with Python usage and asynchronous programming.
	- Understanding of object-oriented programming, aspect-oriented programming concepts, and familiar with classic design patterns such as Singleton pattern and Factory pattern.
- Databases:
	- Familiar with MySQL, deep understanding of indexing principles, storage engine characteristics and lock mechanisms, mastering basic SQL tuning ideas and execution plan analysis.
	- Familiar with Redis and commonly used data structures, with research on multi-level caching, master-slave synchronization, Sentinel mode, cluster management, and distributed locks.
	- Understanding of Redis cache avalanche, penetration, breakdown, Big Key, Hot Key and database consistency and other online production issues.
	- Understanding of ES core concepts, able to perform data statistics and analysis through built-in aggregation frameworks, can complete basic search needs based on business scenarios.
- Backend Development:
	- Familiar with mainstream backend frameworks such as Spring Boot and MyBatis, able to skillfully develop services; understanding of Spring's IOC, AOP and other core concepts.
	- Proficient in using FastAPI and Flask to build Python backend services, able to use SQLAlchemy for database modeling and complex queries;
	- Mastering the entire process of Python backend project setup (modular architecture, multi-environment configuration), able to independently complete the closed loop from development to production.
- Frontend Development:
	- Understanding of Vue framework and component-based thinking, state management (Vuex), mastering virtual DOM, lifecycle, able to develop complex interactive pages.
- Microservices/Cloud Native:
	- Understanding of core components of microservice frameworks such as Spring Cloud and Dubbo, understanding of service governance core content such as service registration discovery and load balancing.
	- Understanding of Docker common commands and Dockerfile writing, understanding of K8s core orchestration (Deployment/Service/Ingress) and other content.
	- Mastering cloud-native CI/CD, familiar with Jenkins Pipeline, able to design automated pipelines for continuous integration delivery and containerized deployment.
- Message Queue:
	- Understanding of RocketMQ usage, with countermeasures for issues such as message loss, message duplicate consumption (such as idempotency handling), and message accumulation.
- LLM Application Development:
	- Understanding of RAG (Retrieval-Augmented Generation) basic principles and applications, understanding of vector databases (such as Chroma) usage scenarios, understanding of LangChain, LangGraph and other Agent development frameworks and common Agent design patterns.
	- Understanding of platforms such as Coze and Dify and able to build AI workflows, mastering MCP, able to build MCP Server and use in Agent development.
</aside>

### 🧗🏻‍♂️ Hobbies

---

<aside>


🏓  Sports: Table Tennis, Badminton
📚  Learning new tools: productivity apps, AI coding tools

</aside>

### 👤 Personal Summary

---

<aside>


I am passionate about learning diverse technologies and highly self-driven. I do not self-limit and actively embrace new technologies and requirements. Whether in academic research or internships, I approach challenges with a positive mindset.

</aside>

### 💼 Internship Experience

---

<aside>


**Marketing Brain** Project — Beijing Rensheng Intelligent Technology Co., Ltd. — Backend Developer — Apr 2024 ~ Jul 2024

**Tech Stack**: Spring Boot, MySQL, Redis, RocketMQ

**Project**: An automated marketing lifecycle management platform with precise user segmentation and smart private chat service to improve efficiency.

**Work Content**:

1. **Containerization and Elastic Scaling**: Based on **Docker + K8S** completed **service containerized deployment**, utilizing **HPA** to achieve automatic instance scaling, ensuring stability during peak periods, and reducing resource occupancy during low-peak periods, overall machine cost reduced by about **20%**.
2. **Live Room Reward Distribution Business Optimization**: Decoupled live reward distribution to **RocketMQ** asynchronous processing, based on **business unique ID + database unique constraint** to achieve idempotent control, and combined with **dead letter queue (DLQ)** to ensure message reliability, **QPS improved by about 2 times**, and steadily supported live reward distribution scenarios.
3. **Cache Optimization**: Adopted **Redis pre-deduct inventory strategy**, combined with **Canal** to achieve **MySQL and Redis data consistency**;同时 introduced **Bloom filter** and **expiration randomization** and other mechanisms to solve **cache penetration / breakdown / avalanche** problems.
</aside>

<aside>


**Private Chatbot** — Beijing Rensheng Intelligent Technology Co., Ltd. — LLM App Developer — Jul 2024 ~ Nov 2024

**Tech Stack**: Python, FastAPI, LangChain, LangGraph

**Project**: Answers customer questions about products, live streaming, and group buying via multiple subsystems including dialog processing, document retrieval, and state management for efficient and accurate service.

**Work Content**:

1. **Corpus Vectorization and Retrieval Optimization**: Built the required **vector database** for the project, storing Embedding vectors of marketing scripts, and implemented **hybrid retrieval**, significantly improving the accuracy and response speed of corpus retrieval.
2. **Private Chat Agent** **Scenario Construction**: Designed and implemented **multi-scenario private chat Agent**, supporting model calls to different tools (Tools), helping marketing personnel automatically respond during customer consultations, significantly reducing manual communication costs.
3. **Dialogue Logic Optimization and Effect Iteration**: By collecting user feedback data and calculating user repeat question rates, iterated Agent script templates and tool call priorities, effectively improving customer consultation "one-time resolution rate", further optimizing service experience.
</aside>

<aside>


**SRE Operation & Control Platform** — Hangzhou Yunzhizhongqi Technology Co., Ltd. — Full-stack Developer — May 2025 ~ Present

**Tech Stack**: Python, Flask, Streamlit, Bootstrap, Jenkins, K8S

**Project**: Internal platform for building, releasing, deploying services, and managing task files, enabling correct delivery and efficient execution through an ops admin console.

**Work Content**:

1. **Rapid Prototyping and Feature Development**: Based on **Cursor** built project prototype, achieving rapid iteration and verification of core functions, accelerating product landing speed.
2. **Cross-service Interface Authentication Optimization**: Through **AK/SK authentication + Python decorators**, adding decorators directly on interfaces can complete signature verification, ensuring security between service calls.
3. **Agent Design**: Designed and developed an operations AI Agent based on **MCP protocol**, implementing **ReAct** reasoning mode and multi-tool server management, through asynchronous **event loop** and synchronous encapsulation, supporting LLM-driven multi-round reasoning and external tool calls.
4. **Memory Optimization**: In response to POD memory constraints, adopted local database Duck DB combined with iJSON to efficiently complete parsing and aggregation processing of GB-level large log files, fundamentally avoiding OOM (Out of Memory) issues, ensuring stability and efficiency of large file processing.
5. **Analysis Result Visualization**: For visualization of log analysis results, combined with Claude Code using ECharts, D3 and other JavaScript libraries to quickly generate **line charts, Gantt charts, Timeline** and other custom charts, helping R&D locate problems, shorten problem troubleshooting cycles, and improve efficiency.

</aside>

### 💼 Project Experience

---

<aside>


**Pulse Health Management System** — Lab Project

**Tech Stack**: Spring Boot, MySQL, Redis, MyBatis-Plus, JWT

**Project**: A Java-based health management platform for universities, providing psychological testing and pulse wave data analysis, supporting data collection, AI model analysis, and multi-dimensional health scoring.

**Work Content**:

1. **Security Authentication and Mobile Login**: Implemented stateless login verification based on **JWT**, and integrated Alibaba Cloud SMS service to support verification code registration and login, improving system security and user experience.
2. **AI Model Service Asynchronous Optimization**: Through **CompletableFuture + thread pool** asynchronously orchestrated the analysis process after data upload, optimizing the average interface response time to **about 600ms**, improving system concurrent processing capability.
3. **Batch Data Computation Optimization**: Performed shard polling on large-scale historical data, combined with **thread pool parallel computing** for multi-dimensional health scoring, improving batch computation efficiency.
4. **Database Performance Optimization**: Added **composite indexes** to high-frequency query fields, query efficiency improved by about **30%**, reducing system response latency.
5. **Permission Management Upgrade**: Introduced **RBAC permission model** to achieve fine-grained control of roles and permissions in the management backend, improving system security and operation and maintenance management efficiency.
</aside>

