# WorldMonitor 快速开始

## 环境要求

### 前端开发

| 要求 | 最低版本 |
|------|----------|
| Node.js | 18.x 或更高 |
| npm | 9.x 或更高 |
| 浏览器 | Chrome 90+, Edge 90+, Firefox 88+, Safari 15+ |

### 后端开发

| 要求 | 最低版本 |
|------|----------|
| Node.js | 20.x 或更高 |
| PostgreSQL | 14.x 或更高 |
| Redis | 6.x 或更高 |

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/koala73/worldmonitor.git
cd worldmonitor
```

### 2. 安装前端依赖

```bash
npm install
```

### 3. 安装后端依赖

```bash
cd server
npm install
cd ..
```

### 4. 配置环境变量

复制环境变量示例文件并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```bash
# 数据库连接
DATABASE_URL=postgresql://user:password@localhost:5432/worldmonitor

# Redis 缓存 (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# AI 服务 (至少选择一个)
GROQ_API_KEY=gsk_xxxxxxxx
OPENROUTER_API_KEY=sk-or-xxxxxxxx
```

## 运行开发服务器

### 方式一：分别运行前后端

#### 启动后端服务器

```bash
cd server
npm run dev
```

后端服务将在 `http://localhost:3001` 运行。

#### 启动前端开发服务器

在新终端中：

```bash
npm run dev
```

前端将在 `http://localhost:5173` 运行（开发模式）。

### 方式二：使用 Express 生产构建

先构建前端：

```bash
npm run build
```

然后启动后端服务器：

```bash
cd server
npm run start
```

访问 `http://localhost:3001`

## 站点变体

### World 变体（默认）

地缘政治情报版本：

```bash
npm run dev        # 开发模式 (world 变体)
npm run build      # 生产构建 (world 变体)
```

### Tech 变体

科技与 AI 情报版本：

```bash
npm run dev:tech  # 开发模式
npm run build:tech # 生产构建
```

## 常用命令

### 前端命令

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器 (world 变体，默认) |
| `npm run dev:tech` | 启动开发服务器 (tech 变体) |
| `npm run build` | 构建生产版本 (world 变体，默认) |
| `npm run build:full` | 构建生产版本 (world 变体，兼容旧名称) |
| `npm run build:tech` | 构建生产版本 (tech 变体) |
| `npm run preview` | 预览生产构建 |
| `npm run typecheck` | TypeScript 类型检查 |

> **注意**: `build:full` 实际上会使用 `world` 变体（因为代码中没有定义 `full` 变体）。

### 后端命令

| 命令 | 描述 |
|------|------|
| `cd server && npm run dev` | 启动开发服务器 (热重载) |
| `cd server && npm run start` | 启动生产服务器 |

## Docker 部署

### 使用 Docker Compose

```bash
docker-compose up -d
```

这将启动：
- 前端服务 (nginx)
- 后端服务 (Express)
- PostgreSQL 数据库
- Redis 缓存

### 手动 Docker 构建

```bash
# 构建镜像
docker build -t worldmonitor .

# 运行容器
docker run -p 3001:3001 worldmonitor
```

## Vercel 部署

### 前端部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### Edge Functions

项目包含 Vercel Edge Functions，位于 `api/` 目录。

## 本地数据库设置

### PostgreSQL

创建数据库：

```sql
CREATE DATABASE worldmonitor;
```

### 运行数据库迁移

后端会在首次启动时自动创建数据库表。

## 常见问题

### 1. 端口占用

如果端口 3001 或 5173 被占用：

```bash
# 查找占用端口的进程
netstat -ano | findstr :3001

# 终止进程
taskkill /PID <PID> /F
```

### 2. 数据库连接失败

确保 PostgreSQL 服务运行，并检查 `DATABASE_URL` 环境变量。

### 3. RSS 代理 403 错误

需要在 `api/rss-proxy.js` 中将新添加的 RSS 域名添加到白名单。

### 4. AI 摘要不工作

检查 `GROQ_API_KEY` 或 `OPENROUTER_API_KEY` 是否正确配置。

## 下一步

- 阅读 [项目概述](./01-overview.md) 了解功能
- 阅读 [技术架构](./02-architecture.md) 了解系统设计
- 阅读 [项目结构](./03-structure.md) 了解代码组织
