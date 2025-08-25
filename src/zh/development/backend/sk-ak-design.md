---
icon: pen-to-square
date: 2025-08-25
category:
  - 后端
tag:
  - 场景设计
---
# 【设计】项目中的AK 与 SK设计

## **概述**

Dahlin平台采用基于Access Key/Secret Key（AK/SK）的API认证机制，这是一种广泛应用于云服务的安全认证方式。本文将从技术实现角度详细解析该认证机制的设计思路、核心组件和实现细节，并提供完整的使用示例。

## **1. 整体架构设计**

### **1认证流程**

```
客户端请求 → 签名生成 → 请求发送 → 服务端验证 → 响应返回

```

### **1 核心组件**

- **密钥管理模块**：负责AK/SK的生成、存储和管理
- **签名生成模块**：客户端和服务端分别生成签名进行对比
- **认证验证模块**：验证请求的合法性和时效性
- **数据库存储**：安全存储密钥信息

## **2. 密钥生成与管理**

### **2 密钥生成算法**

```python
def generate_access_key():
    """生成ACCESS ID和SECRET KEY"""
    access_id = base64.urlsafe_b64encode(os.urandom(16)).decode('utf-8').rstrip('=')
    secret_key = base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8').rstrip('=')
    return access_id, secret_key

```

**技术要点：**

- 使用`os.urandom()`生成密码学安全的随机数
- ACCESS ID：16字节随机数，Base64编码
- SECRET KEY：32字节随机数，Base64编码
- 去除Base64填充字符`=`，提高URL安全性

### **2 数据库存储结构**

```sql
CREATE TABLE api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID，自增',
    access_id VARCHAR(255) UNIQUE NOT NULL COMMENT '访问密钥ID，用于API认证，全局唯一',
    secret_key VARCHAR(255) NOT NULL COMMENT '密钥，用于生成签名，需要安全存储',
    purpose TEXT COMMENT '密钥用途说明，便于管理和审计',
    active BOOLEAN DEFAULT TRUE COMMENT '是否启用，支持密钥的启用/禁用管理',
    create_time DATETIME COMMENT '创建时间，用于审计和密钥生命周期管理',
    update_time DATETIME COMMENT '更新时间，记录最后修改时间'
) COMMENT 'API密钥管理表，存储所有AK/SK认证所需的密钥信息';

```

**字段说明：**

- **id**: 主键，用于数据库内部标识和关联
- **access_id**: 访问密钥ID，客户端在请求时使用，相当于用户名
- **secret_key**: 密钥，用于生成HMAC签名，相当于密码，需要严格保密
- **purpose**: 用途说明，记录该密钥的用途，如"测试环境API"、"生产环境API"等
- **active**: 启用状态，支持临时禁用密钥而不删除，便于安全管理
- **create_time**: 创建时间，用于密钥生命周期管理和审计
- **update_time**: 更新时间，记录密钥信息的最后修改时间

**设计特点：**

- `access_id`设置唯一索引，确保全局唯一性，防止冲突
- `purpose`字段记录密钥用途，便于管理员了解密钥的使用场景
- `active`字段支持密钥的启用/禁用，提供灵活的权限控制
- 时间戳字段支持审计追踪和密钥过期管理
- 表级注释说明表的整体用途

## **3. 签名算法实现**

### **1 签名字符串构建**

```python
def get_sign_string(self):
    json_body_sorted_str = ''
    if self.body:
        json_body = json.loads(self.body)
        json_body_sorted = json_utils.sort_dict_by_key(json_body)
        json_body_sorted_str = json.dumps(json_body_sorted)

    return f"{self.method}||{self.path}||{self.query_str}||{json_body_sorted_str}||{self.timestamp}"

```

**签名字符串组成：**

- HTTP方法（GET/POST等）
- 请求路径
- 查询参数字符串（按键排序）
- 请求体JSON（按键排序）
- 时间戳

### **2 HMAC-SHA256签名生成**

- 用密钥对签名进行加密

```python
def generate_signature(sign_string, secret_key):
    """生成请求签名"""
    return hmac.new(
        secret_key.encode('utf-8'),
        sign_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

```

**安全特性：**

- 使用HMAC-SHA256算法，抗碰撞攻击
- 密钥与消息混合，防止长度扩展攻击
- 十六进制输出，便于传输和调试

## **4. 认证验证机制**

### **1 请求解析**

```python
class DahlinAuthRequest:
# for dahlin api authdef __init__(self, request):
        self.request = request
        self.method = self.request.method
        self.path = self.request.path

        auth_header = request.headers.get('Authorization')
        self.access_id, self.signature, self.timestamp = DahlinAuthRequest.parse_header(auth_header)
        self.query_str = DahlinAuthRequest.get_query_str(request.arguments)
        self.body = self.request.body.decode('utf-8')
        self.sign_string = self.get_sign_string()

    @staticmethod
    def get_query_str(params):
        query_string = ""
        if params:
            query_items = []
            for key, value in sorted(params.items()):
                query_items.append(f"{key}={value[0].decode('utf-8')}")
            query_string = "&".join(query_items)

        return query_string

    @staticmethod
    def parse_header(auth_header):
        auth_info = auth_header.split(' ')[1]
        access_id, signature, timestamp = auth_info.split(':')
        return access_id, signature, int(timestamp)

    def get_sign_string(self):
        json_body_sorted_str = ''
        if self.body:
            json_body = json.loads(self.body)
            json_body_sorted = json_utils.sort_dict_by_key(json_body)
            json_body_sorted_str = json.dumps(json_body_sorted)

        return f"{self.method}||{self.path}||{self.query_str}||{json_body_sorted_str}||{self.timestamp}"

```

**Authorization Header格式：**

```
Authorization: Bearer access_id:signature:timestamp

```

### **2 认证验证流程**

```python
import time
import json
import hmac
import hashlib
from utils import json_utils, get_secret_by_access_id, log

def build_sign_string(dahlin_request):
    """
    服务端根据 request 自己构造 sign_string
    {method}||{path}||{query_str}||{sorted_json_body}||{timestamp}
    """
    json_body_sorted_str = ''
    if dahlin_request.body:
        json_body = json.loads(dahlin_request.body)
        json_body_sorted = json_utils.sort_dict_by_key(json_body)
        json_body_sorted_str = json.dumps(json_body_sorted, separators=(',', ':'))  # 去掉空格

    return f"{dahlin_request.method}||{dahlin_request.path}||{dahlin_request.query_str}||{json_body_sorted_str}||{dahlin_request.timestamp}"

def api_auth(dahlin_request):
    access_id = dahlin_request.access_id
    client_signature = dahlin_request.signature
    client_timestamp = dahlin_request.timestamp

    # 1. 检查时间戳是否过期
    if not is_valid_timestamp(client_timestamp):
        err_msg = f"request out of date, client timestamp: {client_timestamp}, server timestamp: {int(time.time())}"
        log.error(err_msg)
        raise ValueError(err_msg)

    # 2. 服务端构造签名字符串
    sign_string = build_sign_string(dahlin_request)

    # 3. 取出 secret
    secret = get_secret_by_access_id(access_id)
    if not secret:
        raise ValueError(f"invalid access_id: {access_id}")

    # 4. 服务端生成签名
    server_signature = hmac.new(
        secret.encode("utf-8"),
        sign_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    # 5. 比对签名
    if not hmac.compare_digest(server_signature, client_signature):
        raise ValueError("signature mismatch")

    return True

```

**验证步骤：**

1. **时间戳验证**：防止重放攻击，允许10分钟时间差
2. **密钥查询**：从数据库获取对应的SECRET KEY
3. **签名对比**：使用`hmac.compare_digest()`进行安全比较

### **3 缓存优化**

```python
@st.cache_data(ttl=3600)# 缓存1小时def get_api_key_by_access_id_cached(access_id):
    return get_api_key_by_access_id(access_id)

```

**性能优化：**

- 使用Streamlit缓存减少数据库查询
- 1小时TTL平衡性能和一致性
- 支持密钥状态变更的及时生效

## **5. 装饰器集成**

### **1 认证装饰器**

```python
def check_auth(func: Callable) -> Callable:
    @wraps(func)
    def wrapper(self: RequestHandler, *args: Any, **kwargs: Any) -> Any:
        try:
            if conf.get('common', 'enable_api_auth') == BooleanType.STR_TRUE:
                dahlin_request = DahlinAuthRequest(self.request)
                auth_utils.api_auth(dahlin_request)
            return func(self, *args, **kwargs)
        except Exception as e:
# 统一错误处理
            response = {
                'status': ShadowJobStatus.FAILURE,
                'msg': f'API auth failed: {str(e)}',
                'data': []
            }
            self.set_status(400)
            self.write(response)
            return None
    return wrapper

```

**使用示例：**

```python
class ShadowJobGetHandler(RequestHandler):
    @check_auth
    def get(self):
# 业务逻辑pass

```

## **6. 完整使用DEMO**

### **1 客户端SDK实现**

```python
import hashlib
import hmac
import json
import time
import requests
from urllib.parse import urlencode

class DahlinAPIClient:
    def __init__(self, access_id, secret_key, base_url="https://dahlin.example.com"):
        self.access_id = access_id
        self.secret_key = secret_key
        self.base_url = base_url

    def _sort_dict_by_key(self, d):
        """递归排序字典键"""
        if isinstance(d, dict):
            return {k: self._sort_dict_by_key(v) for k, v in sorted(d.items())}
        elif isinstance(d, list):
            return [self._sort_dict_by_key(item) for item in d]
        else:
            return d

    def _generate_signature(self, sign_string):
        """生成HMAC-SHA256签名"""
        return hmac.new(
            self.secret_key.encode('utf-8'),
            sign_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    def _build_sign_string(self, method, path, query_params=None, body=None):
        """构建签名字符串"""
# 处理查询参数
        query_str = ""
        if query_params:
            sorted_params = sorted(query_params.items())
            query_items = [f"{key}={value}" for key, value in sorted_params]
            query_str = "&".join(query_items)

# 处理请求体
        json_body_sorted_str = ""
        if body:
            json_body_sorted = self._sort_dict_by_key(body)
            json_body_sorted_str = json.dumps(json_body_sorted)

# 获取时间戳
        timestamp = int(time.time())

        return f"{method}||{path}||{query_str}||{json_body_sorted_str}||{timestamp}", timestamp

    def _make_request(self, method, path, query_params=None, body=None):
        """发送API请求"""
# 构建签名字符串
        sign_string, timestamp = self._build_sign_string(method, path, query_params, body)

# 生成签名
        signature = self._generate_signature(sign_string)

# 构建Authorization header
        auth_header = f"Bearer {self.access_id}:{signature}:{timestamp}"

# 构建请求URL
        url = f"{self.base_url}{path}"
        if query_params:
            url += "?" + urlencode(query_params)

# 设置请求头
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }

# 发送请求if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=body)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        return response

    def get_shadow_jobs(self, region=None, job_id=None, task_type=None, status=None):
        """获取影子任务列表"""
        query_params = {}
        if region:
            query_params["region"] = region
        if job_id:
            query_params["job_id"] = job_id
        if task_type:
            query_params["task_type"] = task_type
        if status:
            query_params["status"] = status

        response = self._make_request("GET", "/api/shadow/get_jobs", query_params)
        return response.json()

    def update_shadow_job(self, dahlin_job_id, lh_job_id, status_code, region,
                         presign_url=None, shadow_job_url=None):
        """更新影子任务状态"""
        body = {
            "status": status_code,
            "input_data": {
                "dahlin_job_id": dahlin_job_id,
                "job_id": lh_job_id,
                "region": region
            },
            "result_data": {
                "presign_url": presign_url,
                "shadow_job_url": shadow_job_url
            }
        }

        response = self._make_request("POST", "/api/shadow/update_job", body=body)
        return response.json()

    def create_flighting_env(self, config):
        """创建飞行环境"""
        response = self._make_request("POST", "/api/flighting/create", body=config)
        return response.json()

    def reclaim_flighting_env(self, config):
        """回收飞行环境"""
        response = self._make_request("POST", "/api/flighting/reclaim", body=config)
        return response.json()

```

### **2 使用示例**

```python
# 初始化客户端
client = DahlinAPIClient(
    access_id="your_access_id_here",
    secret_key="your_secret_key_here",
    base_url="https://dahlin.example.com"
)

# 示例1: 获取影子任务列表try:
    jobs = client.get_shadow_jobs(region="cn-hangzhou", status="running")
    print("获取影子任务成功:", jobs)
except Exception as e:
    print("获取影子任务失败:", e)

# 示例2: 更新影子任务状态try:
    result = client.update_shadow_job(
        dahlin_job_id="12345",
        lh_job_id="lh_job_67890",
        status_code="SUCCESS",
        region="cn-hangzhou",
        presign_url="https://example.com/presign",
        shadow_job_url="https://example.com/shadow_job"
    )
    print("更新影子任务成功:", result)
except Exception as e:
    print("更新影子任务失败:", e)

# 示例3: 创建飞行环境try:
    flighting_config = {
        "branch_name": "feature/new-feature",
        "version_tag": "v1.2.3",
        "env_namespace": "test-env",
        "components": ["ap", "gp"],
        "submitter": "developer@example.com"
    }
    result = client.create_flighting_env(flighting_config)
    print("创建飞行环境成功:", result)
except Exception as e:
    print("创建飞行环境失败:", e)

```

### **3 服务端API示例**

```python
# 服务端API处理器示例class ShadowJobGetHandler(RequestHandler):
    @check_auth# 使用认证装饰器def get(self):
        try:
# 获取查询参数
            region = self.get_argument('region', None)
            job_id = self.get_argument('job_id', None)
            task_type = self.get_argument('task_type', None)
            status = self.get_argument('status', None)

# 查询数据库
            jobs_list = get_shadow_job_list(region, job_id, task_type, status)

# 格式化响应数据
            formatted_data = []
            for job in jobs_list:
                formatted_job = {
                    "tool_name": job.get('task_type', ''),
                    "input_data": {
                        "job_id": job.get('job_id', ''),
                        "dahlin_job_id": job.get('id', ''),
                        "region": job.get('env', ''),
                    },
                    "operator": job.get('submitter', '')
                }
                formatted_data.append(formatted_job)

# 返回成功响应
            response = {
                'status': 'success',
                'msg': 'Shadow job GET request processed successfully',
                'data': formatted_data
            }
            self.write(response)

        except Exception as e:
# 错误处理
            response = {
                'status': 'failure',
                'msg': f'Shadow job GET request failed: {str(e)}',
                'data': []
            }
            self.set_status(500)
            self.write(response)

class ShadowJobPostHandler(PostHandler):
    @check_auth# 使用认证装饰器def post(self):
        try:
# 解析请求体
            post_body = self.request.body.decode('utf-8')
            post_body_json = json.loads(post_body)

# 提取参数
            status_code = post_body_json.get('status')
            status = JOB_STATUS_MAP[status_code]

            input_data = post_body_json.get('input_data')
            dahlin_job_id = input_data.get('dahlin_job_id')
            lh_job_id = input_data.get('job_id')
            env_region = input_data.get('region')

            result_data = post_body_json.get('result_data', {})
            presign_url = result_data.get('presign_url')
            shadow_job_url = result_data.get('shadow_job_url')

# 更新数据库
            update_shadow_job_status(
                dahlin_job_id=dahlin_job_id,
                status=status,
                presign_url=presign_url,
                shadow_job_url=shadow_job_url
            )

# 返回成功响应
            response = {
                'msg': 'Shadow job POST request processed successfully',
                'status': 'success'
            }
            self.write(response)

        except Exception as e:
# 错误处理
            response = {
                'msg': f'Shadow job POST request failed: {str(e)}',
                'status': 'failure'
            }
            self.set_status(500)
            self.write(response)

```

### **4 密钥管理界面示例**

```python
# Streamlit密钥管理界面import streamlit as st
from tools.crypt_utils import generate_access_key
from tools.sql_mapper import load_api_keys, insert_api_key

def ak_management_page():
    st.title("API密钥管理")

# 创建新密钥with st.expander("创建新API密钥"):
        purpose = st.text_area("用途说明", height=100)
        active = st.checkbox("启用状态", value=True)

        if st.button("创建密钥"):
            if purpose.strip():
                try:
                    access_id, secret_key = generate_access_key()
                    insert_api_key(access_id, secret_key, purpose.strip(), active)

                    st.success("API密钥创建成功！")
                    st.info(f"**ACCESS ID:** {access_id}")
                    st.warning("**SECRET KEY:** {secret_key}")
                    st.warning("⚠️ 请妥善保存SECRET KEY，创建后将无法再次查看")
                except Exception as e:
                    st.error(f"创建失败: {str(e)}")
            else:
                st.error("用途说明不能为空")

# 显示现有密钥
    st.subheader("现有API密钥")
    df = load_api_keys()
    if not df.empty:
        st.dataframe(df)
    else:
        st.info("暂无API密钥")

# 运行界面if __name__ == "__main__":
    ak_management_page()

```

### **5 测试脚本**

```python
# 测试脚本import unittest
import time
from dahlin_api_client import DahlinAPIClient

class TestDahlinAPI(unittest.TestCase):
    def setUp(self):
        self.client = DahlinAPIClient(
            access_id="test_access_id",
            secret_key="test_secret_key",
            base_url="http://localhost:8502"
        )

    def test_signature_generation(self):
        """测试签名生成"""
        method = "GET"
        path = "/api/shadow/get_jobs"
        query_params = {"region": "cn-hangzhou", "status": "running"}
        body = None

        sign_string, timestamp = self.client._build_sign_string(
            method, path, query_params, body
        )

# 验证签名字符串格式
        self.assertIn("GET||/api/shadow/get_jobs||", sign_string)
        self.assertIn("region=cn-hangzhou&status=running", sign_string)
        self.assertIn(str(timestamp), sign_string)

    def test_timestamp_validation(self):
        """测试时间戳验证"""
        current_time = int(time.time())

# 测试有效时间戳
        self.assertTrue(self.client._is_valid_timestamp(current_time))

# 测试过期时间戳（11分钟前）
        expired_time = current_time - 660
        self.assertFalse(self.client._is_valid_timestamp(expired_time))

    def test_json_sorting(self):
        """测试JSON排序"""
        test_data = {
            "c": 3,
            "a": 1,
            "b": {"z": 2, "y": 1}
        }

        sorted_data = self.client._sort_dict_by_key(test_data)
        expected_keys = list(sorted_data.keys())

        self.assertEqual(expected_keys, ["a", "b", "c"])

if __name__ == "__main__":
    unittest.main()

```

## **7. 安全特性分析**

### **1 防重放攻击**

- 时间戳验证，限制请求时效性
- 10分钟时间窗口，平衡安全性和可用性

### **2 防篡改攻击**

- HMAC-SHA256签名，确保数据完整性
- 请求体JSON按键排序，保证签名一致性

### **3 密钥管理安全**

- 随机生成，避免弱密钥
- 数据库存储，支持密钥轮换
- 用途记录，便于审计追踪

## **8. 配置管理**

### **1 认证开关**

```
[common]
enable_api_auth = True

```

### **2 数据库配置**

```
[database]
host = pc-beijing-2.rwlb.rds.aliyuncs.com
user = jiakang
password = Eq4pmEMluP
db_name = dahlin

```

## **9. 最佳实践**

### **1 客户端实现**

1. 严格按照签名算法生成签名
2. 使用当前时间戳，确保时效性
3. 妥善保管SECRET KEY，定期轮换

### **2 服务端运维**

1. 监控认证失败日志
2. 定期审查密钥使用情况
3. 及时清理过期密钥

### **3 安全建议**

1. 使用HTTPS传输
2. 实施密钥轮换策略
3. 添加请求频率限制
4. 完善审计日志

## **总结**

Dahlin平台的AK/SK认证机制采用了业界成熟的安全标准，通过HMAC-SHA256签名算法、时间戳验证、缓存优化等技术手段，实现了高效、安全的API认证。本文提供了完整的实现代码和使用示例，包括客户端SDK、服务端API、管理界面和测试脚本，为开发者提供了完整的参考实现。

**技术亮点：**

- 密码学安全的密钥生成
- 防重放和防篡改的签名机制
- 性能优化的缓存策略
- 灵活的配置管理
- 完善的错误处理
- 完整的SDK和示例代码

这种实现方式值得在其他需要API认证的项目中参考和借鉴，特别是对于需要高安全性和易用性的企业级应用。

## **10. AK/SK机制设计关键点总结**

### **1 核心设计原则**

**1. 安全性优先**

- **密码学安全**: 使用`os.urandom()`生成随机密钥
- **防重放攻击**: 时间戳验证机制
- **防篡改攻击**: HMAC-SHA256签名算法
- **密钥保护**: 数据库安全存储，支持密钥轮换

**2. 性能优化**

- **缓存机制**: 使用Streamlit缓存减少数据库查询
- **签名算法**: HMAC-SHA256高效且安全
- **批量处理**: 支持批量密钥管理操作

**3. 可维护性**

- **模块化设计**: 认证逻辑独立封装
- **装饰器模式**: 简化API集成
- **配置驱动**: 支持动态开启/关闭认证
- **审计日志**: 完整的操作记录

### **2 技术架构要点**

**1. 密钥生成策略**

```python
# 关键点：使用密码学安全的随机数生成器
access_id = base64.urlsafe_b64encode(os.urandom(16)).decode('utf-8').rstrip('=')
secret_key = base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8').rstrip('=')

```

**2. 签名算法选择**

```python
# 关键点：HMAC-SHA256提供安全性和性能的平衡
hmac.new(secret_key.encode('utf-8'), sign_string.encode('utf-8'), hashlib.sha256)

```

**3. 时间戳验证机制**

```python
# 关键点：10分钟时间窗口平衡安全性和可用性
valid_interval_seconds = 600# 10分钟return abs(current_time - client_timestamp) < valid_interval_seconds

```

**4. 数据库设计**

```sql
-- 关键点：支持密钥生命周期管理
CREATE TABLE api_keys (
    access_id VARCHAR(255) UNIQUE NOT NULL,-- 全局唯一
    secret_key VARCHAR(255) NOT NULL,-- 安全存储
    purpose TEXT,-- 用途管理
    active BOOLEAN DEFAULT TRUE,-- 状态控制
    create_time DATETIME,-- 审计追踪
    update_time DATETIME-- 变更记录
);

```

### **3 安全防护机制**

**1. 多层安全验证**

- **时间戳验证**: 防止重放攻击
- **密钥验证**: 验证身份合法性
- **签名验证**: 确保数据完整性
- **状态验证**: 检查密钥是否启用

**2. 攻击防护**

- **重放攻击**: 时间戳过期机制
- **篡改攻击**: HMAC签名验证
- **暴力破解**: 强随机密钥生成
- **密钥泄露**: 支持密钥轮换

**3. 监控告警**

- **异常检测**: 时间戳差异监控
- **失败统计**: 认证失败日志
- **使用分析**: 密钥使用情况统计

## 11. 改进

### **1. 防重放攻击的增强**

- **问题**：当前仅依赖时间戳验证，10分钟窗口内的请求可能被重放一次。
- **改进**：
    - 引入**唯一请求ID（nonce）**，服务端记录已处理的nonce，保证每个请求只能使用一次。
    - 将nonce与时间戳结合，防止短时间内的重复请求。
    
    **原因：平滑轮换，避免服务中断**
    
    - 当客户端需要更新密钥时，如果服务端只接受最新密钥，请求会立即失败，造成业务中断。
    - 通过同时支持旧版和新版密钥，可以让客户端在更新过程中仍然正常访问服务，保证 **高可用性**。
    - 支持多版本密钥也利于 **分批更新客户端**，尤其在大规模系统中非常重要。
    - 与安全性结合：旧密钥可以设置为有限期或有限使用次数，逐步淘汰。
    
    **改进价值：**
    
    - 平滑过渡
    - 降低运维压力
    - 提升系统容错性

### **2. 签名算法与密钥管理**

- **问题**：HMAC-SHA256安全性够，但在大规模高并发场景下，密钥轮换可能影响可用性。
- **改进**：
    - 支持**多版本密钥**，服务端可同时验证旧版和新版密钥，平滑轮换。
    - 引入**密钥到期时间**，自动标记过期密钥，减少人工管理。
    
    **原因：自动化管理，减少人为错误**
    
    - 如果密钥长期有效，容易造成安全隐患（被泄露后可长期访问）。
    - 设置密钥到期时间后，服务端可以 **自动标记和拒绝过期密钥**。
    - 配合多版本密钥，客户端有缓冲时间更新到新密钥，而服务端可以自动清理旧密钥，避免累积。
    - 减少人工干预，提高安全性和管理效率。
    
    **改进价值：**
    
    - 提升安全性（防止密钥长期有效带来的风险）
    - 自动化运维，降低管理成本
    - 与多版本密钥配合，实现安全、平滑的轮换策略

## **12. 面试题梳理**

### 1 AK/SK是如何实现的

- **客户端**：只传
    - `access_id`
    - `timestamp`
    - `signature`（对 sign_string 的 HMAC）
- **服务端**：
    - 用请求里的 `method / path / query / body / timestamp` 自己拼 `sign_string`
    - 用 secret 算签名
    - 和 `client_signature` 对比

AK/SK 认证机制本质上是基于 **对称密钥 + HMAC 签名** 的鉴权方式。

1. **密钥生成**
    - 服务端通过密码学安全的随机数生成器（如 `os.urandom`）生成 Access Key（公钥）和 Secret Key（私钥）。
    - `Access Key` 作为客户端身份标识，相当于用户名；
    - `Secret Key` 相当于密码，只存储在服务端，客户端仅在初始化时获取。
2. **签名流程**
    - 客户端在发起请求时，将请求的关键信息（HTTP 方法、路径、Query 参数、Body、时间戳）拼接成一个 **签名字符串**。
    - 使用 `Secret Key` 对这个签名字符串执行 **HMAC-SHA256 签名**，得到签名。
    - 将 `Access Key`、`Signature`、`Timestamp` 放入 `Authorization Header` 一起发送给服务端。
3. **服务端验证**
    - 解析 `Authorization Header`，取出 `Access Key`、`Signature`、`Timestamp`。
    - 从数据库/缓存中查出对应的 `Secret Key`。
    - 使用相同的算法生成服务端签名，并与客户端传来的签名做 **恒等时间比较**（`hmac.compare_digest`）防止时序攻击。
    - 同时检查 **时间戳是否过期**，避免重放攻击。
4. **安全特性**
    - 时间戳限制请求有效期（比如 10 分钟）。
    - HMAC-SHA256 保证签名不可伪造。
    - 数据库存储支持 AK/SK 启用/禁用、轮换和用途管理。

一句话总结：

> AK 标识身份，SK 生成签名，服务端通过签名比对和时间戳验证来确保请求合法且未被篡改。
> 

### 2 如果这个鉴权的服务有多个节点 如何保证缓存的一致性

这是一个 **分布式缓存一致性** 的问题，可以从以下几方面回答：

1. **核心问题**
    - 每个节点可能会缓存 `access_id -> secret_key` 的映射。
    - 如果有节点的缓存未及时更新（例如某个 AK 被禁用或轮换了），可能会造成鉴权不一致。
2. **解决思路**
    
    常见的几种方法：
    
    **(1) 使用集中式缓存**
    
    - 将缓存放在 Redis、Memcached 这种集中式缓存中。
    - 所有节点共享同一个缓存，不需要考虑一致性问题，节点只是客户端。
    
    **(2) 消息通知机制**
    
    - 如果各节点本地也维护缓存，可以通过消息队列（Kafka、RabbitMQ）或者数据库的 binlog 订阅，推送 **密钥变更事件**。
    - 各节点收到消息后，主动清理或更新缓存。
    
    **(3) TTL（失效时间）机制**
    
    - 给缓存设置较短 TTL，比如 5 分钟。即使某个节点没收到更新通知，过期后会重新从数据库加载，保证最终一致性。
    
    **(4) 管理平台触发失效**
    
    - 在 AK/SK 管理界面里，当管理员禁用/更新一个密钥时，直接触发 Redis key 删除或消息推送，强制让各节点更新缓存。
3. **推荐实践**
    - **高并发场景**：用 Redis Cluster 做统一缓存，天然解决一致性问题。
    - **低频变更场景**：本地缓存 + TTL 即可，变更时用消息广播更新。
    - **安全要求高**：结合两者，Redis 作为权威缓存源，节点本地只做短期缓存，失效后自动刷新。

一句话总结：

> 多节点下，AK/SK 缓存最好用 Redis 这类集中式缓存统一管理，配合 TTL 和消息通知，保证缓存更新的实时性和一致性。
> 

### 3 重放攻击是什么 如何避免重放攻击

**重放攻击**是指攻击者截获一条合法请求，然后在之后多次发送给服务器，导致重复执行敏感操作，比如重复支付。

仅靠签名不能避免重放攻击，因为签名只验证了请求合法性，而不是请求的唯一性。

常见的防御手段包括：

1. **时间戳 + 有效期**：限制请求只能在短时间窗口内有效。
2. **时间戳 + Nonce**：引入随机数，每个请求只能用一次，服务端要校验唯一性。
3. **业务幂等性**：比如转账、下单用唯一请求ID，确保同一个请求不会执行多次。

实际项目中，一般会组合使用，比如：**签名 + 时间戳 + Nonce + 幂等性校验**，这样才能有效避免重放攻击。