# WorldMonitor 技术架构

## 系统架构概览

WorldMonitor 采用前后端分离的架构设计，前端使用 Vanilla TypeScript + Deck.gl 构建，后端使用 Express.js 提供 API 服务。

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (Frontend)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │ TypeScript  │  │   Deck.gl   │  │      MapLibre GL        ││
│  │   (TS)      │  │  (地图渲染)  │  │      (底图渲染)         ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │     D3      │  │    Vite     │  │    ONNX Runtime        ││
│  │  (图表)     │  │  (构建工具)  │  │    (ML 推理)          ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         后端 (Backend)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │   Express   │  │   Node.js   │  │      TypeScript         ││
│  │  (Web 框架) │  │   (运行时)   │  │        (TS)            ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     API Routes (50+)                       ││
│  │  rss-proxy | reports | tech-events | groq-summarize | ...││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │PostgreSQL│   │  Redis   │   │  外部API  │
       │ (数据库)  │   │  (缓存)   │   │ (数据源)  │
       └──────────┘   └──────────┘   └──────────┘
```

## 技术栈详情

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | ^5.7.2 | 类型安全 |
| Vite | ^6.0.7 | 构建工具 |
| Deck.gl | ^9.2.6 | 地图数据可视化 |
| MapLibre GL | ^5.16.0 | 地图底图渲染 |
| D3.js | ^7.9.0 | 数据图表 |
| ONNX Runtime Web | ^1.23.2 | 浏览器端 ML 推理 |
| @xenova/transformers | ^2.17.2 | Hugging Face Transformers |
| TopoJSON | ^3.1.0 | 地理数据处理 |
| @vercel/analytics | ^1.6.1 | 访问分析 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Express | ^4.18.2 | Web 框架 |
| TypeScript | ^5.3.0 | 类型安全 |
| tsx | ^4.7.0 | 开发环境运行时 |
| pg | ^8.11.3 | PostgreSQL 客户端 |
| @upstash/redis | ^1.36.1 | Redis 缓存 |
| rss-parser | ^3.13.0 | RSS 解析 |
| node-cron | ^3.0.3 | 定时任务 |
| pino | ^8.18.0 | 日志框架 |
| xml2js | ^0.6.2 | XML 解析 |
| turndown | ^7.1.2 | HTML 转 Markdown |

### 开发与部署

| 技术 | 用途 |
|------|------|
| Docker | 容器化部署 |
| Railway | 后端服务部署 |
| Vercel | 前端静态部署 |
| PostgreSQL | 主数据库 |
| Upstash | Redis 缓存服务 |

## 数据流架构

### 新闻数据流

```
RSS 源 → RSS Proxy → 前端 → 新闻聚类 → 地图标注
              ↓
         AI Summary (Groq/OpenRouter)
              ↓
         Redis 缓存 (24h TTL)
```

### 地图数据流

```
外部 API → 服务器端缓存 → 前端 Deck.gl → WebGL 渲染
                  ↓
            Redis 缓存
```

## 核心模块说明

### 前端模块

| 模块 | 路径 | 描述 |
|------|------|------|
| App.ts | src/App.ts | 主应用入口 |
| components/ | src/components/ | UI 面板组件 |
| services/ | src/services/ | 数据获取服务 |
| workers/ | src/workers/ | Web Workers |
| i18n/ | src/i18n/ | 国际化 |
| config/ | src/config/ | 配置 |
| styles/ | src/styles/ | 样式 |

### 后端模块

| 模块 | 路径 | 描述 |
|------|------|------|
| index.ts | server/index.ts | 服务器入口 |
| routes/ | server/routes/ | API 路由 |
| agent/ | server/agent/ | Agent 系统 |
| database/ | server/database/ | 数据库连接与迁移 |
| services/ | server/services/ | 服务层 |
| utils/ | server/utils/ | 工具函数 |

## API 接口分类

后端提供 50+ 个 API 接口，主要分类如下：

1. **新闻与 RSS**：rss-proxy, hackernews, country-intel
2. **地图数据**：opensky, fires, earthquakes, gdelt-geo
3. **市场数据**：yahoo-finance, polymarket, stablecoin-markets, etf-flows
4. **风险评分**：risk-scores, acled, ucdp
5. **AI 服务**：groq-summarize, openrouter-summarize, minimax-summarize
6. **Agent**：reports, rss-collector, agent
7. **宏观数据**：fred-data, worldbank, eia

## 安全与性能

### 安全措施
- CORS 跨域配置
- 请求频率限制 (rate limiting)
- 环境变量敏感信息管理
- RSS 代理域名白名单

### 性能优化
- Redis 跨用户缓存
- 服务端预渲染缓存
- 前端 Web Worker 并行处理
- 静态资源 CDN 加速
- ML 推理使用 ONNX Runtime Web

## 环境配置

### 开发环境变量
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...upstash.io
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
VITE_VARIANT=world|tech
```
