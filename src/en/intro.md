---
icon: circle-info
cover: /assets/images/cover3.jpg

sidebar: false
---

# My Resume

### 👤 Basic Information

---

<aside>


Name: Shao Yuanhong            Education: Second-year Master's Student         

Job Objective: Backend Development Engineer

Language: CET-6 527  Date of Birth: November 2001

Phone: 17879307139

Email: [shaoyuanhong1234@gmail.com](mailto:shaoyuanhong1234@gmail.com)

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
    - Proficient in Java (collections source code, JVM, multithreading and locks).
    - Familiar with Python basics and asynchronous programming.
    - Solid understanding of OOP and AOP; familiar with classic design patterns such as Singleton and Factory.
- Databases:
    - Familiar with MySQL; understand indexes, storage engines, locking, and basic SQL tuning strategies.
    - Familiar with Redis and common data structures; studied multi-level cache, master-slave replication, Sentinel, cluster management, and distributed locks.
    - Understand issues like cache avalanche, penetration, breakdown, Big Key, Hot Key, and DB consistency.
    - Understand Elasticsearch core concepts; capable of simple stats/analysis via aggs and fulfilling basic search needs.
- Backend Frameworks:
    - Familiar with Spring Boot, MyBatis; understand Spring core concepts.
    - Familiar with FastAPI, Flask, SQLAlchemy; understand Python backend project setup.
- Microservices / Cloud Native:
    - Understand Spring Cloud and Dubbo; familiar with service governance basics.
    - Familiar with Docker common commands for images and containers; able to write Dockerfiles.
    - Understand K8s core resources: Deployment, Service, Ingress, and the end-to-end containerized deployment process.
    - Understand cloud-native CI/CD: Familiar with Jenkins Pipeline, can design automated pipelines for CI/CD.
- Message Queue:
    - Familiar with RocketMQ; understand message loss, duplicate consumption, and backlog handling.
- LLM Application Development:
    - Familiar with common vector DBs such as Chroma and their scenarios.
    - Understand the MCP protocol; able to build and use an MCP Server.
    - Familiar with platforms like Coze and Dify to build AI workflows.
    - Understand LangChain and LangGraph as agent frameworks and common agent design patterns.
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


"Marketing Brain" Project — Beijing Rensheng Intelligent Technology Co., Ltd. — Backend Developer — Apr 2024 ~ Jul 2024

Tech Stack: Spring Boot, MySQL, Redis, RocketMQ

Project: An automated marketing lifecycle management platform with precise user segmentation and smart private chat service to improve efficiency.

Responsibilities:

1. Containerization & Auto Scaling: Used Docker + K8S for containerized deployment; implemented HPA for auto scaling to ensure peak stability and reduce low-peak resources, cutting machine costs by ~20%.
2. Live Room Rewards Optimization: Decoupled reward delivery using RocketMQ async processing; ensured idempotency via Business Unique ID + DB unique constraint, added DLQ for reliability; QPS improved ~2x for stable live reward scenarios.
3. Caching & Inventory Optimization: Adopted Redis pre-deduction strategy; ensured MySQL-Redis consistency via Canal; used Bloom filter and expiration randomization to mitigate penetration/breakdown/avalanche; reduced order API latency by ~40%.
</aside>

<aside>


Private Chatbot — Beijing Rensheng Intelligent Technology Co., Ltd. — LLM App Developer — Jul 2024 ~ Nov 2024

Tech Stack: Python, FastAPI, LangChain, LangGraph

Project: Answers customer questions about products, live streaming, and group buying via multiple subsystems including dialog processing, document retrieval, and state management for efficient and accurate service.

Responsibilities:

1. Corpus Vectorization & Retrieval: Built a vector database to store embeddings of marketing scripts and implemented hybrid retrieval to significantly improve accuracy and latency.
2. Private Chat Agent Scenarios: Designed and implemented multi-scenario chat agents with tool usage to assist marketers in auto-replying, greatly reducing manual communication costs.
</aside>

<aside>


SRE Operation & Control Platform — Hangzhou Yunzhizhongqi Technology Co., Ltd. — Full-stack Developer — May 2025 ~ Present

Tech Stack: Python, Flask, Streamlit, Bootstrap, Jenkins, K8S

Project: Internal platform for building, releasing, deploying services, and managing task files, enabling correct delivery and efficient execution through an ops admin console.

Responsibilities:

1. Rapid Prototyping & Feature Dev: Used Cursor to build the project prototype and iterate core functions quickly to accelerate time-to-value.
2. Cross-service Auth Optimization: Implemented AK/SK auth with Python decorators for on-endpoint signature checks to secure inter-service calls.
3. Task Execution Optimization: Generated a hash from task parameters as a unique task ID to avoid duplicate pulls during POD restarts, ensuring idempotency and improving reliability.
4. Agent Design: Designed an ops AI agent based on MCP protocol, implementing ReAct reasoning and multi-tool server management with async event loop and sync wrappers to support LLM-driven multi-turn reasoning and tool usage.

</aside>

### 💼 Project Experience

---

<aside>


Pulse Health Management System — Lab Project

Tech Stack: Spring Boot, MySQL, Redis, MyBatis-Plus, JWT

Project: A Java-based health management platform for universities, providing psychological testing and pulse wave data analysis, supporting data collection, AI model analysis, and multi-dimensional health scoring.

Responsibilities:

1. Security & Mobile Login: Implemented stateless login with JWT and integrated Alibaba Cloud SMS for OTP registration/login to improve security and UX.
2. Async AI Workflow: Orchestrated data-analysis pipeline using CompletableFuture + thread pool to reduce average API latency to ~600ms and improve concurrency.
3. Batch Data Computation: Performed shard polling and parallel computation with thread pools for large-scale historical data to improve throughput.
4. Database Performance: Added composite indexes to high-frequency query fields, improving query performance by ~30% and reducing latency.
5. RBAC Authorization: Introduced an RBAC model to achieve fine-grained role/permission control in the admin panel, improving security and ops efficiency.
</aside>

