# Proposal: WorldMonitor Agent 重构

## Why

当前 WorldMonitor 前端依赖 Vercel Serverless，Agent 任务无法长时间运行，且缺少统一的实时通信和任务管理能力。Vercel 的执行时间限制（10-30秒）导致 RSS 收集、AI 摘要生成等耗时任务无法完整执行。需要将架构从 Vercel 迁移到 Docker 部署，并构建完整的 Agent 框架支持自动化新闻收集、翻译、报告生成等能力。

## What Changes

- **部署架构**: 从 Vercel + Railway 迁移到 Docker 自托管，支持长时间运行的 Agent 任务
- **数据库**: 引入 PostgreSQL 存储新闻、报告、Agent 任务状态，支持 2 个月新闻 retention
- **状态管理**: 引入 Zustand 替代当前分散的状态管理
- **实时通信**: 构建统一的 WebSocket 架构，支持 Agent 状态、日志、进度实时推送
- **任务调度**: 引入 Bull 任务队列 + Cron 定时任务，支持定时和手动触发
- **Agent 框架**: 构建完整的 Agent 系统，包含工具注册、子代理、消息队列、心跳机制
- **新闻处理**: 支持中英文翻译（立即翻译）、MD5 去重、增量更新、分类存储，新闻保留 2 个月，报告保留 1 个月
- **UI 改造**: 新增对话窗口、Agent 控制面板、报告面板，重构布局
- **错误处理**: 实现指数退避重试机制（最多 3 次）
- **日志系统**: 引入 Pino 结构化日志，分类存储
- **备份策略**: 每日自动备份 + 云存储，保留 7 天
- **安全**: Nginx 反向代理，Docker 内网隔离

## Capabilities

### New Capabilities

- **agent-framework**: 核心 Agent 框架，包含工具系统、子代理（新闻收集、数据分析、信息查询、深度思考、报告生成、事实核查）、消息队列、心跳保活机制
- **news-storage**: 新闻存储系统，支持中英文双语存储（立即翻译）、MD5(title+url) 去重、Jaccard 聚类（0.5 阈值）、增量更新、自动清理（新闻 2 个月、报告 1 个月）
- **database-schema**: PostgreSQL 表结构设计，包含新闻、报告、任务、日志、工具配置等表，索引优化（title, source, lang, category）
- **rest-api**: RESTful API 设计，继承当前风格，无用户认证，定时清理过期数据
- **websocket**: 统一 WebSocket 消息架构，支持 agent/task/data/system 四类消息，实时推送任务进度、日志、新闻更新
- **task-scheduler**: 任务调度系统，基于 Bull 队列（Redis）和 Cron 定时任务，支持定时/手动触发、进度追踪、重试
- **ui-layout**: 前端 UI 布局改造，包含新闻面板（左侧）、对话窗口（中间）、报告面板（右上）、地图（header 下）
- **error-handling**: 错误处理与重试机制，指数退避算法（2s → 4s → 8s），不同任务类型差异化配置
- **logging**: 日志系统，基于 Pino，分层存储（应用/任务/错误），保留策略（7天/30天/90天）
- **backup**: 数据备份策略，每日自动 pg_dump 备份 + 云存储上传，保留 7 天
- **security**: 安全架构，Nginx 反向代理 + Docker 内网隔离，API 不暴露到公网

### Modified Capabilities

- 无（现有功能均为新增，非修改）

## Impact

- **前端**: 需要引入 Zustand，重构组件接入新状态管理，WebSocket 客户端接入
- **后端**: 全新 Agent 服务，Docker 化部署，PostgreSQL + Redis 依赖
- **部署**: 从 Vercel 迁移到 Docker，需要准备云服务器
- **数据**: 迁移现有 RSS 数据到 PostgreSQL，历史数据保留策略调整
- **外部依赖**: 新增 PostgreSQL、Redis、Nginx，保留 Groq/OpenRouter AI 服务

## Implementation Phases

由于变更范围较大，建议分 5 个阶段实施：

| 阶段 | 内容 | 周期 |
|-----|------|-----|
| **Phase 1: 基础设施** | Docker + PostgreSQL + Redis + Nginx 环境搭建 | 1 周 |
| **Phase 2: 核心数据** | database-schema + news-storage + rest-api | 1-2 周 |
| **Phase 3: Agent 框架** | agent-framework + task-scheduler + websocket | 2 周 |
| **Phase 4: 前端改造** | ui-layout + Zustand + WebSocket 接入 | 1-2 周 |
| **Phase 5: 完善** | logging + backup + error-handling + security | 1 周 |

**预计总周期**: 6-8 周

### 补充：监控与运维

| 项目 | 内容 |
|-----|------|
| **监控告警** | 任务失败告警、服务健康检查、资源使用监控 (CPU/内存/磁盘) |
| **CI/CD** | GitHub Actions 自动构建 Docker 镜像、部署脚本 |

> 注：监控告警和 CI/CD 可在 Phase 5 或后续迭代中实现
