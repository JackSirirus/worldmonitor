# Design: Multi-Agent System for WorldMonitor

> **基于 OpenClaw 架构设计参考** - 借鉴自 [openclaw/openclaw](https://github.com/openclaw/openclaw)

## Context

### 背景

WorldMonitor 是一个实时全球情报仪表板，当前需要完善其自动化 Agent 系统。

### 当前状态

| 组件 | 状态 |
|------|------|
| Scheduler 代码 | ✅ 存在但未集成 |
| Report Generator | ⚠️ 存在但依赖数据库无数据 |
| TTS Agent | ✅ 存在但未与报告生成集成 |
| RSS 采集 | ❌ 不存在 |
| Web Search Agent | ❌ 不存在 |
| 前端 UI | ❌ 不存在 |
| 数据库表 | ⚠️ 部分存在 |

### OpenClaw 架构参考

基于 GitHub 官方文档，OpenClaw 的核心架构模式：

| OpenClaw 组件 | 设计模式 |
|--------------|---------|
| Gateway | 单一 WebSocket 服务器，路由/会话管理 |
| Session Store + Transcript | 双层存储：元数据 + 追加日志 |
| Cron Service | 内置调度器，持久化任务配置 |
| Tool Policy Pipeline | 多层工具策略：权限→速率→循环检测 |
| Model Fallback | 模型兜底链 + 重试机制 |
| Subagents | 独立会话执行，结果汇总 |

### 约束

1. **API 限制**：第三方 Web Search (DuckDuckGo/Brave) 有速率限制，需合理使用
2. **成本控制**：AI 摘要和 TTS 有成本，需缓存机制
3. **前端简约**：UI 组件不应过于复杂
4. **向后兼容**：现有功能不应被破坏

### 利益相关者

- 最终用户：需要查看报告和播客
- 运维人员：需要查看任务状态
- 开发者：需要清晰的架构文档

## Goals / Non-Goals

### Goals (目标)

1. **Scheduler 集成**：将 node-cron 调度器接入服务器
2. **RSS 采集 Agent**：定时采集 100+ RSS 源到数据库
3. **Web Search Agent**：数据不足时自动补充
4. **多类型报告**：分别生成 AI/Tech 和 World 新闻报告
5. **TTS 集成**：报告自动生成语音播报
6. **前端展示**：Agent 状态面板 + 播客播放器

### Non-Goals (不在范围)

- 实时聊天 Agent
- 自定义报告模板系统
- 移动端完整支持
- 报告分享到社交媒体

## Architecture Design

### 整体架构 (参考 OpenClaw 模式)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Gateway (Express + WS)                       │
│                    Scheduler (node-cron 内置)                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Task Queue   │         │  Task Queue   │         │  Task Queue   │
│  (tech)       │         │  (world)      │         │  (rss)        │
└───────────────┘         └───────────────┘         └───────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     Agent Runtime (任务执行层)                         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Tool Policy Pipeline: 权限检查 → 速率限制 → 循环检测 → 执行     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Model Fallback Chain: MiniMax → Groq → OpenRouter → Lepton     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Storage     │         │   Storage     │         │   Storage     │
│  (reports)    │         │  (podcasts)   │         │  (rss_items)  │
└───────────────┘         └───────────────┘         └───────────────┘
                                  │
                                  ▼
                         ┌───────────────┐
                         │  WebSocket    │ ← 实时推送
                         │  + Polling    │   (降级方案)
                         └───────────────┘
                                  │
                                  ▼
                         ┌───────────────┐
                         │  Frontend UI  │
                         └───────────────┘
```

### 核心组件设计

#### 1. 任务队列与会话管理

参考 OpenClaw 的会话隔离模式：

```typescript
// 任务状态 + 追加日志双层存储
interface TaskSession {
  // 元数据 (agent_tasks 表)
  id: string;
  type: 'rss-collect' | 'report-tech' | 'report-world' | 'report-weekly' | 'cleanup' | 'backup' | 'tts-tech' | 'tts-world';
  status: 'pending' | 'running' | 'completed' | 'failed';
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;

  // 追加日志 (task_logs.jsonl)
  // 格式: { timestamp, level, message, context }
  // 用于调试和上下文恢复
}

// 写锁机制 (防止并发执行同一任务)
interface TaskLock {
  taskId: string;
  lockedAt: Date;
  expiresAt: Date;
}
```

#### 2. 工具策略管道 (Tool Policy Pipeline)

参考 OpenClaw 的多层工具策略：

```
请求 → [权限检查] → [速率限制] → [循环检测] → [执行]
         │            │              │
      白名单        指数退避        重复中止
```

```typescript
// 工具类型定义
type ToolType = 'rss-fetch' | 'web-search' | 'ai-summarize' | 'tts-generate' | 'report-generate';

interface ToolDefinition {
  name: ToolType;
  description: string;
  parameters: z.ZodSchema;
  policy: {
    // 权限策略
    allowedRoles: ('system' | 'scheduled' | 'manual')[];
    // 速率限制
    rateLimit?: {
      maxCalls: number;
      windowMs: number;
    };
    // 循环检测
    loopDetection?: {
      maxRepeats: number;
      windowMs: number;
    };
  };
}

// 策略执行
async function executeWithPolicy<T>(
  tool: ToolDefinition,
  params: unknown,
  context: ExecutionContext
): Promise<T> {
  // 1. 权限检查
  if (!tool.policy.allowedRoles.includes(context.role)) {
    throw new PolicyViolationError(`Role ${context.role} not allowed for tool ${tool.name}`);
  }

  // 2. 速率限制 (使用 Redis 计数)
  await rateLimiter.check(tool.name, tool.policy.rateLimit);

  // 3. 循环检测
  await loopDetector.check(context.sessionId, tool.name);

  // 4. 执行
  return await tool.execute(params);
}
```

#### 3. 模型兜底链 (Model Fallback Chain)

```typescript
// 参考 OpenClaw 的 runWithModelFallback
interface AIProvider {
  name: string;
  chat(messages: Message[]): Promise<Completion>;
  isHealthy(): Promise<boolean>;
}

class ModelFallbackChain {
  private providers: AIProvider[];

  async chat(messages: Message[]): Promise<Completion> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        // 健康检查
        if (!(await provider.isHealthy())) {
          continue;
        }
        return await provider.chat(messages);
      } catch (error) {
        lastError = error;
        console.warn(`Provider ${provider.name} failed, trying next...`);
      }
    }

    throw new AllProvidersFailedError(lastError);
  }
}
```

#### 4. Cron 任务配置化

参考 OpenClaw 的 jobs.json 持久化：

```typescript
// 任务配置存储在数据库 (agent_jobs 表)
interface AgentJob {
  id: string;                    // 'rss-collector', 'report-tech', 'report-world'
  name: string;
  schedule: string;              // cron 表达式
  enabled: boolean;
  executionMode: 'isolated' | 'mainSession';  // 参考 OpenClaw
  payload: {
    type: string;
    params?: Record<string, unknown>;
  };
  maxConcurrent: number;          // 最大并发数
  timeout: number;               // 超时时间 (ms)
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

// 默认任务配置
const DEFAULT_JOBS: AgentJob[] = [
  {
    id: 'rss-collector',
    name: 'RSS Collector',
    schedule: '*/30 * * * *',
    enabled: true,
    executionMode: 'isolated',
    payload: { type: 'rssCollect' },
    maxConcurrent: 1,
    timeout: 600000, // 10分钟
  },
  {
    id: 'report-tech',
    name: 'Tech Report Generator',
    schedule: '0 6 * * *',
    enabled: true,
    executionMode: 'isolated',
    payload: { type: 'reportGenerate', params: { category: 'tech' } },
    maxConcurrent: 1,
    timeout: 300000, // 5分钟
  },
  {
    id: 'report-world',
    name: 'World Report Generator',
    schedule: '0 6 * * *',
    enabled: true,
    executionMode: 'isolated',
    payload: { type: 'reportGenerate', params: { category: 'world' } },
    maxConcurrent: 1,
    timeout: 300000,
  },
  {
    id: 'report-weekly',
    name: 'Weekly Trend Report',
    schedule: '0 6 * * 0', // 每周日 6:00 UTC
    enabled: true,
    executionMode: 'isolated',
    payload: { type: 'weeklyTrend' },
    maxConcurrent: 1,
    timeout: 600000, // 10分钟
  },
  {
    id: 'cleanup',
    name: 'Data Cleanup',
    schedule: '0 4 * * *',
    enabled: true,
    executionMode: 'isolated',
    payload: { type: 'cleanup' },
    maxConcurrent: 1,
    timeout: 60000,
  },
  {
    id: 'backup',
    name: 'Database Backup',
    schedule: '0 3 * * *',
    enabled: false, // 默认关闭，需要配置云存储后开启
    executionMode: 'isolated',
    payload: { type: 'backup' },
    maxConcurrent: 1,
    timeout: 300000,
  },
];
```

#### 5. 错误处理与重试

```typescript
// 参考 OpenClaw 的执行模式
interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

class AgentExecutor {
  async executeWithRetry<T>(
    task: AgentJob,
    handler: () => Promise<T>,
    retryConfig: RetryConfig
  ): Promise<T> {
    let lastError: Error | null = null;
    let currentBackoff = retryConfig.backoffMs;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // 获取任务写锁
        const lock = await this.acquireLock(task.id);
        if (!lock) {
          throw new TaskLockedError(`Task ${task.id} is already running`);
        }

        try {
          return await handler();
        } finally {
          await this.releaseLock(lock);
        }
      } catch (error) {
        lastError = error;

        if (attempt < retryConfig.maxRetries) {
          console.warn(`Attempt ${attempt + 1} failed, retrying in ${currentBackoff}ms...`);
          await this.sleep(currentBackoff);
          currentBackoff = Math.min(
            currentBackoff * retryConfig.backoffMultiplier,
            retryConfig.maxBackoffMs
          );
        }
      }
    }

    throw new TaskExecutionError(`Task failed after ${retryConfig.maxRetries} retries`, lastError);
  }
}
```

## Decisions

### D1: 报告生成流程

**决策**：采用 **并行 + 级联触发** 模式（参考 OpenClaw 的并行执行）

```
Daily Reports (每日 6:00 UTC)
│
├─ Tech Report (独立会话)              World Report (独立会话)
│       │                                    │
│       ├─ 检查 rss_items (tech)            ├─ 检查 rss_items (world)
│       │                                    │
│       ├─ 不足? Web Search                 ├─ 不足? Web Search
│       │         │                          │         │
│       │         ▼                          │         ▼
│       ├─ 生成 Tech 报告                    ├─ 生成 World 报告
│       │         │                          │         │
│       └─────────┴──────────────────────────┘
│                     │
│                     ▼
│              串行: TTS 生成 (依赖报告完成)
│                     │
│                     ▼
│               保存报告 + 播客
│
└─ Weekly Trend Report (每周日 6:00 UTC)
        │
        ├─ 检查 rss_items (过去7天)
        │
        ├─ 生成 Weekly Trend 报告
        │
        └─ TTS 生成 (可选)
```

**理由**：
- Tech 和 World 报告完全独立，并行执行提升效率
- TTS 依赖报告生成完成，需串行执行
- Weekly 报告独立调度，可在周日生成
- 参考 OpenClaw 的 `executionMode: 'isolated'`，每个报告有独立会话
- 减少不必要的 API 调用（Web Search 有成本）

### D2: 任务执行模式

**决策**：采用 **写锁 + 追加日志** 模式（参考 OpenClaw 的会话管理）

```
任务执行
    │
    ├─ 1. 检查任务写锁 (Redis/Database)
    │       │
    │       ├─ 已锁定 → 返回错误 (防止并发)
    │       │
    │       └─ 未锁定 → 获取锁 + 创建会话
    │
    ├─ 2. 执行任务 + 追加日志到 .jsonl
    │
    ├─ 3. 完成后释放锁
    │
    └─ 4. 记录最终状态 (completed/failed)
```

**理由**：
- 写锁防止同一任务并发执行
- 追加日志便于调试和恢复
- 与 OpenClaw 的 Session Write Lock 设计一致

### D3: 工具策略管道

**决策**：实现 **多层工具策略管道**（参考 OpenClaw 的 Tool Policy Pipeline）

```
工具调用请求
    │
    ├─ Layer 1: 权限检查
    │       ├─ 角色白名单 (system/scheduled/manual)
    │       └─ 管理员手动触发 vs 定时任务
    │
    ├─ Layer 2: 速率限制
    │       ├─ 滑动窗口算法
    │       ├─ Redis 计数器
    │       └─ 超出限制 → 429 错误
    │
    ├─ Layer 3: 循环检测
    │       ├─ 记录最近 N 次调用
    │       ├─ 检测重复模式
    │       └─ 触发阈值 → 中止调用
    │
    └─ Layer 4: 执行
            ├─ 参数验证
            └─ 实际执行
```

**理由**：
- 多层防护确保系统稳定性
- 速率限制防止 API 过载
- 循环检测防止无限重试

### D4: 模型兜底链

**决策**：实现 **AI Provider 兜底链**（参考 OpenClaw 的 Model Fallback）

```
AI 请求
    │
    ├─ 1. MiniMax (首选)
    │       │
    │       ├─ 成功 → 返回结果
    │       │
    │       └─ 失败 → 记录错误，尝试下一个
    │
    ├─ 2. Groq (备选)
    │
    ├─ 3. OpenRouter (备选)
    │
    ├─ 4. Lepton (最后兜底)
    │
    └─ 全部失败 → 返回错误 + 缓存数据
```

**理由**：
- 多层兜底确保高可用
- 健康检查跳过不健康 provider
- 参考 OpenClaw 的 `runWithModelFallback`

### D5: Web Search 策略

> **注意**：MiniMax **不提供** Web Search API，此功能需要使用第三方服务。

**参考 OpenClaw 社区 Skills 的 Web Search 方案**：

| 方案 | 来源 | 优点 | 缺点 |
|------|------|------|------|
| **DuckDuckGo** | OpenClaw Skills (ianwchoi/duckduckgo-websearch) | 免费，无需 API Key，无速率限制 | 英文为主 |
| **Brave Search** | OpenClaw 内置 | 结构化结果 | 需要 API Key |
| **Tavily** | 备选 | 专为 AI/RAG 设计 | 付费超量 |
| **Perplexity** | 备选 | AI 合成答案 | 需 API Key |

**数据源优先级**：
1. **RSS 源**（首选）- 100+ 已配置的 RSS 源，无需额外 API
2. **DuckDuckGo**（备选）- OpenClaw 社区推荐，完全免费，无需 API Key
3. **Brave Search**（备选）- OpenClaw 内置方案
4. **Tavily**（最后兜底）- 专为 AI/RAG 设计

**DuckDuckGo 集成方案**（参考 OpenClaw Skill）：
```typescript
// 使用 DuckDuckGo Instant Answer API
interface DuckDuckGoSearchResult {
  heading: string;
  abstract: string;
  url: string;
  sources: string[];
}

// 或使用 HTML SERP 爬虫（备选）
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  // 方式1: Instant Answer API (推荐)
  const response = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json`);
  // 方式2: HTML SERP 爬虫 (备选)
  const html = await fetch(`https://html.duckduckgo.com/html/?q=${query}`);
}
```

**理由**：
- MiniMax 仅提供 LLM/TTS/ASR API，不提供 Web Search
- 优先使用已有的 100+ RSS 源，减少额外 API 依赖
- **首选 DuckDuckGo**：OpenClaw 社区验证，完全免费，无需 API Key
- Web Search 仅作为数据不足时的兜底方案

### D5.1: 报告语言

**决策**：**默认英文**，支持语言切换

```
报告语言配置
    │
    ├─ 'en' (默认) ──► 英文报告 + TTS en-US-AriaNeural
    │
    └─ 'zh' ──► 中文报告 + TTS zh-CN-XiaoxiaoNeural
```

**理由**：
- 默认英文（符合国际用户需求）
- 简单实现，无需语言检测
- 用户可通过配置切换语言

### D6: 报告分类策略

**决策**：基于 RSS 源的 category 字段分类

```
rss_sources.category
       │
       ├─ 'tech' / 'ai' / 'startup' ──► AI/Tech 报告
       │
       └─ 'world' / 'geopolitical' / 'military' ─► World 报告
```

**备选方案**：
- AI 分类：使用 LLM 判断每条新闻类别（成本高，不采用）

### D6.1: 报告数据来源

**Tech 报告数据来源**：

| RSS 分类 | 说明 | 来源 |
|---------|------|------|
| `tech` | 科技新闻 | Hacker News, Ars Technica, The Verge, MIT Tech Review |
| `ai` | AI/ML 新闻 | AI News, VentureBeat AI, The Verge AI, MIT AI, ArXiv AI |
| `finance` | 财经新闻 | CNBC, MarketWatch, Yahoo Finance, FT, Reuters Business |
| `crypto` | 加密货币 | (如配置) |

**Tech 报告过滤条件**：`category IN ('tech', 'ai', 'finance', 'crypto')`

---

**World 报告数据来源**：

| RSS 分类 | 说明 | 来源 |
|---------|------|------|
| `politics` | 政治新闻 | BBC World, NPR, Guardian, AP, Reuters, Politico |
| `middleeast` | 中东 | BBC ME, Al Jazeera, Al Arabiya, Guardian ME |
| `gov` | 政府/国际组织 | White House, State Dept, Pentagon, SEC, UN |
| `thinktanks` | 智库 | Foreign Policy, Atlantic Council, RAND, Brookings |
| `crisis` | 人道危机 | CrisisWatch, IAEA, WHO, UNHCR |
| `regional` | 地区 | Xinhua, TASS, Kyiv Independent, Moscow Times |
| `energy` | 能源 | Oil & Gas, Nuclear Energy, Mining |
| `africa` | 非洲 | Africa News, BBC Africa, Sahel Crisis |
| `latam` | 拉美 | Latin America, BBC LatAm |
| `asia` | 亚太 | Asia News, BBC Asia, SCMP |

**World 报告过滤条件**：`category IN ('politics', 'middleeast', 'gov', 'thinktanks', 'crisis', 'regional', 'energy', 'africa', 'latam', 'asia')`

### D6.2: 报告 Prompt 设计

**Tech 报告 Prompt**：

```
You are a tech industry analyst. Analyze the following AI/tech news headlines from the past 24 hours.

Instructions:
1. Identify the most important stories and breakthroughs
2. Highlight any significant product launches, funding news, or partnerships
3. Note any regulatory or policy developments affecting the tech industry
4. Summarize emerging trends in AI, startups, and technology

Provide a well-structured report with:
- **Top Stories**: 3-5 most important headlines with brief analysis
- **Key Developments**: Notable events and announcements
- **Market Impact**: How these stories might affect the tech sector
- **Looking Ahead**: Potential storylines to watch

Keep the tone professional and analytical. Use bullet points for readability.
```

**World 报告 Prompt**：

```
You are a geopolitical analyst. Analyze the following world news headlines from the past 24 hours.

Instructions:
1. Identify major geopolitical events and developments
2. Highlight conflicts, diplomatic developments, and security issues
3. Note any significant policy changes or international agreements
4. Summarize regional hotspots and trending topics

Provide a well-structured report with:
- **Breaking News**: Critical events requiring immediate attention
- **Regional Updates**: Key developments by region (Middle East, Europe, Asia, Americas, Africa)
- **Security & Defense**: Military and security-related news
- **Diplomacy**: International relations and treaty developments
- **Looking Ahead**: Events to watch in the coming days

Keep the tone professional and objective. Prioritize accuracy and balanced reporting.
```

**Weekly Trend 报告 Prompt**：

```
You are a news analyst. Analyze the following news headlines from the past week.

Instructions:
1. Identify major trends and recurring themes
2. Highlight emerging stories that gained momentum
3. Note any notable shifts from previous weeks
4. Provide context for how stories developed over the week

Provide a comprehensive weekly report with:
- **Top Trends**: Primary themes dominating the news
- **Story Development**: How major stories evolved
- **Under the Radar**: Important stories that received less coverage
- **Week in Review**: Summary of key events by day (if discernible)
- **Outlook**: Potential developments for the coming week

Keep it comprehensive but concise. Use headers and bullet points for structure.
```

### D6.3: 数据流

```
RSS Sources (feeds.ts)
       │
       ▼
RSS Collector Agent
(每 30 分钟采集)
       │
       ▼
rss_items 表
(category 字段: tech/ai/world/gov/...)
       │
       ▼
Report Generator
(按 category 过滤)
       │
       ▼
AI (MiniMax/Groq/OpenRouter)
       │
       ▼
Markdown Report
       │
       ▼
TTS Agent
(生成语音播客)
```

### D6.4: 数据库 Schema

**rss_sources 表**（需添加字段）：

```sql
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS category TEXT;
-- category 值: 'tech', 'ai', 'politics', 'middleeast', 'gov', 'thinktanks', 'crisis', 'regional', 'energy'
```

**rss_items 表**（需添加字段）：

```sql
ALTER TABLE rss_items ADD COLUMN IF NOT EXISTS category TEXT;
-- 继承 rss_sources.category

CREATE INDEX idx_rss_items_category ON rss_items(category);
CREATE INDEX idx_rss_items_pub_date ON rss_items(pub_date);
```

**agent_jobs 表**（新建）：

```sql
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
```

**task_logs 表**（新建）：

```sql
CREATE TABLE task_logs (
  id SERIAL PRIMARY KEY,
  task_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB
);

CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_timestamp ON task_logs(timestamp);
```

**dead_letter_tasks 表**（新建）：

```sql
CREATE TABLE dead_letter_tasks (
  id SERIAL PRIMARY KEY,
  original_task_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  failed_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending-review',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### D7: 前端状态同步

**决策**：使用 **WebSocket + 轮询降级**（参考 OpenClaw 的实时推送）

```
Primary: WebSocket                    Fallback: Polling
Frontend                    Backend          Frontend
    │                         │                  │
    │◄──── WS: task-update ───│                  │
    │                         │                  │
    │◄──── WS: task-complete │                  │
    │                         │                  │
    │    (WebSocket 连接)     │                  │
    │                         │◄── GET /api/agent/tasks (每 30s)
    │                         │         │
    │                         │         └─ 仅当 WS 不可用时
```

**理由**：
- WebSocket 提供实时推送（参考 OpenClaw 的 Gateway）
- 轮询作为降级方案，确保兼容性
- 30秒轮询作为备用，减少服务器负载

### D8: Cron 任务配置化

**决策**：任务配置存储在数据库，支持运行时修改（参考 OpenClaw 的 jobs.json）

```
数据库: agent_jobs 表
    │
    ├─ 读取任务配置
    │       │
    │       ├─ 任务存在 → 使用配置
    │       │
    │       └─ 任务不存在 → 使用默认配置
    │
    └─ 动态更新
            │
            ├─ PUT /api/agent/config 更新 schedule
            ├─ PUT /api/agent/config 更新 enabled
            └─ 无需重启服务器
```

**理由**：
- 参考 OpenClaw 的持久化任务配置
- 运行时可动态调整，无需代码修改
- 支持启用/禁用单个任务

### D9: 数据保留策略

| 数据类型 | 保留期 | 原因 |
|---------|-------|------|
| RSS Items | 90 天 | 报告需要历史数据 |
| Reports | 永久 | 用户可能需要查看 |
| Podcasts | 3 天 | 语音文件较大 |
| Agent Tasks | 30 天 | 审计需要 |

## Risks / Trade-offs

### R1: RSS 采集频率

**风险**：100+ RSS 源每 30 分钟采集可能：
- API 限流
- 服务器负载高
- 数据重复

**缓解**：
- 使用去重（基于 link 字段）
- 增量更新（只获取新条目）
- 分布式采集（未来考虑）

### R2: Web Search API 限制

**风险**：第三方 Web Search (DuckDuckGo/Brave/Tavily) 有速率限制

**缓解**：
- DuckDuckGo 无速率限制（首选）
- 设置最大搜索次数（每次报告最多 10 次）
- 失败后使用缓存数据
- 人工审核队列

### R3: 报告生成时间

**风险**：生成报告可能需要较长时间（AI API 响应）

**缓解**：
- 异步处理（后台任务）
- 超时设置（最多 5 分钟）
- 错误时返回部分数据

### R4: TTS 文件存储

**风险**：语音文件占用存储空间

**缓解**：
- 3 天自动清理
- 压缩音频（MP3 128kbps）
- 可选：云存储（S3/R2）

## Migration Plan

### 阶段 1：基础设施（Day 1）

1. 创建数据库表（如不存在）
2. 创建 `agent_jobs` 表（任务配置存储）
3. 创建 `task_logs` 表（追加日志）
4. 创建 `dead_letter_tasks` 表（死信队列）
5. 修改 `rss_sources` 表（添加 category 字段）
6. 修改 `rss_items` 表（添加 category 字段 + 索引）
7. 集成 Scheduler 到 server/index.ts
8. 实现任务配置加载和动态更新
9. 验证定时任务触发

### 阶段 2：核心架构（Day 2）

1. 实现任务锁机制（Redis/Database）
2. 实现工具策略管道
3. 实现模型兜底链
4. 实现追加日志系统

### 阶段 3：数据采集（Day 3）

1. 实现 RSS 采集 Agent
2. 配置 RSS 源列表（从 feeds.ts 读取）
3. 实现 RSS 源分类映射
4. 测试增量更新
5. 实现并行采集

### 阶段 4：报告生成（Day 4-5）

1. 重构报告生成器（支持并行）
2. 实现 Web Search 兜底
3. 实现分类报告（Tech / World / Weekly）
4. 配置报告 Prompt
5. 集成 TTS
6. 实现并行执行优化

### 阶段 5：前端 UI（Day 6）

1. 创建 WebSocket 连接（实时推送）
2. 实现轮询降级方案
3. 创建 Agent 状态面板
4. 创建播客播放器
5. 添加手动触发功能
6. 注册 Agent 面板到 panels.ts

### 回滚计划

如发现问题：
1. 禁用 Scheduler 定时任务
2. 回滚代码到上一版本
3. 手动清理新增数据

## Open Questions (Resolved)

### Q1: RSS 采集频率 ✅

**决策**：30 分钟采集一次（可配置）

### Q2: Web Search 使用场景 ✅

**决策**：当 rss_items 特定类别少于 50 条时触发

### Q3: 报告语言 ✅

**决策**：根据用户浏览器语言生成对应语言报告

### Q4: 播客发布 ✅

**决策**：仅在 UI 播放（简单实现）

---

## Additional Considerations

### 错误通知机制

- 任务失败时记录到 `agent_tasks.error_message`
- 前端显示最近失败任务
- 可选：发送邮件通知（未来功能）

### API 认证

- `/api/agent/trigger` 端点需要管理员认证
- 使用现有的 rate limiting 中间件
- 前端手动触发仅对已登录管理员开放

### 报告缓存

- 同一天同一类型报告返回缓存
- 缓存 key: `report:{type}:{date}:{language}`
- 缓存有效期: 24 小时

### 并行处理

- Tech 和 World 报告并行生成
- 使用 Promise.all() 等待两者完成
- 任一失败不影响另一个

---

## API 设计

### 新增 API 端点

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/api/agent/status` | GET | 公开 | 获取 Agent 系统状态 |
| `/api/agent/jobs` | GET | 公开 | 获取任务配置列表 |
| `/api/agent/jobs/:id` | GET | 需认证 | 获取单个任务配置 |
| `/api/agent/jobs/:id` | PUT | 需认证 | 更新任务配置（schedule/enabled） |
| `/api/agent/tasks` | GET | 公开 | 获取任务执行历史（分页） |
| `/api/agent/tasks/:id` | GET | 公开 | 获取任务详情 |
| `/api/agent/tasks/:id/logs` | GET | 公开 | 获取任务执行日志 |
| `/api/agent/trigger/:task` | POST | 需认证 | 手动触发任务 |
| `/api/reports` | GET | 公开 | 获取报告列表 |
| `/api/reports/:id` | GET | 公开 | 获取报告详情 |
| `/api/reports/generate` | POST | 需认证 | 手动生成报告 |
| `/api/podcasts` | GET | 公开 | 获取播客列表 |
| `/api/podcasts/:id/audio` | GET | 公开 | 获取音频流 |
| `/ws` | WS | 内部 (Origin验证) | WebSocket 实时推送 |

### WebSocket 消息格式

```typescript
// 客户端 -> 服务器
type WSClientMessage =
  | { type: 'subscribe'; tasks: string[] }
  | { type: 'ping' };

// 服务器 -> 客户端
type WSServerMessage =
  | { type: 'task-update'; task: TaskStatus }
  | { type: 'task-complete'; taskId: string; result: TaskResult }
  | { type: 'task-error'; taskId: string; error: string }
  | { type: 'pong' };
```

### 前端组件

| 组件 | 描述 |
|------|------|
| `AgentStatusPanel` | 显示 Agent 运行状态 + 连接状态 |
| `AgentTaskList` | 任务历史列表（支持实时更新） |
| `ReportList` | 报告列表 |
| `PodcastPlayer` | 播客音频播放器 |
| `ManualTriggerModal` | 手动触发弹窗 |
| `AgentConfigModal` | Agent 配置弹窗（动态调整 schedule） |
| `TaskLogsViewer` | 任务执行日志查看器 |

### 前端面板注册

在 `src/config/panels.ts` 中添加：

```typescript
// FULL_PANELS 中添加 (地缘政治版本)
agent: { name: 'Agent Panel', enabled: true, priority: 1 },

// TECH_PANELS 中添加 (科技/创业版本)
agent: { name: 'Agent Panel', enabled: true, priority: 1 },
```

**面板优先级建议**：
- `priority: 1` - 与 insights, strategic-posture 等高优先级面板同级
- 位置：建议放在 insights 面板之后

**说明**：
- Agent 面板在 full 和 tech 两个 variant 中都可用
- 报告数据根据 variant 不同有所区别：
  - **full variant**: 使用 politics, middleeast, gov 等分类
  - **tech variant**: 使用 tech, ai, startups, vcblogs 等分类

### 配置项

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `rssFetchInterval` | number | 30 | RSS 采集间隔（分钟） |
| `reportLanguage` | string | 'auto' | 报告语言 (auto/en/zh) |
| `ttsEnabled` | boolean | true | 是否启用 TTS |
| `webSearchEnabled` | boolean | true | 是否启用 Web Search |
| `webSearchLimit` | number | 10 | 每次报告最大搜索次数 |
| `minDataThreshold` | number | 50 | 触发 Web Search 的最小数据量 |
| `taskLockTimeout` | number | 300000 | 任务锁超时（5分钟） |
| `maxRetries` | number | 3 | 任务失败重试次数 |
| `backoffMs` | number | 1000 | 重试初始退避（ms） |
| `wsEnabled` | boolean | true | 是否启用 WebSocket |
| `pollingInterval` | number | 30000 | 轮询间隔（ms，当 WS 不可用） |

---

## Additional Requirements

### 错误处理与补偿机制

#### 死信队列 (Dead Letter Queue)

当任务重试次数超过上限后，任务进入死信队列：

```typescript
interface DeadLetterTask {
  id: string;
  originalTaskId: string;
  type: string;
  payload: Record<string, unknown>;
  errorMessage: string;
  retryCount: number;
  failedAt: Date;
  status: 'pending-review' | 'ignored' | 'requeued';
}
```

**处理流程**：
1. 任务重试 `maxRetries` 次后失败
2. 自动进入死信队列
3. 记录失败详情（错误信息、重试次数、上下文）
4. 通知管理员（可选：邮件/Slack）
5. 人工审核后可选择：
   - 忽略（ignored）
   - 重新入队（requeued）
   - 手动修复后重试

#### 任务依赖关系

部分任务有依赖关系，需要明确定义：

```typescript
interface TaskDependency {
  taskId: string;
  dependsOn: string[];  // 依赖的任务 ID 列表
  required: boolean;    // 是否必须完成
}

// 示例
const TASK_DEPENDENCIES: TaskDependency[] = [
  { taskId: 'tts-tech', dependsOn: ['report-tech'], required: true },
  { taskId: 'tts-world', dependsOn: ['report-world'], required: true },
  { taskId: 'report-tech', dependsOn: ['rss-collector'], required: false },  // 可选
];
```

### 安全设计

#### API 认证与授权

| 端点 | 认证 | 权限 |
|------|------|------|
| `/api/agent/status` | 无 | 公开 |
| `/api/agent/jobs` | 无 | 公开 |
| `/api/agent/jobs/:id` | JWT | admin |
| `/api/agent/jobs/:id` (PUT) | JWT | admin |
| `/api/agent/tasks` | 无 | 公开 |
| `/api/agent/tasks/:id` | 无 | 公开 |
| `/api/agent/tasks/:id/logs` | 无 | 公开 |
| `/api/agent/trigger/:task` | JWT | admin |
| `/api/agent/config` (GET) | JWT | admin |
| `/api/agent/config` (PUT) | JWT | admin |
| `/api/reports/*` | 无 | 公开 |
| `/api/podcasts/*` | 无 | 公开 |
| `/ws` | Origin 验证 | 内部使用 |

#### WebSocket 安全策略

由于 WebSocket 仅用于内部前后端通信，不对外提供，采用 Origin 验证替代 token：

```typescript
// 允许的来源（可在环境变量配置）
const ALLOWED_ORIGINS = [
  'https://worldmonitor.app',
  'https://tech.worldmonitor.app',
  'http://localhost:5173',  // 开发环境
];

// 连接时验证
function isOriginAllowed(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}
```

**安全理由**：
- 网络层：防火墙只开放 80/443，外部无法直接连接 WS
- 传输层：Nginx 强制 SSL/TLS
- 应用层：Origin 验证 + 同源策略
- 数据：仅推送公开数据（新闻、任务状态），无敏感信息

### 监控与可观测性

#### 健康检查端点

```typescript
// GET /api/health
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  dependencies: {
    database: { status: 'ok' | 'error'; latency: number };
    redis: { status: 'ok' | 'error'; latency: number };
    rssSources: { total: number; healthy: number };
    scheduler: { status: 'running' | 'stopped' };
  };
  tasks: {
    running: number;
    pending: number;
    failed: number;
  };
}
```

#### Prometheus Metrics

```typescript
// 关键指标
const METRICS = {
  // 任务指标
  'agent_task_total': Counter,        // 任务总数
  'agent_task_duration_seconds': Histogram,  // 任务执行时间
  'agent_task_failures_total': Counter,      // 任务失败数

  // RSS 指标
  'rss_fetch_total': Counter,         // RSS 采集次数
  'rss_items_total': Gauge,          // RSS 条目总数
  'rss_fetch_duration_seconds': Histogram,   // 采集耗时

  // 报告指标
  'report_generate_total': Counter,   // 报告生成次数
  'report_generate_duration_seconds': Histogram,

  // TTS 指标
  'tts_generate_total': Counter,     // TTS 生成次数

  // 系统指标
  'ws_connections_active': Gauge,    // WebSocket 连接数
};
```

### 数据一致性策略

#### RSS 采集失败处理

```typescript
interface FetchResult {
  sourceId: string;
  status: 'success' | 'partial' | 'failed';
  itemsCollected: number;
  errors?: string[];
}

// 策略：部分失败不影响其他源
async function collectAllSources(sources: RSSSource[]): Promise<FetchResult[]> {
  const results: FetchResult[] = [];

  // 并行采集，但容错处理
  const promises = sources.map(async (source) => {
    try {
      const items = await fetchRSS(source);
      return { sourceId: source.id, status: 'success', itemsCollected: items.length };
    } catch (error) {
      // 记录失败，但继续处理其他源
      return { sourceId: source.id, status: 'failed', itemsCollected: 0, errors: [error.message] };
    }
  });

  return Promise.allSettled(promises)
    .then(results => results.map(r => r.status === 'fulfilled' ? r.value : r.reason));
}
```

### 配置管理

#### 全局配置存储

```typescript
interface AgentConfig {
  // 任务配置
  jobs: AgentJob[];

  // 全局设置
  settings: {
    rssFetchInterval: number;
    reportLanguage: string;
    ttsEnabled: boolean;
    webSearchEnabled: boolean;
    webSearchLimit: number;
    minDataThreshold: number;
    taskLockTimeout: number;
    maxRetries: number;
    backoffMs: number;
    wsEnabled: boolean;
    pollingInterval: number;
  };

  // 通知设置
  notifications: {
    emailOnTaskFailure: boolean;
    slackWebhook?: string;
  };

  updatedAt: Date;
  updatedBy: string;
}
```

### 备份与灾难恢复

#### 备份验证

```typescript
interface BackupVerification {
  timestamp: Date;
  fileSize: number;
  checksum: string;
  status: 'verified' | 'corrupted' | 'missing';
}

// 备份文件校验
async function verifyBackup(backupPath: string): Promise<BackupVerification> {
  const stats = await fs.stat(backupPath);
  const checksum = await calculateChecksum(backupPath);

  return {
    timestamp: stats.mtime,
    fileSize: stats.size,
    checksum,
    status: stats.size > 0 ? 'verified' : 'corrupted'
  };
}
```
