# Design: PostgreSQL Cache and AI Agent Service

## Context

WorldMonitor 当前使用内存缓存，刷新后丢失且频繁请求外部 API 可能导致 IP 被封。同时缺乏自动化新闻分析和报告生成能力。

**当前状态：**
- RSS 缓存：内存 Map，页面刷新丢失
- 获取策略：无间隔控制，每次刷新都请求
- AI 集成：已有 Groq、OpenRouter
- 部署：Docker Compose（前端+后端）

**约束：**
- 开发环境：Windows + Docker Desktop
- 生产环境：VPS Linux (4C8G)
- 预算：独立开发者，优先免费/低价方案
- 用户：100 人

## Goals / Non-Goals

**Goals:**
1. PostgreSQL 持久化缓存（3个月）
2. RSS 自动获取（2小时间隔）
3. AI 多供应商支持（MiniMax 优先）
4. Agent 自动化服务（摘要、报告、播客）
5. 日志和监控
6. 云端备份

**Non-Goals:**
- 用户认证系统（后期考虑）
- 多实例部署（单实例）
- 实时推送通知
- 移动端应用

## Decisions

### D1: 数据库选择 PostgreSQL 而非 Redis/MongoDB

**选择：** PostgreSQL

**理由：**
- 支持复杂查询（Agent 分析需要）
- JSONB 类型支持半结构化数据
- 向量搜索扩展可期（未来 AI 分析）
- 免费版功能完整
- 与现有技能匹配

**备选考虑：**
- Redis：速度快但不支持复杂查询，Agent 分析受限
- MongoDB：灵活但不如 PostgreSQL 稳定

### D2: AI 供应商优先级

**优先级：**
1. MiniMax（首选，便宜，中文优化）
2. Groq（免费额度，响应快）
3. OpenRouter（模型多，备用）
4. Lepton（价格最低）

**实现：**
- 统一抽象 AI Provider 接口
- 支持热切换
- 失败自动切换到备用

### D3: TTS 使用 Edge 免费 API

**选择：** edge-tts (社区开源 npm 包)

**理由：**
- 免费使用 Microsoft Edge TTS
- 无需 Azure 订阅
- npm 包直接集成
- 质量好

**实现方式：**
```bash
npm install edge-tts
```

**备选考虑：**
- Coqui TTS：开源本地部署，但占用资源多
- Google Cloud TTS：超出预算
- Azure TTS：需要付费订阅

### D4: Docker Compose 单一网络

**架构：**
```
VPS:
  ├── worldmonitor (前端+后端)
  ├── postgres (数据库)
  └── (无额外容器，Agent 集成在主服务内)
```

**理由：**
- 简化部署和运维
- Agent 作为定时任务运行，无需独立容器
- 减少资源占用

### D5: 报告/播客访问方式

**方式：** 公开 URL

**实现：**
- `/api/reports/:id` - Markdown 报告
- `/api/podcasts/:id` - 音频文件

**考虑：** 未来可加密码保护

### D6: 备份策略

**方案：** 本地备份 + 云端

- 每日 pg_dump 到本地卷
- 每日上传到 S3/R2
- 本地保留30天，云端保留1年

**云存储：** Cloudflare R2（免费10GB）或 AWS S3

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| PostgreSQL 存储增长 | 3个月后数据量可能超过预期 | 限制单源最大缓存量，及时清理 |
| AI API 费用 | MiniMax 超出免费额度 | 监控使用量，设置上限 |
| VPS 资源不足 | 4C8G 可能不够 | 监控资源使用，可扩容 |
| Edge TTS 限流 | 免费额度用尽 | 设置上限，邮件告警 |
| 网络问题 | 备份失败 | 重试机制，告警 |

## Migration Plan

### Phase 1: 数据库基础
1. 更新 docker-compose.yml 添加 PostgreSQL
2. 创建数据库 schema
3. 测试数据库连接

### Phase 2: RSS 缓存
1. 实现数据库缓存层
2. 修改 RSS 获取逻辑（2小时间隔）
3. 添加去重逻辑

### Phase 3: AI 集成
1. 添加 MiniMax provider
2. 抽象 provider 接口
3. 配置热切换

### Phase 4: Agent 服务
1. 实现定时任务框架
2. 添加摘要/报告生成
3. 添加 Edge TTS 播客

### Phase 5: 运维
1. 添加日志系统
2. 配置健康检查
3. 设置备份脚本

## Open Questions

1. **报告生成频率**：每日还是每周？
   - 建议：每日摘要 + 每周深度报告

2. **播客保留策略**：3天是否太短？
   - 用户确认：3天，减少存储

3. **VPS 规格**：4C8G 还是 2C4G 起步？
   - 建议：4C8G 预留扩展空间

4. **备份云端选择**：R2 还是 S3？
   - 建议：R2（免费额度大）
