# Docker Deployment Design

## Context

### 当前状态

- 前端使用 Vite 构建静态网站
- 45+ 个 Vercel Edge Functions 作为 API 层
- 依赖 Upstash Redis 作为跨用户缓存
- 使用 Groq、OpenRouter 进行 AI 摘要
- 多外部数据源 API（Finnhub, ACLED, FRED 等）

### 约束条件

- 保留所有现有功能（45+ API）
- 保持前端代码兼容（API 端点不变）
- 继续使用 Upstash Redis（可选自托管）
- 支持本地开发和 VPS 生产部署

### 目标用户

- 开发者希望在本地运行完整功能
- 希望在自有 VPS 上部署的用户

---

## Goals / Non-Goals

**Goals:**
- 创建 Express 服务器，替代 Vercel Edge Functions
- 创建 Dockerfile 和 docker-compose.yml
- 保留所有 45+ API 功能
- 添加环境变量注册文档
- 支持本地开发和 VPS 部署

**Non-Goals:**
- 不修改前端代码
- 不改变现有 API 端点路径
- 不强制要求自托管 Redis（继续支持 Upstash）
- 不提供 Vercel 部署支持

---

## Decisions

### 决策 1: Express 替代 Edge Functions

**选择**: 使用 Express.js 作为服务器框架

**理由**:
- 与现有代码风格一致（都是 JavaScript/TypeScript）
- 社区成熟，文档丰富
- 易于从 Edge Functions 转换

**替代方案考虑**:
- Fastify: 更轻量，但生态较小
- Koa: 更简洁，但需要更多中间件配置

### 决策 2: 多阶段 Docker 构建

**选择**: 使用多阶段构建（builder + production）

**理由**:
- 减小最终镜像体积
- 分离构建环境和运行环境
- 提高安全性

**替代方案考虑**:
- 单阶段构建: 镜像较大
- 外部构建: 增加复杂性

### 决策 3: 保留 Upstash Redis

**选择**: 继续使用 Upstash 云服务

**理由**:
- 免费额度足够日常使用（10K 命令/天）
- 无需额外运维
- 未来可随时切换到自托管

**替代方案考虑**:
- 自托管 Redis: 需要额外容器和运维

### 决策 4: CORS 配置

**选择**: 通过环境变量配置允许的域名

**理由**:
- 灵活支持不同部署域名
- 与现有 _cors.js 逻辑兼容

---

## Risks / Trade-offs

### 风险 1: API 转换工作量

[风险] 45+ Edge Functions 转换需要大量时间
[缓解] 分阶段实施，优先转换简单 API

### 风险 2: 动态路由处理

[风险] `[[...path]].js` 格式需要特殊处理
[缓解] 使用 Express 的通配符路由

### 风险 3: WebSocket 支持

[风险] 部分功能依赖 WebSocket
[缓解] 继续使用外部 WS 中继服务（可选自建）

### 风险 4: 环境变量管理

[风险] 生产环境需要配置多个 API Key
[缓解] 提供完整的 .env 示例文件

### 权衡

- **性能**: Docker 部署无冷启动，但需要维护服务器
- **成本**: VPS 成本 vs Vercel 免费版
- **运维**: 自托管需要更多运维工作

---

## Migration Plan

### 阶段 1: 基础设施

1. 创建 server/ 目录结构
2. 创建 Express 主入口
3. 复制工具函数（cors, cache, telemetry）

### 阶段 2: API 转换

按复杂度分批转换：
- Phase 3: 简单 GET API (12个)
- Phase 4: 带缓存 API (10个)
- Phase 5: 带密钥 API (9个)
- Phase 6: 复杂 API (13个)

### 阶段 3: Docker 配置

1. 创建 Dockerfile
2. 创建 docker-compose.yml
3. 创建 .env.docker 示例

### 阶段 4: 文档

1. 更新 README.md
2. 添加环境变量注册流程

### 回滚计划

如需回滚：
1. 继续使用 Vercel 部署
2. 前端代码无需修改
3. 只需将 API 路径改回 Vercel URL

---

## Open Questions

1. **Q: 是否需要支持 ARM 架构 (Apple Silicon)?**
   - A: 暂不需要，x64 足以满足需求

2. **Q: 是否需要自动更新机制?**
   - A: 暂不在范围内，手动更新

3. **Q: 是否需要 HTTPS 支持?**
   - A: 需要反向代理（如 Caddy, Nginx）处理
