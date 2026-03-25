# WorldMonitor 数据流详解

## 概述

WorldMonitor 的数据流涵盖从外部数据源获取到前端展示的完整流程。本文档详细介绍各类数据的流动路径和处理机制。

---

## 1. 数据流概览

### 1.1 整体数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                      整体数据流架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  外部数据源  │────▶│   后端 API   │────▶│   前端展示   │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │               │
│         ▼                    ▼                    ▼               │
│   RSS / API            缓存/处理            WebGL 渲染         │
│   数据库              Redis              Deck.gl              │
│   WebSocket           PostgreSQL         D3 图表            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 数据类型分类

| 数据类型 | 来源 | 更新频率 | 展示方式 |
|---------|------|---------|---------|
| 新闻 | RSS 订阅 | 15 分钟 | 列表/聚类 |
| 市场数据 | 第三方 API | 实时 | 图表 |
| 地图数据 | 实时追踪 | 实时 | Deck.gl |
| 风险评分 | ACLED/GDELT | 10 分钟 | 面板 |
| AI 摘要 | LLM API | 按需 | Insights 面板 |

---

## 2. 新闻数据流

### 2.1 RSS 收集流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      RSS 收集流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Agent Scheduler 触发收集任务                                 │
│                    │                                             │
│                    ▼                                             │
│  2. RSS 收集器从各源获取数据                                   │
│     ┌────────────┬────────────┬────────────┐                 │
│     │ BBC        │ Reuters    │ AP News   │                 │
│     │ Guardian   │ NPR        │ Al Jazeera│                 │
│     └────────────┴────────────┴────────────┘                 │
│                    │                                             │
│                    ▼                                             │
│  3. 解析 XML → 标准化格式                                       │
│                    │                                             │
│                    ▼                                             │
│  4. 存储到 PostgreSQL (可选)                                   │
│                    │                                             │
│                    ▼                                             │
│  5. 返回给前端                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 RSS 代理机制

外部 RSS 请求通过后端代理：

```typescript
// 前端请求
GET /api/rss-proxy?url=https://feeds.bbci.co.uk/news/world/rss.xml

// 后端处理
1. 验证域名是否在白名单
2. 获取 RSS 内容
3. 解析 XML
4. 返回 JSON
```

**安全机制**: 只允许白名单中的域名

### 2.3 新闻聚类流程

```
RSS 数据 ──▶ 去重 ──▶ 分词 ──▶ Jaccard 聚类 ──▶ 显示
              │                            │
              ▼                            ▼
         词汇相似度检测              聚类结果
```

---

## 3. 市场数据流

### 3.1 数据源

| 市场类型 | API 来源 | 缓存 TTL |
|---------|---------|---------|
| 股票指数 | Yahoo Finance | 1 分钟 |
| 加密货币 | CoinGecko | 1 分钟 |
| 稳定币 | 自有 API | 5 分钟 |
| 预测市场 | Polymarket | 2 分钟 |
| ETF 流向 | 自有 API | 15 分钟 |

### 3.2 数据流程

```
用户访问 ──▶ 检查 Redis ──▶ 有缓存 ──▶ 返回缓存
                │                │
                │ 无             │ 是
                ▼                ▼
           调用外部 API    缓存结果
                │                │
                ▼                ▼
           存储缓存        返回前端
```

### 3.3 数据更新机制

```typescript
// 前端定期刷新
setInterval(async () => {
  const [stocks, crypto, stablecoins] = await Promise.all([
    fetch('/api/stock-index'),
    fetch('/api/coingecko'),
    fetch('/api/stablecoin-markets')
  ]);
  updateMarketPanels({ stocks, crypto, stablecoins });
}, 60000); // 每分钟更新
```

---

## 4. 地图数据流

### 4.1 实时追踪数据

```
┌─────────────────────────────────────────────────────────────────┐
│                    实时追踪数据流                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │  AISStream   │     │  OpenSky    │     │  FIRMS      │  │
│  │  (船舶)      │     │  (航班)     │     │  (火灾)     │  │
│  └──────────────┘     └──────────────┘     └──────────────┘  │
│         │                    │                    │             │
│         └────────────────────┼────────────────────┘             │
│                              │                                  │
│                              ▼                                  │
│                     Railway Relay Server                        │
│                              │                                  │
│              ┌──────────────┼──────────────┐                  │
│              ▼              ▼              ▼                  │
│         WebSocket      WebSocket      HTTP                   │
│              │              │              │                  │
│              └──────────────┼──────────────┘                  │
│                             │                                 │
│                             ▼                                 │
│                      前端 Deck.gl 渲染                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 WebSocket 连接

```typescript
// 建立 WebSocket 连接
const ws = new WebSocket(WS_RELAY_URL);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'aircraft':
      updateAircraftLayer(data.positions);
      break;
    case 'vessel':
      updateVesselLayer(data.positions);
      break;
  }
};
```

### 4.3 Deck.gl 图层

| 图层类型 | 数据源 | 更新频率 |
|---------|--------|---------|
| 航班 | OpenSky | 实时 |
| 船舶 | AISStream | 实时 |
| 火灾 | NASA FIRMS | 30 分钟 |
| 地震 | USGS | 实时 |
| 天气 | OpenWeatherMap | 10 分钟 |

---

## 5. 风险评分数据流

### 5.1 数据获取

```
ACLED API ──▶ 抗议/冲突数据 ──▶ 风险计算 ──▶ Redis 缓存 ──▶ 前端
                   │                    │              │
                   ▼                    ▼              ▼
              原始事件              计算得分         10分钟 TTL
```

### 5.2 计算流程

```typescript
// 1. 获取 ACLED 抗议数据
const protests = await fetchACLED();

// 2. 按国家统计
const countryEvents = countByCountry(protests);

// 3. 计算 CII 分数
for (const country of TIER1_COUNTRIES) {
  const score = calculateCIIScore(countryEvents[country]);
  scores.push({ country, score });
}

// 4. 计算战略风险
const strategicRisk = calculateStrategicRisk(top5Scores);
```

---

## 6. AI 摘要数据流

### 6.1 处理流程

```
用户查看 Insights ──▶ 发送 headlines ──▶ 后端 ──▶ AI API
        │                                           │
        │                                           ▼
        │                                    Groq/OpenRouter
        │                                           │
        ▼                                           ▼
  显示摘要                              返回 ──▶ 缓存 ──▶ 返回
```

### 6.2 缓存策略

```typescript
// 检查缓存
const cacheKey = hash(headlines.slice(0, 8));
const cached = await redis.get(`summary:${cacheKey}`);

if (cached) {
  return { summary: cached, cached: true };
}

// 调用 AI API
const summary = await callAIAPI(headlines);

// 缓存 24 小时
await redis.set(cacheKey, summary, { ex: 86400 });
```

---

## 7. 前端数据管理

### 7.1 状态管理

```typescript
// 集中管理所有面板数据
class DataManager {
  private panels = new Map<string, PanelData>();

  registerPanel(id: string, panel: BasePanel) {
    this.panels.set(id, panel);
  }

  refreshAll() {
    for (const panel of this.panels.values()) {
      panel.refresh();
    }
  }
}
```

### 7.2 数据更新事件

```typescript
// 面板数据更新时触发事件
panel.on('data-updated', (data) => {
  // 更新 UI
  this.render(data);
});
```

---

## 8. 数据缓存架构

### 8.1 多层缓存

```
┌─────────────────────────────────────────┐
│            请求 ──▶ 响应                 │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  L1: 浏览器 Memory                      │
│  - 当前会话数据                          │
│  - 刷新丢失                             │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  L2: Redis (Upstash)                   │
│  - 跨用户共享                           │
│  - 10分钟 - 24小时 TTL                 │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  L3: 外部 API                           │
│  - 最终数据源                           │
│  - 可能失败                             │
└─────────────────────────────────────────┘
```

### 8.2 缓存键命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 风险评分 | `risk:scores:v{version}` | `risk:scores:v2` |
| AI 摘要 | `summary:{variant}:{hash}` | `summary:world:abc123` |
| 面板数据 | `panel:{id}:{params}` | `panel:markets:v1` |

---

## 9. 错误处理与回退

### 9.1 错误处理策略

```typescript
async function fetchWithFallback(api: string) {
  try {
    // 1. 尝试主 API
    return await fetch(api);
  } catch (error) {
    console.warn('Primary API failed:', error);

    try {
      // 2. 尝试缓存
      const cached = await redis.get(cacheKey);
      if (cached) return { data: cached, stale: true };
    } catch (cacheError) {
      console.warn('Cache failed:', cacheError);
    }

    // 3. 返回基准数据
    return getBaselineData();
  }
}
```

### 9.2 用户反馈

| 错误类型 | 用户反馈 |
|---------|---------|
| API 超时 | "数据加载超时，显示缓存数据" |
| 网络错误 | "网络连接失败，检查网络" |
| 无数据 | "暂无数据，请稍后刷新" |
