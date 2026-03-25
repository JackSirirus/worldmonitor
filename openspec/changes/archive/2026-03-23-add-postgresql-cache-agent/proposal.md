# Proposal: Add PostgreSQL Cache and AI Agent Service

## Why

当前 WorldMonitor 缺乏持久化数据存储和自动化分析能力：
1. RSS 缓存仅存在于内存中，刷新页面后丢失
2. 外部 API 频繁请求可能导致 IP 被封
3. 缺乏自动化新闻分析和报告生成能力
4. 未来 Agent 需要访问历史数据进行数据分析

## What Changes

1. **新增 PostgreSQL 数据库**
   - Docker Compose 集成
   - RSS 新闻持久化缓存（3个月）
   - Agent 分析结果存储

2. **RSS 缓存系统**
   - 2小时自动获取间隔
   - 支持强制刷新
   - 去重存储（title + url）
   - 源级别可用性检测

3. **AI 多供应商支持**
   - MiniMax（首选）
   - Groq、OpenRouter、Lepton（备用）
   - OpenAI 兼容 API 格式

4. **Agent 服务**
   - 定时触发（每日/每周）
   - 新闻摘要生成
   - 趋势分析
   - Markdown 报告生成
   - 播客生成 (Edge TTS)

5. **日志和监控**
   - 结构化日志
   - 健康检查端点
   - 播客本地托管（保留3天）

6. **云端备份**
   - 每日自动备份到 S3/R2
   - 保留30天本地，1年云端

7. **定时清理**
   - 3个月后自动删除新闻
   - 保留 Agent 分析结果

## Capabilities

### New Capabilities
- `postgresql-cache`: PostgreSQL 数据库配置和 Docker 集成
- `rss-cache`: RSS 新闻缓存系统（3个月保留，2小时间隔，去重）
- `ai-providers`: AI 多供应商支持（MiniMax/Groq/OpenRouter/Lepton）
- `agent-service`: Agent 服务（摘要、趋势分析、报告、播客）
- `logging-monitoring`: 日志和监控系统
- `cloud-backup`: 云端备份策略（S3/R2）
- `data-cleanup`: 定时清理任务（3个月删除）

### Modified Capabilities
- 无（现有 capabilities 不需要修改）

## Impact

- **代码影响**：
  - 新增 `server/database/` 目录（数据库连接和模型）
  - 新增 `server/routes/cache.ts`（缓存 API）
  - 新增 `server/agent/` 目录（Agent 服务）
  - 修改 `docker-compose.yml`（新增 PostgreSQL）
  - 新增 `.env` 配置项

- **依赖影响**：
  - 新增 `pg` (PostgreSQL 客户端)
  - 新增 `edge-tts` (播客生成)
  - 新增 `pino` (结构化日志)
  - 新增 `node-cron` (定时任务)
  - 新增 `@aws-sdk/client-s3` (云端备份)
  - 保留现有 AI API 集成

- **系统影响**：
  - 开发环境：新增 Docker 服务
  - 生产环境：VPS 需要额外资源（预计 4C8G）
