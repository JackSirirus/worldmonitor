# World Monitor
# World Monitor 世界监控

**Real-time global intelligence dashboard** — AI-powered news aggregation, geopolitical monitoring, and infrastructure tracking in a unified situational awareness interface.
**实时全球情报仪表板** — 人工智能驱动的新闻聚合、地缘政治监控和基础设施追踪，集成于统一态势感知界面。

[![GitHub stars](https://img.shields.io/github/stars/JackSirirus/worldmonitor?style=social)](https://github.com/JackSirirus/worldmonitor/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/JackSirirus/worldmonitor?style=social)](https://github.com/JackSirirus/worldmonitor/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Last commit](https://img.shields.io/github/last-commit/JackSirirus/worldmonitor)](https://github.com/JackSirirus/worldmonitor/commits/main)

<p align="center">
  <a href="https://worldmonitor.app"><strong>Live Demo</strong></a> &nbsp;·&nbsp;
  <a href="https://worldmonitor.app"><strong>在线演示</strong></a> &nbsp;·&nbsp;
  <a href="https://tech.worldmonitor.app"><strong>Tech Variant</strong></a> &nbsp;·&nbsp;
  <a href="https://tech.worldmonitor.app"><strong>Tech 版本</strong></a> &nbsp;·&nbsp;
  <a href="./docs/tech/00-index.md"><strong>Full Documentation</strong></a>
  <a href="./docs/tech/00-index.md"><strong>完整文档</strong></a>
</p>

![World Monitor Dashboard](new-world-monitor.png)

---

## Why World Monitor?
## 为什么选择 World Monitor？

| Problem 问题 | Solution 解决方案 |
|---------|----------|
| News scattered across 100+ sources 新闻分散在 100+ 个来源 | **Single unified dashboard** 统一仪表板 with 100+ curated feeds 整合 100+ 精选信息源 |
| No geospatial context for events 事件缺乏地理空间上下文 | **Interactive map** 交互式地图 with 25+ toggleable data layers 包含 25+ 可切换数据层 |
| Information overload 信息过载 | **AI-synthesized briefs** AI 合成简报 with focal point detection 配备焦点检测 |
| Crypto/macro signal noise 加密/宏观信号噪音 | **7-signal market radar** 7 信号市场雷达 with composite BUY/CASH verdict 给出综合买入/持有判断 |
| Expensive OSINT tools ($$$) 昂贵的开源情报工具 | **100% free & open source** 100% 免费开源 |
| Static news feeds 静态新闻订阅 | **Real-time updates** 实时更新 with live video streams 搭配直播视频流 |

---

## Live Demos
## 在线演示

| Variant 版本 | URL 网址 | Focus 关注领域 |
|---------|-----|-------|
| **World Monitor** | [worldmonitor.app](https://worldmonitor.app) | Geopolitics, military, conflicts, infrastructure 地缘政治、军事、冲突、基础设施 |
| **Tech Monitor** | [tech.worldmonitor.app](https://tech.worldmonitor.app) | Startups, AI/ML, cloud, cybersecurity 初创公司、AI/ML、云、网络安全 |

Both variants run from a single codebase — switch between them with one click.
两个版本共用一个代码库 — 只需点击一次即可切换。

---

## Key Features
## 核心功能

### Interactive Global Map
### 交互式全球地图
- **25+ data layers** — conflicts, military bases, nuclear facilities, undersea cables, pipelines, satellite fire detection, protests, natural disasters, datacenters, and more
- **25+ 数据层** — 冲突、军事基地、核设施、海底电缆、管道、卫星火灾探测、抗议、自然灾害、数据中心等
- **Smart clustering** — markers intelligently group at low zoom, expand on zoom in
- **智能聚合** — 标记在低缩放级别时智能分组，放大时展开
- **Progressive disclosure** — detail layers (bases, nuclear, datacenters) appear only when zoomed in; zoom-adaptive opacity prevents clutter at world view
- **渐进式展开** — 详细图层（基地、核设施、数据中心）仅在放大时显示；世界视图下自适应透明度防止杂乱
- **Label deconfliction** — overlapping labels (e.g., multiple BREAKING badges) are automatically suppressed by priority, highest-severity first
- **标签解冲突** — 重叠标签（如多个 BREAKING 徽章）按优先级自动抑制，高严重性优先
- **8 regional presets** — Global, Americas, Europe, MENA, Asia, Africa, Oceania, Latin America
- **8 个区域预设** — 全球、美洲、欧洲、中东北非、亚洲、非洲、大洋洲、拉丁美洲
- **Time filtering** — 1h, 6h, 24h, 48h, 7d event windows
- **时间过滤** — 1小时、6小时、24小时、48小时、7天事件窗口

### AI-Powered Intelligence
### AI 驱动情报
- **World Brief** — LLM-synthesized summary of top global developments (Groq Llama 3.1, Redis-cached)
- **全球简报** — LLM 合成的全球重大事件摘要（Groq Llama 3.1，Redis 缓存）
- **Hybrid Threat Classification** — instant keyword classifier with async LLM override for higher-confidence results
- **混合威胁分类** — 即时关键词分类器，带异步 LLM 覆盖以获得更高置信度结果
- **Focal Point Detection** — correlates entities across news, military activity, protests, outages, and markets to identify convergence
- **焦点检测** — 跨新闻、军事活动、抗议、停电和市场关联实体以识别聚合
- **Country Instability Index** — real-time stability scores for 20 monitored nations using weighted multi-signal blend
- **国家不稳定指数** — 使用加权多信号混合对 20 个受监控国家进行实时稳定性评分
- **Strategic Posture Assessment** — composite risk score combining all intelligence modules with trend detection
- **战略姿态评估** — 结合趋势检测的综合风险评分，融合所有情报模块

### Real-Time Data Layers
### 实时数据层

<details>
<summary><strong>Geopolitical</strong></summary>

- Active conflict zones with escalation tracking
- 带升级追踪的活跃冲突区域
- Intelligence hotspots with news correlation
- 带新闻关联的情报热点
- Social unrest events (ACLED + GDELT)
- 社会动荡事件 (ACLED + GDELT)
- Sanctions regimes
- 制裁制度
- Weather alerts and severe conditions
- 天气警报和恶劣条件

</details>

<details>
<summary><strong>Military & Strategic</strong></summary>

- 220+ military bases from 9 operators
- 来自 9 个运营方的 220+ 军事基地
- Live military flight tracking (ADS-B)
- 实时军事飞行追踪 (ADS-B)
- Naval vessel monitoring (AIS)
- 海军舰船监测 (AIS)
- Nuclear facilities & gamma irradiators
- 核设施和伽马辐照器
- APT cyber threat actor attribution
- APT 网络威胁行为者归因
- Spaceports & launch facilities
- 航天中心和发射设施

</details>

<details>
<summary><strong>Infrastructure</strong></summary>

- Undersea cables with landing points
- 带登陆点的海底电缆
- Oil & gas pipelines
- 油气管道
- AI datacenters (111 major clusters)
- AI 数据中心（111 个主要集群）
- Internet outages (Cloudflare Radar)
- 互联网中断 (Cloudflare Radar)
- Critical mineral deposits
- 关键矿物矿床
- NASA FIRMS satellite fire detection (VIIRS thermal hotspots)
- NASA FIRMS 卫星火灾探测 (VIIRS 热热点)

</details>

<details>
<summary><strong>Market & Crypto Intelligence</strong></summary>

- 7-signal macro radar with composite BUY/CASH verdict
- 7 信号宏观雷达，综合买入/卖出判断
- BTC spot ETF flow tracker (IBIT, FBTC, GBTC, and 7 more)
- BTC 现货 ETF 资金流向追踪器 (IBIT, FBTC, GBTC 等 7 支)
- Stablecoin peg health monitor (USDT, USDC, DAI, FDUSD, USDe)
- 稳定币锚定健康监测 (USDT, USDC, DAI, FDUSD, USDe)
- Fear & Greed Index with 30-day history
- 恐惧与贪婪指数，30 天历史
- Bitcoin technical trend (SMA50, SMA200, VWAP, Mayer Multiple)
- 比特币技术趋势 (SMA50, SMA200, VWAP, Mayer 倍数)
- JPY liquidity signal, QQQ/XLP macro regime, BTC hash rate
- 日元流动性信号、QQQ/XLP 宏观状态、比特币哈希率
- Inline SVG sparklines and donut gauges for visual trends
- 内联 SVG 迷你图和环形仪表，直观展示趋势

</details>

<details>
<summary><strong>Tech Ecosystem</strong> (Tech variant)</summary>

- Tech company HQs (Big Tech, unicorns, public)
- 科技公司总部（大型科技、独角兽、上市公司）
- Startup hubs with funding data
- 创业中心及融资数据
- Cloud regions (AWS, Azure, GCP)
- 云区域 (AWS, Azure, GCP)
- Accelerators (YC, Techstars, 500)
- 孵化器 (YC, Techstars, 500)
- Upcoming tech conferences
- 即将举办的科技会议

</details>

### Live News & Video
### 实时新闻与视频
- **100+ RSS feeds** across geopolitics, defense, energy, tech
- **100+ RSS 订阅源**，涵盖地缘政治、国防、能源、科技
- **Live video streams** — Bloomberg, Sky News, Al Jazeera, CNBC, and more
- **直播视频流** — Bloomberg、Sky News、Al Jazeera、CNBC 等
- **Custom monitors** — Create keyword-based alerts for any topic
- **自定义监控** — 为任意主题创建基于关键词的提醒
- **Entity extraction** — Auto-links countries, leaders, organizations
- **实体提取** — 自动关联国家、领导人、组织

### Signal Aggregation & Anomaly Detection
### 信号聚合与异常检测
- **Multi-source signal fusion** — internet outages, military flights, naval vessels, protests, AIS disruptions, and satellite fires are aggregated into a unified intelligence picture with per-country and per-region clustering
- **多源信号融合** — 互联网中断、军事飞行、舰船、抗议、AIS 中断和卫星火灾聚合为统一情报画面，按国家和区域聚类
- **Temporal baseline anomaly detection** — Welford's online algorithm computes streaming mean/variance per event type, region, weekday, and month over a 90-day window. Z-score thresholds (1.5/2.0/3.0) flag deviations like "Military flights 3.2x normal for Thursday (January)" — stored in Redis via Upstash
- **时序基线异常检测** — Welford 在线算法计算 90 天窗口内每种事件类型、区域、星期几和月份的流式均值/方差。Z 分数阈值 (1.5/2.0/3.0) 标记偏差，如"1 月周四军事飞行 3.2 倍正常"— 通过 Upstash 存储在 Redis 中
- **Regional convergence scoring** — when multiple signal types spike in the same geographic area, the system identifies convergence zones and escalates severity
- **区域收敛评分** — 当多种信号类型在同一地理区域激增时，系统识别收敛区域并升级严重性

### Story Sharing & Social Export
### 故事分享与社交导出
- **Shareable intelligence stories** — generate country-level intelligence briefs with CII scores, threat counts, theater posture, and related prediction markets
- **可分享的情报故事** — 生成国家级情报简报，包含 CII 分数、威胁数量、战区态势和相关预测市场
- **Multi-platform export** — custom-formatted sharing for Twitter/X, LinkedIn, WhatsApp, Telegram, Reddit, and Facebook with platform-appropriate formatting
- **多平台导出** — 为 Twitter/X、LinkedIn、WhatsApp、Telegram、Reddit 和 Facebook 定格式化分享
- **Deep links** — every story generates a unique URL (`/story?c=<country>&t=<type>`) with dynamic Open Graph meta tags for rich social previews
- **深度链接** — 每个故事生成唯一网址 (`/story?c=<country>&t=<type>`)，带动态 Open Graph 元标签，实现丰富的社交预览
- **Canvas-based image generation** — stories render as PNG images for visual sharing, with QR codes linking back to the live dashboard
- **基于 Canvas 的图片生成** — 故事渲染为 PNG 图片用于视觉分享，带二维码链接回实时仪表板

### Additional Capabilities
### 附加功能
- Signal intelligence with "Why It Matters" context
- 带"为何重要"背景的情报信号
- Infrastructure cascade analysis with proximity correlation
- 基础设施级联分析与邻近关联
- Maritime & aviation tracking with surge detection
- 海上和航空追踪与激增检测
- Prediction market integration (Polymarket) as leading indicators
- 预测市场整合 (Polymarket) 作为领先指标
- Service status monitoring (cloud providers, AI services)
- 服务状态监控（云提供商、AI 服务）
- Shareable map state via URL parameters (view, zoom, coordinates, time range, active layers)
- 通过网址参数分享地图状态（视图、缩放、坐标、时间范围、活跃图层）
- Data freshness monitoring across 14 data sources with explicit intelligence gap reporting
- 14 个数据源的数据新鲜度监控，明确报告情报缺口
- Per-feed circuit breakers with 5-minute cooldowns to prevent cascading failures
- 每订阅源断路器，5 分钟冷却时间防止级联故障
- Browser-side ML worker (Transformers.js) for NER and sentiment analysis without server dependency
- 浏览器端 ML 工作器 (Transformers.js)，用于命名实体识别和情感分析，无需服务器依赖
- **Cmd+K search** — fuzzy search across news headlines, countries, and entities
- **Cmd+K 搜索** — 模糊搜索新闻标题、国家和实体
- **Virtual scrolling** — news panels render only visible DOM elements, handling thousands of items without browser lag
- **虚拟滚动** — 新闻面板仅渲染可见 DOM 元素，处理数千条内容无浏览器延迟
- **Mobile detection** — screens below 768px receive a warning modal since the dashboard is designed for multi-panel desktop use
- **移动端检测** — 低于 768px 的屏幕显示警告弹窗，因为仪表板专为多面板桌面使用设计
- **UCDP conflict classification** — countries with active wars (1,000+ battle deaths/year) receive automatic CII floor scores, preventing optimistic drift
- **UCDP 冲突分类** — 有活跃战争的国家（每年 1,000+ 战斗死亡）自动获得 CII 地板分数，防止乐观漂移
- **HAPI humanitarian data** — UN OCHA humanitarian access metrics feed into country-level instability scoring
- **HAPI 人道主义数据** — 联合国人道主义事务协调厅人道主义准入指标纳入国家级不稳定评分

---

## How It Works
## 工作原理

### Threat Classification Pipeline
### 威胁分类流水线

Every news item passes through a two-stage classification pipeline:
每条新闻都经过两阶段分类流水线：

1. **Keyword classifier** (instant) — pattern-matches against ~120 threat keywords organized by severity tier (critical → high → medium → low → info) and category (conflict, terrorism, cyber, disaster, etc.). Returns immediately with a confidence score.
1. **关键词分类器**（即时）— 按严重程度层级（critical → high → medium → low → info）和类别（冲突、恐怖主义、网络、灾难等）组织的大约 120 个威胁关键词进行模式匹配。立即返回置信度分数。
2. **LLM classifier** (async) — fires in the background via a Vercel Edge Function calling Groq's Llama 3.1 8B at temperature 0. Results are cached in Redis (24h TTL) keyed by headline hash. When the LLM result arrives, it overrides the keyword result only if its confidence is higher.
2. **LLM 分类器**（异步）— 通过 Vercel 边缘函数调用 Groq 的 Llama 3.1 8B（temperature 0）在后台触发。结果在 Redis 中按标题哈希键缓存（24 小时 TTL）。当 LLM 结果到达时，只有在置信度更高时才会覆盖关键词结果。

This hybrid approach means the UI is never blocked waiting for AI — users see keyword results instantly, with LLM refinements arriving within seconds and persisting for所有后续访问者。
这种混合方法意味着 UI 永远不会被 AI 阻塞 — 用户立即看到关键词结果，LLM 优化在几秒内到达并对所有后续访问者持久化。

### Country Instability Index (CII)
### 国家不稳定指数 (CII)

Each monitored country receives a real-time instability score (0–100) computed from:
每个受监控国家收到实时不稳定分数 (0–100)，计算方式如下：

| Component 组件 | Weight 权重 | Details 详情 |
|-----------|--------|---------|
| **Baseline risk** 基线风险 | 40% | Pre-configured per country reflecting structural fragility 预先配置，反映每个国家的结构性脆弱性 |
| **Unrest events** 动荡事件 | 20% | Protests scored logarithmically for democracies (routine protests don't trigger), linearly for authoritarian states (every protest is significant). Boosted for fatalities and internet outages 民主国家抗议按对数评分，威权国家按线性评分。死亡人数和互联网中断时加分 |
| **Security activity** 安全活动 | 20% | Military flights (3pts) + vessels (5pts) from own forces + foreign military presence (doubled weight) 军事飞行（3分）+ 本国舰船（5分）+ 外国军事存在（权重翻倍） |
| **Information velocity** 信息速度 | 20% | News mention frequency weighted by event severity multiplier, log-scaled for high-volume countries 新闻提及频率按事件严重性倍数加权，高容量国家按对数缩放 |

Additional boosts apply for hotspot proximity, focal point urgency, and conflict-zone floors (e.g., Ukraine is pinned at ≥55, Syria at ≥50).
额外的加分适用于热点接近度、焦点紧急性和冲突区地板（例如，乌克兰固定在 ≥55，叙利亚固定在 ≥50）。

### Hotspot Escalation Scoring
### 热点升级评分

Intelligence hotspots receive dynamic escalation scores blending four normalized signals (0–100):
情报热点接收动态升级评分，融合四个归一化信号 (0–100)：

- **News activity** (35%) — article count and severity in the hotspot's area
- **新闻活动** (35%) — 热点地区的文章数量和严重程度
- **Country instability** (25%) — CII score of the host country
- **国家不稳定** (25%) — 所在国家的 CII 分数
- **Geo-convergence alerts** (25%) — spatial binning detects 3+ event types (protests + military + earthquakes) co-occurring within 1° lat/lon cells
- **地理收敛警报** (25%) — 空间分箱检测 3+ 种事件类型（抗议 + 军事 + 地震）在 1° 经纬度单元格内同时发生
- **Military activity** (15%) — vessel clusters and flight density near the hotspot
- **军事活动** (15%) — 热点附近的舰船集群和飞行密度

The system blends static baseline risk (40%) with detected events (60%) and tracks trends via linear regression on 48-hour history. Signal emissions cool down for 2 hours to prevent alert fatigue.
系统将静态基线风险 (40%) 与检测到的事件 (60%) 混合，并通过 48 小时历史的线性回归跟踪趋势。信号发射冷却 2 小时以防止警报疲劳。

### Geographic Convergence Detection
### 地理收敛检测

Events (protests, military flights, vessels, earthquakes) are binned into 1°×1° geographic cells within a 24-hour window. When 3+ distinct event types converge in one cell, a convergence alert fires. Scoring is based on type diversity (×25pts per unique type) plus event count bonuses (×2pts). Alerts are reverse-geocoded to human-readable names using conflict zones, waterways, and hotspot databases.
事件（抗议、军事飞行、舰船、地震）在 24 小时窗口内分箱到 1°×1° 地理单元格。当 3+ 种不同事件类型在一个单元格内收敛时，触发收敛警报。评分基于类型多样性（每种独特类型 ×25 分）加上事件数量奖励（×2 分）。警报使用冲突区、水道和热点数据库反向地理编码为人类可读的名称。

### Strategic Theater Posture Assessment
### 战略战区态势评估

Nine operational theaters are continuously assessed for military posture escalation:
九个作战战区持续评估军事态势升级：

| Theater 战区 | Key Trigger 关键触发因素 |
|---------|-------------|
| Iran / Persian Gulf 伊朗/波斯湾 | Carrier groups, tanker activity, AWACS 航母编队、油轮活动、预警机 |
| Taiwan Strait 台湾海峡 | PLAAF sorties, USN carrier presence 空军出击、美军航母存在 |
| Baltic / Kaliningrad 波罗的海/加里宁格勒 | Russian Western Military District flights 俄罗斯西部军区飞行 |
| Korean Peninsula 朝鲜半岛 | B-52/B-1 deployments, DPRK missile activity B-52/B-1 部署、朝鲜导弹活动 |
| Eastern Mediterranean 东地中海 | Multi-national naval exercises 多国海军演习 |
| Horn of Africa 非洲之角 | Anti-piracy patrols, drone activity 反海盗巡逻、无人机活动 |
| South China Sea 南海 | Freedom of navigation operations 航行自由行动 |
| Arctic 北极 | Long-range aviation patrols 远程航空巡逻 |
| Black Sea 黑海 | ISR flights, naval movements 情报监视侦察飞行、舰船移动 |

Posture levels escalate from NORMAL → ELEVATED → CRITICAL based on a composite of:
态势级别从 NORMAL → ELEVATED → CRITICAL 升级，基于以下综合因素：
- **Aircraft count** in theater (both resident and transient)
- **战区飞机数量**（常驻和临时）
- **Strike capability** — the presence of tankers + AWACS + fighters together indicates strike packaging, not routine training
- **打击能力** — 加油机 + 预警机 + 战斗机同时存在表明是打击编队，而非常规训练
- **Naval presence** — carrier groups and combatant formations
- **海军存在** — 航母编队和战斗编队
- **Country instability** — high CII scores for theater-adjacent countries amplify posture
- **国家不稳定** — 战区邻国的高 CII 分数放大态势

Each theater is linked to 38+ military bases, enabling automatic correlation between observed flights and known operating locations.

### Military Surge & Foreign Presence Detection
### 军事激增与外国存在检测

The system monitors five operational theaters (Middle East, Eastern Europe, Western Europe, Western Pacific, Horn of Africa) with 38+ associated military bases. It classifies vessel clusters near hotspots by activity type:
系统监控五个作战战区（中东、东欧、西欧、西太平洋、非洲之角）及 38+ 个相关军事基地。它按活动类型对热点附近的舰船集群进行分类：

- **Deployment** — carrier present with 5+ vessels
- **部署** — 航母存在且有 5+ 艘舰船
- **Exercise** — combatants present in formation
- **演习** — 战斗人员列队
- **Transit** — vessels passing through
- **过境** — 舰船通过

Foreign military presence is dual-credited: the operator's country is flagged for force projection, and the host location's country is flagged for foreign military threat. AIS gaps (dark ships) are flagged as potential signal discipline indicators.
外国军事存在双向计分：运营商所在国标记为力量投射，所在位置所在国标记为外国军事威胁。AIS 间隙（暗船）标记为潜在信号纪律指标。

### Infrastructure Cascade Modeling
### 基础设施级联建模

Beyond proximity correlation, the system models how disruptions propagate through interconnected infrastructure. A dependency graph connects undersea cables, pipelines, ports, chokepoints, and countries with weighted edges representing capacity dependencies:

```
Disruption Event → Affected Node → Cascade Propagation (BFS, depth ≤ 3)
                                          │
                    ┌─────────────────────┤
                    ▼                     ▼
            Direct Impact         Indirect Impact
         (e.g., cable cut)    (countries served by cable)
```

**Impact calculation**: `strength = edge_weight × disruption_level × (1 − redundancy)`
**影响计算**：`strength = edge_weight × disruption_level × (1 − redundancy)`

Strategic chokepoint modeling captures real-world dependencies:
战略咽喉要道建模捕捉现实世界依赖关系：
- **Strait of Hormuz** — 80% of Japan's oil, 70% of South Korea's, 60% of India's, 40% of China's
- **霍尔木兹海峡** — 日本 80%、韩国 70%、印度 60%、中国 40% 的石油
- **Suez Canal** — EU-Asia trade routes (Germany, Italy, UK, China)
- **苏伊士运河** — 欧亚贸易路线（德国、意大利、英国、中国）
- **Malacca Strait** — 80% of China's oil transit
- **马六甲海峡** — 中国 80% 的石油运输

Ports are weighted by type: oil/LNG terminals (0.9 — critical), container ports (0.7), naval bases (0.4 — geopolitical but less economic). This enables questions like "if the Strait of Hormuz closes, which countries face energy shortages within 30 days?"
港口按类型加权：油/LNG 码头（0.9 — 关键）、集装箱港口（0.7）、海军基地（0.4 — 地缘政治但经济性较低）。这使得能够回答"如果霍尔木兹海峡关闭，哪些国家在 30 天内面临能源短缺？"这样的问题。

### Related Assets & Proximity Correlation
### 相关资产与邻近关联

When a news event is geo-located, the system automatically identifies critical infrastructure within a 600km radius — pipelines, undersea cables, data centers, military bases, and nuclear facilities — ranked by distance. This enables instant geopolitical context: a cable cut near a strategic chokepoint, a protest near a nuclear facility, or troop movements near a data center cluster.
当新闻事件被地理定位时，系统自动识别 600 公里半径内的关键基础设施 — 管道、海底电缆、数据中心、军事基地和核设施 — 按距离排序。这能够提供即时地缘政治背景：战略咽喉要道附近的电缆切断、核设施附近的抗议或数据中心集群附近的军队移动。

### News Geo-Location
### 新闻地理定位

A 74-hub strategic location database infers geography from headlines via keyword matching. Hubs span capitals, conflict zones, strategic chokepoints (Strait of Hormuz, Suez Canal, Malacca Strait), and international organizations. Confidence scoring is boosted for critical-tier hubs and active conflict zones, enabling map-driven news placement without requiring explicit location metadata from RSS feeds.
74 个中心战略位置数据库通过关键词匹配从标题推断地理位置。中心包括首都、冲突区、战略咽喉要道（霍尔木兹海峡、苏伊士运河、马六甲海峡）和国际组织。关键层级中心和活跃冲突区的置信度评分提升，实现地图驱动的新闻放置，无需从 RSS 订阅源获取明确的地理位置元数据。

### Temporal Baseline Anomaly Detection
### 时序基线异常检测

Rather than relying on static thresholds, the system learns what "normal" looks like and flags deviations. Each event type (military flights, naval vessels, protests, news velocity, AIS gaps, satellite fires) is tracked per region with separate baselines for each weekday and month — because military activity patterns differ on Tuesdays vs. weekends, and January vs. July.
系统不依赖静态阈值，而是学习"正常"的样子并标记偏差。每种事件类型（军事飞行、海军舰船、抗议、新闻速度、AIS 间隙、卫星火灾）按区域跟踪，每个工作日和月份有单独的基线 — 因为军事活动模式在周二与周末、1 月与 7 月有所不同。

The algorithm uses **Welford's online method** for numerically stable streaming computation of mean and variance, stored in Redis with a 90-day rolling window. When a new observation arrives, its z-score is computed against the learned baseline. Thresholds:
算法使用 **Welford 在线方法** 进行数值稳定的流式均值和方差计算，在 Redis 中存储 90 天滚动窗口。当新观察到达时，根据学习的基线计算其 Z 分数。阈值：

| Z-Score | Severity 严重程度 | Example 示例 |
|---------|----------|---------|
| ≥ 1.5 | Low 低 | Slightly elevated protest activity 略微升高的抗议活动 |
| ≥ 2.0 | Medium 中 | Unusual naval presence 异常的海军存在 |
| ≥ 3.0 | High/Critical 高/关键 | Military flights 3x above baseline 军事飞行是基线的 3 倍 |

A minimum of 10 historical samples is required before anomalies are reported, preventing false positives during the learning phase. Anomalies are ingested back into the signal aggregator, where they compound with other signals for convergence detection.
需要至少 10 个历史样本才报告异常，防止学习阶段误报。异常被重新纳入信号聚合器，在那里与其他信号复合用于收敛检测。

### Browser-Side ML Pipeline
### 浏览器端 ML 流水线

The dashboard runs a full ML pipeline in the browser via Transformers.js, with no server dependency for core intelligence. This is automatically disabled on mobile devices to conserve memory.
仪表板通过 Transformers.js 在浏览器中运行完整的 ML 流水线，核心情报无需服务器依赖。这在移动设备上自动禁用以节省内存。

| Capability 功能 | Model 模型 | Use 用途 |
|-----------|-------|-----|
| **Text embeddings** 文本嵌入 | sentence-similarity | Semantic clustering of news headlines 新闻标题的语义聚类 |
| **Sequence classification** 序列分类 | threat-classifier | Threat severity and category detection 威胁严重程度和类别检测 |
| **Summarization** 摘要 | T5-small | Fallback when Groq and OpenRouter are unavailable Groq 和 OpenRouter 不可用时的备选 |
| **Named Entity Recognition** 命名实体识别 | NER pipeline | Country, organization, and leader extraction 国家、组织和领导人提取 |

**Hybrid clustering** combines fast Jaccard similarity (n-gram overlap, threshold 0.4) with ML-refined semantic similarity (cosine similarity, threshold 0.78). Jaccard runs instantly on every refresh; semantic refinement runs when the ML worker is loaded and merges clusters that are textually different but semantically identical (e.g., "NATO expands missile shield" and "Alliance deploys new air defense systems").
**混合聚类**结合快速 Jaccard 相似度（n-gram 重叠，阈值 0.4）与 ML 优化的语义相似度（余弦相似度，阈值 0.78）。Jaccard 在每次刷新时即时运行；语义优化在 ML 工作器加载时运行，合并文本不同但语义相同的聚类（例如"NATO expands missile shield"和"Alliance deploys new air defense systems"）。

News velocity is tracked per cluster — when multiple Tier 1–2 sources converge on the same story within a short window, the cluster is flagged as a breaking alert with `sourcesPerHour` as the velocity metric.
每个聚类跟踪新闻速度 — 当多个第一、二层来源在短时间窗口内聚焦同一故事时，该聚类被标记为突发警报，使用 `sourcesPerHour` 作为速度指标。

### Signal Aggregation
### 信号聚合

All real-time data sources feed into a central signal aggregator that builds a unified geospatial intelligence picture. Signals are clustered by country and region, with each signal carrying a severity (low/medium/high), geographic coordinates, and metadata. The aggregator:
所有实时数据源馈入中央信号聚合器，构建统一的地理空间情报画面。信号按国家和区域聚类，每个信号带有严重程度（低/中/高）、地理坐标和元数据。聚合器：

1. **Clusters by country** — groups signals from diverse sources (flights, vessels, protests, fires, outages) into per-country profiles
1. **按国家聚类** — 将来自不同来源的信号（飞行、舰船、抗议、火灾、中断）分组为按国家分类的画像
2. **Detects regional convergence** — identifies when multiple signal types spike in the same geographic corridor (e.g., military flights + protests + satellite fires in Eastern Mediterranean)
2. **检测区域收敛** — 识别多种信号类型在同一地理走廊激增的情况（例如东地中海的军事飞行 + 抗议 + 卫星火灾）
3. **Feeds downstream analysis** — the CII, hotspot escalation, focal point detection, and AI insights modules all consume the aggregated signal picture rather than raw data
3. **供给下游分析** — CII、热点升级、焦点检测和 AI 洞察模块都消费聚合的信号画面而非原始数据

### Data Freshness & Intelligence Gaps
### 数据新鲜度与情报缺口

A singleton tracker monitors 14 data sources (GDELT, RSS, AIS, military flights, earthquakes, weather, outages, ACLED, Polymarket, economic indicators, NASA FIRMS, and more) with status categorization: fresh (<15 min), stale (1h), very_stale (6h), no_data, error, disabled. It explicitly reports **intelligence gaps** — what analysts can't see — preventing false confidence when critical data sources are down or degraded.
单例追踪器监控 14 个数据源（GDELT、RSS、AIS、军事飞行、地震、天气、中断、ACLED、Polymarket、经济指标、NASA FIRMS 等），状态分类：新鲜（<15 分钟）、过时（1 小时）、严重过时（6 小时）、无数据、错误、禁用。它明确报告**情报缺口** — 分析师看不到的内容 — 防止关键数据源关闭或降级时产生虚假信心。

### Prediction Markets as Leading Indicators
### 预测市场作为领先指标

Polymarket geopolitical markets are queried using tag-based filters (Ukraine, Iran, China, Taiwan, etc.) with 5-minute caching. Market probability shifts are correlated with news volume: if a prediction market moves significantly before matching news arrives, this is flagged as a potential early-warning signal.
使用基于标签的过滤器（乌克兰、伊朗、中国、台湾等）查询 Polymarket 地缘政治市场，缓存 5 分钟。市场概率变化与新闻量相关：如果预测市场在匹配新闻到达前大幅波动，这被标记为潜在预警信号。

### Macro Signal Analysis (Market Radar)
### 宏观信号分析（市场雷达）

The Market Radar panel computes a composite BUY/CASH verdict from 7 independent signals sourced entirely from free APIs (Yahoo Finance, mempool.space, alternative.me):
市场雷达面板计算来自完全来自免费 API（Yahoo Finance、mempool.space、alternative.me）的 7 个独立信号的综合买入/卖出判断：

| Signal 信号 | Computation 计算 | Bullish When 看涨条件 |
|--------|------------|--------------|
| **Liquidity** 流动性 | JPY/USD 30-day rate of change 日元/美元 30 天变化率 | ROC > -2% (no yen squeeze) 无日元挤压 |
| **Flow Structure** 资金流结构 | BTC 5-day return vs QQQ 5-day return | Gap < 5% (aligned) 差距 < 5% |
| **Macro Regime** 宏观状态 | QQQ 20-day ROC vs XLP 20-day ROC | QQQ outperforming (risk-on) |
| **Technical Trend** 技术趋势 | BTC vs SMA50 + 30-day VWAP | Above both (bullish) 高于两者 |
| **Hash Rate** 哈希率 | Bitcoin mining hashrate 30-day change | Growing > 3% 增长 > 3% |
| **Mining Cost** 挖矿成本 | BTC price vs hashrate-implied cost | Price > $60K (profitable) |
| **Fear & Greed** 恐惧与贪婪 | alternative.me sentiment index | Value > 50 |

The overall verdict requires ≥57% of known signals to be bullish (BUY), otherwise CASH. Signals with unknown data are excluded from the denominator.
总体判断要求 ≥57% 的已知信号看涨（买入），否则卖出。数据未知的信号从分母中排除。

**VWAP Calculation** — Volume-Weighted Average Price is computed from aligned price/volume pairs over a 30-day window. Pairs where either price or volume is null are excluded together to prevent index misalignment:
**VWAP 计算** — 成交量加权平均价格从 30 天窗口内的对齐价格/成交量对计算。价格或成交量为 null 的配对一起排除以防止指数错位：

```
VWAP = Σ(price × volume) / Σ(volume)    for last 30 trading days
```

The **Mayer Multiple** (BTC price / SMA200) provides a long-term valuation context — historically, values above 2.4 indicate overheating, while values below 0.8 suggest deep undervaluation.
**Mayer 倍数**（BTC 价格 / SMA200）提供长期估值背景 —历史上，高于 2.4 表示过热，低于 0.8 表示严重低估。

### Stablecoin Peg Monitoring
### 稳定币锚定监测

Five major stablecoins (USDT, USDC, DAI, FDUSD, USDe) are monitored via the CoinGecko API with 2-minute caching. Each coin's deviation from the $1.00 peg determines its health status:
通过 CoinGecko API 监控五个主要稳定币（USDT、USDC、DAI、FDUSD、USDe），缓存 2 分钟。每个币种相对于 $1.00 锚定的偏差决定其健康状态：

| Deviation 偏差 | Status 状态 | Indicator 指示器 |
|-----------|--------|-----------|
| ≤ 0.5% | ON PEG 锚定 | Green 绿色 |
| 0.5% – 1.0% | SLIGHT DEPEG 轻微脱锚 | Yellow 黄色 |
| > 1.0% | DEPEGGED 已脱锚 | Red 红色 |

The panel aggregates total stablecoin market cap, 24h volume, and an overall health status (HEALTHY / CAUTION / WARNING). The `coins` query parameter accepts a comma-separated list of CoinGecko IDs, validated against a `[a-z0-9-]+` regex to prevent injection.
面板聚合总稳定币市值、24 小时交易量和总体健康状态（健康 / 谨慎 / 警告）。`coins` 查询参数接受逗号分隔的 CoinGecko ID 列表，根据 `[a-z0-9-]+` 正则表达式验证以防止注入。

### BTC ETF Flow Estimation
### BTC ETF 资金流估算

Ten spot Bitcoin ETFs are tracked via Yahoo Finance's 5-day chart API (IBIT, FBTC, ARKB, BITB, GBTC, HODL, BRRR, EZBC, BTCO, BTCW). Since ETF flow data requires expensive terminal subscriptions, the system estimates flow direction from publicly available signals:
通过 Yahoo Finance 的 5 天图表 API 追踪十个现货比特币 ETF（IBIT、FBTC、ARKB、BITB、GBTC、HODL、BRRR、EZBC、BTCO、BTCW）。由于 ETF 资金流数据需要昂贵的终端订阅，系统从公开可用信号估算资金流方向：

- **Price change** — daily close vs. previous close determines direction
- **价格变化** — 每日收盘价 vs. 前日收盘价决定方向
- **Volume ratio** — current volume / trailing average volume measures conviction
- **成交量比率** — 当前成交量 /  trailing 平均成交量衡量信心
- **Flow magnitude** — `volume × price × direction × 0.1` provides a rough dollar estimate
- **资金流规模** — `volume × price × direction × 0.1` 提供粗略的美元估算

This is an approximation, not a substitute for official flow data, but it captures the direction and relative magnitude correctly. Results are cached for 15 minutes.
这是近似值，不是官方资金流数据的替代品，但正确捕捉了方向和相对规模。结果缓存 15 分钟。

---

## Architecture Principles
## 架构原则

| Principle | Implementation |
|-----------|---------------|
| **Speed over perfection** | Keyword classifier is instant; LLM refines asynchronously. Users never wait. |
| **Assume failure** | Per-feed circuit breakers with 5-minute cooldowns. AI fallback chain: Groq → OpenRouter → browser-side T5. Redis cache failures degrade gracefully. Every edge function returns stale cached data when upstream APIs are down. |
| **Show what you can't see** | Intelligence gap tracker explicitly reports data source outages rather than silently hiding them. |
| **Browser-first compute** | Analysis (clustering, instability scoring, surge detection) runs client-side — no backend compute dependency for core intelligence. |
| **Multi-signal correlation** | No single data source is trusted alone. Focal points require convergence across news + military + markets + protests before escalating to critical. |
| **Geopolitical grounding** | Hard-coded conflict zones, baseline country risk, and strategic chokepoints prevent statistical noise from generating false alerts in low-data regions. |
| **Defense in depth** | CORS origin allowlist, domain-allowlisted RSS proxy, server-side API key isolation, input sanitization with output encoding, IP rate limiting on AI endpoints. |
| **Cache everything, trust nothing** | Three-tier caching (in-memory → Redis → upstream) with versioned cache keys and stale-on-error fallback. Every API response includes `X-Cache` header for debugging. |

---

## Agent System
## Agent 自动化系统

World Monitor includes an autonomous agent system for automated data processing, report generation, and system maintenance.
World Monitor 包含一个自主 Agent 系统，用于自动化数据处理、报告生成和系统维护。

### Overview
### 概览

The agent system is located in `server/agent/` and provides the following automated capabilities:
Agent 系统位于 `server/agent/`，提供以下自动化能力：

| Agent | File | Function | 文件 | 功能 |
|-------|------|----------|-----|------|
| **Scheduler** | `scheduler.ts` | Task orchestration using node-cron | 任务调度 | 使用 node-cron 进行任务编排 |
| **Report Generator** | `report-generator.ts` | AI-powered daily/weekly report generation | 报告生成器 | AI 驱动的日报/周报生成 |
| **Backup** | `backup.ts` | Database backup to local storage and cloud (R2/S3) | 备份 | 数据库备份到本地存储和云端 (R2/S3) |
| **Cleanup** | `cleanup.ts` | Automatic data retention management | 清理 | 自动数据保留管理 |
| **TTS** | `tts.ts` | Text-to-speech for podcast generation | 语音合成 | 播客生成的文本转语音 |

### Scheduled Tasks
### 定时任务

The scheduler runs these automated tasks on a cron schedule:
调度器按 cron 计划运行以下自动化任务：

| Task | Schedule (UTC) | Description | 任务 | 计划 (UTC) | 描述 |
|------|---------------|-------------|------|-----------|------|
| `daily-summary` | `0 6 * * *` (6:00 daily) | Generate AI summary from past 24h news | `daily-summary` | `0 6 * * *` (每日 6:00) | 从过去 24 小时新闻生成 AI 摘要 |
| `weekly-trend` | `0 6 * * 0` (Sunday 6:00) | Generate weekly trend analysis report | `weekly-trend` | `0 6 * * 0` (周日 6:00) | 生成周趋势分析报告 |
| `cleanup` | `0 4 * * *` (4:00 daily) | Remove old RSS items and podcasts | `cleanup` | `0 4 * * *` (每日 4:00) | 删除旧的 RSS 项和播客 |
| `backup` | `0 3 * * *` (3:00 daily) | Backup database to local/cloud storage | `backup` | `0 3 * * *` (每日 3:00) | 备份数据库到本地/云存储 |

### Manual Task Trigger
### 手动触发任务

You can manually trigger any task via the `triggerTask()` function:
您可以通过 `triggerTask()` 函数手动触发任何任务：

```typescript
import { triggerTask } from './agent/scheduler.js';

// Trigger specific task
await triggerTask('daily-summary');
await triggerTask('weekly-trend');
await triggerTask('cleanup');
await triggerTask('backup');
```

```typescript
import { triggerTask } from './agent/scheduler.js';

// 触发特定任务
await triggerTask('daily-summary');
await triggerTask('weekly-trend');
await triggerTask('cleanup');
await triggerTask('backup');
```

### Report Generator
### 报告生成器

The report generator uses AI to analyze news data and create Markdown reports:
报告生成器使用 AI 分析新闻数据并创建 Markdown 报告：

```typescript
import { generateDailySummary, generateWeeklyTrend } from './agent/report-generator.js';

// Generate daily summary
const dailyReport = await generateDailySummary();

// Generate weekly trend analysis
const weeklyReport = await generateWeeklyTrend();
```

```typescript
import { generateDailySummary, generateWeeklyTrend } from './agent/report-generator.js';

// 生成日报
const dailyReport = await generateDailySummary();

// 生成周趋势分析
const weeklyReport = await generateWeeklyTrend();
```

Reports are saved to the `reports` table in the database with:
报告保存到数据库的 `reports` 表中，包含以下字段：
- `title`: Report title with date | 报告标题（含日期）
- `content`: AI-generated Markdown content | AI 生成的 Markdown 内容
- `format`: Always 'markdown' | 格式：始终为 'markdown'
- `category`: 'daily' or 'weekly' | 类别：'daily' 或 'weekly'
- `period_start` / `period_end`: Time period covered | 周期开始/结束时间

### Backup Service
### 备份服务

The backup agent handles database backups with the following features:
备份 Agent 处理数据库备份，具有以下功能：

- **Local backup**: Creates SQL dump to `/backups` directory
- **本地备份**: 创建 SQL 转储到 `/backups` 目录
- **Cloud backup**: Supports Cloudflare R2 and AWS S3
- **云备份**: 支持 Cloudflare R2 和 AWS S3
- **Retention**: 30 days local, 365 days cloud
- **保留期**: 本地 30 天，云端 365 天

Required environment variables:
所需环境变量：

```bash
# Local backup directory
BACKUP_DIR=/backups

# Cloudflare R2 (recommended - free 10GB)
R2_ACCESS_KEY=your_key
R2_SECRET_KEY=your_key
R2_BUCKET=your_bucket
R2_ENDPOINT=your_endpoint

# Or AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_key
S3_BUCKET=your_bucket
```

### Cleanup Service
### 清理服务

Automatic data retention management:
自动数据保留管理：

| Data Type | Default Retention | Environment Variable | 数据类型 | 默认保留期 | 环境变量 |
|-----------|------------------|---------------------|---------|-----------|---------|
| RSS Items | 90 days | `RSS_RETENTION_DAYS` | RSS 项 | 90 天 | `RSS_RETENTION_DAYS` |
| Podcasts | 3 days | `PODCAST_RETENTION_DAYS` | 播客 | 3 天 | `PODCAST_RETENTION_DAYS` |

The cleanup also removes orphan RSS items (items whose source no longer exists).
清理还会删除孤立的 RSS 项（来源不存在的项）。

### Text-to-Speech (TTS)
### 文本转语音 (TTS)

Microsoft Edge TTS for podcast generation:
Microsoft Edge TTS 用于播客生成：

```typescript
import { textToSpeech, generatePodcast, getVoices } from './agent/tts.js';

// Get available voices
const voices = getVoices();
// { 'en-US': 'en-US-AriaNeural', 'zh-CN': 'zh-CN-XiaoxiaoNeural', ... }

// Generate podcast
const result = await generatePodcast(
  'Daily News Summary',
  'Full article content here...',
  'en-US-AriaNeural' // Optional voice
);
```

```typescript
import { textToSpeech, generatePodcast, getVoices } from './agent/tts.js';

// 获取可用的语音
const voices = getVoices();
// { 'en-US': 'en-US-AriaNeural', 'zh-CN': 'zh-CN-XiaoxiaoNeural', ... }

// 生成播客
const result = await generatePodcast(
  '每日新闻摘要',
  '完整的文章内容...',
  'zh-CN-XiaoxiaoNeural' // 可选语音
);
```

Supported voices:
支持的语音：
- `en-US-AriaNeural` (English US) | 英语（美国）
- `en-GB-SoniaNeural` (English UK) | 英语（英国）
- `zh-CN-XiaoxiaoNeural` (Chinese Simplified) | 中文（简体）
- `zh-TW-HsiaoChenNeural` (Chinese Traditional) | 中文（繁体）

### Integration
### 集成

To enable the scheduler in your server, add to `server/index.ts`:
要在服务器中启用调度器，请添加到 `server/index.ts`：

```typescript
import { initializeScheduler, stopScheduler } from './agent/scheduler.js';

// Initialize on startup
initializeScheduler();

// Graceful shutdown
process.on('SIGTERM', stopScheduler);
process.on('SIGINT', stopScheduler);
```

```typescript
import { initializeScheduler, stopScheduler } from './agent/scheduler.js';

// 启动时初始化
initializeScheduler();

// 优雅关闭
process.on('SIGTERM', stopScheduler);
process.on('SIGINT', stopScheduler);
```

---

### Viewing Results & Manual Execution
### 查看结果与手动执行

The agent results are stored in the database and accessible via API:
Agent 结果存储在数据库中，可通过 API 访问：

```bash
# List all reports / 查看所有报告
curl http://localhost:3001/api/reports

# View specific report (Markdown format) / 查看特定报告 (Markdown格式)
curl http://localhost:3001/api/reports/1
```

Manually trigger report generation:
手动触发报告生成：

```bash
# Generate daily summary / 生成日报
curl -X POST http://localhost:3001/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "daily"}'

# Generate weekly trend / 生成周报
curl -X POST http://localhost:3001/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "weekly"}'
```

Database tables required (auto-created on server start):
所需的数据库表（服务器启动时自动创建）：

| Table | Purpose | 表名 | 用途 |
|-------|---------|------|------|
| `reports` | Generated reports | `reports` | 生成的报告 |
| `rss_items` | News items for analysis | `rss_items` | 用于分析的新闻项 |
| `podcasts` | Generated podcasts | `podcasts` | 生成的播客 |
| `agent_tasks` | Task history | `agent_tasks` | 任务历史 |

**Note**: Reports require `rss_items` table to have data. The report generator reads the past 24 hours of news to create summaries.
**注意**: 报告需要 `rss_items` 表中有数据。报告生成器读取过去 24 小时的新闻来创建摘要。

---

### MCP Server
### MCP 服务器

World Monitor includes an MCP (Model Context Protocol) server for AI tool integration:
World Monitor 包含一个 MCP（Model Context Protocol）服务器，用于 AI 工具集成：

| Tool | File | Description |
|------|------|-------------|
| **News Tools** | `server/mcp/tools/news-tools.ts` | Search, browse, and analyze news articles |
| **Analysis Tools** | `server/mcp/tools/analysis-tools.ts` | Geopolitical analysis and threat assessment |
| **Report Tools** | `server/mcp/tools/report-tools.ts` | Generate and manage intelligence reports |

```typescript
// MCP server entry point
import { createMCPServer } from './mcp/index.js';

// Initialize MCP server with AI tools
const server = createMCPServer({
  newsTools: true,
  analysisTools: true,
  reportTools: true,
});
```

---

### Sentiment AI
### 情感 AI

The sentiment analysis service (`server/services/sentiment-ai.ts`) provides real-time sentiment scoring for news articles:
情感分析服务（`server/services/sentiment-ai.ts`）为新闻文章提供实时情感评分：

- **Multi-source sentiment analysis** — Combines multiple signals for accurate sentiment detection
- **多源情感分析** — 结合多个信号进行准确的情感检测
- **Real-time scoring** — Sentiment scores updated as new articles arrive
- **实时评分** — 新文章到达时更新情感分数
- **Integrated with AI Chat RAG** — Sentiment context included in AI responses
- **与 AI Chat RAG 集成** — AI 响应中包含情感上下文

---

### OpenSpec Change Workflow
### OpenSpec 变更工作流

World Monitor uses OpenSpec for structured feature development:
World Monitor 使用 OpenSpec 进行结构化功能开发：

| Artifact | Location | Purpose |
|----------|----------|---------|
| **Proposal** | `openspec/changes/<name>/proposal.md` | Feature requirements and goals |
| **Design** | `openspec/changes/<name>/design.md` | Technical design and architecture |
| **Spec** | `openspec/changes/<name>/specs/<spec>/spec.md` | Detailed specifications |
| **Tasks** | `openspec/changes/<name>/tasks.md` | Implementation tasks |

```bash
# Start a new change
opsx new <change-name>

# Continue working on a change
opsx continue

# Verify implementation matches specs
opsx verify

# Archive completed change
opsx archive
```

---

## Source Credibility & Feed Tiering
## 来源可信度与订阅分层

Every RSS feed is assigned a source tier reflecting editorial reliability:
每个 RSS 订阅源根据编辑可信度分配来源层级：

| Tier 层级 | Description 描述 | Examples 示例 |
|------|-------------|---------|
| **Tier 1** | Wire services, official government sources 通讯社、政府官方来源 | Reuters, AP, BBC, DOD |
| **Tier 2** | Major established outlets 主要知名媒体 | CNN, NYT, The Guardian, Al Jazeera |
| **Tier 3** | Specialized/niche outlets 专业/小众媒体 | Defense One, Breaking Defense, The War Zone |
| **Tier 4** | Aggregators and blogs 聚合器和博客 | Google News, individual analyst blogs |

Feeds also carry a **propaganda risk rating** and **state affiliation flag**. State-affiliated sources (RT, Xinhua, IRNA) are included for completeness but visually tagged so analysts can factor in editorial bias. Threat classification confidence is weighted by source tier — a Tier 1 breaking alert carries more weight than a Tier 4 blog post in the focal point detection algorithm.
订阅源还带有**宣传风险评级**和**国家附属标志**。国家附属来源（RT、Xinhua、IRNA）包含在内以保持完整性，但会视觉标记以便分析师考虑编辑偏见。威胁分类置信度按来源层级加权 — 第一层突发警报比第四层博客文章在焦点检测算法中权重更高。

---

## Edge Function Architecture
## 边缘函数架构

World Monitor uses 45+ Vercel Edge Functions as a lightweight API layer. Each edge function handles a single data source concern — proxying, caching, or transforming external APIs. This architecture avoids a monolithic backend while keeping API keys server-side:
World Monitor 使用 45+ 个 Vercel 边缘函数作为轻量级 API 层。每个边缘函数处理单一数据源问题 — 代理、缓存或转换外部 API。这种架构避免了单体后端，同时将 API 密钥保持在服务器端：

- **RSS Proxy** — domain-allowlisted proxy for 100+ feeds, preventing CORS issues and hiding origin servers. Feeds from domains that block Vercel IPs are automatically routed through the Railway relay.
- **RSS 代理** — 100+ 订阅源的域名白名单代理，防止 CORS 问题并隐藏源服务器。阻止 Vercel IP 的域名订阅源自动通过 Railway 中继路由。
- **AI Pipeline** — Groq and OpenRouter edge functions with Redis deduplication, so identical headlines across concurrent users only trigger one LLM call. The classify-event endpoint pauses its queue on 500 errors to avoid wasting API quota.
- **AI 流水线** — Groq 和 OpenRouter 边缘函数带 Redis 去重，因此并发用户看到相同标题时只触发一次 LLM 调用。classify-event 端点在 500 错误时暂停队列以避免浪费 API 配额。
- **AI Chat RAG** — AI chat endpoint retrieves relevant news from the past 7 days as context, enabling AI to answer questions about current events using local news data.
- **AI Chat RAG** — AI 聊天端点检索过去 7 天的相关新闻作为上下文，使 AI 能够使用本地新闻数据回答时事问题。
- **Data Adapters** — GDELT, ACLED, OpenSky, USGS, NASA FIRMS, FRED, Yahoo Finance, CoinGecko, mempool.space, and others each have dedicated edge functions that normalize responses into consistent schemas
- **数据适配器** — GDELT、ACLED、OpenSky、USGS、NASA FIRMS、FRED、Yahoo Finance、CoinGecko、mempool.space 等各有专用边缘函数，将响应规范化为一致的 schema
- **Market Intelligence** — macro signals, ETF flows, and stablecoin monitors compute derived analytics server-side (VWAP, SMA, peg deviation, flow estimates) and cache results in Redis
- **市场情报** — 宏观信号、ETF 资金流和稳定币监测器在服务器端计算派生分析（VWAP、SMA、锚定偏差、资金流估算）并将结果缓存到 Redis
- **Temporal Baseline** — Welford's algorithm state is persisted in Redis across requests, building statistical baselines without a traditional database
- **时序基线** — Welford 算法状态在请求间持久化到 Redis，无需传统数据库即可构建统计基线
- **Custom Scrapers** — sources without RSS feeds (FwdStart, GitHub Trending, tech events) are scraped and transformed into RSS-compatible formats
- **自定义爬虫** — 没有 RSS 订阅源的来源（FwdStart、GitHub Trending、科技活动）被抓取并转换为 RSS 兼容格式

All edge functions include circuit breaker logic and return cached stale data when upstream APIs are unavailable, ensuring the dashboard never shows blank panels.
所有边缘函数都包含断路器逻辑，当上游 API 不可用时返回缓存的过期数据，确保仪表板永远不会显示空白面板。

---

## Dual-Deployment Architecture
## 双平台部署架构

World Monitor runs on two platforms that work together:
World Monitor 在两个协同工作的平台上运行：

```
┌─────────────────────────────────────┐
│          Vercel (Edge)              │
│  45+ edge functions · static SPA   │
│  CORS allowlist · Redis cache       │
│  AI pipeline · market analytics     │
└──────────────┬──────────────────────┘
               │ https:// (server-side)
               │ wss://   (client-side)
               ▼
┌─────────────────────────────────────┐
│       Railway (Relay Server)        │
│  WebSocket relay · OpenSky OAuth2   │
│  RSS proxy for blocked domains      │
│  AIS vessel stream multiplexer      │
└─────────────────────────────────────┘
```

**Why two platforms?** Several upstream APIs (OpenSky Network, CNN RSS, UN News, CISA, IAEA) actively block requests from Vercel's IP ranges. The Railway relay server acts as an alternate origin, handling:
**为何使用两个平台？** 多个上游 API（OpenSky Network、CNN RSS、UN News、CISA、IAEA）主动阻止来自 Vercel IP 范围的请求。Railway 中继服务器充当备用来源，处理：

- **AIS vessel tracking** — maintains a persistent WebSocket connection to AISStream.io and multiplexes it to all connected browser clients, avoiding per-user connection limits
- **AIS 船只追踪** — 维护与 AISStream.io 的持久 WebSocket 连接，并将其多路复用至所有连接的浏览器客户端，避免每用户连接限制
- **OpenSky aircraft data** — authenticates via OAuth2 client credentials flow (Vercel IPs get 403'd by OpenSky without auth tokens)
- **OpenSky 飞机数据** — 通过 OAuth2 客户端凭据流进行身份验证（OpenSky 在没有 auth token 时会阻止 Vercel IP）
- **RSS feeds** — proxies feeds from domains that block Vercel IPs, with a separate domain allowlist for security
- **RSS 订阅源** — 代理来自阻止 Vercel IP 的域名的订阅源，带有独立域名白名单以确保安全

The Vercel edge functions connect to Railway via `WS_RELAY_URL` (server-side, HTTPS) while browser clients connect via `VITE_WS_RELAY_URL` (client-side, WSS). This separation keeps the relay URL configurable per deployment without leaking server-side configuration to the browser.
Vercel 边缘函数通过 `WS_RELAY_URL`（服务器端，HTTPS）连接 Railway，而浏览器客户端通过 `VITE_WS_RELAY_URL`（客户端，WSS）连接。这种分离使中继 URL 可按部署配置，而不会向浏览器泄露服务器端配置。

---

## Docker Deployment (Alternative to Vercel)
## Docker 部署（Vercel 的替代方案）

World Monitor can also be deployed using Docker containers instead of Vercel. This provides more control over the server environment and is suitable for VPS or cloud VM deployments.

### Prerequisites
### 前置要求

- [Docker](https://docker.com/) installed
- [Docker Compose](https://docs.docker.com/compose/) (optional, for local development)

### Quick Start
### 快速开始

```bash
# 1. Copy environment variables
cp .env.docker .env

# 2. Edit .env with your API keys (see .env.example for available options)

# 3. Build and run
docker-compose up --build

# 4. Access at http://localhost:3001
```

### Docker Services
### Docker 服务

Docker Compose starts 4 services:

| Container | Image | Purpose |
|-----------|-------|---------|
| `worldmonitor-postgres` | postgres:16-alpine | PostgreSQL 16 for RSS cache and Agent data |
| `worldmonitor-redis` | redis:7-alpine | Redis for Bull queue and local caching |
| `worldmonitor` | worldmonitor (built) | Main application server |
| `worldmonitor-nginx` | nginx:alpine | Reverse proxy for static files |

**Redis** is used for:
- Bull job queue (async task processing)
- Local caching with LRU eviction (256MB maxmemory)
- Session storage

**PostgreSQL** is used for:
- RSS items cache
- Generated reports
- Agent task history
- Podcasts metadata

### Manual Docker Run
### 手动 Docker 运行

```bash
# Build the image
docker build -t worldmonitor .

# Run the container
docker run -p 3001:3001 --env-file .env worldmonitor
```

### Environment Variables
### 环境变量

| Variable | Description | Description (CN) | Register/More Info |
|----------|-------------|------------------|-------------------|
| `PORT` | Server port (default: 3001) | 服务器端口（默认 3001） | - |
| `NODE_ENV` | Set to `production` | 设置为 `production` | - |
| `GROQ_API_KEY` | AI summarization - generates insights from news headlines using Groq LLM (14,400 req/day free) | AI 摘要 - 使用 Groq LLM 从新闻标题生成洞察（免费 14,400 次/天） | [console.groq.com](https://console.groq.com/) |
| `OPENROUTER_API_KEY` | AI summarization fallback - alternative LLM provider when Groq is unavailable (50 req/day free) | AI 摘要备选 - Groq 不可用时的备选 LLM 提供商（免费 50 次/天） | [openrouter.ai](https://openrouter.ai/) |
| `UPSTASH_REDIS_REST_URL` | Redis cache URL - cross-user caching to deduplicate AI calls and cache risk scores | Redis 缓存 URL - 跨用户缓存，用于 AI 调用去重和风险评分缓存 | [upstash.com](https://upstash.com/) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis cache token | Redis 缓存令牌 | [upstash.com](https://upstash.com/) |
| `FINNHUB_API_KEY` | Stock market data - real-time stock quotes and market news | 股票市场数据 - 实时股票报价和市场新闻 | [finnhub.io](https://finnhub.io/) |
| `FRED_API_KEY` | Federal Reserve Economic Data - interest rates, GDP, inflation, employment | 美联储经济数据 - 利率、通胀、就业、GDP | [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) |
| `EIA_API_KEY` | U.S. Energy Information Administration - oil, natural gas, electricity prices and production | 美国能源信息管理局 - 石油、天然气、电力价格和生产数据 | [eia.gov/opendata](https://www.eia.gov/opendata/) |
| `WINGBITS_API_KEY` | Aircraft tracking enrichment - adds aircraft owner, operator, and type info | 飞机追踪增强 - 添加飞机所有者、运营商和类型信息 | [wingbits.com](https://wingbits.com/) |
| `ACLED_ACCESS_TOKEN` | Armed Conflict Location & Event Data - global conflict, protest, and riot events | 武装冲突地点与事件数据 - 全球冲突、抗议和骚乱事件 | [acleddata.com](https://acleddata.com/) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Radar - internet outages and connectivity data | Cloudflare Radar - 互联网中断和连接数据 | [cloudflare.com](https://www.cloudflare.com/) |
| `NASA_FIRMS_API_KEY` | Satellite fire detection (FIRMS) - global active fire locations | 卫星火灾探测 (FIRMS) - 全球活跃火灾位置 | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/) |
| `WS_RELAY_URL` | WebSocket relay server-side URL (https://) - for real-time flight/vessel tracking | WebSocket 中继服务器端 URL (https://) - 用于实时飞行/船舶追踪 | - |
| `VITE_WS_RELAY_URL` | WebSocket relay client-side URL (wss://) - browser connects via this | WebSocket 中继客户端 URL (wss://) - 浏览器通过此连接 | - |

### Database (PostgreSQL)

Docker Compose includes PostgreSQL 16 for persistent RSS cache and Agent data storage.

| Variable | Description | Description (CN) |
|----------|-------------|------------------|
| `DATABASE_URL` | PostgreSQL connection string | PostgreSQL 连接字符串 |
| `POSTGRES_USER` | PostgreSQL username (default: worldmonitor) | PostgreSQL 用户名 |
| `POSTGRES_PASSWORD` | PostgreSQL password | PostgreSQL 密码 |
| `POSTGRES_DB` | PostgreSQL database name | 数据库名称 |

### AI Providers

Multiple AI provider support with automatic failover.

| Variable | Description | Description (CN) | Register |
|----------|-------------|------------------|----------|
| `MINIMAX_API_KEY` | MiniMax AI (primary) | MiniMax AI（首选）| [minimax.chat](https://www.minimax.chat/) |
| `MINIMAX_API_BASE` | MiniMax API endpoint | API 端点 | - |
| `LEPTON_API_KEY` | Lepton AI (last resort) | Lepton AI（最后备选）| [lepton.ai](https://www.lepton.ai/) |

### Cloud Backup

| Variable | Description | Description (CN) |
|----------|-------------|------------------|
| `R2_BUCKET` | Cloudflare R2 bucket name | R2 存储桶名称 |
| `R2_ENDPOINT` | Cloudflare R2 endpoint URL | R2 端点 URL |
| `R2_ACCESS_KEY` | Cloudflare R2 access key | R2 访问密钥 |
| `R2_SECRET_KEY` | Cloudflare R2 secret key | R2 密钥 |
| `S3_BUCKET` | AWS S3 bucket name | S3 存储桶名称 |
| `AWS_REGION` | AWS region (default: us-east-1) | AWS 区域 |

### Data Retention

| Variable | Description | Description (CN) | Default |
|----------|-------------|------------------|---------|
| `RSS_RETENTION_DAYS` | RSS cache retention days | RSS 缓存保留天数 | 90 |
| `PODCAST_RETENTION_DAYS` | Podcast retention days | 播客保留天数 | 3 |
| `BACKUP_DIR` | Local backup directory | 本地备份目录 | /backups |
| `PODCAST_DIR` | Podcast audio directory | 播客音频目录 | /podcasts |

### Agent Services

WorldMonitor includes automated Agent services for news analysis and reporting.

#### Scheduled Tasks

| Task | Schedule | Description |
|------|----------|-------------|
| Daily Summary | 06:00 UTC | AI-generated daily news summary |
| Weekly Trend | Sunday 06:00 UTC | Weekly trend analysis report |
| Cleanup | 04:00 UTC | Delete old RSS items and podcasts |
| Backup | 03:00 UTC | Database backup to local/cloud |

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cache/news` | GET | Get cached news (with category filter) |
| `/api/cache/sources` | GET | Get RSS source status |
| `/api/cache/stats` | GET | Get cache statistics |
| `/api/ai/chat` | POST | AI chat with auto-failover and news RAG context |
| `/api/ai/providers` | GET | Get AI provider status |
| `/api/reports` | GET | List generated reports |
| `/api/reports/:id` | GET | Get report (Markdown) |
| `/api/reports/generate` | POST | Trigger report generation |
| `/api/podcasts` | GET | List generated podcasts |
| `/api/podcasts/:id` | GET | Get podcast audio |
| `/api/podcasts/generate` | POST | Generate podcast from text |

### Docker Commands Reference
### Docker 命令参考

```bash
# Build image
docker build -t worldmonitor .

# Run in background
docker run -d -p 3001:3001 --env-file .env worldmonitor

# View logs
docker logs -f worldmonitor

# Stop container
docker stop worldmonitor

# Rebuild after code changes
docker-compose build --no-cache worldmonitor

# View running containers
docker ps
```

### Built-in RSS News Sources
### 内置 RSS 新闻源

WorldMonitor includes **150+ built-in RSS news sources** that work without any API keys. These are organized by category:
WorldMonitor 内置了 **150+ 个无需 API 密钥即可使用的 RSS 新闻源**，按类别组织：

| Category 类别 | Sources 数量 | Description 说明 |
|----------|---------|-------------|
| **Politics / World** 政治/国际 | 30+ | BBC, Reuters, AP News, NPR, Al Jazeera, Guardian, The Diplomat |
| **Government / Agencies** 政府/机构 | 15+ | White House, Pentagon, Federal Reserve, UN News, SEC, CDC, FEMA |
| **Tech / AI** 科技/AI | 50+ | Hacker News, MIT Tech Review, Ars Technica, VentureBeat, TechCrunch |
| **Startups / VC** 初创/风投 | 40+ | Y Combinator, a16z, Sequoia, Crunchbase, TechCrunch Startups |
| **Finance / Markets** 金融/市场 | 10+ | CNBC, MarketWatch, Yahoo Finance, Financial Times |
| **Defense / Security** 国防/安全 | 15+ | Defense One, Breaking Defense, Janes, Bellingcat, Krebs Security |
| **Think Tanks** 智库 | 20+ | Brookings, Carnegie, RAND, Atlantic Council, CSIS |
| **Regional Tech** 区域科技 | 30+ | EU Startups, Tech in Asia, TechCabal (Africa), Latin America |

#### Source Tiering System
#### 源分级系统

Sources are ranked by reliability (lower = more authoritative):
源按可信度排名（数字越小越权威）：

| Tier 层级 | Description 描述 | Examples 示例 |
|------|-------------|----------|
| **Tier 1** | Wire services & government agencies 路透社、美联社、政府机构 | Reuters, AP News, White House, Pentagon |
| **Tier 2** | Major mainstream outlets 主流媒体 | BBC, Guardian, Financial Times |
| **Tier 3** | Specialty publications 专业媒体 | Defense One, Janes, Breaking Defense |
| **Tier 4** | Aggregators & blogs 聚合器和博客 | Hacker News, The Verge |

#### Propaganda Risk Assessment
#### 宣传风险评估

Sources are tagged with propaganda risk levels:
源带有宣传风险标签：

| Risk 风险 | Sources 来源 |
|------|---------|
| **High 高** | Xinhua, TASS, RT, CGTN (state-controlled 国有媒体) |
| **Medium 中** | Al Jazeera, Al Arabiya (state-funded 国有资金) |
| **Low 低** | Reuters, AP, BBC (independent editorial 独立编辑) |

#### RSS Proxy Domain Allowlist
#### RSS 代理域名白名单

The RSS proxy only allows fetching from approved domains (~90+). This is a security measure:
RSS 代理只允许从已批准的域名（约 90+）获取。这是一个安全措施：

```
feeds.bbci.co.uk, news.google.com, hnrss.org, techcrunch.com,
www.theguardian.com, www.aljazeera.com, www.theverge.com,
www.technologyreview.com, venturebeat.com, foreignpolicy.com,
www.ft.com, www.defenseone.com, breakingdefense.com,
thediplomat.com, arxiv.org, export.arxiv.org, ...
```

Full list in: `api/rss-proxy.js`
完整列表见: `api/rss-proxy.js`

#### Complete Source List by Category
#### 完整源列表（按类别）

**Politics / World 政治/国际:**
- BBC World, NPR News, Guardian World, AP News, Reuters World, Politico, The Diplomat
- BBC Middle East, Al Jazeera, Al Arabiya, Guardian ME, CNN World

**Government / Agencies 政府/机构:**
- White House, State Dept, Pentagon, Treasury, DOJ, Federal Reserve, SEC, CDC, FEMA, DHS
- UN News, CISA

**Tech / AI 科技/AI:**
- Hacker News, Ars Technica, The Verge, MIT Tech Review
- AI News, VentureBeat AI, The Verge AI, MIT Tech Review AI, MIT Research
- ArXiv AI, ArXiv ML, AI Weekly, Anthropic News, OpenAI News

**Finance / Markets 金融/市场:**
- CNBC, MarketWatch, Yahoo Finance, Financial Times, Reuters Business
- CNBC Tech, MarketWatch Tech, Yahoo Finance, Seeking Alpha Tech

**Defense / Security 国防/安全:**
- Defense One, Breaking Defense, The War Zone, Defense News, Janes, CSIS
- The Diplomat, Foreign Policy, Foreign Affairs, Atlantic Council
- Chatham House, ECFR, Middle East Institute
- RAND, Brookings, Carnegie, FAS, NTI
- Bellingcat, Krebs Security, The Hacker News, Dark Reading, Schneier
- FAO News

**Startups / VC 初创/风投:**
- TechCrunch, TechCrunch Startups, TechCrunch Venture, TechCrunch Layoffs
- VentureBeat, Crunchbase News, SaaStr, AngelList News, CB Insights
- Y Combinator Blog, a16z Blog, Sequoia Blog, Paul Graham Essays
- VC Insights, Lenny's Newsletter, Stratechery, FwdStart Newsletter
- The Information, PitchBook News, Fortune Term Sheet
- SEC Filings, VC News, Seed & Pre-Seed, Startup Funding
- IPO News, Renaissance IPO, Tech IPO News

**Regional Startups 区域初创:**

*Europe 欧洲:*
- EU Startups, Tech.eu, Sifted (Europe), The Next Web

*Asia 亚洲:*
- Tech in Asia, KrASIA, SEA Startups, Asia VC News
- China Startups, 36Kr English, China Tech Giants
- Japan Startups, Japan Tech News, Nikkei Tech
- Korea Tech News, Korea Startups
- Inc42 (India), YourStory, India Startups, India Tech News
- Taiwan Tech

*Southeast Asia 东南亚:*
- SEA Tech News, Vietnam Tech, Indonesia Tech

*Latin America 拉美:*
- LAVCA (LATAM), LATAM Startups, Startups LATAM, Brazil Tech, FinTech LATAM

*Africa 非洲:*
- TechCabal (Africa), Disrupt Africa, Africa Startups, Africa Tech News

*Middle East 中东:*
- MENA Startups, MENA Tech News

**GitHub / Developer GitHub/开发者:**
- GitHub Blog, GitHub Trending, Show HN, YC Launches, Dev Events, Open Source News

**Hardware / Semiconductors 硬件/半导体:**
- Tom's Hardware, SemiAnalysis, Semiconductor News

**Cloud / DevOps 云/开发运维:**
- InfoQ, The New Stack, DevOps.com

**Developer 开发者:**
- Dev.to, Lobsters, Changelog

**Security 安全:**
- Krebs Security, The Hacker News, Dark Reading, Schneier

**Product 产品:**
- Product Hunt

**Funding 融资:**
- Unicorn News, CB Insights Unicorn, Decacorn News, New Unicorns

**Accelerators 加速器:**
- Techstars News, 500 Global News, Demo Day News, Startup School

**Podcasts 播客:**
- Acquired Episodes, All-In Podcast, a16z Insights, TWIST Episodes, 20VC Episodes
- Lex Fridman Tech, Verge Shows, Hard Fork (NYT), Pivot Podcast
- Tech Newsletters, AI Podcasts, AI Interviews, How I Built This, Startup Podcasts

**Policy 政策:**
- Politico Tech, AI Regulation, Tech Antitrust, EFF News
- EU Digital Policy, Euractiv Digital, EU Commission Digital
- China Tech Policy, UK Tech Policy, India Tech Policy

**Think Tanks 智库:**
- Brookings Tech, CSIS Tech, MIT Tech Policy, Stanford HAI, AI Now Institute
- OECD Digital, EU Tech Policy, Chatham House Tech
- ISEAS (Singapore), ORF Tech (India), RIETI (Japan), Asia Pacific Tech
- China Tech Analysis, DigiChina

**Regional News 区域新闻:**
- Africa News, Sahel Crisis, News24, BBC Africa
- Latin America, BBC Latin America, Reuters LatAm, Guardian Americas
- Asia News, BBC Asia, South China Morning Post, Reuters Asia

**Energy 能源:**
- Oil & Gas, Nuclear Energy, Reuters Energy, Mining & Resources

**Layoffs 裁员:**
- Layoffs.fyi, TechCrunch Layoffs, Layoffs News

**Outages 故障:**
- AWS Status, Cloud Outages

### VPS Production Deployment
### VPS 生产部署

1. **Server Setup**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **Deploy**
   ```bash
   # Clone repository
   git clone https://github.com/JackSirirus/worldmonitor.git
   cd worldmonitor

   # Copy and configure environment
   cp .env.docker .env
   nano .env  # Add your API keys

   # Build and start
   docker-compose up -d

   # Setup reverse proxy (nginx) for HTTPS
   ```

3. **Systemd Service (optional)**
   ```
   # /etc/systemd/system/worldmonitor.service
   [Unit]
   Description=WorldMonitor
   After=docker.service
   Requires=docker.service

   [Service]
   WorkingDirectory=/path/to/worldmonitor
   ExecStart=/usr/bin/docker-compose up
   ExecStop=/usr/bin/docker-compose down
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

---

## Caching Architecture
## 缓存架构

Every external API call passes through a three-tier cache with stale-on-error fallback:
每个外部 API 调用都经过三层缓存，错误时返回过期数据：

```
Request → [1] In-Memory Cache → [2] Redis (Upstash) → [3] Upstream API
                                                              │
            ◄──── stale data served on error ────────────────┘
```

| Tier 层级 | Scope 范围 | TTL 生存时间 | Purpose 用途 |
|------|-------|-----|---------|
| **In-memory** 内存 | Per edge function instance 每个边缘函数实例 | Varies (60s–900s) 变化 | Eliminates Redis round-trips for hot paths 消除热路径的 Redis 往返 |
| **Redis (Upstash)** | Cross-user, cross-instance 跨用户、跨实例 | Varies (120s–900s) 变化 | Deduplicates API calls across all visitors 跨所有访问者去重 API 调用 |
| **Upstream** 上游 | Source of truth 真实来源 | N/A 不适用 | External API (Yahoo Finance, CoinGecko, etc.) 外部 API |

Cache keys are versioned (`opensky:v2:lamin=...`, `macro-signals:v2:default`) so schema changes don't serve stale formats. Every response includes an `X-Cache` header (`HIT`, `REDIS-HIT`, `MISS`, `REDIS-STALE`, `REDIS-ERROR-FALLBACK`) for debugging.
缓存键有版本控制（`opensky:v2:lamin=...`, `macro-signals:v2:default`），因此 schema 更改不会提供过期格式。每个响应都包含 `X-Cache` 头（`HIT`、`REDIS-HIT`、`MISS`、`REDIS-STALE`、`REDIS-ERROR-FALLBACK`）用于调试。

The AI summarization pipeline adds content-based deduplication: headlines are hashed and checked against Redis before calling Groq, so the same breaking news viewed by 1,000 concurrent users triggers exactly one LLM call.
AI 摘要流水线添加基于内容的去重：标题在调用 Groq 之前被哈希并检查 Redis，因此 1,000 名并发用户查看同一条突发新闻只触发一次 LLM 调用。

---

## Security Model
## 安全模型

| Layer | Mechanism |
|-------|-----------|
| **CORS origin allowlist** | Only `worldmonitor.app`, `startups.worldmonitor.app`, and `localhost:*` can call API endpoints. All others receive 403. Implemented in `api/_cors.js`. |
| **CORS 来源白名单** | 只有 `worldmonitor.app`、`startups.worldmonitor.app` 和 `localhost:*` 可以调用 API 端点。其他所有请求收到 403。在 `api/_cors.js` 中实现。 |
| **RSS domain allowlist** | The RSS proxy only fetches from explicitly listed domains (~90+). Requests for unlisted domains are rejected with 403. |
| **RSS 域名白名单** | RSS 代理只从明确列出的域名（~90+）获取。未列出域名的请求被拒绝，返回 403。 |
| **Railway domain allowlist** | The Railway relay has a separate, smaller domain allowlist for feeds that need the alternate origin. |
| **Railway 域名白名单** | Railway 中继有单独的、较小的域名白名单，用于需要备用来源的订阅源。 |
| **API key isolation** | All API keys live server-side in Vercel environment variables. The browser never sees Groq, OpenRouter, ACLED, Finnhub, or other credentials. |
| **API 密钥隔离** | 所有 API 密钥驻留在服务器端的 Vercel 环境变量中。浏览器永远不会看到 Groq、OpenRouter、ACLED、Finnhub 或其他凭据。 |
| **Input sanitization** | User-facing content passes through `escapeHtml()` (prevents XSS) and `sanitizeUrl()` (blocks `javascript:` and `data:` URIs). URLs use `escapeAttr()` for attribute context encoding. |
| **输入清理** | 用户面向内容通过 `escapeHtml()`（防止 XSS）和 `sanitizeUrl()`（阻止 `javascript:` 和 `data:` URI）。URL 使用 `escapeAttr()` 进行属性上下文编码。 |
| **Query parameter validation** | API endpoints validate input formats (e.g., stablecoin coin IDs must match `[a-z0-9-]+`, bounding box params are numeric). |
| **查询参数验证** | API 端点验证输入格式（例如，稳定币币种 ID 必须匹配 `[a-z0-9-]+`，边界框参数为数字）。 |
| **IP rate limiting** | AI endpoints use Upstash Redis-backed rate limiting to prevent abuse of Groq/OpenRouter quotas. |
| **IP 速率限制** | AI 端点使用 Upstash Redis 支持的速率限制，防止滥用 Groq/OpenRouter 配额。 |
| **No debug endpoints** | The `api/debug-env.js` endpoint returns 404 in production — it exists only as a disabled placeholder. |
| **无调试端点** | `api/debug-env.js` 端点在生产环境返回 404 — 它只作为禁用的占位符存在。 |

---

## Quick Start
## 快速开始

```bash
# Clone and run
git clone https://github.com/koala73/worldmonitor.git
cd worldmonitor
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)
打开 [http://localhost:5173](http://localhost:5173)

### Environment Variables (Optional)
### 环境变量（可选）

The dashboard works without any API keys — panels for unconfigured services simply won't appear. For full functionality, copy the example file and fill in the keys you need:
仪表板无需任何 API 密钥即可工作 — 未配置服务的面板将不会显示。

```bash
cp .env.example .env.local
```

The `.env.example` file documents every variable with descriptions and registration links, organized by deployment target (Vercel vs Railway). Key groups:
`.env.example` 文件记录了每个变量及其描述和注册链接，按部署目标（Vercel 与 Railway）组织。主要分组：

| Group 分组 | Variables 变量 | Free Tier 免费层 |
|-------|-----------|-----------|
| **AI** | `GROQ_API_KEY`, `OPENROUTER_API_KEY` | 14,400 req/day (Groq), 50/day (OpenRouter) |
| **Cache** 缓存 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 10K commands/day |
| **Markets** 市场 | `FINNHUB_API_KEY`, `FRED_API_KEY`, `EIA_API_KEY` | All free tier 全部免费层 |
| **Tracking** 追踪 | `WINGBITS_API_KEY`, `AISSTREAM_API_KEY` | Free 免费 |
| **Geopolitical** 地缘政治 | `ACLED_ACCESS_TOKEN`, `CLOUDFLARE_API_TOKEN`, `NASA_FIRMS_API_KEY` | Free for researchers 研究人员免费 |
| **Relay** 中继 | `WS_RELAY_URL`, `VITE_WS_RELAY_URL`, `OPENSKY_CLIENT_ID/SECRET` | Self-hosted 自托管 |

See [`.env.example`](./.env.example) for the complete list with registration links.
请参阅 [`.env.example`](./.env.example) 获取包含注册链接的完整列表。

---

## Development Mode
## 开发模式

WorldMonitor has two deployment modes with different development workflows:

WorldMonitor 有两种部署模式，具有不同的开发工作流程：

### Mode 1: Vite Dev Server (Frontend + API Proxy)

For quick frontend development with API proxying:

```bash
# Install dependencies
npm install

# Run frontend with Vite dev server
npm run dev        # Full variant (worldmonitor.app)
npm run dev:tech   # Tech variant (startups.worldmonitor.app)

# Access: http://localhost:3000
```

**Note**: This mode uses Vite's proxy to forward API requests. Some features may not work fully without the backend server.

### Mode 2: Pre-built Frontend + Express Backend (Recommended / 推荐)

For full functionality and production parity, build the frontend first then run the Express backend:

```bash
# Terminal 1: Build frontend (run after any frontend changes)
npm run build

# Terminal 2: Start backend (Express serves pre-built frontend)
cd server
npm run dev

# Access: http://localhost:3001
```

**Why this mode?**
- Worker files are pre-compiled (no timeout issues)
- Backend API runs directly (no proxy needed)
- Closest to production behavior
- Database features work properly

### Environment Variables

Make sure your `.env` file has:
```bash
NODE_ENV=development
PORT=3001
```

For other environment variables, see [`.env.example`](./.env.example).

### Vite Proxy Configuration

The Vite dev server includes proxy configurations for external APIs (in `vite.config.ts`):

| Proxy Path | Target | Purpose |
|------------|--------|---------|
| `/api/yahoo` | Yahoo Finance | Stock market data |
| `/api/coingecko` | CoinGecko | Crypto prices |
| `/api/polymarket` | Polymarket | Prediction markets |
| `/api/earthquake` | USGS | Earthquake data |
| `/api/opensky` | OpenSky Network | Flight tracking |
| `/api/adsb-exchange` | ADS-B Exchange | Military aircraft |
| `/api/gdelt` | GDELT | News/events |
| `/api/acled` | ACLED | Conflict data |
| `/rss/*` | Various | RSS feed proxies |

Note: Some APIs require environment variables (e.g., `FRED_API_KEY`). Add these to a `.env` file in the project root.
注意：部分 API 需要环境变量（如 `FRED_API_KEY`）。请在项目根目录添加 `.env` 文件。

---

## Tech Stack
## 技术栈

| Category | Technologies |
|----------|--------------|
| **Frontend** | TypeScript, Vite, deck.gl (WebGL), MapLibre GL |
| **前端** | TypeScript、Vite、deck.gl (WebGL)、MapLibre GL |
| **AI/ML** | Groq (Llama 3.1 8B), OpenRouter (fallback), Transformers.js (browser-side T5, NER, embeddings) |
| **AI/ML** | Groq (Llama 3.1 8B)、OpenRouter（备选）、Transformers.js（浏览器端 T5、NER、嵌入） |
| **Caching** | Redis (Upstash) — 3-tier cache with in-memory + Redis + upstream, cross-user AI deduplication |
| **缓存** | Redis (Upstash) — 三层缓存（内存 + Redis + 上游），跨用户 AI 去重 |
| **Geopolitical APIs** | OpenSky, GDELT, ACLED, UCDP, HAPI, USGS, NASA FIRMS, Polymarket, Cloudflare Radar |
| **地缘政治 API** | OpenSky、GDELT、ACLED、UCDP、HAPI、USGS、NASA FIRMS、Polymarket、Cloudflare Radar |
| **Market APIs** | Yahoo Finance (equities, forex, crypto), CoinGecko (stablecoins), mempool.space (BTC hashrate), alternative.me (Fear & Greed) |
| **市场 API** | Yahoo Finance（股票、外汇、加密货币）、CoinGecko（稳定币）、mempool.space（BTC 哈希率）、alternative.me（恐惧与贪婪） |
| **Economic APIs** | FRED (Federal Reserve), EIA (Energy), Finnhub (stock quotes) |
| **经济 API** | FRED（美联储）、EIA（能源）、Finnhub（股票报价） |
| **Deployment** | Vercel Edge Functions OR Docker/Express (see Development section) |
| **部署** | Vercel 边缘函数 或 Docker/Express（详见开发模式章节） |
| **Data** | 100+ RSS feeds, ADS-B transponders, AIS maritime data, VIIRS satellite imagery |
| **数据** | 100+ RSS 订阅源、ADS-B 应答器、AIS 海上数据、VIIRS 卫星图像 |

---

## Documentation
## 文档

Full documentation including algorithms, data sources, and system architecture:
包含算法、数据源和系统架构的完整文档：

**[docs/DOCUMENT.md](./docs/DOCUMENTATION.md)**

Key sections:
主要章节：
- [Signal Intelligence](./docs/DOCUMENTATION.md#signal-intelligence)
- [信号情报](./docs/DOCUMENTATION.md#signal-intelligence)
- [Country Instability Index](./docs/DOCUMENTATION.md#country-instability-index-cii)
- [国家不稳定指数](./docs/DOCUMENTATION.md#country-instability-index-cii)
- [Military Tracking](./docs/DOCUMENTATION.md#military-tracking)
- [军事追踪](./docs/DOCUMENTATION.md#military-tracking)
- [Infrastructure Analysis](./docs/DOCUMENTATION.md#infrastructure-cascade-analysis)
- [基础设施分析](./docs/DOCUMENTATION.md#infrastructure-cascade-analysis)
- [API Dependencies](./docs/DOCUMENTATION.md#api-dependencies)
- [API 依赖](./docs/DOCUMENTATION.md#api-dependencies)
- [System Architecture](./docs/DOCUMENTATION.md#system-architecture)
- [系统架构](./docs/DOCUMENTATION.md#system-architecture)

---

## Contributing
## 贡献

Contributions welcome! See [CONTRIBUTING](./docs/DOCUMENTATION.md#contributing) for guidelines.
欢迎贡献！请参阅 [CONTRIBUTING](./docs/DOCUMENTATION.md#contributing) 了解指南。

```bash
# Development (recommended: build first, then run backend)
npm run build        # Build frontend (run after any frontend changes)
cd server && npm run dev  # Start backend on http://localhost:3001

# Quick dev mode (Vite only, may have limited functionality)
npm run dev          # Full variant on http://localhost:3000
npm run dev:tech     # Tech variant on http://localhost:3000

# Production builds
npm run build:full   # Build full variant
npm run build:tech   # Build tech variant

# Quality
npm run typecheck    # TypeScript type checking
```

---

## Roadmap
## 路线图

- [x] 45+ API edge functions for programmatic access
- [x] 45+ API 边缘函数，支持程序化访问
- [x] Dual-site variant system (geopolitical + tech)
- [x] 双站点变体系统（地缘政治 + 科技）
- [x] Market intelligence (macro signals, ETF flows, stablecoin peg monitoring)
- [x] 市场情报（宏观信号、ETF 资金流、稳定币锚定监测）
- [x] Railway relay for WebSocket and blocked-domain proxying
- [x] Railway 中继，用于 WebSocket 和被封锁域名代理
- [x] CORS origin allowlist and security hardening
- [x] CORS 来源白名单和安全加固
- [ ] Mobile-optimized views
- [ ] 移动端优化视图
- [ ] Push notifications for critical alerts
- [ ] 关键警报推送通知
- [ ] Historical data playback
- [ ] 历史数据回放
- [ ] Self-hosted Docker image
- [ ] 自托管 Docker 镜像

See [full roadmap](./docs/DOCUMENTATION.md#roadmap).
请参阅[完整路线图](./docs/DOCUMENTATION.md#roadmap)。

---

## Support the Project
## 支持项目

If you find World Monitor useful:
如果您发现 World Monitor 有用：

- **Star this repo** to help others discover it
- **为该项目加星** 帮助他人发现
- **Share** with colleagues interested in OSINT
- **分享** 给对开源情报感兴趣的朋友
- **Contribute** code, data sources, or documentation
- **贡献** 代码、数据源或文档
- **Report issues** to help improve the platform
- **报告问题** 帮助改进平台

---

## License
## 许可证

MIT License — see [LICENSE](LICENSE) for details.
MIT 许可证 — 请参阅 [LICENSE](LICENSE) 了解详情。

---

## Author
## 作者

**Elie Habib** — [GitHub](https://github.com/koala73)

---

<p align="center">
  <a href="https://worldmonitor.app">worldmonitor.app</a> &nbsp;·&nbsp;
  <a href="https://tech.worldmonitor.app">tech.worldmonitor.app</a>
</p>


## Star History
## 星标历史

<a href="https://api.star-history.com/svg?repos=koala73/worldmonitor&type=Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=koala73/worldmonitor&type=Date&type=Date&theme=dark" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=koala73/worldmonitor&type=Date&type=Date" />
 </picture>
</a>
