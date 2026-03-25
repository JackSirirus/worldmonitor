# Docker Deployment Proposal

## Why

当前项目依赖 Vercel 平台进行部署，存在以下限制：
- 免费版有冷启动问题，首次访问响应慢
- API 调用有配额限制
- 部署受制于平台，无法完全控制
- 本地开发需要网络连接 Vercel

通过 Docker 容器化部署，可以实现：
- 本地离线开发测试
- VPS 完全自主控制
- 无冷启动问题
- 无平台配额限制

## What Changes

1. **创建 Express 服务器** - 将 45+ Vercel Edge Functions 转换为 Express 路由
2. **创建 Docker 配置** - Dockerfile 和 docker-compose.yml
3. **保留 Upstash Redis** - 继续使用云端 Redis（可选自托管）
4. **更新 CORS 配置** - 支持自定义域名
5. **更新文档** - 添加 Docker 部署说明和环境变量注册流程

## Capabilities

### New Capabilities

- `docker-server`: Express 服务器，替代 Vercel Edge Functions
- `docker-compose`: 容器编排配置
- `env-registration`: 环境变量注册流程文档
- `api-conversion`: Edge Functions 到 Express 路由的转换

### Modified Capabilities

- 无现有需求变更

## Impact

### 受影响的代码

- 新增 `server/` 目录（Express 应用）
- 新增 `Dockerfile`（多阶段构建）
- 新增 `docker-compose.yml`
- 修改 `api/_cors.js`（支持自定义域名）

### 受影响的系统

- 部署流程（从 Vercel 变为 Docker）
- 环境变量配置（需配置更多变量）
- API 路由（保持兼容，前端无需修改）

### 外部依赖

- 继续使用 Upstash Redis（可选自托管）
- 继续使用所有外部 API（Groq, Finnhub, ACLED 等）
