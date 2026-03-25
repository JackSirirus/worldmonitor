# WorldMonitor AI 处理流程

## 概述

WorldMonitor 使用 AI 技术进行新闻摘要生成、新闻聚类和智能分析。本文档详细介绍这些 AI 功能的工作流程。

---

## 1. AI 摘要生成流程

### 1.1 处理架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI 摘要生成流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户请求 ──▶ 去重处理 ──▶ 缓存检查 ──▶ AI API ──▶ 返回结果    │
│     │            │            │           │                     │
│     ▼            ▼            ▼           ▼                     │
│  输入 headlines  Jaccard    Redis     Groq/OpenRouter         │
│     │         去重        24h TTL     /MiniMax                │
│     │                                                        │
│     ▼                                                        │
│  模式选择 (brief/analysis/summary)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 AI 服务提供商

WorldMonitor 按优先级使用以下 AI 服务：

| 优先级 | 提供商 | 模型 | 免费额度 | 特点 |
|--------|--------|------|---------|------|
| 1 | Groq | llama-3.1-8b-instant | 14,400/天 | 最快 |
| 2 | OpenRouter | llama-3.3-70b-instruct:free | 50/天 | 高质量 |
| 3 | MiniMax | - | - | 中文优化 |
| 4 | 浏览器端 | Xenova Transformers | 无限 | 无需 API |

### 1.3 摘要模式

#### Brief 模式 (默认)
- 生成 2-3 句话的新闻摘要
- 聚焦于发生了什么、在哪里发生
- 直接切入主题，不使用"突发新闻"等开场白

#### Analysis 模式
- 生成 2-3 句话的分析
- 关注趋势和影响
- 连接dots，指出风险

#### Summary 模式
- 最简洁的摘要
- 最多2句话
- 强调关键信息

### 1.4 Prompt 设计

#### 地缘政治版本 (world)

```
当前日期: {date}

用2-3句话概括关键发展。
规则:
- 以"什么发生在哪里"开头 - 要具体
- 永远不要以"突发新闻"、"晚上好"开头
- 直接切入主题: "伊朗政权...", "美国财政部..."
- 关键焦点是主要行为者 - 提及他们的名字
- 如果焦点显示新闻+信号 convergence，那是 lead
- 不要使用要点，不要元评论
```

#### 科技版本 (tech)

```
当前日期: {date}

用2-3句话概括关键科技/创业发展。
规则:
- 只关注科技、创业、AI、融资、产品发布或开发者新闻
- 忽略政治、贸易政策、关税、政府行动
- 以公司/产品/技术名称开头
- 直接开始: "OpenAI宣布...", "新的5000万B轮融资..."
- 不要要点，不要元评论
```

### 1.5 请求参数

```typescript
interface SummarizeRequest {
  headlines: string[];      // 新闻标题数组 (最多8条)
  mode?: 'brief' | 'analysis' | 'summary';  // 摘要模式
  geoContext?: string;      // 地理上下文
  variant?: 'world' | 'tech'; // 站点变体
}
```

### 1.6 响应格式

```typescript
interface SummarizeResponse {
  summary: string;         // 生成的摘要
  model: string;          // 使用的模型
  provider: 'groq' | 'openrouter' | 'cache';  // 提供商
  cached: boolean;        // 是否从缓存返回
  tokens?: number;        // 消耗的 token 数量
}
```

---

## 2. 新闻聚类流程

### 2.1 处理架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     新闻聚类流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RSS 新闻 ──▶ 去重 ──▶ 分词 ──▶ Jaccard 聚类 ──▶ 聚类结果    │
│     │          │         │           │                           │
│     ▼          ▼         ▼           ▼                           │
│  原始数据   相似度      倒排索引    0.5 阈值                   │
│  过滤       清洗                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 去重算法

使用基于词汇相似度的去重算法：

```typescript
function deduplicate(headlines) {
  const seen = new Set();
  const unique = [];

  for (const headline of headlines) {
    const normalized = normalize(headline);  // 转小写、去除标点
    const words = new Set(split(normalized).filter(w => w.length >= 4));

    let isDuplicate = false;
    for (const seenWords of seen) {
      // 计算相似度
      const similarity = intersection(words, seenWords) /
                         min(words.size, seenWords.size);
      if (similarity > 0.6) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(words);
      unique.push(headline);
    }
  }
  return unique;
}
```

### 2.3 聚类算法

使用 Jaccard 相似度和倒排索引优化：

```typescript
// 1. 构建倒排索引
const invertedIndex = new Map<string, number[]>();
for (const token of tokens) {
  const bucket = invertedIndex.get(token) || [];
  bucket.push(newsIndex);
  invertedIndex.set(token, bucket);
}

// 2. 对每条新闻找候选相似新闻
const candidateIndices = getCandidates(tokens, invertedIndex);

// 3. 计算相似度
for (const candidate of candidates) {
  const similarity = jaccardSimilarity(tokensA, tokensB);
  if (similarity >= 0.5) {
    cluster.push(candidate);
  }
}
```

### 2.4 聚类属性

每个聚类包含：

```typescript
interface Cluster {
  id: string;                    // 唯一标识
  primaryTitle: string;          // 主要标题 (最高优先级来源)
  primarySource: string;         // 主要来源
  primaryLink: string;          // 主要链接
  sourceCount: number;          // 来源数量
  topSources: Source[];          // Top 3 来源
  allItems: NewsItem[];         // 所有相关新闻
  firstSeen: Date;               // 首次发现时间
  lastUpdated: Date;            // 最后更新时间
  velocity?: { sourcesPerHour: number };  // 新闻速度
  threat?: ThreatClassification; // 威胁分类
  location?: { lat: number; lon: number }; // 地理位置
}
```

---

## 3. AI Agent 工作流程

### 3.1 Agent 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Agent 系统架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  调度器     │───▶│  任务执行   │───▶│  报告生成  │          │
│  │ Scheduler   │    │ Task Runner │    │ Reporter   │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                   │                   │                  │
│         ▼                   ▼                   ▼                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  RSS 收集   │    │ Web 搜索    │    │  数据库存储  │          │
│  │ Collector  │    │ Web Search  │    │  Storage   │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 核心任务

| 任务 | 描述 | 触发方式 |
|------|------|---------|
| RSS 收集 | 从配置的 RSS 源收集新闻 | 定时 (默认 30 分钟) |
| 报告生成 | 使用 AI 生成情报报告 | 定时 / 手动触发 |
| Web 搜索 | 执行网络搜索获取补充信息 | 按需 |
| 清理 | 清理过期数据和缓存 | 定时 |

### 3.3 报告生成流程

```typescript
// 报告生成流程
async function generateReport(category: string) {
  // 1. 收集相关 RSS 新闻
  const news = await collectRSS(category);

  // 2. 使用 AI 总结关键信息
  const summary = await aiSummarize(news.headlines, {
    mode: 'analysis',
    variant: getVariant()
  });

  // 3. 提取关键实体
  const entities = extractEntities(news.items);

  // 4. 生成报告
  const report = {
    title: generateTitle(category, entities),
    content: summary,
    category,
    created_at: new Date(),
    entities
  };

  // 5. 存储到数据库
  await saveReport(report);

  return report;
}
```

### 3.4 报告分类

| 分类 | 描述 | 生成频率 |
|------|------|---------|
| tech | 科技行业报告 | 按需 |
| world | 地缘政治报告 | 按需 |
| weekly | 周报 | 每周 |

### 3.5 任务依赖

```
RSS 收集 ──┬──▶ 报告生成 ──▶ 存储
           │
           └──▶ Web 搜索 ──▶ 补充信息
```

---

## 4. ML 推理 (浏览器端)

### 4.1 ONNX Runtime Web

WorldMonitor 使用 ONNX Runtime Web 在浏览器端进行 ML 推理：

```typescript
// 加载模型
import { pipeline } from '@xenova/transformers';

// 情感分析
const sentiment = await pipeline('sentiment-analysis');
const result = await sentiment(text);

// 命名实体识别
const ner = await pipeline('ner');
const entities = await ner(text);
```

### 4.2 Web Worker 优化

ML 推理在 Web Worker 中运行，避免阻塞主线程：

```typescript
// 在 Worker 中处理
self.onmessage = async (event) => {
  const { text, task } = event.data;

  // 执行 ML 任务
  const result = await mlPipeline[task](text);

  // 返回结果
  self.postMessage({ result });
};
```

---

## 5. 数据缓存策略

### 5.1 缓存层级

| 层级 | 存储 | TTL | 用途 |
|------|------|-----|------|
| L1 | 内存 | 请求内 | 当前会话数据 |
| L2 | Redis | 10分钟 - 24小时 | 跨用户共享 |
| L3 | 浏览器 | 刷新 | 用户本地缓存 |

### 5.2 缓存键设计

```typescript
// 风险评分缓存
const CACHE_KEY = 'risk:scores:v2';

// AI 摘要缓存 (基于内容hash)
const cacheKey = `summary:${version}:${variant}:${hash(headlines)}:${geoContext}`;
```

### 5.3 缓存回退

当 API 不可用时：

```
API 请求失败
    │
    ▼
检查 Redis 缓存 ──▶ 有 ──▶ 返回缓存数据
    │
    无
    │
    ▼
检查本地回退数据 ──▶ 返回基准值
```
