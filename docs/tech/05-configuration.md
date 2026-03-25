# WorldMonitor 配置说明

## 环境变量概览

WorldMonitor 使用环境变量来配置前端和后端服务。所有配置通过 `.env` 文件管理。

## 前端环境变量

### 基础配置

| 变量 | 描述 | 默认值 | 必需 |
|------|------|--------|------|
| `VITE_VARIANT` | 站点变体 (`world`/`tech`) | `world` | 否 |
| `VITE_MAP_TILES_URL` | 地图瓦片 URL | 内置 | 否 |
| `VITE_WS_RELAY_URL` | WebSocket 中继 URL | - | AIS/航班追踪需要 |

### 变体说明

- `world`: 地缘政治情报版本 (worldmonitor.app)
- `tech`: 科技情报版本 (tech.worldmonitor.app)

## 后端环境变量

### 数据库

| 变量 | 描述 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/db` |
| `POSTGRES_DB` | 数据库名称 | `worldmonitor` |
| `POSTGRES_USER` | 数据库用户 | `worldmonitor` |
| `POSTGRES_PASSWORD` | 数据库密码 | (设置密码) |

### Redis 缓存

| 变量 | 描述 | 示例 |
|------|------|------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Redis 访问令牌 | (从 Upstash 获取) |

### AI 服务

| 变量 | 描述 | 必需 |
|------|------|------|
| `GROQ_API_KEY` | Groq API 密钥 (主要) | 推荐 |
| `OPENROUTER_API_KEY` | OpenRouter API 密钥 (备用) | 推荐 |
| `MINIMAX_API_KEY` | MiniMax API 密钥 (中文优化) | 可选 |
| `LEPTON_API_KEY` | Lepton AI 密钥 (低成本) | 可选 |

#### Groq API
- 免费额度: 14,400 请求/天
- 推荐模型: `llama-3.1-8b-instant`

#### OpenRouter
- 提供多种模型访问
- 推荐模型: `anthropic/claude-sonnet-4-5`

#### MiniMax
- 专为中文优化
- API 地址: `https://api.minimaxi.com/anthropic`

### 市场数据 API

| 变量 | 描述 |
|------|------|
| `FINNHUB_API_KEY` | Finnhub 股票报价 |

### 能源数据 API

| 变量 | 描述 |
|------|------|
| `EIA_API_KEY` | 美国能源信息署 API |

### 经济数据 API

| 变量 | 描述 |
|------|------|
| `FRED_API_KEY` | 美联储经济数据 API |

### 航空与船舶追踪

| 变量 | 描述 |
|------|------|
| `WINGBITS_API_KEY` | Wingbits 飞机信息 enrichment |
| `AISSTREAM_API_KEY` | AISStream 船舶追踪 API |
| `OPENSKY_CLIENT_ID` | OpenSky Network OAuth2 客户端 ID |
| `OPENSKY_CLIENT_SECRET` | OpenSky Network OAuth2 客户端密钥 |

### 冲突与抗议数据

| 变量 | 描述 |
|------|------|
| `ACLED_ACCESS_TOKEN` | ACLED 冲突数据 API |

### 网络状态

| 变量 | 描述 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Radar API |

### 卫星火灾监测

| 变量 | 描述 |
|------|------|
| `NASA_FIRMS_API_KEY` | NASA FIRMS 卫星火灾数据 |

### 云存储 (备份)

| 变量 | 描述 |
|------|------|
| `R2_ACCESS_KEY` | Cloudflare R2 访问密钥 |
| `R2_SECRET_KEY` | Cloudflare R2 密钥 |
| `R2_BUCKET` | R2 存储桶名称 |
| `R2_ENDPOINT` | R2 端点 URL |
| `AWS_ACCESS_KEY_ID` | AWS S3 访问密钥 (备选) |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 密钥 |
| `S3_BUCKET` | S3 存储桶名称 |

### 服务器配置

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务器端口 | `3001` |
| `BASE_URL` | 基础 URL | `http://localhost:3001` |
| `WS_RELAY_URL` | 服务器端 WebSocket URL | - |
| `VITE_WS_RELAY_URL` | 客户端 WebSocket URL | - |

### 数据保留

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `RSS_RETENTION_DAYS` | RSS 缓存保留天数 | `90` |
| `PODCAST_RETENTION_DAYS` | 播客保留天数 | `3` |

### 文件存储路径

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `BACKUP_DIR` | 备份目录 | `/backups` |
| `PODCAST_DIR` | 播客目录 | `/podcasts` |

## 变体配置

### world 变体

面向地缘政治情报，启用以下功能：
- 战略态势
- 战略风险
- 地缘政治新闻
- 军事追踪 (航班/船舶)
- 经济指标
- 冲突数据

### tech 变体

面向科技与 AI 情报，启用以下功能：
- 科技事件
- Hacker News
- AI 资讯
- 技术中心
- GitHub Trending

### 切换变体

```bash
# 开发模式
VITE_VARIANT=tech npm run dev

# 生产构建
VITE_VARIANT=tech npm run build
```

## 敏感信息管理

### 必需变量

生产环境必须配置：
- `DATABASE_URL`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- 至少一个 AI API 密钥

### 可选变量

可选配置，根据需求添加：
- 云存储 (R2/S3)
- 第三方 API 密钥

### 安全建议

1. **不要提交 .env 文件** - 已加入 .gitignore
2. **使用 .env.example** - 共享非敏感配置模板
3. **生产环境使用密文** - 使用 Vercel/Railway 的环境变量管理
4. **定期轮换密钥** - 定期更新 API 密钥
