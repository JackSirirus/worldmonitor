# Proposal: Enable Multi-Agent System for WorldMonitor

> **基于 OpenClaw 架构设计参考**

## Why

WorldMonitor 需要一个完整的自动化 Agent 系统来提升用户体验和自动化能力。当前存在以下问题：

1. **Scheduler 未集成**：Agent 系统的定时任务调度器未连接到服务器
2. **报告生成无数据源**：报告生成器依赖 rss_items 表，但无 RSS 采集功能写入数据
3. **单一报告类型**：只有新闻摘要报告，缺少 AI/Tech 和 World/Geopolitical 分类报告
4. **无前端展示**：用户无法在 UI 中查看和管理 Agent 任务
5. **无语音输出**：报告生成后无法转换为语音播报
6. **数据不足时无兜底**：当数据库数据不足时，无法通过 Web Search 补充信息
7. **缺乏实时反馈**：任务执行状态无实时推送，依赖手动刷新

## What Changes

### 1. Scheduler 集成 (server/index.ts)
- 添加 `initializeScheduler()` 调用
- 添加 `stopScheduler()` 优雅关闭
- **配置化任务**：任务配置存储在数据库，支持运行时动态调整

### 2. 核心架构（基于 OpenClaw 设计）

#### 2.1 任务锁机制
- Redis/Database 实现任务写锁
- 防止同一任务并发执行
- 锁超时自动释放

#### 2.2 工具策略管道
- 多层防护：权限检查 → 速率限制 → 循环检测 → 执行
- 参考 OpenClaw 的 Tool Policy Pipeline 设计

#### 2.3 模型兜底链
- MiniMax → Groq → OpenRouter → Lepton
- 健康检查自动跳过不健康 provider
- 参考 OpenClaw 的 Model Fallback 设计

#### 2.4 追加日志
- 任务执行日志写入 .jsonl 文件
- 便于调试和上下文恢复
- 参考 OpenClaw 的 Transcript 设计

### 3. RSS 采集 Agent
- 新增定时任务：每 30 分钟采集 RSS 源数据
- 数据存储到 rss_items 表
- 支持增量更新（去重）
- **并行采集**：Tech 和 World 源并行获取

### 4. Web Search Agent (信息收集)
- 当 rss_items 数据不足时触发
- 支持多种方案：
  - **首选：使用现有 RSS 源**（无需额外 API）
  - **备选：Tavily API**（专为 AI/RAG 设计）
  - **备选：Serper API**（快速便�)
  - **备选：DuckDuckGo + HTML 解析**（免费）
- 支持按类别（AI/Tech, World）分别搜索

### 5. 报告生成 Agent
- **日报生成**：每日 6:00 UTC 自动生成
  - AI/Tech 报告：从 tech 新闻源生成
  - World 报告：从 world 新闻源生成
  - **并行执行**：Tech 和 World 报告同时生成
- **周报生成**：每周日 6:00 UTC 生成趋势分析
- **默认语言**：英文（English）
- **TTS 语音**：英文使用 `en-US-AriaNeural`

### 6. TTS Agent
- 报告生成后自动转换为语音
- 支持中英文语音
- 存储到 podcasts 表

### 7. 实时推送（基于 WebSocket）
- WebSocket 端点 `/ws/agent`
- 任务状态变化实时推送
- **轮询降级**：WebSocket 不可用时自动降级到 30 秒轮询

### 8. 前端 UI
- Agent 状态面板（显示连接状态）
- 任务历史展示（实时更新）
- 手动触发报告生成
- 任务配置弹窗（动态调整 schedule）
- 任务日志查看器
- 播客播放界面

## Capabilities

### New Capabilities

| 名称 | 描述 | 参考 |
|------|------|------|
| `scheduler-integration` | 将 node-cron 调度器集成到 Express 服务器 | OpenClaw Cron Service |
| `task-lock-mechanism` | 任务写锁，防止并发执行 | OpenClaw Session Lock |
| `tool-policy-pipeline` | 多层工具策略管道 | OpenClaw Tool Policy |
| `model-fallback-chain` | AI Provider 兜底链 | OpenClaw Model Fallback |
| `append-logging` | 追加日志系统 | OpenClaw Transcript |
| `rss-collector-agent` | 定时采集 RSS 源并存储到数据库 | - |
| `web-search-agent` | 使用 MiniMax Web Search 补充信息 | - |
| `multi-report-generator` | 生成 AI/Tech 和 World 两类报告 | - |
| `tts-agent` | 将报告文本转换为语音 | - |
| `agent-websocket` | WebSocket 实时推送 | OpenClaw Gateway |
| `agent-ui-panel` | 前端 Agent 状态和管理面板 | - |

### Modified Capabilities

| 现有名称 | 变更内容 |
|---------|---------|
| `report-generator` | 扩展为支持多类型报告，添加 Web Search 兜底逻辑，并行执行 |

## Impact

### 受影响的代码

| 组件 | 文件 | 变更 |
|------|------|------|
| Server | `server/index.ts` | 添加 scheduler 集成 |
| Agent | `server/agent/scheduler.ts` | 添加 RSS 采集任务 |
| Agent | `server/agent/report-generator.ts` | 重构为多报告类型，支持 Web Search |
| Agent | `server/agent/tts.ts` | 集成到报告生成流程 |
| Agent | `server/agent/web-search.ts` | 新增 Web Search 功能 (使用 Tavily/Serper) |
| Frontend | `src/components/AgentPanel.ts` | 新增 Agent UI 面板 |
| Frontend | `src/components/PodcastPlayer.ts` | 新增播客播放器 |
| Database | `server/database/schema.sql` | 添加 category 字段，更新表结构 |
| Config | `src/config/feeds.ts` | 添加 RSS 源分类 |

### 依赖

- `MINIMAX_API_KEY` + `MINIMAX_API_BASE` - AI 摘要生成
- `GROQ_API_KEY` 或 `OPENROUTER_API_KEY` - AI 摘要（备用）
- `TAVILY_API_KEY` 或 `SERPER_API_KEY` - Web Search（可选，如不使用则只用 RSS 源）
- 数据库表：`rss_items`, `reports`, `podcasts`, `agent_tasks`

### Web Search 策略

**首选方案（无需额外 API）**：
- 直接使用现有的 100+ RSS 源作为数据源
- 采集频率：每 30 分钟
- 优势：无需额外成本，已配置

**备选方案（需要配置）**：

| API | 免费 tier | 优点 | 缺点 |
|-----|----------|------|------|
| Tavily | 1000次/月 | 专为 AI/RAG 设计，语义搜索 | 付费超量 |
| Serper | 100次/天 | 快速，Google 结果 | 英文为主 |
| DuckDuckGo | 无限 | 免费 | 需要解析 HTML |

**决策**：优先使用 RSS 源，Web Search 作为兜底方案。

### 数据库 Schema 变更

```sql
-- rss_sources 表添加 category 字段
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS category TEXT;

-- rss_items 表添加 category 字段
ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS category TEXT;

-- agent_tasks 表添加更多状态字段
ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 新增: agent_jobs 表 (任务配置)
CREATE TABLE agent_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  schedule TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  execution_mode TEXT DEFAULT 'isolated',
  payload JSONB NOT NULL,
  max_concurrent INTEGER DEFAULT 1,
  timeout INTEGER DEFAULT 300000,
  retry_policy JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 新增: task_logs 表 (追加日志)
CREATE TABLE task_logs (
  id SERIAL PRIMARY KEY,
  task_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB
);

-- 创建索引
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_timestamp ON task_logs(timestamp);
```

### Multi-Agent 架构设计 (参考 OpenClaw)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Gateway (Express + WS)                       │
│                    Scheduler (node-cron 内置)                        │
│                    任务配置存储 (agent_jobs 表)                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Job: RSS     │         │ Job: Report   │         │ Job: Report   │
│  Collector    │         │ Tech (并行)   │         │ World (并行)  │
└───────────────┘         └───────────────┘         └───────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     Tool Policy Pipeline                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ 权限检查     │→ │ 速率限制     │→ │ 循环检测     │→ │ 执行        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Model Fallback: MiniMax → Groq → OpenRouter → Lepton           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Storage     │         │   Storage     │         │   Storage     │
│  (rss_items)  │         │  (reports)    │         │  (podcasts)   │
└───────────────┘         └───────────────┘         └───────────────┘
                                  │
                                  ▼
                         ┌───────────────┐
                         │  WebSocket    │ ← 实时推送 /ws/agent
                         │  + Polling    │   (降级方案)
                         └───────────────┘
                                  │
                                  ▼
                         ┌───────────────┐
                         │  Frontend UI  │
                         │ Agent Panel   │
                         └───────────────┘
```

### Agent 职责说明

| Agent | 职责 | 触发条件 | 模式 |
|-------|------|---------|------|
| Scheduler | 任务编排 | 始终运行 | - |
| RSS Collector | 采集新闻数据 | 每 30 分钟 | isolated |
| Report Tech | 生成 Tech 报告 | 每日 6:00 | isolated |
| Report World | 生成 World 报告 | 每日 6:00 | isolated |
| Web Search | 补充信息 | rss_items 不足时 | mainSession |
| TTS | 语音生成 | 报告生成后 | mainSession |
| Cleanup | 清理过期数据 | 每日 4:00 | isolated |
| Backup | 备份数据库 | 每日 3:00 | isolated |

### Multi-Agent 协作模式

本系统采用 **层次式 Multi-Agent 架构**：

```
                    ┌─────────────────┐
                    │   Coordinator    │  ← Scheduler 协调
                    │    (协调层)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Data Layer    │   │ Analysis Layer│   │ Output Layer  │
│ (数据层)       │   │   (分析层)    │   │   (输出层)    │
│               │   │               │   │               │
│ - RSS Collector│   │ - Categorizer │   │ - TTS Agent  │
│ - Web Search  │   │ - Report Gen  │   │ - Frontend   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                    │
        └───────────────────┴────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Shared State   │
                   │  (Redis/DB)     │
                   └─────────────────┘
```

#### Agent 通信流程

1. **Coordinator** 接收 Cron 触发，发布任务
2. **Data Layer** (RSS Collector) 采集数据，写入共享状态
3. **Analysis Layer** 读取数据：
   - 数据充足 → 生成报告
   - 数据不足 → 调用 **Web Search** 请求 Data Layer 补充
4. **Output Layer** 读取报告，生成 TTS，更新 UI

#### 关键特性

- **异步通信**：Agent 间通过消息队列/事件通信
- **共享状态**：使用 Redis/数据库作为共享存储
- **容错处理**：单个 Agent 失败不影响整体流程
- **可扩展**：容易添加新的 Agent 类型
