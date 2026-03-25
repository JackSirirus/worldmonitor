# WorldMonitor API 接口文档

## API 概览

WorldMonitor 后端提供 **57 个** API 接口，用于提供各类数据服务。

## 基础信息

| 项目 | 值 |
|------|------|
| 基础 URL | `http://localhost:3001` |
| 认证方式 | API Key (部分接口) |
| 响应格式 | JSON |
| CORS | 支持跨域 |

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": { }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "Error message"
}
```

## API 分类

---

## 1. RSS 与新闻 API

### RSS 代理

**GET** `/api/rss-proxy`

代理获取 RSS 订阅源。

| 参数 | 类型 | 描述 |
|------|------|------|
| url | string | RSS 源 URL (URL 编码) |

**示例**

```
GET /api/rss-proxy?url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fworld%2Frss.xml
```

### RSS 收集器状态

**GET** `/api/rss-collector/status`

获取 RSS 收集器状态。

### 触发收集

**POST** `/api/rss-collector/collect`

手动触发 RSS 收集。

### Hacker News

**GET** `/api/hackernews`

获取 Hacker News 热门故事。

### 国家情报

**GET** `/api/country-intel`

获取特定国家的情报数据。

**POST** `/api/country-intel`

提交新的国家情报数据。

---

## 2. 市场数据 API

### 股票指数

**GET** `/api/stock-index`

获取主要股票指数数据。

### 稳定币市场

**GET** `/api/stablecoin-markets`

获取稳定币市场数据。

### 加密货币

**GET** `/api/coingecko`

获取加密货币价格数据。

### Polymarket

**GET** `/api/polymarket`

获取预测市场数据。

### ETF 流向

**GET** `/api/etf-flows`

获取 ETF 资金流向数据。

### 雅虎财经

**GET** `/api/yahoo-finance`

获取股票和财经数据。

---

## 3. 地图数据 API

### 航班追踪 (OpenSky)

**GET** `/api/opensky`

获取实时航班数据。

### 野火数据

**GET** `/api/fires`

获取卫星野火数据。

### 地震数据

**GET** `/api/earthquakes`

获取最近地震数据。

### GDELT 地理数据

**GET** `/api/gdelt-geo`

获取 GDELT 地理编码事件数据。

---

## 4. 风险评分 API

### 风险评分

**GET** `/api/risk-scores`

获取地缘政治风险评分。

### ACLED 冲突数据

**GET** `/api/acled`

获取武装冲突数据。

### UCDP 冲突数据

**GET** `/api/ucdp`

获取武装冲突数据。

---

## 5. AI 服务 API

### Groq 摘要

**POST** `/api/groq-summarize`

使用 Groq API 生成新闻摘要。

**请求体**

```json
{
  "headlines": ["Headline 1", "Headline 2"]
}
```

### OpenRouter 摘要

**POST** `/api/openrouter-summarize`

使用 OpenRouter API 生成摘要。

### MiniMax 摘要

**POST** `/api/minimax-summarize`

使用 MiniMax API 生成摘要。

---

## 6. Agent 系统 API

### 报告列表

**GET** `/api/reports`

获取生成的报告列表。

| 参数 | 类型 | 描述 |
|------|------|------|
| limit | number | 返回数量限制 |
| category | string | 报告分类 |

### 生成报告

**POST** `/api/reports/generate/:category`

生成指定分类的报告。

| 参数 | 描述 |
|------|------|
| tech | 科技报告 |
| world | 世界报告 |
| weekly | 周报 |

### Agent 触发

**POST** `/api/agent/trigger/:task`

触发指定 Agent 任务。

### Web 搜索

**GET** `/api/web-search`

执行网络搜索。

---

## 7. 科技数据 API

### 科技事件

**GET** `/api/tech-events`

获取科技会议和事件。

| 参数 | 类型 | 描述 |
|------|------|------|
| days | number | 天数范围 |
| limit | number | 返回数量限制 |

### ArXiv 论文

**GET** `/api/arxiv`

获取最新 ArXiv 论文。

### GitHub Trending

**GET** `/api/github-trending`

获取 GitHub 热门项目。

---

## 8. 宏观数据 API

### 宏观信号

**GET** `/api/macro-signals`

获取宏观经济信号。

### FRED 数据

**GET** `/api/fred-data`

获取美联储经济数据。

### EIA 能源数据

**GET** `/api/eia`

获取美国能源信息署数据。

### 世界银行数据

**GET** `/api/worldbank`

获取世界银行经济指标。

### HAPI 数据

**GET** `/api/hapi`

获取 HAPI 人道主义数据。

### Finhub 股票

**GET** `/api/finnhub`

获取股票报价数据。

### GDELT 文档

**GET** `/api/gdelt-doc`

获取 GDELT 文档数据。

### 时间基线

**GET** `/api/temporal-baseline`

获取时间基线数据。

---

## 9. 军事与安全 API

### 军事态势

**GET** `/api/theater-posture`

获取军事态势数据。

### OpenSky 航班

**GET** `/api/opensky`

获取实时航班数据（含军事飞机）。

### AIS 船舶

**GET** `/api/ais-snapshot`

获取船舶 AIS 数据。

### Wingbits 飞机

**GET** `/api/wingbits`

获取飞机详细信息。

### NGA 警告

**GET** `/api/nga-warnings`

获取 NGA 航行警告。

### FAA 状态

**GET** `/api/faa-status`

获取 FAA 机场状态。

### PizzInt 仪表板

**GET** `/api/pizzint-dashboard`

获取核危机仪表板数据。

### PizzInt GDELT

**GET** `/api/pizzint-gdelt`

获取核危机相关 GDELT 数据。

### 事件分类

**POST** `/api/classify-event`

对事件进行分类。

---

## 10. 媒体与娱乐 API

### YouTube 直播

**GET** `/api/youtube-live`

获取 YouTube 直播数据。

### 播客

**GET** `/api/podcasts`

获取播客数据。

### OG 故事

**GET** `/api/og-story`

获取故事数据。

### Story

**GET** `/api/story`

获取 Story 内容。

---

## 11. 冲突与灾害 API

### ACLED 冲突

**GET** `/api/acled`

获取 ACLED 冲突数据。

### ACLED 详细冲突

**GET** `/api/acled-conflict`

获取详细冲突数据。

### UCDP

**GET** `/api/ucdp`

获取 UCDP 冲突数据。

### 云中断

**GET** `/api/cloudflare-outages`

获取 Cloudflare 网络中断数据。

### 野火 (FIRMS)

**GET** `/api/firms-fires`

获取 NASA FIRMS 卫星野火数据。

---

## 12. 其他 API

### 服务状态

**GET** `/api/service-status`

获取第三方服务状态。

### 缓存

**GET** `/api/cache`

获取缓存数据。

### 缓存遥测

**GET** `/api/cache-telemetry`

获取缓存遥测数据。

### AI 聊天

**POST** `/api/ai`

与 AI 聊天。

### FwdStart

**GET** `/api/fwdstart`

获取 FwdStart 通讯数据。

---

## 9. 服务状态 API

### 服务状态

**GET** `/api/service-status`

获取第三方服务状态。

### 缓存

**GET** `/api/cache`

获取缓存数据。

---

## 常用 API 端点汇总

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/rss-proxy` | GET | RSS 代理 |
| `/api/hackernews` | GET | Hacker News |
| `/api/stock-index` | GET | 股票指数 |
| `/api/stablecoin-markets` | GET | 稳定币 |
| `/api/polymarket` | GET | 预测市场 |
| `/api/opensky` | GET | 航班追踪 |
| `/api/fires` | GET | 野火数据 |
| `/api/risk-scores` | GET | 风险评分 |
| `/api/groq-summarize` | POST | AI 摘要 |
| `/api/reports` | GET | 报告列表 |
| `/api/tech-events` | GET | 科技事件 |

## 错误代码

| 代码 | 描述 |
|------|------|
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |
| 503 | 服务不可用 |
