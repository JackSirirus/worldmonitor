# WorldMonitor 部署指南

## 部署架构

WorldMonitor 支持多种部署方式：

```
┌─────────────────────────────────────────────────────────────────┐
│                        部署架构图                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐        ┌─────────────┐        ┌──────────┐ │
│   │   Vercel    │        │  Railway   │        │ Railway  │ │
│   │  (前端静态)  │───────▶│  (后端 API) │───────▶│(PostgreSQL)│ │
│   │             │        │            │        │          │ │
│   └─────────────┘        └─────────────┘        └──────────┘ │
│         │                      │                      │        │
│         │                      ▼                      │        │
│         │               ┌─────────────┐               │        │
│         └──────────────▶│   Upstash  │◀──────────────┘        │
│                         │  (Redis)   │                        │
│                         └─────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 部署方式

### 方式一：Vercel + Railway (推荐)

#### 1. 前端部署 (Vercel)

1. **推送代码到 GitHub**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **在 Vercel 导入项目**

- 访问 https://vercel.com
- 点击 "New Project"
- 选择 "Import Git Repository"
- 选择 worldmonitor 仓库

3. **配置构建**

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

4. **配置环境变量**

在 Vercel 项目设置中添加：
```
VITE_VARIANT=world
```

5. **部署**

点击 "Deploy"

#### 2. 后端部署 (Railway)

1. **创建 Railway 项目**

- 访问 https://railway.app
- 创建新项目
- 添加 PostgreSQL 插件

2. **连接 GitHub**

- 在 Railway 项目中连接 GitHub 仓库
- 选择 `server` 目录作为根目录

3. **配置环境变量**

在 Railway 项目设置中添加：
```
DATABASE_URL=<自动生成>
REDIS_URL=<Upstash URL>
GROQ_API_KEY=<你的密钥>
OPENROUTER_API_KEY=<你的密钥>
NODE_ENV=production
```

4. **配置端口**

确保 Railway 使用 `3001` 端口

#### 3. 配置 Upstash Redis

1. **创建 Upstash 账户**

- 访问 https://upstash.com
- 创建免费 Redis 数据库

2. **获取连接信息**

复制 REST URL 和 Token

3. **添加到 Railway**

作为环境变量添加

### 方式二：Docker 部署

#### 1. 使用 Docker Compose

```bash
# 克隆项目
git clone https://github.com/koala73/worldmonitor.git
cd worldmonitor

# 复制环境变量
cp .env.example .env
# 编辑 .env 文件配置

# 启动所有服务
docker-compose up -d
```

#### 2. 服务访问

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost |
| 后端 API | http://localhost/api |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

#### 3. Docker 命令

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看日志
docker-compose logs -f

# 重建容器
docker-compose build --no-cache
```

### 方式三：手动部署

#### 1. 前端构建

```bash
# 安装依赖
npm install

# 构建
npm run build

# 输出在 dist/ 目录
```

#### 2. 后端部署

```bash
cd server

# 安装依赖
npm install

# 启动
npm run start
```

#### 3. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name worldmonitor.app;

    root /var/www/worldmonitor/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 部署检查清单

### 生产环境检查

- [ ] 配置 HTTPS 证书
- [ ] 配置数据库连接
- [ ] 配置 Redis 缓存
- [ ] 配置 AI API 密钥
- [ ] 设置 CORS 源限制
- [ ] 配置监控和告警

### 安全检查

- [ ] 使用环境变量存储密钥
- [ ] 禁用调试模式
- [ ] 配置 CORS 白名单
- [ ] 设置请求频率限制
- [ ] 启用日志记录

## 域名配置

### Vercel 域名

1. 在 Vercel 项目设置中
2. 点击 "Domains"
3. 添加自定义域名
4. 配置 DNS 记录

### Railway 域名

1. 在 Railway 项目设置中
2. 点击 "Domains"
3. 添加自定义域名
4. 配置 CNAME 记录

## 监控与告警

### Vercel Analytics

自动启用，访问 https://vercel.com/analytics

### 错误追踪

推荐使用 Sentry：
```bash
npm install @sentry/browser
```

### 日志管理

Railway 提供内置日志：
```bash
railway logs
```

## 常见部署问题

### 1. 404 错误

确保 `dist` 目录存在且包含 `index.html`

### 2. API 请求失败

检查后端服务是否运行
检查 CORS 配置

### 3. 数据库连接失败

验证 DATABASE_URL 格式
检查数据库服务状态

### 4. AI 功能不工作

确认 API 密钥正确
检查 API 配额

## 自动部署

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```
