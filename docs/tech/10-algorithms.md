# WorldMonitor 评分算法详解

## 概述

WorldMonitor 使用多种评分算法来量化地缘政治风险、市场情绪和技术准备度。本文档详细介绍这些算法的工作原理。

---

## 1. 地缘政治风险评分 (CII)

### 1.1 算法概述

CII (Country Intelligence Index) 评分算法综合考虑以下因素：

- **基础风险** (Baseline Risk): 各国固有的地缘政治风险
- **动荡指数** (Unrest): 抗议和骚乱活动的频率
- **安全指数** (Security): 暴力事件对安全的威胁
- **信息指数** (Information): 事件相关新闻覆盖量

### 1.2 评分等级

| 等级 | 分数范围 | 描述 |
|------|---------|------|
| Critical | 70-100 | 严重危机，可能发生重大事件 |
| High | 55-69 | 高风险，政治不稳定 |
| Elevated | 40-54 | 风险升高，需要关注 |
| Normal | 25-39 | 正常风险水平 |
| Low | 0-24 | 低风险 |

### 1.3 计算公式

```typescript
// 综合评分 = 基础风险 + 加权动荡因子
composite = baseline + (unrest * 0.4 + security * 0.35 + information * 0.25) * 0.5

// 各因子计算
unrest = (protests + riots * 2) * multiplier * 2  // 骚乱权重为抗议的2倍
security = baseline + riots * multiplier * 5
information = totalEvents * multiplier * 3
```

### 1.4 基础风险值 (0-50)

| 国家 | 基础风险 | 国家 | 基础风险 |
|------|---------|------|---------|
| 美国 | 5 | 以色列 | 45 |
| 俄罗斯 | 35 | 台湾 | 30 |
| 中国 | 25 | 朝鲜 | 45 |
| 乌克兰 | 50 | 沙特阿拉伯 | 20 |
| 伊朗 | 40 | 土耳其 | 25 |
| 波兰 | 10 | 德国 | 5 |
| 法国 | 10 | 英国 | 5 |
| 印度 | 20 | 巴基斯坦 | 35 |
| 叙利亚 | 50 | 也门 | 50 |
| 缅甸 | 45 | 委内瑞拉 | 40 |

### 1.5 事件乘数 (Event Multiplier)

不同国家对事件的敏感度不同：

```typescript
const EVENT_MULTIPLIER = {
  US: 0.3,    // 美国：对新闻反应较低
  RU: 2.0,    // 俄罗斯：敏感度高
  CN: 2.5,    // 中国：高度敏感
  KP: 3.0,    // 朝鲜：极度敏感
  // ...
};
```

---

## 2. 战略风险评分 (Strategic Risk)

### 2.1 计算方法

战略风险评分基于前5个CII评分国家的加权平均：

```typescript
// Top 5 国家权重
const weights = [1.0, 0.85, 0.70, 0.55, 0.40];
const totalWeight = 3.5;

// 加权平均
const ciiComponent = weightedSum / totalWeight;

// 战略风险 = 70% CII + 30% 基础值
const strategicRisk = ciiComponent * 0.7 + 15;
```

### 2.2 贡献国家

显示对全球战略风险贡献最大的前5个国家及其评分。

---

## 3. 新闻聚类算法

### 3.1 Jaccard 相似度

使用 Jaccard 相似度算法对新闻进行聚类：

```typescript
// Jaccard 相似度 = |A ∩ B| / |A ∪ B|
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
```

### 3.2 分词处理

1. **转小写**
2. **去除标点符号**
3. **去除停用词** (the, a, an, of, etc.)
4. **保留4字符以上的词**

### 3.3 聚类流程

```
1. 对每条新闻标题进行分词
2. 构建倒排索引 (token → news indices)
3. 对每条新闻，找出候选相似新闻
4. 计算 Jaccard 相似度
5. 如果相似度 >= 阈值 (0.5)，归入同一簇
```

### 3.4 相似度阈值

| 阈值 | 效果 |
|------|------|
| 0.3 | 更宽松，可能合并不相关内容 |
| 0.5 | 平衡 (推荐) |
| 0.7 | 更严格，可能遗漏相关内容 |

---

## 4. 预测市场关联信号

### 4.1 信号类型

| 信号类型 | 描述 | 检测条件 |
|---------|------|---------|
| prediction_leads_news | 预测市场领先新闻 | 预测价格变动 > 10%，但无相关新闻 |
| news_leads_markets | 新闻预示市场变动 | 新闻热度上升 + 市场变动 > 3% |
| velocity_spike | 新闻速度激增 | 新闻发布速度突然加快 |
| convergence | 多源 convergence | 同一事件在多个信息源出现 |
| geo_convergence | 地理 convergence | 地理相关事件与市场/预测市场 convergence |

### 4.2 阈值配置

```typescript
const PREDICTION_SHIFT_THRESHOLD = 0.1;    // 10% 预测价格变动
const MARKET_MOVE_THRESHOLD = 0.03;        // 3% 市场变动
const NEWS_VELOCITY_THRESHOLD = 2.0;      // 2倍平均速度
```

---

## 5. 缓存策略

### 5.1 缓存时间

| 数据类型 | TTL | 说明 |
|---------|-----|------|
| 风险评分 | 10 分钟 | 实时性要求高 |
| AI 摘要 | 24 小时 | 内容相对稳定 |
| 新闻聚类 | 5 分钟 | 需要实时更新 |

### 5.2 回退机制

当数据源不可用时：
1. 首先尝试返回 Redis 缓存
2. 如果缓存不存在，返回基础评分（无外部数据）
3. 基础评分只包含基准风险值

---

## 6. 数据源

### 6.1 主要数据源

| 数据源 | 用途 | 更新频率 |
|--------|------|---------|
| ACLED | 冲突与抗议数据 | 每日 |
| GDELT | 全球事件数据 | 实时 |
| RSS 订阅 | 新闻聚合 | 15 分钟 |
| Polymarket | 预测市场 | 实时 |

### 6.2 新闻源分级

| 级别 | 来源 | 权重 |
|------|------|------|
| Tier 1 | 政府官方 (White House, Kremlin) | 最高 |
| Tier 2 | 主流媒体 (Reuters, AP) | 高 |
| Tier 3 | 专业媒体 (FT, WSJ) | 中 |
| Tier 4 | 其他来源 | 低 |
