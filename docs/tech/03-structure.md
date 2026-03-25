# WorldMonitor 项目结构

## 根目录结构

```
worldmonitor/
├── .claude/                 # Claude Code 配置
├── .env                     # 环境变量 (本地)
├── .env.docker             # Docker 环境变量
├── .env.example            # 环境变量示例
├── .gitignore              # Git 忽略配置
├── Dockerfile              # Docker 镜像配置
├── docker-compose.yml      # Docker Compose 配置
├── README.md               # 项目主文档
├── CLAUDE.md               # Claude Code 指南
├── ROADMAP.md              # 路线图
├── package.json            # 前端依赖
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts          # Vite 构建配置
├── index.html              # HTML 入口
├── dist/                   # 构建输出
├── src/                    # 前端源代码
├── server/                 # 后端服务
├── api/                    # Vercel Edge Functions
├── public/                 # 静态资源
├── scripts/                # 脚本工具
├── data/                   # 本地数据
├── backups/                # 备份
├── podcasts/               # 播客文件
└── docs/                   # 文档
```

## 前端目录 (src/)

```
src/
├── App.ts                  # 主应用组件 (140KB+)
├── main.ts                 # 入口文件
├── vite-env.d.ts           # Vite 类型声明
├── components/             # UI 组件 (45 个)
│   ├── index.ts            # 组件导出
│   ├── Panel.ts            # 面板基类
│   ├── AgentPanel.ts        # Agent 面板
│   ├── AgentTaskList.ts    # Agent 任务列表
│   ├── CountryIntelModal.ts # 国家情报弹窗
│   ├── DeckGLMap.ts        # Deck.gl 地图
│   ├── InsightsPanel.ts    # AI 洞察面板
│   ├── LiveNewsPanel.ts    # 实时新闻面板
│   ├── Map.ts              # 地图封装
│   ├── MarketPanel.ts      # 市场面板
│   ├── NewsPanel.ts        # 新闻面板
│   ├── SearchModal.ts      # 搜索弹窗
│   ├── SignalModal.ts      # 信号弹窗
│   ├── StoryModal.ts       # 故事弹窗
│   ├── StrategicPosturePanel.ts  # 战略态势面板
│   ├── StrategicRiskPanel.ts     # 战略风险面板
│   ├── TechEventsPanel.ts  # 科技事件面板
│   └── ... (共 45 个组件)
├── services/               # 数据服务
│   ├── index.ts            # 服务导出
│   ├── rss.ts              # RSS 数据获取
│   ├── military-flights.ts  # 军机追踪
│   ├── military-vessels.ts  # 军舰追踪
│   ├── polymarket.ts       # 预测市场
│   └── ... (更多服务)
├── workers/                # Web Workers
│   ├── clustering.worker.ts # 新闻聚类
│   └── ml.worker.ts        # ML 推理
├── config/                 # 配置
│   ├── index.ts            # 配置导出
│   ├── feeds.ts            # RSS 订阅源
│   └── panels.ts           # 面板配置
├── i18n/                   # 国际化
│   ├── locales/
│   │   ├── en.ts           # 英语
│   │   ├── zh-cn.ts        # 简体中文
│   │   └── zh-tw.ts        # 繁体中文
│   └── index.ts            # i18n 入口
├── styles/                 # 样式
│   └── main.css            # 主样式文件
├── types/                  # 类型定义
└── utils/                  # 工具函数
```

## 后端目录 (server/)

```
server/
├── index.ts                # Express 服务器入口
├── package.json            # 后端依赖
├── tsconfig.json           # TypeScript 配置
├── routes/                 # API 路由 (58 个文件)
│   ├── index.ts            # 路由导出
│   ├── rss-proxy.ts        # RSS 代理
│   ├── rss-collector.ts    # RSS 收集器
│   ├── reports.ts          # 报告生成
│   ├── agent.ts            # Agent 系统
│   ├── tech-events.ts      # 科技事件
│   ├── groq-summarize.ts   # AI 摘要
│   ├── risk-scores.ts      # 风险评分
│   ├── theater-posture.ts   # 军事态势
│   ├── stablecoin-markets.ts # 稳定币市场
│   └── ... (更多 API)
├── agent/                  # Agent 系统
│   ├── index.ts
│   ├── tasks.ts
│   └── ...
├── database/               # 数据库
│   ├── connection.ts       # 数据库连接
│   ├── schema.ts           # 数据库 schema
│   └── ...
├── services/               # 服务层
│   ├── cache.ts            # 缓存服务
│   └── ...
├── utils/                  # 工具函数
│   └── ...
└── node_modules/           # 依赖
```

## 配置文件说明

### 前端配置

| 文件 | 用途 |
|------|------|
| `package.json` | 前端依赖和脚本 |
| `tsconfig.json` | TypeScript 编译配置 |
| `vite.config.ts` | Vite 构建配置 |
| `.env` | 本地环境变量 |

### 后端配置

| 文件 | 用途 |
|------|------|
| `server/package.json` | 后端依赖和脚本 |
| `server/tsconfig.json` | 后端 TypeScript 配置 |

## 组件面板 (45个)

### 核心面板

| 组件 | 描述 |
|------|------|
| `Panel.ts` | 面板基类 |
| `AgentPanel.ts` | Agent 控制面板 |
| `AgentTaskList.ts` | Agent 任务列表 |
| `CIIPanel.ts` | 国家情报面板 |
| `InsightsPanel.ts` | AI 洞察面板 |
| `LiveNewsPanel.ts` | 实时新闻面板 |
| `NewsPanel.ts` | 新闻面板 |
| `MarketPanel.ts` | 市场面板 |
| `MacroSignalsPanel.ts` | 宏观信号面板 |
| `MonitorPanel.ts` | 监控面板 |

### 地图面板

| 组件 | 描述 |
|------|------|
| `DeckGLMap.ts` | Deck.gl 地图 |
| `Map.ts` | 地图封装 |
| `MapContainer.ts` | 地图容器 |
| `MapPopup.ts` | 地图弹窗 |

### 战略与风险

| 组件 | 描述 |
|------|------|
| `StrategicPosturePanel.ts` | 战略态势 |
| `StrategicRiskPanel.ts` | 战略风险 |
| `EconomicPanel.ts` | 经济面板 |
| `RegulationPanel.ts` | 监管面板 |

### 科技面板

| 组件 | 描述 |
|------|------|
| `TechEventsPanel.ts` | 科技事件 |
| `TechHubsPanel.ts` | 科技中心 |
| `TechReadinessPanel.ts` | 科技准备度 |

### 市场面板

| 组件 | 描述 |
|------|------|
| `ETFFlowsPanel.ts` | ETF 流向 |
| `PredictionPanel.ts` | 预测面板 |
| `StablecoinPanel.ts` | 稳定币 |

### 其他面板

| 组件 | 描述 |
|------|------|
| `CascadePanel.ts` | 级联面板 |
| `GeoHubsPanel.ts` | 地理中心 |
| `GdeltIntelPanel.ts` | GDELT 情报 |
| `PizzIntIndicator.ts` | 核风险指示器 |
| `SatelliteFiresPanel.ts` | 卫星火灾 |
| `ServiceStatusPanel.ts` | 服务状态 |

## API 路由 (55个)

### 新闻与数据

| 路由 | 描述 |
|------|------|
| `rss-proxy.ts` | RSS 代理 |
| `rss-collector.ts` | RSS 收集器 |
| `hackernews.ts` | Hacker News |
| `country-intel.ts` | 国家情报 |

### 地图数据

| 路由 | 描述 |
|------|------|
| `opensky.ts` | 航班追踪 |
| `fires.ts` | 野火数据 |
| `earthquakes.ts` | 地震数据 |
| `gdelt-geo.ts` | GDELT 地理数据 |
| `acled.ts` | 冲突数据 |

### 市场数据

| 路由 | 描述 |
|------|------|
| `yahoo-finance.ts` | 雅虎财经 |
| `polymarket.ts` | 预测市场 |
| `stablecoin-markets.ts` | 稳定币市场 |
| `etf-flows.ts` | ETF 流向 |
| `coingecko.ts` | 加密货币 |

### AI 服务

| 路由 | 描述 |
|------|------|
| `groq-summarize.ts` | Groq 摘要 |
| `openrouter-summarize.ts` | OpenRouter 摘要 |
| `minimax-summarize.ts` | MiniMax 摘要 |
| `ai-chat.ts` | AI 聊天 |

### Agent 系统

| 路由 | 描述 |
|------|------|
| `agent.ts` | Agent API |
| `reports.ts` | 报告生成 |
| `web-search.ts` | 网络搜索 |
